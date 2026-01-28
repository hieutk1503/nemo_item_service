import { LaunchController } from "../controllers/LaunchController";
import { createRouter } from "../utils/CreateRouter";

const controller = new LaunchController();

export default createRouter(controller, [
    {
        method: 'post',
        path: '/game/launch',       // API: /api/game/launch
        handler: 'launch'           // Tên hàm trong controller
    }
]);