import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getPlanDefinition, isSubscriptionPlan } from "../services/plan.service.js";

const parseId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const getUserPlan = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, plan: true } });
  if (!user) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  return res.json({ success: true, data: { userId: user.id, plan: getPlanDefinition(user.plan) } });
};

export const updateUserPlan = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parseId(req.params.id);
  const plan = String(req.body?.plan || "").toUpperCase();
  if (!userId || !isSubscriptionPlan(plan)) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "plan must be FREE, PREMIUM, PRO, or UNLIMITED" });
  const user = await prisma.user.updateMany({ where: { id: userId }, data: { plan } });
  if (!user.count) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  return res.json({ success: true, data: { userId, plan: getPlanDefinition(plan) } });
};

export const listPlans = (_req: AuthenticatedRequest, res: Response) => res.json({ success: true, data: ["FREE", "PREMIUM", "PRO", "UNLIMITED"].map((name) => getPlanDefinition(name as "FREE" | "PREMIUM" | "PRO" | "UNLIMITED")) });
