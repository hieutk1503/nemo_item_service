import { Router } from "express";
import prizeRouter from "./prizeRouter";
import prizeRouterCMS from "./prizeRouter.CMS";
import ItemRouter from "./ItemRouter";
import authRouter from "./authRouter";
import subscriptionRouter from "./subscriptionRouter";
import StoreRouter from "./StoreRouter";
import cmsAuthRouter from "./authRouter.CMS";
import InventoryRouterCMS from "./InventoryRouterCMS"; 
import ItemRouterCMS from "./ItemRouterCMS";
import InventoryControllerCMS from "../controllers/InventoryControllerCMS";
import { CmsAuthMiddle } from "../middlewares/CmsAuthMiddle"; // Import middleware bảo vệ

const router = Router();

// 1. Dùng mảng đường dẫn để "chấp" cả lỗi dư chữ /cms của Vite
const inventoryPath = ['/inventories', '/cms/inventories', '/cms/cms/inventories'];

// Đảm bảo không có /:id ở đây vì mình dùng Body rồi
router.put(inventoryPath, [CmsAuthMiddle], InventoryControllerCMS.update);
router.delete(inventoryPath, [CmsAuthMiddle], InventoryControllerCMS.delete);
router.get(inventoryPath, [CmsAuthMiddle], InventoryControllerCMS.getList);


router.use('/cms/inventories', InventoryRouterCMS); 
router.use('/cms/items', ItemRouterCMS);
router.use('/cms', cmsAuthRouter); 
router.use('/', prizeRouterCMS);

router.use('/prizes', prizeRouter);
router.use('/items', ItemRouter);
router.use('/stores', StoreRouter);
router.use('/auth', authRouter);
router.use('/subscriptions', subscriptionRouter);

export default router;