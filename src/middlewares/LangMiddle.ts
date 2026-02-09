import { Request, Response, NextFunction } from "express";

export const LangMiddle = (req: any, res: Response, next: NextFunction) => {
    // 1. Kiểm tra ngôn ngữ từ Query (?lang=) hoặc Headers
    // 2. Nếu không có, mặc định là 'vi'
    const lang = req.query.lang || req.headers['accept-language'] || 'vi';
    
    // 3. Gắn biến lang vào đối tượng req để Controller có thể truy cập
    req.lang = lang;
    
    next(); // Cho phép request đi tiếp vào Controller
};