import dotenv from "dotenv";
dotenv.config();
import express from "express";
import router from "./routers/Router";
import { CorsMiddle } from "./middlewares/CorsMiddle";
import { Logger } from "./utils/Logger";
import { connectMongoDB } from "./configs/MongoDBConfig";
import prisma from "./configs/PrismaContext";
import { CreateLoggerMiddle } from "./middlewares/LoggerMiddle";
//import { connectRedis } from "./utils/RedisClient";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(CorsMiddle);
app.use(express.json());
app.use(CreateLoggerMiddle(Logger));

app.use('/api', router);

const startServer = async () => {
    try{
        Logger.info('⏳ Đang kết nối Database...');
        await prisma.$connect();
        Logger.info('✅ Database MySQL kết nối thành công!');

        await connectMongoDB();

        // await connectRedis();

        app.listen(PORT, () =>{
            console.log(`Server đang chạy tại http://localhost:${PORT}`);
        });
    }
    catch(err){
        console.log("Lỗi khởi động server" + err);
        process.exit(1);
    }
};

startServer();