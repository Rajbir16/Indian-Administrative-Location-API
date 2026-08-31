import { Router } from "express";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/apiKey.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Create a new API key
router.post("/", authenticate, createApiKey);

// List user's API keys
router.get("/", authenticate, listApiKeys);

// Revoke an API key
router.delete("/:id", authenticate, revokeApiKey);

export default router;