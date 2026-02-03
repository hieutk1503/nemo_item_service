import { LaunchController } from "../controllers/LaunchController";
import { createRouter } from "../utils/CreateRouter";
import { authMiddleware } from "../middlewares/auth.middleware";

const controller = new LaunchController();

export default createRouter(controller, [
    {
        method: 'post',
        path: '/game/launch',       // Khởi tạo Game/User
        handler: 'launch'           
    },
    {
        method: 'get',
        path: '/user/profile',      // Lấy thông tin chi tiết User
        middlewares: [authMiddleware],
        handler: 'getProfile' 
    },
    {
        method: 'post',
        path: '/auth/update-password', // Đặt pass lần đầu (First Login)
        middlewares: [authMiddleware],
        handler: 'updatePassword'
    }
]);