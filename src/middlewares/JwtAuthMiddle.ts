import { Request, Response, NextFunction } from 'express';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';
import { verifyToken, TokenPayload } from '../utils/JwtUtil'; 

export const JwtAuthMiddle = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // 1. Kiểm tra format header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(HttpStatusCode.UNAUTHORIZED)
                  .json(APIResponse.Unauthorized("Bạn chưa đăng nhập! (Thiếu Token)"));
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify (Nếu lỗi nó sẽ nhảy xuống catch ngay)
        const decoded: TokenPayload = verifyToken(token);

        // 3. Gán user
        (req as any).user = decoded; 
        
        // 4. Map Header
        if (decoded.msisdn) {
             req.headers['x-msisdn'] = decoded.msisdn;
             req.headers['x-user-id'] = decoded.msisdn;
        }
        
        const gameId = decoded.gameType || req.headers['x-game-id'];
        if (gameId) req.headers['x-game-id'] = String(gameId);

        next();

    } catch (error: any) {
        // [DEBUG LOG]: Bật cái này lên để xem chính xác lỗi gì
        // console.log("🔥 JWT Error:", error.name, error.message);

        let message = "Token không hợp lệ hoặc bị lỗi xác thực.";

        // [FIX]: Bắt đúng tên lỗi chuẩn của thư viện JWT
        if (error.name === 'TokenExpiredError') {
            message = "Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại."; // FE sẽ bắt message này hoặc status 403
        } else if (error.name === 'JsonWebTokenError') {
            message = "Token không hợp lệ (Lỗi cấu trúc/Chữ ký).";
        }

        return res.status(HttpStatusCode.FORBIDDEN)
                  .json(APIResponse.Forbidden(message));
    }
};