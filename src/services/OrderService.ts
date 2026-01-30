import prisma from '../configs/PrismaContext';
import storeManager from '../manager/StoreManager';
import { ServiceResponse } from '../utils/ServiceResponse';
// ✅ Sử dụng đúng instance Logger nghiệp vụ (đã sửa typo thành OrderActionLogger)
import { OrderActionLogger } from '../utils/Logger'; 

interface CreateOrderData {
    userId?: string; // ✅ Khớp msisdn (String)
    gameId: string;   // ✅ Sửa thành string để khớp với game_id trong Schema mới
    productId: number;
    amount: any;
    status: string;
    currency?: string;
}

interface UserData {
    id?: string;
    name?: string;
}

class OrderService {

    /**
     * Tạo đơn hàng
     * Không còn ghi vào bảng transaction_log/order_log theo Schema mới
     */
    async createOrder(data: CreateOrderData, userData: UserData) {
        try {
            // 1. Validate và Clean Data
            const userId = userData?.id || data.userId; 
            const gameId = data.gameId; // ✅ Giữ nguyên kiểu String
            const productId = Number(data.productId);
            const amount = data.amount;

            if (!userId || !gameId || !productId) {
                return ServiceResponse.Fail("Dữ liệu đơn hàng không hợp lệ");
            }

            // 2. BẮT ĐẦU TRANSACTION SQL
            const result = await prisma.$transaction(async (tx) => {
                
                // 2.1. Tạo đơn hàng chính (Bảng orders)
                const newOrder = await tx.orders.create({
                    data: {
                        user_id: String(userId),
                        game_id: String(gameId), // ✅ Lưu game_id kiểu String
                        total_amount: amount,
                        // ✅ Ép kiểu status về Enum orders_status
                        status: data.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED', 
                        // ✅ Khớp với Enum orders_payment_method
                        payment_method: (data.currency as any) || 'VND',
                        created_at: new Date()
                    }
                });

                // 2.2. Tạo chi tiết mặt hàng (Bảng orders_item)
                await tx.orders_item.create({
                    data: {
                        order_id: newOrder.id,
                        product_id: productId,
                        quantity: 1, 
                        unit_price: amount,
                        total_price: amount
                    }
                });

                // 💡 Đã loại bỏ tx.transaction_log.create theo Schema mới của bạn

                return newOrder;
            });

            // 3. Ghi Log nghiệp vụ vào MongoDB (collection: order_actions)
            OrderActionLogger.info('CREATE_ORDER', {
                userId: userId,
                userName: userData?.name || 'N/A',
                resourceId: result.id,
                gameId: gameId,
                details: `Tạo đơn hàng #${result.id} thành công cho user ${userId}`,
                price: amount
            });

            return ServiceResponse.Success(result, "Tạo đơn hàng thành công");

        } catch (err: any) {
            // ✅ Ghi lỗi nghiệp vụ vào file/DB
            OrderActionLogger.error('ORDER_ERROR', { error: err.message, stack: err.stack });
            return ServiceResponse.Fail("Lỗi lưu đơn hàng: " + err.message);
        }
    }

    /**
     * Lấy lịch sử đơn hàng
     */
    async getOrderHistory(userId: string, gameId: string, userData: UserData, page: number = 1, limit: number = 10) {
        try {
            const parsedUserId = String(userData?.id || userId);
            const parsedGameId = String(gameId); // ✅ Dùng String cho game_id
            const parsedPage = Number(page) || 1;
            const parsedLimit = Number(limit) || 10;
            const skip = (parsedPage - 1) * parsedLimit;

            if (!parsedUserId || !parsedGameId) {
                return ServiceResponse.Fail("User ID hoặc Game ID không hợp lệ");
            }

            const [total, orders] = await Promise.all([
                storeManager.countOrdersByUser(parsedUserId, parsedGameId),
                storeManager.findOrdersByUser(parsedUserId, parsedGameId, skip, parsedLimit)
            ]);

            // ✅ Log hành động xem lịch sử
            OrderActionLogger.info('VIEW_HISTORY', {
                userId: parsedUserId,
                userName: userData?.name || 'N/A',
                resourceId: parsedGameId,
                details: `User ${parsedUserId} xem lịch sử đơn hàng Game: ${parsedGameId}`
            });

            return ServiceResponse.Success({
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit),
                data: orders
            }, "Lấy lịch sử thành công");

        } catch (err: any) {
            OrderActionLogger.error('HISTORY_ERROR', { error: err.message });
            return ServiceResponse.Fail(err.message || "Lỗi lấy lịch sử");
        }
    }
}

export default new OrderService();