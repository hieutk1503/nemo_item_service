import { createClient } from "redis";
import { Logger } from "./Logger"; // Import Logger xịn vào

const REDIS_URL = process.env.REDIS_URL || "";

if (REDIS_URL === "") {
    Logger.error("Thiếu cấu hình REDIS_URL trong .env");
    //process.exit(1); // Cho sập luôn để biết mà sửa, chứ chạy tiếp cũng không làm ăn gì được
}

export const RedisClient = createClient({
    url: REDIS_URL,
    // Cấu hình Socket để quản lý việc Reconnect thông minh hơn
    socket: {
        reconnectStrategy: (retries) => {
            // Nếu thử lại quá 20 lần (khoảng 1-2 phút) mà không được thì báo lỗi Error
            if (retries > 20) {
                Logger.error("Redis: Mất kết nối quá lâu, ngừng thử lại!", { retries });
                return new Error("Redis Connection Lost");
            }
            // Thử lại sau: min(thời gian tăng dần, 3 giây)
            return Math.min(retries * 50, 3000);
        }
    }
});

// --- LẮNG NGHE SỰ KIỆN (QUAN TRỌNG) ---

// 1. Lỗi: Cái này quan trọng nhất
RedisClient.on('error', (err) => {
    Logger.error('Redis Client Error', { error: err.message, stack: err.stack });
});

// 2. Connect: Mới chỉ là kết nối TCP thành công
RedisClient.on('connect', () => {
    Logger.info('Redis Client: Connected to Server');
});

// 3. Ready: Lúc này mới thực sự dùng được (Load xong lệnh)
RedisClient.on('ready', () => {
    Logger.info('Redis Client: Ready to use');
});

// 4. Reconnecting: Đang cố gắng kết nối lại (Mạng chập chờn)
RedisClient.on('reconnecting', () => {
    Logger.warn('Redis Client: Đang kết nối lại (Reconnecting)...');
});

// 5. End: Ngắt hẳn kết nối
RedisClient.on('end', () => {
    Logger.warn('Redis Client: Disconnected');
});

/**
 * Hàm khởi tạo kết nối
 */
export const connectRedis = async () => {
    try {
        await RedisClient.connect();
    } catch (err: any) {
        Logger.error("Không thể kết nối Redis lúc khởi động", { error: err.message });
        process.exit(1);
    }
}