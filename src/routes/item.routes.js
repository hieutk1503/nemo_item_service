// src/routes/item.routes.js
const express = require('express');
const router = express.Router();
const ItemController = require('../controllers/item.controller');

// Import các bảo vệ vào
const Validate = require('../middlewares/validate.middleware');
const Auth = require('../middlewares/auth.middleware'); // Khi nào cần Auth thì mở ra

// --- CÁCH DÙNG ---
// Cấu trúc: router.post('url', [Bảo vệ 1, Bảo vệ 2...], Controller xử lý)

// 1. Route Trao đồ: Phải qua lớp checkGrantItem trước
router.post('/grant', Validate.checkGrantItem, ItemController.grantItem);

// 2. Route Dùng đồ: Phải qua lớp checkUseItem trước
router.post('/use', Validate.checkUseItem, ItemController.useItem);

// 3. Route Xem túi đồ: (Ví dụ thêm Auth vào đây để chỉ chủ nhân mới xem được)
router.get('/inventory/:userId', ItemController.getInventory);
// [MỚI] Route Check Ownership (Game Service gọi)
router.post('/check', Validate.checkCheckOwnership, ItemController.checkOwnership);

// [MỚI] Route Revoke Item (Store/Admin gọi)
// Thường API này cần Admin Auth, nhưng tạm thời dùng chung Auth thường
router.post('/revoke', Auth, Validate.checkRevokeItem, ItemController.revokeItem);

module.exports = router;