import storeManager from "../manager/StoreManager";
import orderService from "./OrderService"; // File bạn vừa gửi
import { InventoryManager } from "../manager/InventoryManager";
import { ServiceResponse } from "../utils/ServiceResponse";

class StoreService {
    // 1. Lấy danh sách sản phẩm từ StoreManager (Có Cache Redis)
    async getProduct(gameId: string, filters: { keyword?: string }) {
        const items = await storeManager.findItemsByGameId(gameId);
        let data = items;
        if (filters.keyword) {
            data = items.filter(i => i.item_name.includes(filters.keyword!));
        }
        return { success: true, message: "Thành công", data };
    }

    // 2. Xử lý logic Mua hàng (Kết hợp Order + Inventory)
    async purchaseItem(gameId: string, productId: number, userData: any) {
        // A. Lấy giá từ Manager
        const item = await storeManager.findItemById(productId);
        if (!item) return { success: false, message: "Sản phẩm không tồn tại" };

        // B. Tạo Order 
        const orderResult = await orderService.createOrder({
            gameId: gameId,
            productId: productId,
            amount: item.price,
            status: 'SUCCESS',
            currency: 'VND'
        }, userData);

        if (!orderResult.success) return orderResult;

        // C. Trao đồ (Gọi sang Inventory)
        await InventoryManager.grantItem(userData.id, gameId, productId, 1, "STORE_PURCHASE");

        return { success: true, message: "Mua hàng thành công", data: orderResult.data };
    }
}

export default new StoreService();