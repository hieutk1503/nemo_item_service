import { Request, Response } from "express";
import { ItemService } from "../services/ItemService";
import { InventoryManager } from "../manager/InventoryManager";
import { Logger } from "../utils/Logger";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse";

export class ItemController {

    /**
     * Sửa lại: userId lấy từ header PHẢI là string (msisdn)
     */
    private getContext(req: Request) {
        return {
            userId: req.headers['x-user-id'] as string, // KHÔNG dùng Number() ở đây
            gameId: Number(req.headers['x-game-id'])   // gameId trong schema của bạn là Int nên dùng Number()
        };
    }

    /**
     * API: Trao vật phẩm (Grant Item)
     */
    grantItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);
            const { itemId, quantity, source } = req.body;
            
            if (!userId || !gameId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu Headers: x-user-id (msisdn), x-game-id (number)"));
            }

            const qty = quantity ? Number(quantity) : 1;
            // userId truyền vào lúc này đã là string, khớp với Service
            const result = await ItemService.grantItem(userId, gameId, Number(itemId), qty, source);

            Logger.info(`[GRANT] Thành công - User: ${userId}, Item: ${itemId}`);

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
                          .json(APIResponse.BadRequest("Thiếu thông tin! Check x-user-id, x-game-id, itemId, sessionId"));
            }

            const result = await ItemService.useItem(userId, gameId, Number(itemId), sessionId);

            Logger.info(`[USE] Thành công - User: ${userId}, Session: ${sessionId}`);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Sử dụng vật phẩm thành công", result));

        } catch (error: any) {
            Logger.error(`Error in useItem: ${error.message}`);
            
            if (error.message.includes("giới hạn") || error.message.includes("hết số lượng")) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(error.message));
            }

            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy danh sách túi đồ (Get Inventory)
     */
    getInventory = async (req: Request, res: Response) => {
        try {
            const { userId, gameId } = this.getContext(req);

            if (!userId || !gameId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin Context trên Header!"));
            }

            // Gọi thẳng sang Manager để lấy danh sách
            const data = await InventoryManager.findByUserId(userId, gameId);

            Logger.info(`[INVENTORY] Fetch thành công cho User: ${userId}`);

            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Lấy danh sách túi đồ thành công", data));

        } catch (error: any) {
            Logger.error(`Error in getInventory: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError(error.message));
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