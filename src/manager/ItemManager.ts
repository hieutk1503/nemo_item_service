import prisma from '../configs/PrismaContext';

export class ItemManager {
    // Lấy thông tin chi tiết 1 vật phẩm kèm theo Danh mục (Category)
    static async getItemDetail(itemId: number) {
        return await prisma.item.findUnique({
            where: { item_id: itemId },
            include: { category: true } // Join tự động với bảng Category
        });
    }

    // Lấy danh sách vật phẩm theo Category Name
    static async getItemsByCategory(categoryName: string) {
        return await prisma.item.findMany({
            where: {
                category: {
                    category_name: categoryName
                }
            },
            include: { category: true }
        });
    }
}