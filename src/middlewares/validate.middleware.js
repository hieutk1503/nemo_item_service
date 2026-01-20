// src/middlewares/validate.middleware.js

const ValidateMiddleware = {
    // Middleware check dữ liệu cho API Trao đồ
    checkGrantItem: (req, res, next) => {
        const { userId, catalogId, source } = req.body;

        // Nếu thiếu thông tin thì chặn lại ngay, không cho đi tiếp
        if (!userId || !catalogId || !source) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin! Yêu cầu: userId, catalogId, source."
            });
        }
        
        // Nếu đủ thông tin thì cho đi tiếp sang Controller
        next();
    },

    // Middleware check dữ liệu cho API Dùng đồ
    checkUseItem: (req, res, next) => {
        const { userId, inventoryId } = req.body;

        if (!userId || !inventoryId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin! Yêu cầu: userId, inventoryId."
            });
        }

        next();
    },
    checkCheckOwnership: (req, res, next) => {
        const { userId, catalogId } = req.body;
        if (!userId || !catalogId) {
            return res.status(400).json({ success: false, message: "Thiếu userId hoặc catalogId" });
        }
        next();
    },

    // [MỚI] Validate cho API Revoke
    checkRevokeItem: (req, res, next) => {
        const { userId, inventoryId, reason } = req.body;
        if (!userId || !inventoryId || !reason) {
            return res.status(400).json({ success: false, message: "Thiếu userId, inventoryId hoặc reason" });
        }
        next();
    }
};

module.exports = ValidateMiddleware;