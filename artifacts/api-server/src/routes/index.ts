import { Router, type IRouter } from "express";
import healthRouter from "./health";
import logRouter from "./log";
import robloxRouter from "./roblox";

const router: IRouter = Router();

router.use(healthRouter);
router.use(logRouter);
router.use(robloxRouter);

export default router;
