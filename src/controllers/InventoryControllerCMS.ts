import { Request, Response } from 'express';
import prisma from '../configs/PrismaContext';
import { ServiceResponse } from '../utils/ServiceResponse';

class InventoryController {
    
    /**
     * Lấy danh sách + Tìm kiếm (GET)
     */
    getList = async (req: Request, res: Response) => {
    try {
        console.log(">>>> [BACKEND DEBUG] Query nhận được:", req.query);

        const { userId, itemName } = req.query;
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        const where: any = {};

        // 1. SỬA TẠI ĐÂY: Vì DB là String, nên mình cứ để String mà tìm
        if (userId && String(userId).trim() !== '') {
            where.user_id = { 
                contains: String(userId) // Tìm gần đúng theo chuỗi
            };
        }

        // 2. Tìm theo tên vật phẩm
        if (itemName && String(itemName).trim() !== '') {
            where.item = {
                item_name: { contains: String(itemName) }
            };
        }

        const [items, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                skip,
                take: pageSize,
                include: { item: true },
                orderBy: { acquired_at: 'desc' }
            }),
            prisma.inventory.count({ where })
        ]);

        const formattedItems = items.map(inv => ({
            id: inv.inventory_id,
            user_id: inv.user_id,
            item_name: inv.item?.item_name || 'N/A',
            price: inv.item?.price || 0,
            quantity: inv.quantity,
            status: inv.is_equipped ? 'EQUIPPED' : 'IN_STOCK',
            created_at: inv.acquired_at
        }));

        return res.json(ServiceResponse.Success({ items: formattedItems, total }, 'Thành công'));
    } catch (error: any) {
        console.error("!!!! LỖI PRISMA !!!!", error.message);
        return res.status(500).json(ServiceResponse.Fail("Lỗi truy vấn: " + error.message));
    }
}

    /**
     * Xóa vật phẩm (DELETE - Lấy ID từ Body)
     */
    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.body; 
            if (!id) return res.status(400).json(ServiceResponse.Fail('Thiếu ID vật phẩm'));
            
            await prisma.inventory.delete({
                where: { inventory_id: Number(id) }
            });

            return res.json(ServiceResponse.Success(null, 'Đã xóa vật phẩm khỏi kho đồ'));
        } catch (error: any) {
            return res.status(400).json(ServiceResponse.Fail('Lỗi khi xóa: ' + error.message));
        }
    }

    /**
     * Cập nhật số lượng/trạng thái (PUT - Lấy ID từ Body)
     */
    update = async (req: Request, res: Response) => {
        try {
            const { id, quantity, status } = req.body;
            if (!id) return res.status(400).json(ServiceResponse.Fail('Thiếu ID vật phẩm'));

            const updated = await prisma.inventory.update({
                where: { inventory_id: Number(id) },
                data: {
                    ...(status !== undefined && { is_equipped: status === 'EQUIPPED' }),
                    ...(quantity !== undefined && { quantity: Number(quantity) })
                }
            });

            return res.json(ServiceResponse.Success(updated, 'Cập nhật thành công'));
        } catch (error: any) {
            return res.status(400).json(ServiceResponse.Fail('Lỗi khi cập nhật: ' + error.message));
        }
    }
}

export default new InventoryController();