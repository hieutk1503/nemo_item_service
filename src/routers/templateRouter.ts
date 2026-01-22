` import { OrderController } from "../Controllers/OrderController";
import { JwtAuthMiddle } from "../Middlewares/JwtAuthMiddle";
import { ValidatorMiddle } from "../Middlewares/ValidatorMiddle";
import { CreateRouter } from "../Utils/CreateRouter"; // Lưu ý: check lại tên file/hàm viết hoa/thường cho đồng bộ nhé
import { OrderRequest } from "../Dtos/Requests/OrderRequest"; */

// 1. Khởi tạo Controller: Thằng này chịu trách nhiệm xử lý logic chính (gọi Service, trả về JSON)
//const controller = new OrderController();

/**
 * 2. Xuất ra một Router hoàn chỉnh đã được cấu hình.
 * Thay vì viết thủ công: router.get('/...', ...), ta dùng hàm CreateRouter để code gọn hơn.
 */
/* export default CreateRouter(controller, [
    // --- KHU VỰC PUBLIC (Ai gọi cũng được) ---
    {
        method: 'get',              // Phương thức HTTP
        path: '/getall-orders',     // Đường dẫn API
        handler: 'getallorders'     // Tên hàm trong OrderController sẽ xử lý request này
    },
    {
        method: 'get',
        path: '/getby/:id',         // :id là tham số động (params)
        handler: 'getorderbyid'
    },
    {
        method: 'get',
        path: '/getbyuser/:userid',
        handler: 'getorderbyuserid'
    },

    // --- KHU VỰC CẦN BẢO VỆ (Có Middleware) ---
    {
        method: 'post',
        path: '/create-order',
        handler: 'createorder',
        // 3. Middlewares: Là các "cổng bảo vệ" chạy TRƯỚC khi vào handler chính
        middlewares: [
            JwtAuthMiddle,                  // Cổng 1: Check xem User đã đăng nhập chưa (có Token không?)
            ValidatorMiddle(OrderRequest)   // Cổng 2: Check xem dữ liệu gửi lên (Body) có đúng format OrderRequest không?
        ]
    }
]); */

// khi làm xong sang bên Router.ts import vào và use là xong, ví dụ ở bên file Router.ts`