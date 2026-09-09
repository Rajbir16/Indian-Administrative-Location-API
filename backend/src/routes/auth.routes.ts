import { Router } from "express";
import {
  register,
  login,
} from "../controllers/auth.controller.js";
import { registerB2B } from "../controllers/b2bAuth.controller.js";

const router = Router();

// Register
router.post("/register", register);
router.post("/b2b/register", registerB2B);

// Login
router.post("/login", login);

export default router;