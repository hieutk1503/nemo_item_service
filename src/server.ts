import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path"; // 1. Thêm cái này để xử lý đường dẫn
import router from "./routers/Router";
import { CorsMiddle } from "./middlewares/CorsMiddle";
import { Logger } from "./utils/Logger";
import { connectMongoDB } from "./configs/MongoDBConfig";
import prisma from "./configs/PrismaContext";
import { CreateLoggerMiddle } from "./middlewares/LoggerMiddle";
import { connectRedis } from "./utils/RedisClient";

export const app = express();
const PORT = process.env.PORT || 3000;


app.use(CorsMiddle);
app.use(express.json());
app.use(CreateLoggerMiddle(Logger));

// 2. Phục vụ các file tĩnh ở thư mục gốc (ngang hàng với src)
// Khi bạn chạy ts-node từ thư mục gốc, process.cwd() chính là đường dẫn đến thư mục đó.
app.use(express.static(path.join(process.cwd(),"frontend")));

app.use('/api', router);

// 3. Route mặc định trả về file index.html khi vào http://localhost:PORT
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(),'frontend', 'index.html'));
});

const startServer = async () => {
    try {
        Logger.info('⏳ Đang kết nối Database...');
        await prisma.$connect();
        Logger.info('✅ Database MySQL kết nối thành công!');

        await connectMongoDB();

        // await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.log("Lỗi khởi động server" + err);
        process.exit(1);
    }
};

startServer();

