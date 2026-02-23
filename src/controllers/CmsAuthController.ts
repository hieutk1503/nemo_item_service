import { Request, Response } from 'express';
import { CmsAuthService } from '../services/CmsAuthService';
import { ServiceResponse } from '../utils/ServiceResponse';

export class CmsAuthController {

    /**
     * [POST] /auth/login
     */
    async login(req: Request, res: Response) {
        const result = await CmsAuthService.login(req.body);
        return res.status(result.statusCode).json(result);
    }

    /**
     * [GET] /user/info
     */
    async getInfo(req: Request, res: Response) {
        // Lấy adminId từ middleware đã decode
        const adminId = (req as any).user.adminId;
        const result = await CmsAuthService.getProfile(Number(adminId));
        
        if (!result.success) return res.status(401).json(result);
        return res.status(result.statusCode).json(result);
    }

    /**
     * [POST] /auth/logout
     */
    async logout(req: Request, res: Response) {
        return res.json(ServiceResponse.Success(null, "Đăng xuất thành công"));
    }
}