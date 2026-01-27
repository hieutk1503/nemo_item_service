import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';

export const JwtAuthMiddle = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HttpStatusCode.UNAUTHORIZED)
                  .json(APIResponse.Unauthorized("Bạn chưa đăng nhập! (Thiếu Token)"));
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'secret-mac-dinh'; 
        const decoded = jwt.verify(token, secret) as any;

        // Lưu vào req.user để dùng nếu cần
        (req as any).user = decoded; 
        
        // [QUAN TRỌNG] Trích xuất từ Token và ghi đè vào Header
        // Việc này đảm bảo thông tin userId là chính xác, không thể giả mạo
        if (decoded.userId) {
             req.headers['x-user-id'] = String(decoded.userId);
        }
        
        // Lấy gameId từ token (nếu có) hoặc từ header người dùng gửi lên
        const gameId = decoded.gameId || req.headers['x-game-id'];
        if (gameId) {
             req.headers['x-game-id'] = String(gameId);
        }

        next();
    } catch (error) {
        return res.status(HttpStatusCode.FORBIDDEN)
                  .json(APIResponse.Forbidden("Token không hợp lệ hoặc đã hết hạn!"));
    }
};