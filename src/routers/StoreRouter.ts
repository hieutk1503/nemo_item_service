import { Router } from "express";
import { createRouter } from "../utils/CreateRouter"; 

// ✅ 1. Chỉ import duy nhất StoreController (Instance đã gộp)
import storeController from "../controllers/StoreController";

// 2. Import các Middleware và DTO cần thiết
import { JwtAuthMiddle } from "../middlewares/JwtAuthMiddle";
import { ValidatorMiddle } from "../middlewares/ValidatorMiddle";
import { BuyItemRequest } from "../Dtos/Requests/BuyItemRequest"; 

const StoreRouter = Router();

/**
 * 💡 Giải thích: Vì tất cả các hàm getList, buyItem, getHistory... 
 * bây giờ đều nằm trong storeController, ta chỉ cần gọi createRouter 1 lần duy nhất.
 */
StoreRouter.use('/', createRouter(storeController, [
    // --- PHẦN 1: PRODUCT (Public) ---
    {
        method: 'get',
        path: '/products',    
        handler: 'getList'
    },
    {
        method: 'get',
        path: '/product/:id',
        handler: 'getDetail'
    },

    // --- PHẦN 2: TRANSACTION (Private) ---
    {
        method: 'post',
        path: '/purchase',
        handler: 'buyItem',
        middlewares: [
            //JwtAuthMiddle,
            ValidatorMiddle(BuyItemRequest)
        ]
    },

    // --- PHẦN 3: ORDER HISTORY (Private) ---
    {
        method: 'get',
        path: '/history',
        handler: 'getHistory',
        middlewares: [
            //  JwtAuthMiddle
        ]
    }
]));

export default StoreRouter;