import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import router from "./routers/Router";
import { CorsMiddle } from "./middlewares/CorsMiddle";
import { Logger } from "./utils/Logger";
import { connectMongoDB } from "./configs/MongoDBConfig";
import prisma from "./configs/PrismaContext";
import { CreateLoggerMiddle } from "./middlewares/LoggerMiddle";
import { connectRedis } from "./utils/RedisClient";

export const app = express();
const PORT = process.env.PORT || 3001;
// 1. Middlewares cơ bản
app.use(express.json()); 
app.use(CorsMiddle);
app.use(CreateLoggerMiddle(Logger));

// 2. Phục vụ file tĩnh (Phải đặt TRƯỚC router API nếu muốn chạy chung port)
app.use(express.static(path.join(process.cwd(), "frontend")));


// 3. Định nghĩa API Routes
app.use((req, res, next) => {
    console.log(`[DEBUG] Method: ${req.method} | URL: ${req.url}`);
    next();
});
app.use('/api/cms', router)
// 4. XỬ LÝ LỖI 404 CHO API (SỬA LẠI ĐOẠN NÀY)
// Chỉ chạy vào đây nếu đã đi hết file router mà KHÔNG CÓ cái nào khớp
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    // Nếu request đã được xử lý bởi router ở trên thì nó sẽ không chạy vào đây.
    // Nhưng vì cấu trúc app.use ở server.ts rất nhạy cảm, tốt nhất là COMMENT nó lại để test trước.
    /* res.status(404).json({ 
        success: false, 
        message: `API Endpoint [${req.method}] ${req.originalUrl} không tồn tại!` 
    });
    */
    next(); 
});

// 5. ROUTE TRANG CHỦ
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
});

// 6. XỬ LÝ FALLBACK CHO SPA (Cách mới: Sử dụng Middleware tổng)
// Nếu không phải API và cũng không có file tĩnh nào khớp, trả về index.html
app.use((req: Request, res: Response) => {
    // Chỉ trả về index.html cho các request GET (trang web), không trả về cho POST/API
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
    } else {
        res.status(404).json({ success: false, message: "Resource not found" });
    }

});

const startServer = async () => {
    try {
        Logger.info('Đang khởi động Mystery Box Services...');
        await prisma.$connect();
        Logger.info('Kết nối MySQL (Prisma) thành công.');
        await connectMongoDB();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`=========================================`);
            console.log(`Server: http://localhost:${PORT}`);
            console.log(`=========================================`);
        });
    }
    catch (err: any) {
        console.error("Lỗi khởi động: " + err.message);
        process.exit(1);
    }
};

startServer();