import { Request, Response } from 'express';
// ✅ Import các Service & Manager nghiệp vụ
import transactionService from '../services/TransactionService';
import orderService from '../services/OrderService';
import storeManager from '../manager/StoreManager';

// Import tiện ích hệ thống
import { Logger } from '../utils/Logger';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

class StoreController {

    /**
     * API: Lấy danh sách sản phẩm (Dùng StoreManager có Cache)
     * Method: GET /api/store/products
     */
    getList = async (req: Request, res: Response) => {
        try {
            const gameId = req.header('x-game-id') || req.query.gameId;
            
            // Gọi StoreManager để lấy danh sách Item gốc (Có Redis)
            const items = await storeManager.findItemsByGameId(String(gameId));

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy danh sách vật phẩm thành công", items));

        } catch (error: any) {
            Logger.error(`System Error in getList: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy chi tiết sản phẩm
     * Method: GET /api/store/product/:id
     */
    getDetail = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            // Gọi StoreManager lấy thông tin Item
            const item = await storeManager.findItemById(Number(id));

            if (!item) {
                return res.status(HttpStatusCode.NOT_FOUND)
                          .json(APIResponse.NotFound("Không tìm thấy vật phẩm này"));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Thành công", item));

        } catch (error: any) {
            Logger.error(`System Error in getDetail: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Mua vật phẩm (Hợp nhất Order + Inventory qua TransactionService)
     * Method: POST /api/store/purchase
     */
    buyItem = async (req: Request, res: Response) => {
        try {
            const userId = req.header('x-user-id');
            const gameId = req.header('x-game-id');
            const { productId } = req.body;

            if (!userId || userId === "Guest") {
                return res.status(HttpStatusCode.UNAUTHORIZED)
                          .json(APIResponse.Unauthorized("Vui lòng gửi Header x-user-id hợp lệ"));
            }

            // ✅ Gọi TransactionService: Xử lý trừ tiền (giả định), tạo Order và Grant Item
            const result = await transactionService.purchaseItem(
                String(gameId),
                Number(productId),
                { id: String(userId), name: 'User_Customer' } // Mock userData
            );

            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.CREATED)
                      .json(APIResponse.Created("Giao dịch thành công", result.data));

        } catch (error: any) {
            Logger.error(`System Error in buyItem: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy lịch sử mua sắm (Dùng OrderService để lấy đúng logic phân trang)
     * Method: GET /api/store/history
     */
    getHistory = async (req: Request, res: Response) => {
        try {
            const userId = req.header('x-user-id');
            const gameId = req.header('x-game-id');
            const { page, limit } = req.query;

            const result = await orderService.getOrderHistory(
                String(userId),
                String(gameId),
                { id: String(userId), name: 'Customer' },
                Number(page) || 1,
                Number(limit) || 10
            );

            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message, result.data));

        } catch (error: any) {
            Logger.error(`System Error in getHistory: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }
}

export default new StoreController();