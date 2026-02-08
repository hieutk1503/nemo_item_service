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
const PORT = process.env.PORT || 3000;

// 1. Middlewares cơ bản
app.use(express.json()); 
app.use(CorsMiddle);
app.use(CreateLoggerMiddle(Logger));

// 2. Phục vụ file tĩnh (Phải đặt TRƯỚC router API nếu muốn chạy chung port)
app.use(express.static(path.join(process.cwd(), "frontend")));

// 3. Định nghĩa API Routes
app.use('/api', router);

// 4. XỬ LÝ LỖI 404 CHO API (Cách mới: Không dùng dấu *)
// Nếu một request vào /api mà không khớp route nào trong router, nó sẽ trôi xuống đây
app.use('/api', (req: Request, res: Response) => {
    res.status(404).json({ 
        success: false, 
        message: `API Endpoint [${req.method}] ${req.originalUrl} không tồn tại!` 
    });
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
        Logger.info('⏳ Đang khởi động Mystery Box Services...');
        await prisma.$connect();
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