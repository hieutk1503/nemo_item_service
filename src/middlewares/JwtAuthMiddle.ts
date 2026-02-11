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
        // 2. Verify bằng Util (Đồng bộ logic secret key và expire time)
        const decoded: TokenPayload = verifyToken(token);

        // 3. Gán thông tin đã giải mã vào request để Controller dùng
        (req as any).user = decoded; 
        
        // 4. Map Header định danh người dùng
        if (decoded.msisdn) {
             req.headers['x-msisdn'] = decoded.msisdn;
             
             // [Backward Compatibility] Map msisdn vào x-user-id 
             req.headers['x-user-id'] = decoded.msisdn;
        }
        
        // 5. Map Header Game ID
        const gameId = decoded.gameType || req.headers['x-game-id'];
        
        if (gameId) {
             req.headers['x-game-id'] = String(gameId);
        }

        next();

    } catch (error: any) {

        const message = error.message === 'Token expired' 
            ? "Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại." 
            : "Token không hợp lệ hoặc bị lỗi xác thực.";
            
        // Trả về 403 Forbidden để Client biết đường logout/refresh
        return res.status(HttpStatusCode.FORBIDDEN)
                  .json(APIResponse.Forbidden(message));
    }
};