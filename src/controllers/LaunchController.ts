import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Logger } from '../utils/Logger';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export class LaunchController {
    /**
     * API: Khởi tạo Game cho User
     * Method: POST
     */
    launch = async (req: Request, res: Response) => {
        try {
            const request = req.body;
            
            // Gọi Service xử lý nghiệp vụ
            const result = await AuthService.launchGame(request);
   
            if (!result.success) {
                Logger.error("Lỗi Launch Game: " + result.message);
                return res.status(HttpStatusCode.BAD_REQUEST)
                          .json(APIResponse.BadRequest(result.message));
            }

            Logger.info("Launch game thành công cho: " + request.msisdn);
            return res.status(HttpStatusCode.OK)
                      .json(APIResponse.OK("Thành công", result.data));
        }
        catch (error: any) {
            Logger.error(`System Error in launch: ${error.message}`);
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống: " + error.message));
        }
    }
}