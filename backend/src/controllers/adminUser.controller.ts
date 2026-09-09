import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getStateAccess } from "../utils/stateAccess.js";

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  businessEmail: true,
  businessName: true,
  gstNumber: true,
  phoneNumber: true,
  status: true,
  approvalStatus: true,
  role: true,
  plan: true,
  rejectionReason: true,
  approvedAt: true,
  approvedBy: true,
  createdAt: true,
  updatedAt: true,
};

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parsePage = (value: unknown, fallback: number) => {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeStatus = (value: string) => value === "PENDING" ? "PENDING_APPROVAL" : value;

const safeStatuses = new Set(["PENDING", "PENDING_APPROVAL", "ACTIVE", "REJECTED", "SUSPENDED"]);
const safePlans = new Set(["FREE", "PREMIUM", "PRO", "UNLIMITED"]);
const safeSorts = new Set(["createdAt", "lastActive", "requestCount"]);

export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  const page = parsePage(req.query.page, 1);
  const limit = parsePage(req.query.limit, 25);
  const status = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const plan = req.query.plan ? String(req.query.plan).toUpperCase() : undefined;
  const sort = String(req.query.sort || "createdAt");
  const order = String(req.query.order || "desc").toLowerCase();
  const search = String(req.query.search || "").trim();

  if (!page || !limit || limit > 100 || (status && !safeStatuses.has(status)) || (plan && !safePlans.has(plan)) || !safeSorts.has(sort) || !["asc", "desc"].includes(order)) {
    return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid pagination, filter, or sort parameter" });
  }

  const users = await prisma.user.findMany({
    where: {
      ...(status ? { approvalStatus: normalizeStatus(status) as "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "SUSPENDED" } : {}),
      ...(plan ? { plan: plan as "FREE" | "PREMIUM" | "PRO" | "UNLIMITED" } : {}),
      ...(search ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { businessEmail: { contains: search, mode: "insensitive" } },
          { businessName: { contains: search, mode: "insensitive" } },
          { apiKeys: { some: { key: { contains: search, mode: "insensitive" } } } },
        ],
      } : {}),
    },
    select: {
      ...safeUserSelect,
      apiKeys: { select: { requestCount: true, lastUsed: true } },
    },
  });

  const rows = users.map(({ apiKeys, ...user }) => ({
    ...user,
    lastActive: apiKeys.reduce<Date | null>((latest, key) => key.lastUsed && (!latest || key.lastUsed > latest) ? key.lastUsed : latest, null),
    requestCount: apiKeys.reduce((total, key) => total + key.requestCount, 0),
  }));

  rows.sort((left, right) => {
    const leftValue = sort === "createdAt" ? left.createdAt.getTime() : sort === "lastActive" ? (left.lastActive?.getTime() || 0) : left.requestCount;
    const rightValue = sort === "createdAt" ? right.createdAt.getTime() : sort === "lastActive" ? (right.lastActive?.getTime() || 0) : right.requestCount;
    return order === "asc" ? leftValue - rightValue : rightValue - leftValue;
  });

  const start = (page - 1) * limit;
  return res.json({
    success: true,
    count: rows.length,
    data: rows.slice(start, start + limit),
    meta: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) },
  });
};

export const getUserDetail = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parsePositiveInt(req.params.id);
  if (!userId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...safeUserSelect,
      apiKeys: { select: { id: true, name: true, key: true, status: true, lastUsed: true, expiresAt: true, revokedAt: true, requestCount: true, createdAt: true } },
      stateAccess: { where: { revokedAt: null }, select: { id: true, stateCode: true, scopeType: true, region: true, accessLevel: true, changedByUserId: true, createdAt: true, updatedAt: true } },
      notes: { select: { id: true, authorId: true, note: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } },
      _count: { select: { apiLogs: true } },
    },
  });

  if (!user) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const { _count, apiKeys, ...profile } = user;
  return res.json({
    success: true,
    data: {
      ...profile,
      apiKeys: apiKeys.map(({ key, ...metadata }) => ({ ...metadata, key: `${key.slice(0, 7)}...${key.slice(-4)}` })),
      requestCount: apiKeys.reduce((total, key) => total + key.requestCount, 0),
      apiLogCount: _count.apiLogs,
    },
  });
};

const actionUser = async (userId: number, action: "approve" | "suspend" | "delete", adminId: number) => {
  if (action === "approve") return prisma.user.update({ where: { id: userId }, data: { approvalStatus: "ACTIVE", status: "ACTIVE", rejectionReason: null, approvedAt: new Date(), approvedBy: adminId }, select: safeUserSelect });
  if (action === "suspend") return prisma.user.update({ where: { id: userId }, data: { approvalStatus: "SUSPENDED", status: "SUSPENDED" }, select: safeUserSelect });
  return prisma.user.delete({ where: { id: userId }, select: safeUserSelect });
};

export const bulkAction = async (req: AuthenticatedRequest, res: Response) => {
  const action = String(req.body?.action || "").toLowerCase();
  const ids = req.body?.userIds;
  if (!["approve", "suspend", "delete"].includes(action) || !Array.isArray(ids) || ids.length < 1 || ids.length > 100) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "action and 1 to 100 userIds are required" });
  const userIds = ids.map(parsePositiveInt);
  if (userIds.some((id: number | null): id is null => id === null) || new Set(userIds).size !== userIds.length) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "userIds must contain unique positive integers" });

  const results = [];
  for (const userId of userIds as number[]) {
    if (userId === req.user?.userId && action === "delete") {
      results.push({ userId, success: false, error: "ACCESS_DENIED", message: "The authenticated admin cannot delete itself" });
      continue;
    }
    try {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
      if (!target) throw new Error("NOT_FOUND");
      if (action === "delete" && target.role === "ADMIN") throw new Error("ACCESS_DENIED");
      await actionUser(userId, action as "approve" | "suspend" | "delete", req.user!.userId);
      results.push({ userId, success: true });
    } catch (error) {
      const code = error instanceof Error && error.message === "ACCESS_DENIED" ? "ACCESS_DENIED" : error instanceof Error && error.message === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_ERROR";
      results.push({ userId, success: false, error: code });
    }
  }
  return res.json({ success: true, data: results });
};

export const getUserStateAccess = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parsePositiveInt(req.params.id);
  if (!userId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  return res.json({ success: true, data: await getStateAccess(userId) });
};

export const grantAllStates = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parsePositiveInt(req.params.id);
  if (!userId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user id" });
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  await prisma.$transaction(async (tx) => {
    await tx.userStateAccess.deleteMany({ where: { userId } });
    await tx.userStateAccess.create({ data: { userId, scopeType: "ALL_STATES", stateCode: null, changedByUserId: req.user!.userId } });
  });
  return res.json({ success: true, data: { userId, scopeType: "ALL_STATES" } });
};

export const replaceSelectedStates = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parsePositiveInt(req.params.id);
  const stateIds = req.body?.stateIds;
  if (!userId || !Array.isArray(stateIds) || stateIds.length > 1000 || stateIds.some((id: unknown) => !parsePositiveInt(id))) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "stateIds must be a list of positive integers" });
  const uniqueIds = [...new Set(stateIds.map(Number))];
  const states = await prisma.state.findMany({ where: { id: { in: uniqueIds }, status: "ACTIVE" }, select: { id: true, code: true } });
  if (states.length !== uniqueIds.length) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "One or more states were not found" });
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  await prisma.$transaction(async (tx) => {
    await tx.userStateAccess.deleteMany({ where: { userId } });
    await tx.userStateAccess.createMany({ data: states.map((state) => ({ userId, stateCode: state.code, scopeType: "SELECTED_STATES" as const, changedByUserId: req.user!.userId })) });
  });
  return res.json({ success: true, data: { userId, scopeType: "SELECTED_STATES", stateIds: uniqueIds } });
};

export const revokeStateAccess = async (req: AuthenticatedRequest, res: Response) => {
  const userId = parsePositiveInt(req.params.id);
  const stateId = parsePositiveInt(req.params.stateId);
  if (!userId || !stateId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid user or state id" });
  const state = await prisma.state.findUnique({ where: { id: stateId }, select: { code: true } });
  if (!state) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "State not found" });
  await prisma.userStateAccess.updateMany({ where: { userId, stateCode: state.code }, data: { revokedAt: new Date(), changedByUserId: req.user!.userId } });
  return res.json({ success: true, data: { userId, stateId, revoked: true } });
};
