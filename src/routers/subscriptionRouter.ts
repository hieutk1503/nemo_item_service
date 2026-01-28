import { SubscriptionController } from "../controllers/SubscriptionController";
import { createRouter } from "../utils/CreateRouter";

const controller = new SubscriptionController();

export default createRouter(controller, [
    // --- Client gọi lên ---
    {
        method: 'post',
        path: '/client/purchase',   // API: /api/client/purchase
        handler: 'purchase'
    },
    {
        method: 'post',
        path: '/client/confirm',    // API: /api/client/confirm
        handler: 'confirm'
    },
    // --- CoreGW gọi sang (Callback) ---
    {
        method: 'post',
        path: '/subscription/result', // API: /api/subscription/result
        handler: 'handleCallback'
    }
]);