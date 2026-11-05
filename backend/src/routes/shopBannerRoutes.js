import { Router } from "express";
import { getActiveShopBanner } from "../controllers/shopBannerController.js";

const router = Router();

// Public route to get the active shop banner
router.get("/", getActiveShopBanner);

export default router;
