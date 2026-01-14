// src/repository/inventory.repo.js
const prisma = require('../config/db');

const InventoryRepo = {
    // 1. Tìm item theo ID (Lấy kèm cả Catalog và Rule)
    findById: async (id) => {
        return await prisma.inventory.findUnique({
            where: { id: Number(id) },
            include: {
                catalog: {
                    include: { rule: true }
                }
            }
        });
    },

    // 2. Tìm tất cả đồ của một User (Để hiển thị túi đồ)
    findByUserId: async (userId) => {
        return await prisma.inventory.findMany({
            where: { user_id: Number(userId) },
            include: {
                catalog: true // Lấy tên item, ảnh...
            }
        });
    },

    // 3. [MỚI] Tạo vật phẩm mới cho User (Dùng cho API Grant Item)
    createItem: async (userId, catalogId, initialUses, source) => {
        return await prisma.inventory.create({
            data: {
                user_id: Number(userId),
                item_catalog_id: Number(catalogId), // Link với bảng Catalog
                remaining_uses: initialUses,        // Độ bền gốc lấy từ Catalog
                daily_counter: 0,                   // Mới tinh chưa dùng lần nào
                source: source,                     // Nguồn: "SHOP", "GACHA", "ADMIN"
                status: 'AVAILABLE'
            }
        });
    },

    // 4. Cập nhật thông số sau khi dùng (Trừ độ bền, tăng biến đếm)
    updateAfterUse: async (id, data) => {
        return await prisma.inventory.update({
            where: { id: Number(id) },
            data: {
                remaining_uses: data.remaining_uses,
                daily_counter: data.daily_counter,
                last_used_date: new Date(),
                status: data.status
            }
        });
    },

    // 5. Ghi log lịch sử
    createLog: async (userId, inventoryId, action, note) => {
        return await prisma.itemUsageLog.create({
            data: {
                user_id: Number(userId),
                inventory_id: Number(inventoryId),
                action: action,
                note: note
            }
        });
    }
};

module.exports = InventoryRepo;