import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export class LaunchController {
    
    /**
     * [POST] /api/game/launch
     * Public API
     */
    launch = async (req: Request, res: Response) => {
        try {
            const { msisdn, fullName, lang, gameType } = req.body;

            const result = await AuthService.launchGame({ msisdn, fullName, lang, gameType });
            
            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);

        } catch (error: any) {
            console.error("Launch Error:", error); // Log lỗi ra server để debug
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR)
                      .json(APIResponse.ServerError("Lỗi hệ thống khi khởi tạo game"));
        }
    }

    /**
     * [POST] /api/auth/update-password
     * Private API (Cần Token)
     */
    updatePassword = async (req: Request, res: Response) => {
        try {
            // Ép kiểu (req as any) để lấy user từ Middleware
            const currentUser = (req as any).user; 
            const { password } = req.body;

            if (!currentUser || !currentUser.msisdn) {
                 return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized());
            }

            if (!password) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(APIResponse.BadRequest("Thiếu mật khẩu"));
            }

            const result = await AuthService.updatePassword(currentUser.msisdn, password);
            return res.status(HttpStatusCode.OK).json(result);

        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * [GET] /api/user/profile
     * Private API (Cần Token)
     */
    getProfile = async (req: Request, res: Response) => {
        try {
            const currentUser = (req as any).user;

            if (!currentUser || !currentUser.msisdn) {
                return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized());
            }
            
            const result = await AuthService.getProfile(currentUser.msisdn);
            
            if (!result.success) {
                return res.status(HttpStatusCode.NOT_FOUND).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);

        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * [POST] /api/auth/register
     * Public API
     */
    register = async (req: Request, res: Response) => {
        try {
            const { username, password, msisdn, fullName } = req.body;

            if (!username || !password || !msisdn) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(
                    APIResponse.BadRequest("Thiếu thông tin (username, password, msisdn)")
                );
            }

            const result = await AuthService.register({ username, password, msisdn, fullName });
            
            if (!result.success) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);

        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }

    /**
     * [POST] /api/auth/login
     * Public API
     */
    login = async (req: Request, res: Response) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(HttpStatusCode.BAD_REQUEST).json(
                    APIResponse.BadRequest("Thiếu tài khoản hoặc mật khẩu")
                );
            }
            
            const result = await AuthService.login({ username, password });

            if (!result.success) {
                // Login fail thường là 401
                return res.status(HttpStatusCode.UNAUTHORIZED).json(result);
            }
            return res.status(HttpStatusCode.OK).json(result);

        } catch (error: any) {
            return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(APIResponse.ServerError(error.message));
        }
    }
}