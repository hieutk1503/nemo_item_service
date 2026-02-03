import { BaseRedisManager } from "./BaseRedisManager";
import prisma from "../configs/PrismaContext";
import { Item } from "@prisma/client";

/**
 * ===============================
 * CACHE STRUCTURE
 * ===============================
 */
export interface StoreCacheData {
    gameId: string; 
    items: Item[];
}

/**
 * ===============================
 * STORE MANAGER
 * ===============================
 */
class StoreManagerClass extends BaseRedisManager<StoreCacheData> {

    protected getPrefix(): string {
        return "store_module:products:";
    }

    protected getTTL(): number {
        return 300; // 5 phút
    }

    // ======================================================
    // 📦 PRODUCT
    // ======================================================

    async findItemsByGameId(gameId: string) { 
        const key = gameId;

        // 1. Kiểm tra Redis cache
        const cached = await this.get(key);
        if (cached && cached.items.length > 0) {
            return cached.items;
        }

        // 2. Truy vấn DB
        // Do bảng Item không có game_id trực tiếp, ta lấy theo Category hoặc All
        const items = await prisma.item.findMany({
            include: {
                category: true 
            }
        });

        // 3. Lưu cache
        if (items.length > 0) {
            await this.set(key, {
                gameId,
                items
            });
        }

        return items;
    }

    async findItemById(itemId: number) {
        return prisma.item.findUnique({
            where: {
                item_id: itemId
            },
            include: {
                category: true 
            }
        });
    }

    async clearCache(gameId: string) {
        await this.remove(gameId);
    }

    // ======================================================
    // 🛒 ORDER
    // ======================================================

    /**
     * Đếm số đơn hàng (userId & gameId đều là string)
     */
    async countOrdersByUser(userId: string, gameId: string) { 
        return prisma.orders.count({
            where: {
                user_id: userId, // Khớp msisdn
                game_id: gameId  // Khớp String game_id
            }
        });
    }

    /**
     * Lấy danh sách đơn hàng
     */
    async findOrdersByUser(
        userId: string,
        gameId: string, 
        skip: number,
        take: number
    ) {
        return prisma.orders.findMany({
            where: {
                user_id: userId,
                game_id: gameId
            },
            skip,
            take,
            orderBy: {
                created_at: "desc" // Khớp created_at
            },
            include: {
                orders_item: true 
            }
        });
    }
}

export default new StoreManagerClass();