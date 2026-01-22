import { Request, Response, NextFunction } from "express";
import { Logger } from "winston";

type AppLogger = Pick<Logger, 'info' | 'warn' | 'error'>;

/**
 * Hàm tạo Middleware Log.
 * @param logger Instance logger muốn dùng (Ví dụ: SystemLogger, StoreLogger...)
 */
export const CreateLoggerMiddle = (logger: AppLogger) => {
    
    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        let logged = false;

        res.on('finish', () => {
            if(logged) return;
            logged = true;

            const duration = Date.now() - start;

            // Lấy IP an toàn (Xử lý trường hợp x-forwarded-for là mảng)
            const forwarded = req.headers['x-forwarded-for'];
            const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket.remoteAddress);
            
            // Lấy UserID an toàn
            const userID = (req as any).user?.msisdn || req.body?.MSISDN || 'Guest';

            const message = `[HTTP] ${req.method} ${req.originalUrl || req.url} - ${res.statusCode} - ${duration}ms`;

            const metaData = {
                method: req.method,
                url: req.originalUrl || req.url,
                status: res.statusCode,
                duration: duration, // số để query
                durationText: `${duration}ms`, // chuỗi để log
                ip: ip,
                userID: userID,
                userAgent: req.headers['user-agent']
            };

            // --- PHÂN LOẠI LOG DỰA TRÊN LOGGER ĐƯỢC TRUYỀN VÀO ---
            
            if (res.statusCode >= 500) {
                // Lỗi Server -> Error (Vào DB + File)
                logger.error(message, metaData);
            } 
            else if (res.statusCode >= 400) {
                // Lỗi Client -> Warn (Vào DB + File)
                logger.warn(message, metaData);
            } 
            else {
                // Thành công -> Info (Chỉ vào File - Vì Logger System config info không vào DB)
                logger.info(message, metaData);
            }
        });

        next();
    };
};