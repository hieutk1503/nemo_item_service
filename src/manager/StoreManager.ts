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

        // 2. Truy vấn DB (Đã cập nhật: Lọc theo game_id)
        // ✅ Bây giờ bảng Item đã có game_id trực tiếp, ta filter thẳng luôn
        const items = await prisma.item.findMany({
            where: {
                game_id: gameId // Chỉ lấy vật phẩm của game này (ví dụ: 'MYSTERY_BOX')
            },
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

    /**
     * Tìm vật phẩm cụ thể (Nên kèm thêm gameId để bảo mật)
     */
    async findItemById(itemId: number, gameId?: string) {
        return prisma.item.findFirst({
            where: {
                item_id: itemId,
                ...(gameId && { game_id: gameId }) // Nếu có truyền gameId thì lọc thêm cho chắc
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
    // 🛒 ORDER (Dưới này Hiếu đã viết đúng rồi, mình giữ nguyên)
    // ======================================================

    async countOrdersByUser(userId: string, gameId: string) { 
        return prisma.orders.count({
            where: {
                user_id: userId,
                game_id: gameId
            }
        });
    }

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
                created_at: "desc"
            },
            include: {
                orders_item: true 
            }
        });
    }
}

export default new StoreManagerClass();