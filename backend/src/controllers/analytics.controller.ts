import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";

const utcStart = (daysAgo: number) => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
};

export const getAnalytics = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const start = utcStart(29);
    const now = new Date();
    const [topStates, daily, plans, percentiles, endpoints, heatmap] = await Promise.all([
      prisma.$queryRaw<Array<{ name: string; village_count: bigint }>>`SELECT s.name, COUNT(v.id)::bigint AS village_count FROM "State" s JOIN "District" d ON d."stateId" = s.id JOIN "SubDistrict" sd ON sd."districtId" = d.id JOIN "Village" v ON v."subDistrictId" = sd.id WHERE s.status = 'ACTIVE' AND v.status = 'ACTIVE' GROUP BY s.id, s.name ORDER BY village_count DESC LIMIT 10`,
      prisma.$queryRaw<Array<{ day: Date; request_count: bigint }>>`SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*)::bigint AS request_count FROM "ApiLog" WHERE "createdAt" >= ${start} AND "createdAt" < ${now} GROUP BY day ORDER BY day`,
      prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
      prisma.$queryRaw<Array<{ average: number | null; p95: number | null; p99: number | null }>>`SELECT AVG("responseTime")::float AS average, percentile_cont(0.95) WITHIN GROUP (ORDER BY "responseTime") AS p95, percentile_cont(0.99) WITHIN GROUP (ORDER BY "responseTime") AS p99 FROM "ApiLog"`,
      prisma.apiLog.groupBy({ by: ["endpoint"], _count: { _all: true }, orderBy: { _count: { endpoint: "desc" } }, take: 20 }),
      prisma.$queryRaw<Array<{ day_of_week: number; hour: number; request_count: bigint }>>`SELECT EXTRACT(DOW FROM "createdAt" AT TIME ZONE 'UTC')::int AS day_of_week, EXTRACT(HOUR FROM "createdAt" AT TIME ZONE 'UTC')::int AS hour, COUNT(*)::bigint AS request_count FROM "ApiLog" GROUP BY day_of_week, hour ORDER BY day_of_week, hour`,
    ]);
    const dailyMap = new Map(daily.map((row) => [row.day.toISOString().slice(0, 10), Number(row.request_count)]));
    const dailyRequests = Array.from({ length: 30 }, (_, index) => { const day = utcStart(29 - index).toISOString().slice(0, 10); return { date: day, count: dailyMap.get(day) || 0 }; });
    return res.json({ success: true, data: { timezone: "UTC", topStates: topStates.map((row) => ({ state: row.name, villageCount: Number(row.village_count) })), dailyRequests, planDistribution: Object.fromEntries(plans.map((row) => [row.plan, row._count._all])), responseTimes: percentiles[0], endpointBreakdown: endpoints.map((row) => ({ endpoint: row.endpoint, count: row._count._all })), heatmap: heatmap.map((row) => ({ dayOfWeek: row.day_of_week, hour: row.hour, count: Number(row.request_count) })) } });
  } catch (error) {
    console.error("Admin analytics request failed:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to calculate analytics" });
  }
};

export const getAnalyticsSummary = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const start = utcStart(0);
    const [villages, users, today, stats, percentiles] = await Promise.all([
      prisma.village.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.apiLog.count({ where: { createdAt: { gte: start } } }),
      prisma.apiLog.aggregate({ _avg: { responseTime: true } }),
      prisma.$queryRaw<Array<{ p95: number | null; p99: number | null }>>`SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY "responseTime") AS p95, percentile_cont(0.99) WITHIN GROUP (ORDER BY "responseTime") AS p99 FROM "ApiLog"`,
    ]);
    return res.json({ success: true, data: { totalVillages: villages, activeUsers: users, todayRequests: today, averageResponseTime: stats._avg.responseTime || 0, p95ResponseTime: percentiles[0]?.p95 || 0, p99ResponseTime: percentiles[0]?.p99 || 0, revenue: null, timezone: "UTC" } });
  } catch (error) {
    console.error("Analytics summary request failed:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to calculate analytics summary" });
  }
};
