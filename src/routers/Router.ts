import { Router } from "express";
//import templateRouter from "./templateRouter";
import prizeRouter from "./prizeRouter";

const router = Router();
//router.use(templateRouter);

// router prize
router.use('/', prizeRouter);

export default router