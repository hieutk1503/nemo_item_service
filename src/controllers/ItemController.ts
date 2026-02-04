import { Request, Response } from "express";
import { ItemService } from "../services/ItemService";
import { Logger } from "../utils/Logger";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse";

export class ItemController {

    /**
     * Helper: Lấy thông tin từ Token và Header
     */
    private getContext(req: Request) {
        // Thông tin user thường được JwtAuthMiddle gán vào req.user hoặc req.context
        const user = (req as any).user; 
        const gameId = req.headers['x-game-id'] as string;

        // Log ra để Hiếu dễ debug khi test Postman
        console.log("--- [Debug Context] ---");
        console.log("User từ Token:", user);
        console.log("GameID từ Header:", gameId);

        return {
            // Lấy msisdn (userId) từ token. Sửa lại tên trường theo đúng file JwtAuthMiddle của bạn
            userId: user?.msisdn || user?.userId || user?.id, 
            gameId: gameId
        };
    }

    /**
     * API: Lấy danh sách túi đồ
     */
    getInventory = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);

            if (!userId) return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized("Không tìm thấy thông tin User trong Token!"));
            if (!gameId) return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu Header x-game-id!"));

            const data = await ItemService.getInventory(userId, gameId);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy danh sách túi đồ thành công", data));

        } catch (error: any) {
            Logger.error(`Error in getInventory: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Trao vật phẩm (Grant Item)
     */
    grantItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId, quantity, source } = req.body;
            
            // Kiểm tra chi tiết để báo lỗi chính xác
            if (!userId) return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized("Token không hợp lệ hoặc thiếu UserID"));
            if (!gameId) return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu Header x-game-id"));
            if (!itemId) return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu itemId trong Body"));

            const qty = quantity ? Number(quantity) : 1;
            const result = await ItemService.grantItem(userId, gameId, Number(itemId), qty, source);

            Logger.info(`[GRANT] Thành công - User: ${userId}, Game: ${gameId}, Item: ${itemId}`);

            return res.status(HttpStatusCode.CREATED)
                      .json(APIResponse.Created("Trao vật phẩm thành công", result));

        } catch (error: any) {
            Logger.error(`Error in grantItem: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Sử dụng vật phẩm (Use Item)
     */
    useItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId, sessionId } = req.body;

            if (!userId || !gameId || !itemId || !sessionId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thông tin không đầy đủ (Check Token, Header, Body)"));
            }

            const result = await ItemService.useItem(userId, gameId, Number(itemId), sessionId);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Sử dụng vật phẩm thành công", result));

        } catch (error: any) {
            if (error.message.includes("giới hạn") || error.message.includes("hết số lượng")) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest(error.message));
            }
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Kiểm tra quyền sở hữu
     */
    checkOwnership = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId } = req.body;

            if (!userId || !gameId || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Dữ liệu kiểm tra không hợp lệ"));
            }

            const result = await ItemService.checkOwnership(userId, gameId, Number(itemId));
            return res.status(HttpStatusCode.OK).json(APIResponse.OK("Kiểm tra thành công", result));
        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Thu hồi vật phẩm
     */
    revokeItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId, reason } = req.body;

            if (!userId || !gameId || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thông tin thu hồi không đủ"));
            }

            const result = await ItemService.revokeItem(userId, gameId, Number(itemId), reason || "Admin Revoke");

            return res.status(HttpStatusCode.OK).json(APIResponse.OK("Thu hồi thành công", result));
        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }
}