import { Request, Response } from 'express';
import { CmsAuthService } from '../services/CmsAuthService';
import { ServiceResponse } from '../utils/ServiceResponse';

export class LaunchControllerCMS {
    
    // Xử lý Login Admin
    async login(req: Request, res: Response) {
        const result = await CmsAuthService.login(req.body);
        return res.status(result.statusCode).json(result);
    }

    // Lấy Profile và danh sách Permission
    async getInfo(req: Request, res: Response) {
        // middleware đã nhét adminId vào req.user
        const adminId = (req as any).user.adminId;
        const result = await CmsAuthService.getProfile(Number(adminId));
        
        if (!result.success) return res.status(401).json(result);
        return res.status(result.statusCode).json(result);
    }

    // Đăng xuất
    async logout(req: Request, res: Response) {
        return res.json(ServiceResponse.Success(null, "Đăng xuất thành công"));
    }
}