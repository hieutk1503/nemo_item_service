import { createRouter } from "../utils/CreateRouter";
import { LaunchControllerCMS } from "../controllers/LaunchController.CMS"; 
import { CmsAuthMiddle } from "../middlewares/CmsAuthMiddle";

const controller = new LaunchControllerCMS();

export default createRouter(controller, [
    {
        method: 'post',
        path: '/auth/login',
        handler: 'login' // Trỏ vào hàm login trong LaunchControllerCMS
    },
    {
        method: 'get',
        path: '/user/info',
        middlewares: [
            CmsAuthMiddle
        ],
        handler: 'getInfo'
    },
    {
        method: 'post',
        path: '/auth/logout',
        middlewares: [
            CmsAuthMiddle
        ],
        handler: 'logout'
    }
]);