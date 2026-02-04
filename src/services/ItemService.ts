import { InventoryManager } from '../manager/InventoryManager';
import { ItemManager } from '../manager/ItemManager';
import { RedisClient } from '../utils/RedisClient'; 
export class ItemService {

    /**
     * 1. DÙNG VẬT PHẨM (USE ITEM)
     */
    static async useItem(userId: string, gameId: string, itemId: number, sessionId: string) {
        const inventoryItem = await InventoryManager.getInventoryItem(userId, gameId, itemId);

        if (!inventoryItem) {
            throw new Error("Vật phẩm không tồn tại trong túi đồ!");
        }

        if (inventoryItem.quantity <= 0) {
            throw new Error("Vật phẩm đã hết số lượng (Out of Stock)!");
        }

        const itemMetadata: any = inventoryItem.item.metadata || {};
        const limitPerSession = itemMetadata.limit_per_session || 9999;
        let customData: any = inventoryItem.custom_data || {};

        if (customData.last_session_id !== sessionId) {
            customData.session_usage_count = 0;
            customData.last_session_id = sessionId;
        }

        if (customData.session_usage_count >= limitPerSession) {
            throw new Error(`Đã đạt giới hạn sử dụng (${limitPerSession} lần) trong lượt chơi này!`);
        }

        customData.session_usage_count += 1;
        const newQuantity = inventoryItem.quantity - 1;

        await InventoryManager.updateAfterUse(inventoryItem.inventory_id, newQuantity, customData);

        // ✅ Xóa Cache Inventory sau khi dùng đồ
        await this._clearCache(userId, gameId);

        InventoryManager.createLog(
            userId, 
            inventoryItem.inventory_id, 
            'USE_ITEM', 
            `Game: ${gameId} | Session: ${sessionId}. Còn lại: ${newQuantity}`
        );

        return {
            success: true,
            remaining_quantity: newQuantity,
            session_usage: customData.session_usage_count
        };
    }

    /**
     * 2. TRAO VẬT PHẨM (GRANT ITEM)
     */
    static async grantItem(userId: string, gameId: string, itemId: number, quantity: number, source: string) {
        const itemBase = await ItemManager.getItemDetail(itemId);

        if (!itemBase) {
            throw new Error(`Vật phẩm ID ${itemId} không tồn tại trong hệ thống!`);
        }

        const result = await InventoryManager.grantItem(
            userId,
            gameId,
            itemBase.item_id,
            quantity,
            itemBase.category.category_name
        );

        // ✅ Xóa Cache Inventory sau khi nhận thêm đồ
        await this._clearCache(userId, gameId);

        InventoryManager.createLog(
            userId, 
            result.inventory_id, 
            'GRANT_ITEM', 
            `Game: ${gameId} | Nhận ${quantity} cái. Nguồn: ${source}`
        );

        return result;
    }

    /**
     * 3. CHECK SỞ HỮU (Tích hợp đọc Cache)
     */
    static async checkOwnership(userId: string, gameId: string, itemId: number) {
        const cacheKey = `inv:${gameId}:${userId}`;
        
        try {
            // Thử đọc từ Redis
            const cached = await RedisClient.get(cacheKey);
            if (cached) {
                const inventory = JSON.parse(cached);
                const item = inventory.find((i: any) => i.item_reference_id === itemId);
                if (item && item.quantity > 0) {
                    return { hasItem: true, quantity: item.quantity, item: item, fromCache: true };
                }
            }
        } catch (err) {
            console.error("Redis Get Error:", err);
        }

        // Nếu hụt cache, đọc DB
        const item = await InventoryManager.getInventoryItem(userId, gameId, itemId);
        
        if (item && item.quantity > 0) {
            return { hasItem: true, quantity: item.quantity, item: item };
        }
        return { hasItem: false, quantity: 0, item: null };
    }

    /**
     * 4. THU HỒI VẬT PHẨM (REVOKE)
     */
    static async revokeItem(userId: string, gameId: string, itemId: number, reason: string) {
        const item = await InventoryManager.getInventoryItem(userId, gameId, itemId);

        if (!item) throw new Error("Người chơi không sở hữu vật phẩm này!");

        await InventoryManager.updateQuantity(item.inventory_id, 0);

        // ✅ Xóa Cache Inventory
        await this._clearCache(userId, gameId);

        InventoryManager.createLog(
            userId, 
            item.inventory_id, 
            'REVOKE_ITEM', 
            `Game: ${gameId} | Lý do: ${reason}`
        );

        return { success: true, message: "Đã thu hồi vật phẩm" };
    }

    /**
     * 5. LẤY TOÀN BỘ TÚI ĐỒ (Dùng nhiều nhất - Nên Cache nhất)
     */
    static async getInventory(userId: string, gameId: string) {
        const cacheKey = `inv:${gameId}:${userId}`;

        try {
            const cached = await RedisClient.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error("Redis Get Error:", err);
        }

        const inventory = await InventoryManager.findByUserId(userId, gameId);

        try {
            // Cache trong 10 phút (600 giây)
            await RedisClient.set(cacheKey, JSON.stringify(inventory), { EX: 600 });
        } catch (err) {
            console.error("Redis Set Error:", err);
        }

        return inventory;
    }

    /**
     * Helper xóa cache
     */
    private static async _clearCache(userId: string, gameId: string) {
        try {
            await RedisClient.del(`inv:${gameId}:${userId}`);
        } catch (err) {
            console.error("Redis Del Error:", err);
        }
    }
}