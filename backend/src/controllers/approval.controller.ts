import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const publicUser = {
  id: true,
  email: true,
  name: true,
  businessEmail: true,
  businessName: true,
  gstNumber: true,
  phoneNumber: true,
  approvalStatus: true,
  rejectionReason: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
};

export const listPendingUsers = async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { approvalStatus: "PENDING_APPROVAL" },
    select: publicUser,
    orderBy: { createdAt: "asc" },
  });
  return res.json({ success: true, count: users.length, data: users });
};

const findTarget = async (id: number) => prisma.user.findUnique({ where: { id }, select: { id: true } });

export const approveUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  if (!(await findTarget(userId))) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const user = await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "ACTIVE", status: "ACTIVE", rejectionReason: null, approvedAt: new Date(), approvedBy: req.user?.userId }, select: publicUser });
  return res.json({ success: true, data: user });
};

export const rejectUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  const reason = String(req.body?.reason || "").trim();
  if (!Number.isInteger(userId) || userId <= 0 || !reason) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "A user id and rejection reason are required" });
  if (!(await findTarget(userId))) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const user = await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "REJECTED", status: "INACTIVE", rejectionReason: reason, approvedAt: null, approvedBy: null }, select: publicUser });
  return res.json({ success: true, data: user });
};

export const suspendUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  if (!(await findTarget(userId))) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const user = await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "SUSPENDED", status: "SUSPENDED" }, select: publicUser });
  return res.json({ success: true, data: user });
};

export const reactivateUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  if (!(await findTarget(userId))) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const user = await prisma.user.update({ where: { id: userId }, data: { approvalStatus: "ACTIVE", status: "ACTIVE", rejectionReason: null, approvedAt: new Date(), approvedBy: req.user?.userId }, select: publicUser });
  return res.json({ success: true, data: user });
};
