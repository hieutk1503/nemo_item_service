import { Request, Response, NextFunction } from 'express';
import { APIResponse, HttpStatusCode } from '../utils/APIResponse';
import {Logger} from '../utils/Logger';

// Định nghĩa kiểu lỗi mở rộng (để hứng status code nếu có)
interface AppError extends Error {
    statusCode?: number;
    status?: number;
}

export const ErrorMiddle = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    
    // 1. Xác định Status Code
    // Nếu lỗi có sẵn status (VD: 404, 403) thì lấy, nếu không thì mặc định 500
    const statusCode = err.statusCode || err.status || HttpStatusCode.INTERNAL_SERVER_ERROR;

    // 2. Ghi Log chi tiết (Quan trọng: Phải ghi cả Stack Trace để debug)
    Logger.error(`[ERROR] ${req.method} ${req.url} - Status: ${statusCode} - Msg: ${err.message}`, {
        stack: err.stack, // Lưu stack trace vào DB/File để tra cứu
        body: req.body,   // Lưu body để biết client gửi gì (nhớ che pass nếu cần)
        query: req.query
    });

    // 3. Xử lý lỗi cú pháp JSON (Cái cũ của bạn - Giữ nguyên vì tốt)
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(HttpStatusCode.BAD_REQUEST)
                  .json(APIResponse.BadRequest("JSON gửi lên bị lỗi cú pháp!"));
    }

    // 4. Phản hồi cho Client
    
    // A. Nếu là lỗi 500 (Lỗi server crash/code lởm)
    if (statusCode === HttpStatusCode.INTERNAL_SERVER_ERROR) {
        // Môi trường DEV: Trả về chi tiết lỗi để Dev sửa
        if (process.env.NODE_ENV === 'development') {
            return res.status(statusCode).json({
                success: false,
                message: err.message,
                stack: err.stack // Chỉ hiện stack ở Dev
            });
        }
        
        // Môi trường PROD: Giấu lỗi đi, chỉ báo chung chung để bảo mật
        return res.status(statusCode)
                  .json(APIResponse.ServerError("Đã xảy ra lỗi hệ thống, vui lòng thử lại sau."));
    }

    // B. Nếu là lỗi Logic (400, 401, 403, 404...) do mình chủ động throw
    // Ví dụ: throw { statusCode: 400, message: "Hết hàng" }
    return res.status(statusCode).json({
        success: false,
        message: err.message || "Lỗi không xác định",
        data: null
    });
};