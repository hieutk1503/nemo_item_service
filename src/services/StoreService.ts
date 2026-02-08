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

}
export default new StoreService();