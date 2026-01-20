import winston from "winston";
import 'winston-mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || "";
if(mongoUri === ""){
    console.log("Có lỗi khi lấy đường dẫn mongodb hoặc không có MONG_URL trong env");
}

export const Logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({
            stack: true
        }),
        winston.format.metadata(),
    ),
    defaultMeta: {
        service: 'CMSMysterybox_Server'
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({timestamp, level, message, metadata, stack}) => {
                    let metaStr = Object.keys(metadata as object).length ? JSON.stringify(metadata) : '';
                    if(stack){
                        return `[${timestamp} ${level}: ${message} \n Stack: ${stack}]`;
                    }
                    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
                })
            ),
        }),
        new winston.transports.MongoDB({
            db: mongoUri,
            collection: 'ServerCMS_Logs',
            level: 'info',
            options: {
                useUnifiedTopology: true,
            },
            storeHost: true,
            capped: true,
            cappedMax: 10000,
        }) as any
    ]
});