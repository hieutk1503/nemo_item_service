import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export class LaunchController {
    /**
     * API: Khởi tạo Game và kiểm tra đăng nhập lần đầu
     * Path: POST /api/game/launch
     */
    launch = async (req: Request, res: Response) => {
        try {
            const result = await AuthService.launchGame(req.body);
            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Đặt mật khẩu mới (Dùng cho Popup First Login)
     * Path: POST /api/auth/update-password
     * Yêu cầu: authMiddleware
     */
    updatePassword = async (req: any, res: Response) => {
        try {
            // msisdn được trích xuất từ Token thông qua authMiddleware
            const msisdn = req.user.msisdn; 
            const { password } = req.body;

            if (!password) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu mật khẩu"));
            }

            const result = await AuthService.updatePassword(msisdn, password);
            return res.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * API: Lấy thông tin chi tiết người dùng
     * Path: GET /api/user/profile
     * Yêu cầu: authMiddleware
     */
    getProfile = async (req: any, res: Response) => {
        try {
            // Lấy msisdn từ thông tin user đã verify qua token
            const msisdn = req.user.msisdn;
            
            const result = await AuthService.getProfile(msisdn);
            if (!result.success) {
                return res.status(HttpStatusCode.NOT_FOUND).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);
        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }
}