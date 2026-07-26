import { createRouter } from "../utils/CreateRouter";
import InventoryController from "../controllers/InventoryControllerCMS"; 
import { CmsAuthMiddle } from "../middlewares/CmsAuthMiddle"; 

export default createRouter(InventoryController, [
    // 1. Lấy danh sách (Giữ nguyên)
    {
        method: 'get',
        path: '/',
        middlewares: [CmsAuthMiddle],
        handler: 'getList'
    },

    // 2. Thu hồi (Xóa) 
    // Mẹo: Hiếu có thể để nguyên ở đây, Express sẽ ưu tiên thằng ở Router Tổng chạy trước.
    // Nhưng phải đảm bảo handler tên là 'delete' khớp với Controller.
    {
        method: 'delete',
        path: '/:id',
        middlewares: [CmsAuthMiddle],
        handler: 'delete'
    },

    // 3. Cập nhật
    // Đảm bảo handler tên là 'update' khớp với Controller.
    {
        method: 'put',
        path: '/:id',
        middlewares: [CmsAuthMiddle],
        handler: 'update'
    }
]);