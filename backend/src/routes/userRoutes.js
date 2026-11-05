import express from "express";
import userController from "../controllers/userController.js";
import cookieController from "../controllers/cookieController.js";
import { protect } from "../middleware/authMiddleware.js";
import uploadAvatar from "../middleware/uploadAvatar.js";

const router = express.Router();

router.get("/profile", protect, userController.getProfile);
router.get("/profile/stats", protect, userController.getStats);
router.put("/profile", protect, userController.updateProfile);
router.post(
  "/profile/avatar",
  protect,
  uploadAvatar.single("avatar"),
  userController.uploadAvatar,
);
router.put("/profile/password", protect, userController.changePassword);

router.post("/cookie-consent", protect, cookieController.updateConsent);
router.get("/cookie-consent", protect, cookieController.getConsent);

export default router;
