import { Router } from "express";
//import templateRouter from "./templateRouter";
import prizeRouter from "./prizeRouter";
import ItemRouter from "./ItemRouter";

const router = Router();
//router.use(templateRouter);

// router prize
router.use('/', prizeRouter);
router.use('/',ItemRouter)

export default router