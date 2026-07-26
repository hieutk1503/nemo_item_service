import { createRouter } from "../utils/CreateRouter";
import ItemControllerCMS from "../controllers/ItemControllerCMS"; // Import cái instance vừa export
import { CmsAuthMiddle } from "../middlewares/CmsAuthMiddle"; // Dùng Middleware bảo vệ của CMS

// Không cần new ItemControllerCMS() vì bên Controller đã export default new ... rồi
const controller = ItemControllerCMS;

export default createRouter(controller, [
    {
        // Route: GET /api/admin/items/
        // Tác dụng: Lấy danh sách vật phẩm hiển thị lên Table
        method: 'get',
        path: '/', 
        middlewares: [CmsAuthMiddle], // Bắt buộc phải có Token Admin
        handler: 'getList'
    },
    
    
    
    {
        // Route: POST /api/admin/items/
        // Tác dụng: Tạo vật phẩm mới
        method: 'post',
        path: '/',
        middlewares: [CmsAuthMiddle],
        handler: 'create'
    }/*
    {
        // Route: PUT /api/admin/items/:id
        // Tác dụng: Sửa vật phẩm
        method: 'put',
        path: '/:id',
        middlewares: [CmsAuthMiddle],
        handler: 'update'
    },
    {
        // Route: DELETE /api/admin/items/:id
        // Tác dụng: Xóa vật phẩm
        method: 'delete',
        path: '/:id',
        middlewares: [CmsAuthMiddle],
        handler: 'delete'
    }
    */
]);