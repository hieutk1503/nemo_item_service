import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/JwtUtil';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export const CmsAuthMiddle = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized());
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = verifyToken(token);

        // Check xem có phải Token của CMS không?
        if (decoded.gameType !== 'CMS_SYSTEM' || !decoded.adminId) {
             return res.status(HttpStatusCode.FORBIDDEN).json(APIResponse.Forbidden("Token không hợp lệ cho CMS"));
        }

        // Gắn info vào req để Controller dùng
        (req as any).user = decoded; 
        next();

    } catch (error) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json(APIResponse.Unauthorized("Token hết hạn hoặc không hợp lệ"));
    }
};