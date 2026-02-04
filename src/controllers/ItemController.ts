import { Request, Response } from "express";
import { ItemService } from "../services/ItemService";
import { Logger } from "../utils/Logger";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse";

export class ItemController {

    /**
     * Helper: Lấy thông tin Context từ Header
     */
    private getContext(req: Request) {
        return {
            userId: req.headers['x-user-id'] as string,
            gameId: req.headers['x-game-id'] as string 
        };
    }

    /**
     * API: Lấy danh sách túi đồ (Đã tích hợp Redis Cache)
     */
    getInventory = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);

            if (!userId || !gameId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu Headers: x-user-id, x-game-id"));
            }

            // Gọi qua Service để ưu tiên lấy từ Redis trước khi vào MySQL
            const data = await ItemService.getInventory(userId, gameId);

            Logger.info(`[INVENTORY] Fetch thành công cho User: ${userId} tại Game: ${gameId}`);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy danh sách túi đồ thành công", data));

        } catch (error: any) {
            Logger.error(`Error in getInventory: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Trao vật phẩm (Grant Item)
     */
    grantItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId, quantity, source } = req.body;
            
            if (!userId || !gameId || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin trao vật phẩm!"));
            }

            const qty = quantity ? Number(quantity) : 1;
            const result = await ItemService.grantItem(userId, gameId, Number(itemId), qty, source);

            Logger.info(`[GRANT] Thành công - User: ${userId}, Game: ${gameId}, Item: ${itemId}`);

            return res.status(HttpStatusCode.CREATED)
                      .json(APIResponse.Created("Trao vật phẩm thành công", result));

        } catch (error: any) {
            Logger.error(`Error in grantItem: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
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
                          .json(APIResponse.BadRequest("Thiếu thông tin sử dụng vật phẩm!"));
            }

            const result = await ItemService.useItem(userId, gameId, Number(itemId), sessionId);

            Logger.info(`[USE] Thành công - User: ${userId}, Game: ${gameId}, Session: ${sessionId}`);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Sử dụng vật phẩm thành công", result));

        } catch (error: any) {
            Logger.error(`Error in useItem: ${error.message}`);
            
            // Xử lý các lỗi nghiệp vụ (Business Logic Errors)
            if (error.message.includes("giới hạn") || error.message.includes("hết số lượng")) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(error.message));
            }

            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Kiểm tra quyền sở hữu (Sử dụng Cache từ Service)
     */
    checkOwnership = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId } = req.body;

            if (!userId || !gameId || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin kiểm tra!"));
            }

            const result = await ItemService.checkOwnership(userId, gameId, Number(itemId));

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Kiểm tra thành công", result));

        } catch (error: any) {
            Logger.error(`Error in checkOwnership: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
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
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin thu hồi!"));
            }

            const result = await ItemService.revokeItem(userId, gameId, Number(itemId), reason || "Admin Revoke");

            Logger.info(`[REVOKE] User: ${userId} bị thu hồi Item: ${itemId}`);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Thu hồi vật phẩm thành công", result));

        } catch (error: any) {
            Logger.error(`Error in revokeItem: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }
}