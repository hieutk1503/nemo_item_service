import { createRouter } from "../utils/CreateRouter"; // Ông nhớ check đường dẫn file này bên Core
import { CmsAuthController } from "../controllers/CmsAuthController";
import { CmsAuthMiddle } from "../middlewares/CmsAuthMiddle";

const controller = new CmsAuthController();

export default createRouter(controller, [
    {
        method: 'post',
        path: '/auth/login',        // Đăng nhập CMS
        handler: 'login'            // Tên hàm trong CmsAuthController
    },
    {
        method: 'get',
        path: '/user/info',         // Lấy thông tin Admin
        middlewares: [
            CmsAuthMiddle           // Middleware chặn quyền
        ],
        handler: 'getInfo'
    },
    {
        method: 'post',
        path: '/auth/logout',       // Đăng xuất
        middlewares: [
            CmsAuthMiddle
        ],
        handler: 'logout'
    }
]);