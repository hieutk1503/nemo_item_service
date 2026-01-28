import { InventoryManager } from '../manager/InventoryManager';
import { ItemManager } from '../manager/ItemManager';

export class ItemService {

    /**
     * 1. DÙNG VẬT PHẨM (USE ITEM)
     * Giữ nguyên logic: Kiểm tra giới hạn Session, Reset Session ID, Trừ số lượng
     */
    static async useItem(userId: string, gameId: number, itemId: number, sessionId: string) {
        // A. Lấy vật phẩm từ túi đồ (gameId truyền vào Manager là kiểu number theo schema)
        const inventoryItem = await InventoryManager.getInventoryItem(userId, gameId, itemId);

        if (!inventoryItem) {
            throw new Error("Vật phẩm không tồn tại trong túi đồ!");
        }

        if (inventoryItem.quantity <= 0) {
            throw new Error("Vật phẩm đã hết số lượng (Out of Stock)!");
        }

        // B. Đọc Metadata từ bảng Item (Json trực tiếp)
        const itemMetadata: any = inventoryItem.item.metadata || {};
        const limitPerSession = itemMetadata.limit_per_session || 9999;

        // C. Đọc Custom Data từ bảng Inventory (Json trực tiếp)
        let customData: any = inventoryItem.custom_data || {};

        // D. Logic Reset Session
        if (customData.last_session_id !== sessionId) {
            customData.session_usage_count = 0;
            customData.last_session_id = sessionId;
        }

        // E. Check Giới hạn
        if (customData.session_usage_count >= limitPerSession) {
            throw new Error(`Đã đạt giới hạn sử dụng (${limitPerSession} lần) trong lượt chơi này!`);
        }

        // F. Chuẩn bị dữ liệu mới
        customData.session_usage_count += 1;
        const newQuantity = inventoryItem.quantity - 1;

        // G. Cập nhật DB (Manager nhận Object Json nên cực gọn)
        await InventoryManager.updateAfterUse(inventoryItem.inventory_id, newQuantity, customData);

        // H. Ghi Log (Dùng ItemActionLogger qua Manager)
        InventoryManager.createLog(
            userId, 
            inventoryItem.inventory_id, 
            'USE_ITEM', 
            `Session: ${sessionId}. Còn lại: ${newQuantity}`
        );

        return {
            success: true,
            remaining_quantity: newQuantity,
            session_usage: customData.session_usage_count
        };
    }

    /**
     * 2. TRAO VẬT PHẨM (GRANT ITEM)
     * Giữ nguyên logic: Upsert cộng dồn số lượng
     */
    static async grantItem(userId: string, gameId: number, itemId: number, quantity: number, source: string) {
        // A. Tìm thông tin vật phẩm gốc
        const itemBase = await ItemManager.getItemDetail(itemId);

        if (!itemBase) {
            throw new Error(`Vật phẩm ID ${itemId} không tồn tại trong hệ thống!`);
        }

        // B. Gọi Manager để Upsert (gameId kiểu number khớp schema)
        const result = await InventoryManager.grantItem(
            userId,
            gameId,
            itemBase.item_id,
            quantity,
            itemBase.category.category_name
        );

        // C. Ghi Log
        InventoryManager.createLog(
            userId, 
            result.inventory_id, 
            'GRANT_ITEM', 
            `Nhận ${quantity} cái. Nguồn: ${source}`
        );

        return result;
    }

    /**
     * 3. CHECK SỞ HỮU
     */
    static async checkOwnership(userId: string, gameId: number, itemId: number) {
        const item = await InventoryManager.getInventoryItem(userId, gameId, itemId);
        
        if (item && item.quantity > 0) {
            return { hasItem: true, quantity: item.quantity, item: item };
        }
        return { hasItem: false, quantity: 0, item: null };
    }

    /**
     * 4. THU HỒI VẬT PHẨM (REVOKE)
     */
    static async revokeItem(userId: string, gameId: number, itemId: number, reason: string) {
        const item = await InventoryManager.getInventoryItem(userId, gameId, itemId);

        if (!item) throw new Error("Người chơi không sở hữu vật phẩm này!");

        // Set số lượng về 0
        await InventoryManager.updateQuantity(item.inventory_id, 0);

        // Ghi log
        InventoryManager.createLog(
            userId, 
            item.inventory_id, 
            'REVOKE_ITEM', 
            `Lý do: ${reason}`
        );

        return { success: true, message: "Đã thu hồi vật phẩm" };
    }
}