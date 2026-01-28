import prisma from '../configs/PrismaContext';
import { ItemActionLogger, Logger } from '../utils/Logger'; // <--- Import đúng ItemActionLogger

export class InventoryManager {
    
    /**
     * 1. Tìm vật phẩm cụ thể
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
            include: { item: { include: { category: true } } }
        });
    }

    /**
     * 2. Lấy danh sách túi đồ
     */
    static async findByUserId(userId: number, gameType: string) {
        return await prisma.inventory.findMany({
            where: { user_id: Number(userId), game_type: gameType },
            include: { item: { include: { category: true } } }
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
            update: { quantity: { increment: Number(qty) } },
            create: {
                user_id: Number(userId),
                game_type: gameType,
                item_reference_id: Number(itemId),
                quantity: Number(qty),
                item_type: itemType,
                current_level: 1,
                is_equipped: false,
                custom_data: { session_usage_count: 0 } // Đã sửa thành Json Object
            }
        });
    }

    /**
     * 4. Cập nhật sau khi dùng (Update)
     */
    static async updateAfterUse(inventoryId: number, newQty: number, newCustomData: any) {
        return await prisma.inventory.update({
            where: { inventory_id: Number(inventoryId) },
            data: { 
                quantity: newQty,
                custom_data: newCustomData 
            }
        });
    }

    /**
     * 5. Cập nhật số lượng (Update Quantity)
     */
    static async updateQuantity(inventoryId: number, newQty: number) {
        return await prisma.inventory.update({
            where: { inventory_id: Number(inventoryId) },
            data: { quantity: newQty }
        });
    }

    /**
     * 6. Ghi Log vào MongoDB (ĐÃ SỬA CHUẨN)
     * Sử dụng ItemActionLogger của Winston
     */
    static createLog(userId: number, inventoryId: number, action: string, note?: string) {
        // Winston sẽ lưu tham số thứ 1 là message (Action), tham số thứ 2 là metadata (Chi tiết)
        // Vì storeInfoToDb = true, level 'info' sẽ được lưu vào MongoDB
        ItemActionLogger.info(action, {
            userId: userId,
            inventoryId: inventoryId,
            note: note || '',
            // Có thể thêm các field khác nếu muốn, Winston sẽ lưu hết vào cột 'metadata' trong Mongo
        });
    }
}