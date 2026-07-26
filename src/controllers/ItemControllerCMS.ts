import { Request, Response } from 'express';
import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';

class ItemControllerCMS {

    /**
     * [GET] /api/cms/items
     * Lấy danh sách Item gốc (Có phân trang & Tìm kiếm)
     */
    async getList(req: Request, res: Response) {
        try {
            const page = Number(req.query.page) || 1;
            const pageSize = Number(req.query.pageSize) || 10;
            const skip = (page - 1) * pageSize;

            const { itemName, itemCode, categoryId } = req.query;

            const where: any = {};
            
            if (itemName) where.item_name = { contains: String(itemName) };
            if (itemCode) where.item_code = { contains: String(itemCode) };
            if (categoryId) where.category_id = Number(categoryId);

            const [items, total] = await Promise.all([
                prisma.item.findMany({
                    where,
                    skip,
                    take: pageSize,
                    orderBy: { created_at: 'desc' },
                    include: { category: true }
                }),
                prisma.item.count({ where })
            ]);

            return res.json(ServiceResponse.Success({
                items,
                total,
                page,
                pageSize
            }, "Lấy danh sách vật phẩm thành công"));

        } catch (error: any) {
            console.error("Get Item List Error:", error);
            return res.status(500).json(ServiceResponse.Fail("Lỗi hệ thống: " + error.message));
        }
    }

    /**
     * [POST] /api/cms/items
     * Tạo vật phẩm mới
     */
    async create(req: Request, res: Response) {
        try {
            // 1. Lấy thêm game_id từ request body
            const { item_code, item_name, price, category_id, game_id } = req.body;
            
            // Check trùng mã
            const exist = await prisma.item.findUnique({ where: { item_code } });
            if (exist) return res.json(ServiceResponse.Fail("Mã vật phẩm đã tồn tại"));

            // 2. Xử lý game_id (Bắt buộc phải có)
            // Nếu Frontend không gửi game_id thì gán mặc định là "DEFAULT" để không bị lỗi Prisma
            const finalGameId = game_id ? String(game_id) : "DEFAULT_GAME";

            const newItem = await prisma.item.create({
                data: {
                    item_code,
                    item_name,
                    price: Number(price),
                    category_id: Number(category_id),
                    
                    // ✅ QUAN TRỌNG: Thêm trường này để fix lỗi TypeScript
                    game_id: finalGameId 
                }
            });

            return res.json(ServiceResponse.Success(newItem, "Tạo vật phẩm thành công"));
        } catch (error: any) {
            console.error("Create Item Error:", error);
            return res.status(500).json(ServiceResponse.Fail("Lỗi tạo vật phẩm: " + error.message));
        }
    }
}

export default new ItemControllerCMS();