import storeManager from '../manager/StoreManager';
import OrderService from './OrderService';
// ✅ Sửa lại: Gọi qua ItemService để tận dụng logic Log/Check Category
import { ItemService } from './ItemService'; 
import { ServiceResponse } from '../utils/ServiceResponse';
import { OrderActionLogger } from '../utils/Logger'; 

interface UserData {
    id: string; // msisdn (String)
    name: string;
}

class TransactionService {

    async purchaseItem(gameId: string, productId: number, userData: UserData) {
        let productData: any = null;
        const userId = userData.id;

        try {
            // 1. LẤY THÔNG TIN SẢN PHẨM
            productData = await storeManager.findItemById(productId);
            if (!productData) {
                return ServiceResponse.Fail("Sản phẩm không tồn tại!");
            }

            // 2. [GIẢ ĐỊNH TRỪ TIỀN]

            // 3. CỘNG ĐỒ (Gọi qua ItemService thay vì Manager)
            // Logic bên trong ItemService sẽ tự gọi InventoryManager + Ghi Log
            try {
                await ItemService.grantItem(
                    userId,             
                    gameId,       
                    productId,    
                    1,                  
                    'STORE_PURCHASE'    
                );
            } catch (invError: any) {
                // Nếu cộng đồ lỗi, phải ghi log lại và báo lỗi ngay
                OrderActionLogger.error('CRITICAL_INVENTORY_FAIL', { 
                    userId, gameId, productId,
                    error: invError.message 
                });
                
                // Lưu lại một đơn hàng FAILED để theo dõi
                await this._logFailedOrder(gameId, productId, productData.price, userData, "INVENTORY_ERROR");
                
                return ServiceResponse.Fail(`Giao dịch thất bại: Không thể cộng vật phẩm (${invError.message})`);
            }

            // 4. LƯU ĐƠN HÀNG THÀNH CÔNG (Chỉ chạy khi bước 3 xong)
            const orderRes = await OrderService.createOrder({
                gameId: gameId,
                productId: productId,
                amount: productData.price,
                currency: 'VND', 
                status: 'SUCCESS'
            }, userData);

            // 5. GHI LOG HOÀN TẤT
            OrderActionLogger.info('PURCHASE_COMPLETE', {
                userId, 
                gameId,
                orderId: (orderRes.data as any)?.id,
                details: `Mua thành công: ${productData.item_name}`
            });

            return ServiceResponse.Success({
                orderId: (orderRes.data as any)?.id,
                productName: productData.item_name
            }, "Mua vật phẩm thành công!");

        } catch (err: any) {
            OrderActionLogger.error('PURCHASE_FATAL_ERROR', { userId, error: err.message });
            return ServiceResponse.Fail("Lỗi hệ thống: " + err.message);
        }
    }

    private async _logFailedOrder(gameId: string, productId: number, amount: any, userData: UserData, reason: string) {
        try {
            await OrderService.createOrder({
                gameId: gameId,
                productId: productId,
                amount: amount || 0,
                status: 'FAILED'
            }, userData);
        } catch (e) {
            console.error("Lỗi log Failed Order:", e);
        }
    }
}

export default new TransactionService();