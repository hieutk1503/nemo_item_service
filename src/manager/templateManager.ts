`import { BaseRedisManager } from "./BaseRedisManager";

/**
 * 1. Định nghĩa kiểu dữ liệu bạn muốn lưu
 * Ví dụ: Inventory, RoomData, PlayerStatus...
 */
export interface TemplateData {
    id: string;          // ID định danh
    name: string;        // Tên
    count: number;       // Số lượng
    isActive: boolean;   // Trạng thái
    metaData?: any;      // Dữ liệu phụ (nếu có)
}

/**
 * 2. Tạo Class Manager kế thừa từ BaseRedisManager
 * Thay 'TemplateData' bằng interface bên trên
 */
class TemplateManagerClass extends BaseRedisManager<TemplateData> {
    
    // --- BẮT BUỘC: Cấu hình Prefix ---
    // Để tránh trùng key với module khác. Ví dụ: "inventory:", "room:", "shop:"
    protected getPrefix(): string {
        return "template_module:"; 
    }

    // --- BẮT BUỘC: Cấu hình thời gian sống (TTL) ---
    // Tính bằng giây. Ví dụ: 3600 = 1 tiếng. 
    protected getTTL(): number {
        return 3600; 
    }

    // --- TÙY CHỌN: Viết thêm hàm riêng nếu cần ---
    // Các hàm cơ bản: get, set, update, remove, exists đã CÓ SẴN ở Base.
    // Chỉ viết thêm nếu có logic đặc thù.
    
    // Ví dụ: Hàm tăng số lượng
    async incrementCount(id: string, amount: number) {
        const data = await this.get(id);
        if (data) {
            data.count += amount;
            await this.update(id, data); // update giữ nguyên TTL
            return data.count;
        }
        return 0;
    }
}

// 3. Export ra một instance duy nhất (Singleton) để dùng toàn project
export const TemplateManager = new TemplateManagerClass();

/* --- HƯỚNG DẪN SỬ DỤNG ---
import { TemplateManager } from "./manager/TemplateManager";

// Lưu mới
await TemplateManager.set("user_123", { id: "user_123", name: "Test", count: 10, isActive: true });

// Lấy ra
const data = await TemplateManager.get("user_123");

// Xóa
await TemplateManager.remove("user_123");
*/`