import { InventoryManager } from '../manager/InventoryManager';
import { ItemManager } from '../manager/ItemManager';

export class ItemService {

    /**
     * 1. DÙNG VẬT PHẨM (USE ITEM)
     * - Logic mới: Kiểm tra giới hạn theo Session (lượt chơi) lưu trong JSON
     * - An toàn: Dùng Transaction để cập nhật đồng thời số lượng và lượt dùng
     */
    static async useItem(userId: number, gameType: string, itemId: number, sessionId: string) {
        // A. Lấy vật phẩm từ túi đồ (Kèm thông tin Item gốc để lấy metadata)
        const inventoryItem = await InventoryManager.getInventoryItem(userId, gameType, itemId);

        if (!inventoryItem) {
            throw new Error("Vật phẩm không tồn tại trong túi đồ!");
        }

        if (inventoryItem.quantity <= 0) {
            throw new Error("Vật phẩm đã hết số lượng (Out of Stock)!");
        }

        // B. Đọc Metadata từ bảng Item (Chứa luật chơi: limit_per_session)
        const itemMetadata: any = inventoryItem.item.metadata || {};
        const limitPerSession = itemMetadata.limit_per_session || 9999; // Mặc định 9999 nếu không set

        // C. Đọc Custom Data từ bảng Inventory (Chứa lịch sử dùng: session_usage_count)
        let customData: any = inventoryItem.custom_data || {};

        // D. Logic Reset Session: Nếu Session ID gửi lên khác cái đang lưu -> Reset về 0
        if (customData.last_session_id !== sessionId) {
            customData.session_usage_count = 0;
            customData.last_session_id = sessionId;
        }

        // E. Check Giới hạn
        if (customData.session_usage_count >= limitPerSession) {
            throw new Error(`Đã đạt giới hạn sử dụng (${limitPerSession} lần) trong lượt chơi này!`);
        }

        // F. Chuẩn bị dữ liệu mới
        customData.session_usage_count += 1; // Tăng lượt dùng
        const newQuantity = inventoryItem.quantity - 1; // Trừ số lượng (Logic tiêu hao)

        // G. GỌI TRANSACTION: Cập nhật cả 2 trường cùng lúc
        // Đảm bảo không bao giờ bị lỗi "mất lượt mà không mất đồ"
        await InventoryManager.updateAfterUse(inventoryItem.inventory_id, newQuantity, customData);

        // H. Ghi Log
        await InventoryManager.createLog(
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
     * - Logic mới: Dùng Upsert để cộng dồn số lượng nếu đã có
     */
    static async grantItem(userId: number, gameType: string, itemId: number, quantity: number, source: string) {
        // A. Tìm thông tin vật phẩm gốc để lấy tên loại (Category)
        // Lưu ý: itemId ở đây là ID trong bảng Item (Catalog cũ)
        const itemBase = await ItemManager.getItemDetail(itemId);

        if (!itemBase) {
            throw new Error(`Vật phẩm ID ${itemId} không tồn tại trong hệ thống!`);
        }

        // B. Gọi Manager để Upsert (Nếu có rồi thì +quantity, chưa có thì tạo mới)
        const result = await InventoryManager.grantItem(
            userId,
            gameType,
            itemBase.item_id,
            quantity,
            itemBase.category.category_name // Lấy type từ Category
        );

        // C. Ghi Log
        await InventoryManager.createLog(
            userId, 
            result.inventory_id, 
            'GRANT_ITEM', 
            `Nhận ${quantity} cái. Nguồn: ${source}`
        );

        return result;
    }

    /**
     * 3. CHECK SỞ HỮU
     * - Logic mới: Kiểm tra quantity > 0
     */
    static async checkOwnership(userId: number, gameType: string, itemId: number) {
        const item = await InventoryManager.getInventoryItem(userId, gameType, itemId);
        
        if (item && item.quantity > 0) {
            return { hasItem: true, quantity: item.quantity, item: item };
        }
        return { hasItem: false, quantity: 0, item: null };
    }

    /**
     * 4. THU HỒI VẬT PHẨM (REVOKE)
     * - Logic mới: Set quantity về 0 thay vì đổi status
     */
    static async revokeItem(userId: number, gameType: string, itemId: number, reason: string) {
        const item = await InventoryManager.getInventoryItem(userId, gameType, itemId);

        if (!item) throw new Error("Người chơi không sở hữu vật phẩm này!");

        // Set số lượng về 0 (Coi như xóa khỏi túi)
        await InventoryManager.updateQuantity(item.inventory_id, 0);

        // Ghi log
        await InventoryManager.createLog(
            userId, 
            item.inventory_id, 
            'REVOKE_ITEM', 
            `Lý do: ${reason}`
        );

        return { success: true, message: "Đã thu hồi vật phẩm" };
    }
}