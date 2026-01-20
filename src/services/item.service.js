// src/services/item.service.js
const InventoryRepo = require('../repository/inventory.repo');
// [MỚI] Cần thêm ông này để check xem vật phẩm mẫu có tồn tại không trước khi trao
const CatalogRepo = require('../repository/catalog.repo'); 

const ItemService = {

    // ============================================================
    // 1. LOGIC DÙNG VẬT PHẨM (User tự dùng)
    // ============================================================
    useItem: async (userId, inventoryId) => {
        // BƯỚC 1: GỌI REPO LẤY DỮ LIỆU
        const item = await InventoryRepo.findById(inventoryId);

        // --- VALIDATE ---
        if (!item) {
            throw new Error("Vật phẩm không tồn tại!");
        }
        
        if (item.user_id !== Number(userId)) {
            throw new Error("Vật phẩm này không phải của bạn!");
        }

        if (item.remaining_uses <= 0) {
            throw new Error("Vật phẩm đã hỏng (Hết lượt sử dụng)!");
        }

        // --- LOGIC TÍNH TOÁN ---
        const rule = item.catalog.rule;
        const now = new Date();

        // 1. Lazy Reset (Reset lượt dùng mỗi ngày)
        let currentDailyCounter = item.daily_counter || 0;
        
        if (item.last_used_date) {
            const lastUsed = new Date(item.last_used_date);
            const isSameDay = lastUsed.getDate() === now.getDate() &&
                              lastUsed.getMonth() === now.getMonth() &&
                              lastUsed.getFullYear() === now.getFullYear();
            
            if (!isSameDay) {
                currentDailyCounter = 0; // Sang ngày mới -> Reset về 0
            }
        }
        
        // 2. Check giới hạn ngày 
        if (currentDailyCounter >= rule.daily_limit) {
            throw new Error(`Đã đạt giới hạn sử dụng trong ngày (${rule.daily_limit} lần)!`);
        }

        // 3. Check hồi chiêu
        if (item.last_used_date && rule.cooldown_seconds > 0) {
            const lastTime = new Date(item.last_used_date).getTime();
            const diffInSeconds = (now.getTime() - lastTime) / 1000;

            if (diffInSeconds < rule.cooldown_seconds) {
                const waitTime = Math.ceil(rule.cooldown_seconds - diffInSeconds);
                throw new Error(`Đang hồi chiêu! Vui lòng đợi ${waitTime} giây.`);
            }
        }

        // --- CẬP NHẬT DỮ LIỆU ---
        const newDurability = item.remaining_uses - 1;
        const newDailyCount = currentDailyCounter + 1;
        const newStatus = newDurability <= 0 ? 'BROKEN' : 'AVAILABLE';

        // Gọi Repo cập nhật
        const updatedItem = await InventoryRepo.updateAfterUse(item.id, {
            remaining_uses: newDurability,
            daily_counter: newDailyCount,
            status: newStatus
        });

        // Gọi Repo ghi log
        await InventoryRepo.createLog(
            userId, 
            item.id, 
            'USE_ITEM', 
            `Dùng ${item.catalog.name}. Độ bền còn: ${newDurability}`
        );

        return updatedItem;
    },

    // ============================================================
    // 2. LOGIC TRAO VẬT PHẨM (Shop / Admin / Game tặng) - [MỚI]
    // ============================================================
    grantItem: async (userId, catalogId, source) => {
        // BƯỚC 1: Check xem Item Catalog có tồn tại không
        const catalogItem = await CatalogRepo.findById(catalogId);
        if (!catalogItem) {
            throw new Error(`Item Catalog ID ${catalogId} không tồn tại!`);
        }

        // BƯỚC 2: Gọi Repo để tạo vật phẩm mới vào túi đồ
        // (Lấy độ bền tối đa từ Catalog gán cho vật phẩm mới)
        const newItem = await InventoryRepo.createItem(
            userId, 
            catalogId, 
            catalogItem.max_usages, 
            source
        );

        // BƯỚC 3: Ghi log nhận đồ
        await InventoryRepo.createLog(
            userId, 
            newItem.id, 
            'GRANT_ITEM', 
            `Nhận ${catalogItem.name} từ nguồn: ${source}`
        );

        return newItem;
    },
    checkOwnership: async (userId, catalogId) => {
        const item = await InventoryRepo.findActiveItemByCatalog(userId, catalogId);
        
        // Trả về true/false và thông tin item nếu có
        if (item) {
            return { hasItem: true, item: item };
        } else {
            return { hasItem: false, item: null };
        }
    },

    // [MỚI] Thu hồi vật phẩm (Store hoàn tiền / Admin xóa đồ)
    revokeItem: async (userId, inventoryId, reason) => {
        // 1. Kiểm tra vật phẩm có tồn tại không
        const item = await InventoryRepo.findById(inventoryId);
        if (!item) throw new Error("Vật phẩm không tồn tại!");
        
        // 2. Check quyền (User này có đúng là chủ sở hữu không)
        if (item.user_id !== Number(userId)) {
            throw new Error("Vật phẩm không thuộc về user này!");
        }

        // 3. Cập nhật trạng thái sang REVOKED (Đã thu hồi)
        const updatedItem = await InventoryRepo.updateStatus(inventoryId, 'REVOKED');

        // 4. Ghi log lịch sử
        await InventoryRepo.createLog(
            userId, 
            inventoryId, 
            'REVOKE_ITEM', 
            `Bị thu hồi. Lý do: ${reason}`
        );

        return updatedItem;
    }
};

module.exports = ItemService;