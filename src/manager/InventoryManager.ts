import prisma from '../configs/PrismaContext';
import { ItemActionLogger } from '../utils/Logger';

export class InventoryManager {
    
    static async getInventoryItem(userId: string, gameId: number, itemId: number) {
        return await prisma.inventory.findUnique({
            where: {
                user_id_game_id_item_reference_id: {
                    user_id: userId,
                    game_id: gameId,
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

    static async findByUserId(userId: string, gameId: number) {
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

    static async grantItem(userId: string, gameId: number, itemId: number, qty: number, itemType: string) {
        return await prisma.inventory.upsert({
            where: {
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
                item_type: itemType,
                custom_data: { session_usage_count: 0 }
            }
        });
    }

    static async updateAfterUse(inventoryId: number, newQty: number, newCustomData: any) {
        return await prisma.inventory.update({
            where: { inventory_id: inventoryId },
            data: { 
                quantity: newQty,
                custom_data: newCustomData 
            }
        });
    }

    static async updateQuantity(inventoryId: number, newQty: number) {
        return await prisma.inventory.update({
            where: { inventory_id: inventoryId },
            data: { quantity: newQty }
        });
    }

    static createLog(userId: string, inventoryId: number, action: string, note?: string) {
        ItemActionLogger.info(action, {
            userId: userId,
            inventoryId: inventoryId,
            note: note || ''
        });
    }
}