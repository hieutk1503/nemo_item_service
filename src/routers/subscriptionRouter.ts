import { SubscriptionController } from "../controllers/SubscriptionController";
import { createRouter } from "../utils/CreateRouter";
import { authMiddleware } from "../middlewares/auth.middleware";

const controller = new SubscriptionController();

export default createRouter(controller, [
    {
        method: 'get',
        path: '/client/plans',      // Lấy danh sách gói cước để hiện ở Shop
        handler: 'getPlans'
    },
    {
        method: 'get',
        path: '/client/me/transactions', // Xem lịch sử mua gói của bản thân
        middlewares: [authMiddleware],
        handler: 'getTransactions'
    },

    // --- Các API Giao dịch (POST) ---
    {
        method: 'post',
        path: '/client/purchase',   // Khởi tạo mua gói
        middlewares: [authMiddleware], // Đã bổ sung middleware để lấy msisdn từ Token
        handler: 'purchase'
    },
    {
        method: 'post',
        path: '/client/confirm',    // Xác nhận OTP
        middlewares: [authMiddleware],
        handler: 'confirm'
    },

    // --- Hệ thống ---
    {
        method: 'post',
        path: '/subscription/result', // Callback từ CoreGW
        handler: 'handleCallback'
    }
]);