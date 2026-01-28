import { Router } from "express";
// import templateRouter from "./templateRouter";
import prizeRouter from "./prizeRouter";
import ItemRouter from "./ItemRouter";

// Import Router của bạn
import authRouter from "./authRouter";
import subscriptionRouter from "./subscriptionRouter";

const router = Router();
// router.use(templateRouter);

// 1. Router Prize
router.use('/', prizeRouter);
router.use('/',ItemRouter)

// 2. Router Auth
router.use('/', authRouter);

// 3. Router Subscription
router.use('/', subscriptionRouter);

export default router;