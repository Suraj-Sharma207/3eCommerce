import { Router } from "express";
import chatbotController from "../controllers/chatbotController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { errorResponse } from "../utils/response.js";
import { env } from "../config/env.js";

const router = Router();

// Middleware to verify internal requests from Python
const verifyChatbotApi = (req, res, next) => {
  const apiKey = req.headers["x-chatbot-api-key"];
  if (env.chatbotApiKey && apiKey !== env.chatbotApiKey) {
    return errorResponse(res, "Unauthorized chatbot service", [], 401);
  }
  next();
};

// ── Public Routes ────────────────────────────────────────────────────────────
router.get("/health", chatbotController.health);

// ── Authenticated Routes (Frontend → Node → Python) ──────────────────────────
// Uses optionalAuth so guests can chat, but users get personalized context
router.post("/chat", optionalAuth, chatbotController.chat);

// ── Admin Routes (Frontend → Node → Python) ──────────────────────────────
router.post(
  "/sync/bulk",
  protect,
  authorize("ADMIN"),
  chatbotController.bulkSync,
);
router.all(
  "/admin/*",
  protect,
  authorize("ADMIN"),
  chatbotController.proxyAdmin,
);

// ── Internal Routes (Python → Node) ──────────────────────────────────────────
// Requires shared API key. Used by Python to fetch user data for the RAG pipeline.
router.get(
  "/internal/orders",
  verifyChatbotApi,
  chatbotController.getInternalOrders,
);
router.get(
  "/internal/cart",
  verifyChatbotApi,
  chatbotController.getInternalCart,
);
router.get(
  "/internal/wishlist",
  verifyChatbotApi,
  chatbotController.getInternalWishlist,
);
router.post(
  "/internal/products/bulk",
  verifyChatbotApi,
  chatbotController.getInternalProductsBulk,
);

export default router;
