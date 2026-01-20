// src/app.js
require('dotenv').config(); // 1. Nạp biến môi trường từ file .env
const express = require('express');
const app = express();

// 2. Import các Route
const itemRoutes = require('./routes/item.routes');

// 3. Middleware mặc định (Bắt buộc để đọc được JSON từ Postman)
app.use(express.json());

// 4. Đăng ký Route
// Tất cả API liên quan đến item sẽ có đầu ngữ /api/items
// Ví dụ: /api/items/use, /api/items/grant
app.use('/api/items', itemRoutes);

// 5. Route trang chủ (để test xem server sống hay chết)
app.get('/', (req, res) => {
    res.send(' Game Item Service is Running!');
});

// 6. Xử lý lỗi 404 (Nếu gọi sai đường dẫn)
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API không tồn tại!' });
});

// 7. Khởi động Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`Test API tại:`);
    console.log(`   - Trao đồ: POST http://localhost:${PORT}/api/items/grant`);
    console.log(`   - Dùng đồ: POST http://localhost:${PORT}/api/items/use`);
    console.log(`   - Xem túi đồ: GET  http://localhost:${PORT}/api/items/inventory/1`);
    console.log(`=============================================`);
});