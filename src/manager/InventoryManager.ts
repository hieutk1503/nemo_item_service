import prisma from '../configs/PrismaContext';
import { LogManager } from './LogManager';

export class InventoryManager {
    
    /**
     * 1. Tìm vật phẩm cụ thể của User
     * Dùng findUnique kết hợp Compound ID (user_id + game_type + item_reference_id)
     */
    static async getInventoryItem(userId: number, gameType: string, itemId: number) {
        return await prisma.inventory.findUnique({
            where: {
                user_id_game_type_item_reference_id: {
                    user_id: Number(userId),
                    game_type: gameType,
                    item_reference_id: Number(itemId)
                }
            },
            include: {
                item: {
                    include: { category: true }
                }
            }
        });
    }

    /**
     * 2. Lấy danh sách túi đồ
     */
    static async findByUserId(userId: number, gameType: string) {
        return await prisma.inventory.findMany({
            where: { 
                user_id: Number(userId),
                game_type: gameType 
            },
            include: {
                item: {
                    include: { category: true }
                }
            }
        });
    }

    /**
     * 3. Trao vật phẩm (Upsert)
     */
    static async grantItem(userId: number, gameType: string, itemId: number, qty: number, itemType: string) {
        return await prisma.inventory.upsert({
            where: {
                user_id_game_type_item_reference_id: {
                    user_id: Number(userId),
                    game_type: gameType,
                    item_reference_id: Number(itemId)
                }
            },
            update: {
                quantity: { increment: Number(qty) }
            },
            create: {
                user_id: Number(userId),
                game_type: gameType,
                item_reference_id: Number(itemId),
                quantity: Number(qty),
                item_type: itemType,
                current_level: 1,
                is_equipped: false,
                custom_data: { session_usage_count: 0 }
            }
        });
    }

    /**
     * 4. Cập nhật sau khi dùng vật phẩm
     * Không cần dùng $transaction rườm rà, update trực tiếp 2 trường trong 1 query
     */
    static async updateAfterUse(inventoryId: number, newQty: number, newCustomData: any) {
        return await prisma.inventory.update({
            where: { inventory_id: Number(inventoryId) },
            data: { 
                quantity: newQty,
                custom_data: newCustomData // Prisma tự động stringify JSON
            }
        });
    }

    /**
     * 5. Cập nhật số lượng (Dùng cho Revoke hoặc logic khác)
     */
    static async updateQuantity(inventoryId: number, newQty: number) {
        return await prisma.inventory.update({
            where: { inventory_id: Number(inventoryId) },
            data: { quantity: newQty }
        });
    }

    /**
     * 6. Ghi Log vào MongoDB
     */
    static async createLog(userId: number, inventoryId: number, action: string, note?: string) {
        // Đảm bảo LogManager đã được khai báo và saveLog nhận tham số đúng
        try {
            return await LogManager.saveLog(userId, inventoryId, action, note || '');
        } catch (error) {
            console.error("Lỗi ghi log MongoDB:", error);
            // Không throw lỗi để tránh làm gián đoạn logic game chính
        }
    }
}