// src/controllers/item.controller.js
const ItemService = require('../services/item.service');
// Import thêm Repo để làm hàm xem túi đồ (Read-only thì gọi thẳng Repo cho nhanh)
const InventoryRepo = require('../repository/inventory.repo');

const ItemController = {

    // API 1: Trao vật phẩm (Dành cho Shop/Admin/Event)
    // POST /api/items/grant
    grantItem: async (req, res) => {
        try {
            const { userId, catalogId, source } = req.body;

            // Validate dữ liệu đầu vào
            if (!userId || !catalogId || !source) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin! Cần: userId, catalogId, source"
                });
            }

            // Gọi Service xử lý
            const newItem = await ItemService.grantItem(userId, catalogId, source);

            return res.status(200).json({
                success: true,
                message: "Trao vật phẩm thành công!",
                data: newItem
            });

        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },

    // API 2: Sử dụng vật phẩm (Dành cho Game)
    // POST /api/items/use
    useItem: async (req, res) => {
        try {
            const { userId, inventoryId } = req.body;

            if (!userId || !inventoryId) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin! Cần: userId, inventoryId"
                });
            }

            const updatedItem = await ItemService.useItem(userId, inventoryId);

            return res.status(200).json({
                success: true,
                message: "Sử dụng thành công!",
                data: updatedItem
            });

        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    },

    // API 3: Xem túi đồ (Dành cho Frontend hiển thị)
    // GET /api/items/inventory/:userId
    getInventory: async (req, res) => {
        try {
            const { userId } = req.params; // Lấy trên URL
            
            // Với hành động đọc dữ liệu đơn giản, Controller gọi thẳng Repo cũng được
            const items = await InventoryRepo.findByUserId(userId);

            return res.status(200).json({
                success: true,
                data: items
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    checkOwnership: async (req, res) => {
        try {
            const { userId, catalogId } = req.body;
            const result = await ItemService.checkOwnership(userId, catalogId);
            
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    // [MỚI] API Revoke Item
    revokeItem: async (req, res) => {
        try {
            const { userId, inventoryId, reason } = req.body;
            const result = await ItemService.revokeItem(userId, inventoryId, reason);

            return res.status(200).json({
                success: true,
                message: "Thu hồi vật phẩm thành công!",
                data: result
            });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
};

module.exports = ItemController;