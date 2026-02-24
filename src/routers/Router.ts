import { Router } from "express";
import prizeRouter from "./prizeRouter";
import prizeRouterCMS from "./prizeRouter.CMS";
import ItemRouter from "./ItemRouter";
import authRouter from "./authRouter";
import subscriptionRouter from "./subscriptionRouter";
import StoreRouter from "./StoreRouter";
import cmsAuthRouter from "./authRouter.CMS";

const router = Router();

// 1. Router Prize
router.use('/', prizeRouter);
router.use('/', prizeRouterCMS);
// 2. Router Item
router.use('/',ItemRouter)
// 3. Router Store
router.use('/',StoreRouter)
// 4. Router Auth
router.use('/', authRouter);

// 5. Router Subscription
router.use('/', subscriptionRouter);
// 6. Router CMS Auth
router.use('/cms', cmsAuthRouter);

export default router;
