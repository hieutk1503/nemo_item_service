// server.js
const express = require('express');
const app = express();

// Middleware đọc JSON (Bắt buộc)
app.use(express.json());

// Import Routes
const itemRoutes = require('./src/routes/item.routes');

// Đăng ký Routes
// Mọi API trong itemRoutes sẽ bắt đầu bằng /api/items
app.use('/api/items', itemRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server Game Item đang chạy tại port ${PORT}`);
    console.log(`- Trao đồ: POST /api/items/grant`);
    console.log(`- Dùng đồ: POST /api/items/use`);
    console.log(`- Xem đồ:  GET  /api/items/inventory/:userId`);
});