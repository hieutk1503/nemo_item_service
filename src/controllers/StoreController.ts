import { Request, Response } from 'express';
// Import các Service tương ứng
import productService from '../services/ProductService';
import transactionService from '../services/TransactionService';
import orderService from '../services/OrderService';
// Import tiện ích hệ thống
import { Logger } from '../utils/Logger';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

class StoreController {

    /**
     * API: Lấy danh sách sản phẩm
     * Method: GET
     */
    getList = async (req: Request, res: Response) => {
        try {
            const { gameId, keyword } = req.query;
            const userData = (req as any).user; 

            // ✅ Truyền trực tiếp gameId kiểu String theo Schema mới
            const result = await productService.getProduct(
                String(gameId), 
                { keyword: keyword ? String(keyword) : undefined }, 
                userData
            );

            if (!result.success) {
                Logger.error("Lỗi lấy danh sách SP: " + result.message);
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message, result.data));

        } catch (error: any) {
            Logger.error(`System Error in getList: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy chi tiết sản phẩm
     * Method: GET
     */
    getDetail = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { gameId } = req.query;
            const userData = (req as any).user;

            const result = await productService.getProductDetail(
                String(gameId), // ✅ gameId là String
                Number(id),     // ✅ item_id vẫn là Number (Autoincrement)
                userData
            );

            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK(result.message, result.data));

        } catch (error: any) {
            Logger.error(`System Error in getDetail: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Mua vật phẩm
     * Method: POST
     */
    buyItem = async (req: Request, res: Response) => {
        try {
            const { gameId, productId } = req.body;
            const userData = (req as any).user;

            if (!userData || !userData.id) {
                return res.status(HttpStatusCode.UNAUTHORIZED)
                          .json(APIResponse.Unauthorized());
            }

            const result = await transactionService.purchaseItem(
                String(gameId),    // ✅ gameId là String
                Number(productId), // ✅ productId là Number
                userData
            );

            if (!result.success) {
                Logger.error(`User ${userData.id} mua thất bại: ${result.message}`);
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            Logger.info(`User ${userData.id} mua thành công item ${productId}`);
            return res.status(HttpStatusCode.CREATED)
                      .json(APIResponse.Created(result.message, result.data));

        } catch (error: any) {
            Logger.error(`System Error in buyItem: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy lịch sử đơn hàng
     * Method: GET
     */
    getHistory = async (req: Request, res: Response) => {
        try {
            const { gameId, page, limit } = req.query;
            const userData = (req as any).user;

            if (!userData || !userData.id) {
                return res.status(HttpStatusCode.UNAUTHORIZED)
                          .json(APIResponse.Unauthorized());
            }

            const result = await orderService.getOrderHistory(
                String(userData.id), // ✅ msisdn là String
                String(gameId),      // ✅ gameId là String
                userData,
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