import { Request, Response } from "express";
import { ItemService } from "../services/ItemService";
import { InventoryManager } from "../manager/InventoryManager";
import { Logger } from "../utils/Logger";
import { APIResponse, HttpStatusCode } from "../utils/APIResponse";


export class ItemController {

    /**
     * Hàm hỗ trợ lấy Context từ Header để tránh lặp code
     */
    private getContext(req: Request) {
        return {
            userId: Number(req.headers['x-user-id']),
            gameType: req.headers['x-game-id'] as string
        };
    }

    /**
     * API: Trao vật phẩm cho người chơi (Grant Item)
     */
    grantItem = async (req: Request, res: Response) => {
        try {
            const { userId, gameType } = this.getContext(req);
            const { itemId, quantity, source } = req.body;
            
            // Validate dữ liệu Context (Header)
            if (!userId || !gameType) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin trên Header! Cần: x-user-id, x-game-id"));
            }

            // Gọi Service xử lý
            const qty = quantity ? Number(quantity) : 1;
            const result = await ItemService.grantItem(userId, gameType, Number(itemId), qty, source);

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
            const { userId, gameType } = this.getContext(req);
            const { itemId, sessionId } = req.body;

            if (!userId || !gameType || !itemId || !sessionId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin! Check Headers (x-user-id, x-game-id) và Body (itemId, sessionId)"));
            }

            const result = await ItemService.useItem(userId, gameType, Number(itemId), sessionId);

            Logger.info(`[USE] Thành công - User: ${userId}, Session Usage: ${result.session_usage}`);

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
            const { userId, gameType } = this.getContext(req);

            if (!userId || !gameType) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin Context trên Header!"));
            }

            const data = await InventoryManager.findByUserId(userId, gameType);

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
     * API: Kiểm tra quyền sở hữu (Check Ownership
     */
    checkOwnership = async (req: Request, res: Response) => {
        try {
            const { userId, gameType } = this.getContext(req);
            const { itemId } = req.body;

            if (!userId || !gameType || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin kiểm tra!"));
            }

            const result = await ItemService.checkOwnership(userId, gameType, Number(itemId));

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
            const { userId, gameType } = this.getContext(req);
            const { itemId, reason } = req.body;

            if (!userId || !gameType || !itemId) {
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest("Thiếu thông tin thu hồi!"));
            }

            const result = await ItemService.revokeItem(userId, gameType, Number(itemId), reason || "Admin Revoke");

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