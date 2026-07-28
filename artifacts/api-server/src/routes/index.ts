import { Router, type IRouter } from "express";
import healthRouter from "./health";
import logRouter from "./log";
import robloxRouter from "./roblox";
import discordProxyRouter from "./discord-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(logRouter);
router.use(robloxRouter);
router.use(discordProxyRouter);

export default router;
