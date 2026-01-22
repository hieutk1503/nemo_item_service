import { Logger } from "../utils/Logger";
import { RedisClient } from "../utils/RedisClient"

export abstract class BaseRedisManager<T> {
    
    // Prefix để tránh trùng key (Ví dụ: "inventory:", "shop_cart:")
    protected abstract getPrefix(): string;
    
    // Thời gian sống mặc định của Key (giây)
    protected abstract getTTL(): number;

    // --- 2. Helper nội bộ ---
    protected getKey(id: string): string {
        return `${this.getPrefix()}${id}`;
    }

    // --- 3. Các chức năng chính (GET, SET, UPDATE, REMOVE) ---

    /**
     * Lấy dữ liệu từ Redis
     * @param id ID của đối tượng (ví dụ userId, sessionId)
     */
    async get(id: string): Promise<T | null> {
        try {
            const key = this.getKey(id);
            const rawData = await RedisClient.get(key);
            
            if (!rawData) return null;
            
            return JSON.parse(rawData) as T;
        } catch (err: any) {
            Logger.error(`[Redis Base] Get Error [${this.getPrefix()}]`, { id, error: err.message });
            return null;
        }
    }

    /**
     * Lưu dữ liệu mới vào Redis (Sẽ reset lại thời gian hết hạn theo getTTL)
     * @param id ID định danh
     * @param data Dữ liệu cần lưu
     */
    async set(id: string, data: T): Promise<boolean> {
        try {
            const key = this.getKey(id);
            const value = JSON.stringify(data);
            
            // Lưu và set thời gian hết hạn (EX)
            await RedisClient.set(key, value, { EX: this.getTTL() });
            return true;
        } catch (err: any) {
            Logger.error(`[Redis Base] Set Error [${this.getPrefix()}]`, { id, error: err.message });
            return false;
        }
    }

    /**
     * Cập nhật dữ liệu (Giữ nguyên thời gian hết hạn còn lại - KEEPTTL)
     * Dùng khi user chỉ thay đổi nhỏ (cộng tiền, trừ đồ) mà không muốn reset time.
     */
    async update(id: string, data: T): Promise<boolean> {
        try {
            const key = this.getKey(id);
            const value = JSON.stringify(data);

            // KEEPTTL: True -> Không reset thời gian đếm ngược
            await RedisClient.set(key, value, { KEEPTTL: true });
            return true;
        } catch (err: any) {
            Logger.error(`[Redis Base] Update Error [${this.getPrefix()}]`, { id, error: err.message });
            return false;
        }
    }

    /**
     * Xóa dữ liệu khỏi Redis
     */
    async remove(id: string): Promise<void> {
        try {
            const key = this.getKey(id);
            await RedisClient.del(key);
            Logger.info(`[Redis] Removed key: ${key}`);
        } catch (err: any) {
            Logger.error(`[Redis Base] Remove Error [${this.getPrefix()}]`, { id, error: err.message });
        }
    }

    /**
     *  Kiểm tra xem Key có tồn tại không
     */
    async exists(id: string): Promise<boolean> {
        try {
            const count = await RedisClient.exists(this.getKey(id));
            return count > 0;
        } catch (err) {
            return false;
        }
    }
}