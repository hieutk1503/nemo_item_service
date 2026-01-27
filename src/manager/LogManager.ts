import mongoose, { Schema, Document } from 'mongoose';

// 1. Định nghĩa Interface & Schema ngay tại đây (Encapsulation)
interface IItemLog extends Document {
    userId: number;
    inventoryId: number;
    action: string;
    note: string;
    createdAt: Date;
}

const ItemLogSchema: Schema = new Schema({
    userId: { type: Number, required: true, index: true },
    inventoryId: { type: Number, required: true },
    action: { type: String, required: true },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, expires: '90d' } // Tự xóa sau 90 ngày
});

// Tạo Model (Biến này chỉ dùng nội bộ trong file này)
const ItemLogModel = mongoose.model<IItemLog>('ItemLog', ItemLogSchema);

// 2. Export Class LogManager để bên ngoài gọi vào
export class LogManager {
    
    /**
     * Ghi log hành động vào MongoDB
     */
    static async saveLog(userId: number, inventoryId: number, action: string, note: string = '') {
        try {
            return await ItemLogModel.create({
                userId: Number(userId),
                inventoryId: Number(inventoryId),
                action: action,
                note: note
            });
        } catch (error) {
            console.error("❌ [LogManager] Lỗi ghi log MongoDB:", error);
            // Không throw error để tránh làm chết luồng chính của game
        }
    }
}