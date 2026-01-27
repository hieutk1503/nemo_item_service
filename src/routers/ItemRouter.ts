import { ItemController } from "../controllers/ItemController";
import { createRouter } from "../utils/CreateRouter"; 

// Import các Middleware
import { JwtAuthMiddle } from "../middlewares/JwtAuthMiddle";
import { ValidatorMiddle } from "../middlewares/ValidatorMiddle";

// Import các DTO
import { 
    GrantItemRequest, 
    UseItemRequest, 
    RevokeItemRequest, 
    CheckOwnershipRequest 
} from "../Dtos/Requests/ItemRequests"; 

// 1. Khởi tạo Controller
const controller = new ItemController();

/**
 * 2. Cấu hình Router hoàn chỉnh (Header-driven)
 * Base path: /api/items
 */
export default createRouter(controller, [
    // --- KHU VỰC ĐỌC DỮ LIỆU (READ) ---
    {
        method: 'get',
        path: '/inventory',    
        handler: 'getInventory', 
        middlewares: [
            JwtAuthMiddle // Nên có để bảo vệ túi đồ của người dùng
        ]
    },

    // --- KHU VỰC GHI DỮ LIỆU (WRITE) ---
    
    // 1. Kiểm tra sở hữu
    {
        method: 'post',
        path: '/check-ownership',
        handler: 'checkOwnership',
        middlewares: [
            JwtAuthMiddle,
            ValidatorMiddle(CheckOwnershipRequest) 
        ]
    },

    // 2. Trao vật phẩm
    {
        method: 'post',
        path: '/grant',
        handler: 'grantItem',
        middlewares: [
            JwtAuthMiddle,                    
            ValidatorMiddle(GrantItemRequest) 
        ]
    },

    // 3. Sử dụng vật phẩm
    {
        method: 'post',
        path: '/use',
        handler: 'useItem',
        middlewares: [
            JwtAuthMiddle,                  
            ValidatorMiddle(UseItemRequest) 
        ]
    },

    // 4. Thu hồi vật phẩm
    {
        method: 'post',
        path: '/revoke',
        handler: 'revokeItem',
        middlewares: [
            JwtAuthMiddle,
            ValidatorMiddle(RevokeItemRequest)
        ]
    }
]);