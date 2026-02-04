import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../configs/PrismaContext';

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const token = authHeader.split(' ')[1];
        // Giải mã token ông vừa tạo ở AuthService
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'nemo_secret_2026');

        // Tìm user theo msisdn từ token
        const user = await prisma.user.findUnique({
            where: { msisdn: decoded.msisdn }
        });

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ success: false, message: "User không hợp lệ" });
        }

        // Gắn user vào request để Controller xài
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token invalid" });
    }
};