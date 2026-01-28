import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Logger } from '../utils/Logger';

export class LaunchController {
    public async launch(req: Request, res: Response) {
        try {
            // Gọi Service xử lý logic login game
            const result = await AuthService.launchGame(req.body);
            
            // result hiện tại đã có statusCode nhờ vào việc cập nhật ServiceResponse
            return res.status(result.statusCode).json(result);
        } catch (error) {
            // Ghi log lỗi vào MongoDB nếu có exception xảy ra
            Logger.error('LAUNCH_ERR', 'Unhandled error', error);
            return res.status(500).json({ success: false, message: "Internal Error" });
        }
    }
}