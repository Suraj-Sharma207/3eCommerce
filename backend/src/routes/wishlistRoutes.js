import { Router } from "express";
import wishlistController from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", wishlistController.getWishlist);
router.post("/toggle", wishlistController.toggleWishlistItem);

export default router;
