import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getPlanDefinition } from "../services/plan.service.js";

export const getOwnUsage = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: "Authentication required" });
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [user, today, month, stats] = await prisma.$transaction([
    prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, plan: true } }),
    prisma.apiLog.count({ where: { userId: req.user.userId, createdAt: { gte: startOfDay } } }),
    prisma.apiLog.count({ where: { userId: req.user.userId, createdAt: { gte: startOfMonth } } }),
    prisma.apiLog.aggregate({ where: { userId: req.user.userId }, _avg: { responseTime: true }, _count: { id: true } }),
  ]);
  if (!user) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "User not found" });
  const plan = getPlanDefinition(user.plan);
  const successful = await prisma.apiLog.count({ where: { userId: user.id, statusCode: { gte: 200, lt: 300 } } });
  const total = stats._count.id;
  return res.json({ success: true, data: { plan, requestsToday: today, remainingDailyRequests: Math.max(0, plan.dailyRequestLimit - today), monthlyRequestCount: month, averageResponseTime: stats._avg.responseTime || 0, successfulRequestPercentage: total ? (successful / total) * 100 : 0 } });
};

export const getOwnUsageHistory = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    const today = new Date();
    const start = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 29
    ));
    const end = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + 1
    ));

    const rows = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        COUNT(*)::bigint AS count
      FROM "ApiLog"
      WHERE "userId" = ${req.user.userId}
        AND "createdAt" >= ${start}
        AND "createdAt" < ${end}
      GROUP BY date
      ORDER BY date ASC
    `;

    const counts = new Map(rows.map((row) => [row.date, Number(row.count)]));
    const dailyRequests = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) || 0 };
    });

    return res.json({
      success: true,
      data: {
        timezone: "UTC",
        dailyRequests,
      },
    });
  } catch (error) {
    console.error("Usage history request failed:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Unable to load usage history",
    });
  }
};
