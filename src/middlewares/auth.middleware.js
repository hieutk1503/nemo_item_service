const jwt = require('jsonwebtoken');

const AuthMiddleware = (req, res, next) => {
    console.log("⚠️ Đang dùng Auth giả (Bypass) để test");
    
    // Giả bộ như đã login thành công với User ID = 1
    req.user = { id: 1, role: 'ADMIN' }; 
    
    // Cho qua luôn, không kiểm tra gì cả
    next();
    // // 1. Lấy token từ header gửi lên
    // const authHeader = req.headers['authorization'];
    // // Header thường có dạng: "Bearer eyJhbGciOi..." -> Cần cắt chữ "Bearer " đi
    // const token = authHeader && authHeader.split(' ')[1];

    // if (!token) {
    //     return res.status(401).json({ message: "Không tìm thấy Token! Vui lòng đăng nhập." });
    // }

    // try {
    //     // 2. GIẢI MÃ TOKEN (Đây là bước quan trọng nhất)
    //     // JWT_SECRET: Phải khớp với cái key mà Team Auth dùng để tạo token
    //     // Bạn lưu key này trong file .env nhé
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-tam-thoi');

    //     // 3. Gắn thông tin User vào request
    //     // Team Auth thường nhét userId vào trong token. Giờ mình lôi nó ra.
    //     req.user = decoded; 
        
    //     // Mẹo: Thay vì tin tưởng userId gửi ở body (dễ bị fake),
    //     // bạn nên dùng req.user.id lấy từ token này để đảm bảo chính chủ.
        
    //     console.log("User đã xác thực:", decoded);
    //     next();

    // } catch (error) {
    //     return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    // }
};

module.exports = AuthMiddleware;