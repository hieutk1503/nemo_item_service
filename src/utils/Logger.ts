import winston from "winston";
import 'winston-mongodb';
import 'winston-daily-rotate-file'; // Import cái này vào
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoUri = process.env.MONGO_URI || "";
if(mongoUri === ""){
    console.log("Sai uri mongodb kh connect được");
}

// Định nghĩa màu sắc cho đẹp đội hình console
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

/**
 * Factory tạo Logger
 * @param serviceName Tên Service
 * @param mongoCollection Tên Collection trong Mongo
 * @param storeInfoToDb Có lưu Info vào DB không? (Mặc định là False - chỉ lưu Warn/Error)
 */
export const createServiceLogger = (serviceName: string, mongoCollection: string, storeInfoToDb: boolean = false) => {
    
    // 1. Cấu hình Format chung
    const generalFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Tự động lấy stack trace khi log error
        winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }) // Gom các field lạ vào metadata
    );

    const transports: any[] = [
        // --- A. Console Transport (Màu mè để dev nhìn) ---
        new winston.transports.Console({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug', // Prod thì ít log lại
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
                    let metaStr = Object.keys(metadata as object).length ? JSON.stringify(metadata) : '';
                    if (stack) return `[${timestamp}] [${serviceName}] ${level}: ${message}\nStack: ${stack} ${metaStr}`;
                    return `[${timestamp}] [${serviceName}] ${level}: ${message} ${metaStr}`;
                })
            ),
        }),

        // --- B. File Rotation Transport (Lưu tất cả Info/Error vào file) ---
        // File 1: Lưu lỗi riêng để dễ check (Quan trọng)
        new winston.transports.DailyRotateFile({
            filename: path.join('logs', '%DATE%-error.log'), // Tự tạo thư mục logs
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Nén file cũ lại cho nhẹ
            maxSize: '20m',      // File to quá 20MB thì cắt
            maxFiles: '30d',     // Chỉ giữ log trong 14 ngày
            level: 'error',      // Chỉ file này chứa ERROR
            format: winston.format.combine(winston.format.json())
        }),
        // File 2: Lưu tất cả (Info + Error) để trace luồng chạy
        new winston.transports.DailyRotateFile({
            filename: path.join('logs', '%DATE%-combined.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '50m',
            maxFiles: '30d',
            level: 'info',       // Lưu từ Info trở lên
            format: winston.format.combine(winston.format.json())
        }),
    ];

    // --- C. MongoDB Transport (Chỉ lưu ERROR/WARN) ---
    if (mongoUri) {
        transports.push(
            new winston.transports.MongoDB({
                db: mongoUri,
                collection: mongoCollection, // Collection động theo tham số
                level: storeInfoToDb ? 'info' : 'warn', // QUAN TRỌNG: nếu storeInfoToDb = true thì sẽ lưu cả Info Warn và Error vào DB. Info thì thôi.
                options: { useUnifiedTopology: true },
                storeHost: true,
                capped: true,      // Giới hạn kích thước collection (xoay vòng)
                cappedMax: 500000,  // Chỉ lưu tối đa 500.000 dòng log mới nhất trong DB
                metaKey: 'metadata',
                tryReconnect: true
            })
        );
    }

    return winston.createLogger({
        format: generalFormat,
        defaultMeta: { service: serviceName },
        transports: transports
    });
};

// đây là 1 instance mặc định cho Core dùng luôn
export const Logger = createServiceLogger('CoreSystem_Log', 'CoreSystem_Log', false);// log system

// nếu ai muốn tạo log action cho riêng service của mình thì làm theo ví dụ bên dưới.
//ex:
//export const StoreActionLogger = createServiceLogger('StoreAction_Log', 'Log_Action_Store', true);
// mục đích tạo riêng là để log các action quan trong về nghiệp vụ cần phải lưu db

// Log cho module prize
export const PrizeActionLogger = createServiceLogger('PrizeAction_Log', 'prize_actions', true);
export const ItemActionLogger = createServiceLogger('ItemAction_Log', 'item_actions', true);
export const OrderActionLogger = createServiceLogger('OrderAction_Log', 'order_actions', true);