import prisma from '../configs/PrismaContext';
import { ItemActionLogger } from '../utils/Logger';

export class InventoryManager {
    
    /**
     * 1. Tìm vật phẩm cụ thể
     * gameId: string (Game Code)
     */
    static async getInventoryItem(userId: string, gameId: string, itemId: number) {
        return await prisma.inventory.findUnique({
            where: {
                user_id_game_id_item_reference_id: {
                    user_id: userId,
                    game_id: gameId, // Kiểu String (Ví dụ: "NEMO_FARM")
                    item_reference_id: itemId
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
    static async findByUserId(userId: string, gameId: string) {
        return await prisma.inventory.findMany({
            where: { 
                user_id: userId, 
                game_id: gameId 
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
    // src/manager/InventoryManager.ts

static async grantItem(userId: string, gameId: string, itemId: number, qty: number, itemType: string) {
    return await prisma.inventory.upsert({
        where: {
            // Tên index mặc định của Prisma khi dùng @@unique([user_id, game_id, item_reference_id])
            user_id_game_id_item_reference_id: {
                user_id: userId,
                game_id: gameId,
                item_reference_id: itemId
            }
        },
        update: { 
            quantity: { increment: qty } 
        },
        create: {
            user_id: userId,
            game_id: gameId,
            item_reference_id: itemId,
            quantity: qty,
            item_type: itemType, // Sẽ lưu Category Name vào đây
            current_level: 1,
            is_equipped: false,
            custom_data: { session_usage_count: 0 }
        }
    });
}

    /**
     * 4. Cập nhật sau khi dùng vật phẩm
     */
    static async updateAfterUse(inventoryId: number, newQty: number, newCustomData: any) {
        return await prisma.inventory.update({
            where: { inventory_id: inventoryId },
            data: { 
                quantity: newQty,
                custom_data: newCustomData 
            }
        });
    }

    /**
     * 5. Cập nhật số lượng
     */
    static async updateQuantity(inventoryId: number, newQty: number) {
        return await prisma.inventory.update({
            where: { inventory_id: inventoryId },
            data: { quantity: newQty }
        });
    }

    /**
     * 6. Ghi log qua Winston
     */
    static createLog(userId: string, inventoryId: number, action: string, note?: string) {
        ItemActionLogger.info(action, {
            userId: userId,
            inventoryId: inventoryId,
            note: note || ''
        });
    }
}