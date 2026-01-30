import ProductService from './ProductService';
import OrderService from './OrderService';
import { ItemService } from './ItemService'; 
import { ServiceResponse } from '../utils/ServiceResponse';
// ✅ Sử dụng OrderActionLogger để ghi log nghiệp vụ vào MongoDB/File
import { OrderActionLogger } from '../utils/Logger'; 

interface UserData {
    id: string; // msisdn (String)
    name: string;
}

class TransactionService {

    /**
     * Quy trình mua hàng hoàn chỉnh theo Schema mới
     */
    async purchaseItem(gameId: string, productId: number, userData: UserData) {
        let productData: any = null;
        const userId = userData.id;

        try {
            // 1. LẤY THÔNG TIN SẢN PHẨM
            const productRes = await ProductService.getProductDetail(gameId, productId, userData);
            if (!productRes.success) return productRes;
            
            productData = productRes.data;

            // 2. TRỪ TIỀN (Giả định logic ví)
            try {
                // Logic: await walletService.deductBalance(userId, productData.price, 'VND');
            } catch (walletError: any) {
                // Ghi log thất bại và tạo đơn hàng FAILED
                await this._logFailedOrder(gameId, productId, productData.price, userData, "WALLET_DENIED");
                
                OrderActionLogger.warn('PURCHASE_REJECTED', { userId, gameId, reason: 'Insufficient Balance' });
                return ServiceResponse.Fail("Giao dịch ví thất bại: " + walletError.message);
            }

            // 3. CỘNG ĐỒ (Grant Item)
            try {
                // ✅ gameId lúc này là String khớp với model Inventory
                await ItemService.grantItem(
                    userId,             
                    gameId,       
                    productId,    
                    1,                  
                    'STORE_PURCHASE'    
                );

            } catch (invError: any) {
                // ⚠️ Ghi log lỗi nghiêm trọng khi đã trừ tiền nhưng lỗi cộng đồ
                OrderActionLogger.error('CRITICAL_INVENTORY_FAIL', { 
                    userId,
                    gameId,
                    productId,
                    details: `Đã trừ tiền nhưng lỗi cộng đồ. SP: ${productData.name}. Lỗi: ${invError.message}`
                });

                await this._logFailedOrder(gameId, productId, productData.price, userData, "INVENTORY_ERROR");
                return ServiceResponse.Fail("Đã trừ tiền nhưng cộng vật phẩm thất bại. Vui lòng liên hệ CSKH.");
            }

            // 4. LƯU ĐƠN HÀNG THÀNH CÔNG (Vào SQL bảng orders)
            const orderRes = await OrderService.createOrder({
                gameId: gameId, // Kiểu String
                productId: productId,
                amount: productData.price,
                currency: productData.buy_style || 'VND', // Khớp Enum payment_method
                status: 'SUCCESS'
            }, userData);

            // 5. GHI LOG HOÀN TẤT VÀO MONGODB/FILE
            OrderActionLogger.info('PURCHASE_COMPLETE', {
                userId, 
                gameId,
                orderId: (orderRes.data as any)?.id,
                details: `Mua thành công: ${productData.name}`, 
                price: productData.price
            });

            return ServiceResponse.Success({
                orderId: (orderRes.data as any)?.id,
                productName: productData.name
            }, "Mua vật phẩm thành công!");

        } catch (err: any) {
            OrderActionLogger.error('PURCHASE_FATAL_ERROR', { userId, error: err.message });
            return ServiceResponse.Fail("Lỗi hệ thống không xác định.");
        }
    }

    /**
     * Ghi lại đơn hàng thất bại vào SQL và Logger
     */
    private async _logFailedOrder(gameId: string, productId: number, amount: any, userData: UserData, reason: string) {
        try {
            await OrderService.createOrder({
                gameId: gameId,
                productId: productId,
                amount: amount || 0,
                currency: 'VND',
                status: 'FAILED' // Enum orders_status
            }, userData);
            
            OrderActionLogger.warn('ORDER_FAILED_LOGGED', { userId: userData.id, reason, gameId });
        } catch (e) {
            console.error("Lỗi khi ghi log Failed Order:", e);
        }
    }
}

export default new TransactionService();