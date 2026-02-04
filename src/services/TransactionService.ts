// import axios from 'axios';
// import prisma from '../configs/PrismaContext';
// import storeManager from '../manager/StoreManager';
// import OrderService from './OrderService';
// import { ItemService } from './ItemService'; 
// import { ServiceResponse } from '../utils/ServiceResponse';
// import { OrderActionLogger } from '../utils/Logger';

// interface UserData {
//     id: string; // msisdn (String)
//     name: string;
// }

// class TransactionService {

//     async purchaseItem(gameId: string, productId: number, userData: UserData) {
//         let productData: any = null;
//         const userId = userData.id;

//         try {
//             // 1. LẤY THÔNG TIN SẢN PHẨM
//             productData = await storeManager.findItemById(productId);
//             if (!productData) {
//                 return ServiceResponse.Fail("Sản phẩm không tồn tại!");
//             }

//             // 2. LẤY THÔNG TIN GAME TỪ BẢNG GAMES (Để lấy code và baseUrl)
//             const gameInfo = await prisma.games.findFirst({
//                 where: { 
//                     // Kiểm tra theo ID hoặc Code tùy vào tham số truyền vào
//                     OR: [
//                         { id: isNaN(Number(gameId)) ? undefined : Number(gameId) },
//                         { code: gameId }
//                     ]
//                 }
//             });

//             if (!gameInfo) {
//                 return ServiceResponse.Fail("Thông tin Game không tồn tại trong hệ thống!");
//             }

//             const gameType = gameInfo.code.toLowerCase(); // Lấy từ trường code của bạn

//             // 3. GỌI API TRỪ TIỀN (Subscription Init)
//             try {
//                 // Sử dụng baseUrl lưu trong DB của Hiếu để gọi API
//                 const paymentUrl = `${gameInfo.baseUrl}/api/${gameType}/subscription/init`; 

//                 const paymentResponse = await axios.post(paymentUrl, {
//                     msisdn: userId, // Định dạng String (msisdn)
//                     productId: productId,
//                     amount: productData.price,
//                     description: `User ${userId} mua ${productData.item_name}`
//                 });

//                 // Kiểm tra phản hồi từ API trừ tiền của team
//                 if (paymentResponse.data.status !== 'SUCCESS') {
//                     throw new Error(paymentResponse.data.message || "Tài khoản không đủ tiền hoặc lỗi thanh toán");
//                 }
//             } catch (payError: any) {
//                 OrderActionLogger.error('PAYMENT_FAILED', { userId, gameType, error: payError.message });
//                 return ServiceResponse.Fail(`Thanh toán thất bại: ${payError.message}`);
//             }

//             // 4. CỘNG VẬT PHẨM (Chỉ chạy khi đã trừ tiền thành công)
//             try {
//                 await ItemService.grantItem(
//                     userId,             
//                     gameId,       
//                     productId,    
//                     1,                  
//                     'STORE_PURCHASE'    
//                 );
//             } catch (invError: any) {
//                 // Trường hợp trừ tiền rồi mà lỗi cộng đồ: Cực kỳ nghiêm trọng
//                 OrderActionLogger.error('CRITICAL_INVENTORY_FAIL', { 
//                     userId, gameId, productId, error: invError.message 
//                 });
                
//                 // Ghi lại đơn hàng FAILED để team kỹ thuật xử lý hoàn tiền/cộng tay
//                 await this._logFailedOrder(gameId, productId, productData.price, userData, "INVENTORY_ERROR");
                
//                 return ServiceResponse.Fail(`Đã trừ tiền nhưng không thể nhận đồ, vui lòng liên hệ admin!`);
//             }

//             // 5. LƯU ĐƠN HÀNG THÀNH CÔNG VÀO MYSQL
//             const orderRes = await OrderService.createOrder({
//                 gameId: gameId,
//                 productId: productId,
//                 amount: productData.price,
//                 currency: 'VND', 
//                 status: 'SUCCESS'
//             }, userData);

//             // 6. GHI LOG HOÀN TẤT VÀO MONGODB
//             OrderActionLogger.info('PURCHASE_COMPLETE', {
//                 userId, 
//                 gameId,
//                 orderId: (orderRes.data as any)?.id,
//                 details: `Giao dịch hoàn tất: ${productData.item_name}`
//             });

//             return ServiceResponse.Success({
//                 orderId: (orderRes.data as any)?.id,
//                 productName: productData.item_name
//             }, "Mua vật phẩm thành công!");

//         } catch (err: any) {
//             OrderActionLogger.error('PURCHASE_FATAL_ERROR', { userId, error: err.message });
//             return ServiceResponse.Fail("Lỗi hệ thống trong quá trình giao dịch!");
//         }
//     }

//     private async _logFailedOrder(gameId: string, productId: number, amount: any, userData: UserData, reason: string) {
//         try {
//             await OrderService.createOrder({
//                 gameId: gameId,
//                 productId: productId,
//                 amount: amount || 0,
//                 status: 'FAILED'
//             }, userData);
//         } catch (e) {
//             console.error("Lỗi khi ghi nhận đơn hàng thất bại:", e);
//         }
//     }
// }

// export default new TransactionService();
import axios from 'axios'; // Đảm bảo Hiếu đã chạy: npm install axios
import prisma from '../configs/PrismaContext';
import storeManager from '../manager/StoreManager';
import OrderService from './OrderService';
import { ItemService } from './ItemService'; 
import { ServiceResponse } from '../utils/ServiceResponse';
import { OrderActionLogger } from '../utils/Logger';

interface UserData {
    id: string; // msisdn (Dạng String để khớp với team)
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

            // 2. LẤY THÔNG TIN GAME (Để lấy baseUrl và code làm gameType)
            const gameInfo = await prisma.game.findFirst({
                where: { 
                    OR: [
                        { id: isNaN(Number(gameId)) ? undefined : Number(gameId) },
                        { code: gameId }
                    ]
                }
            });

            if (!gameInfo) {
                return ServiceResponse.Fail("Thông tin Game không tồn tại!");
            }

            const gameType = gameInfo.code.toLowerCase();

            // 3. GỌI API TRỪ TIỀN BÊN THỨ BA (Subscription Init)
            try {
                // Sử dụng baseUrl từ database của Hiếu
                const paymentUrl = `${gameInfo.baseUrl}/api/${gameType}/subscription/init`; 

                const paymentResponse = await axios.post(paymentUrl, {
                    msisdn: userId, // Số điện thoại dạng string
                    productId: productId,
                    amount: productData.price,
                    description: `Mua vật phẩm ${productData.item_name}`
                });

                // Kiểm tra trạng thái trả về từ bên thứ ba
                if (paymentResponse.data.status !== 'SUCCESS') {
                    throw new Error(paymentResponse.data.message || "Tài khoản không đủ tiền");
                }
            } catch (payError: any) {
                OrderActionLogger.error('PAYMENT_FAILED', { userId, gameType, error: payError.message });
                return ServiceResponse.Fail(`Thanh toán thất bại: ${payError.message}`);
            }

            // 4. CỘNG ĐỒ VÀO INVENTORY (Chỉ thực hiện khi trừ tiền xong)
            try {
                await ItemService.grantItem(
                    userId,             
                    gameId,       
                    productId,    
                    1,                  
                    'STORE_PURCHASE'    
                );
            } catch (invError: any) {
                // Lỗi cộng đồ sau khi trừ tiền là lỗi nghiêm trọng
                OrderActionLogger.error('CRITICAL_INVENTORY_FAIL', { 
                    userId, gameId, productId, error: invError.message 
                });
                
                // Lưu đơn hàng FAILED để đối soát
                await this._logFailedOrder(gameId, productId, productData.price, userData, "INVENTORY_ERROR");
                
                return ServiceResponse.Fail(`Đã trừ tiền nhưng cộng vật phẩm thất bại. Vui lòng liên hệ CSKH!`);
            }

            // 5. LƯU ĐƠN HÀNG THÀNH CÔNG VÀO MYSQL
            const orderRes = await OrderService.createOrder({
                gameId: gameId,
                productId: productId,
                amount: productData.price,
                currency: 'VND', 
                status: 'SUCCESS'
            }, userData);

            // 6. GHI LOG HOÀN TẤT VÀO MONGODB
            OrderActionLogger.info('PURCHASE_COMPLETE', {
                userId, 
                gameId,
                orderId: (orderRes.data as any)?.id,
                details: `Giao dịch hoàn tất cho ${productData.item_name}`
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
            console.error("Lỗi ghi log đơn hàng thất bại:", e);
        }
    }
}

export default new TransactionService();