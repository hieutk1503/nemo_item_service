import prisma from '../configs/PrismaContext';

export class ItemManager {
    
    // 1. Lấy thông tin chi tiết 1 vật phẩm
    // Prisma sẽ tự động trả về game_id vì nó đã có trong model Item
    static async getItemDetail(itemId: number) {
        return await prisma.item.findUnique({
            where: { item_id: Number(itemId) },
            include: { 
                category: true // ✅ BẮT BUỘC phải có dòng này
            }
        });
    }

    // 2. Lấy danh sách vật phẩm theo Category Name VÀ Game Code
    // Thêm tham số gameId để lọc chính xác
    static async getItemsByCategory(categoryName: string, gameId: string) {
        return await prisma.item.findMany({
            where: {
                game_id: gameId, // ✅ Lọc theo Game (ví dụ: 'MYSTERY_BOX')
                category: {
                    category_name: categoryName
                }
            },
            include: { category: true }
        });
    }

    // 3. (Gợi ý thêm) Lấy vật phẩm theo Item Code và Game Code
    // Vì item_code của bạn là @unique, nhưng nên check kèm game_id cho chắc chắn
    static async getItemByCode(itemCode: string, gameId: string) {
        return await prisma.item.findFirst({
            where: {
                item_code: itemCode,
                game_id: gameId
            },
            include: { category: true }
        });
    }
}