import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getResponseMeta } from "../utils/apiResponse.js";

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

type LogQuery = Record<string, unknown>;
type LogFilter = { error: string } | { where: Record<string, unknown> };

const maskKey = (key: string | null) => key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null;
const maskIp = (ip: string | null) => ip || null;

const getLogFilter = (query: LogQuery): LogFilter => {
  const now = new Date();
  const range = String(query.range || "").toLowerCase();
  let from: Date | undefined;
  if (["hour", "lasthour"].includes(range)) from = new Date(now.getTime() - 60 * 60 * 1000);
  if (["day", "lastday"].includes(range)) from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (["week", "lastweek"].includes(range)) from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (["month", "lastmonth"].includes(range)) from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (range && !["hour", "lasthour", "day", "lastday", "week", "lastweek", "month", "lastmonth", "custom"].includes(range)) return { error: "Invalid date range" };
  if (range === "custom") {
    if (!query.from || !query.to) return { error: "Custom range requires from and to" };
    from = new Date(String(query.from));
    if (Number.isNaN(from.getTime())) return { error: "Invalid from date" };
  }
  const to = query.to && range === "custom" ? new Date(String(query.to)) : undefined;
  if (to && Number.isNaN(to.getTime())) return { error: "Invalid to date" };
  if (from && to && from > to) return { error: "from must be before to" };

  const status = String(query.status || "").toLowerCase();
  const statusCode = status === "2xx" ? { gte: 200, lt: 300 } : status === "4xx" ? { gte: 400, lt: 500 } : status === "5xx" ? { gte: 500, lt: 600 } : undefined;
  if (status && !statusCode) return { error: "Invalid status category" };

  const minResponseTime = query.minResponseTime === undefined ? undefined : Number(query.minResponseTime);
  if (minResponseTime !== undefined && (!Number.isInteger(minResponseTime) || minResponseTime < 0)) return { error: "Invalid minimum response time" };

  const userId = query.userId === undefined ? undefined : parsePositiveInt(query.userId);
  if (query.userId !== undefined && !userId) return { error: "Invalid user id" };

  return {
    where: {
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(userId ? { userId } : {}),
      ...(query.user ? { user: { OR: [{ email: { contains: String(query.user), mode: "insensitive" as const } }, { businessName: { contains: String(query.user), mode: "insensitive" as const } }] } } : {}),
      ...(query.endpoint ? { endpoint: { contains: String(query.endpoint).slice(0, 200), mode: "insensitive" as const } } : {}),
      ...(statusCode ? { statusCode } : {}),
      ...(minResponseTime !== undefined ? { responseTime: { gte: minResponseTime } } : {}),
    },
  };
};

const safeSelect = {
  id: true,
  endpoint: true,
  method: true,
  statusCode: true,
  responseTime: true,
  maskedIp: true,
  createdAt: true,
  apiKey: { select: { key: true } },
  user: { select: { id: true, name: true, businessName: true, email: true } },
};

type LogResult = { error: string } | { page: number; pageSize: number; total: number; logs: ReturnType<typeof shapeLog>[] };

type SafeLog = { id: number; endpoint: string; method: string; statusCode: number; responseTime: number; maskedIp: string | null; createdAt: Date; apiKey: { key: string } | null; user: { id: number; name: string; businessName: string | null; email: string } | null };
const shapeLog = (log: SafeLog) => ({ timestamp: log.createdAt, apiKey: maskKey(log.apiKey?.key || null), user: log.user ? { id: log.user.id, name: log.user.name, businessName: log.user.businessName, email: log.user.email } : null, endpoint: log.endpoint, method: log.method, responseTime: log.responseTime, statusCode: log.statusCode, ip: maskIp(log.maskedIp) });

const fetchLogs = async (query: LogQuery, max: number): Promise<LogResult> => {
  const filter = getLogFilter(query);
  if ("error" in filter) return filter;
  const page = parsePositiveInt(query.page ?? 1);
  const pageSize = parsePositiveInt(query.pageSize ?? 500);
  if (!page || !pageSize || pageSize > 1000) return { error: "page must be positive and pageSize must be between 1 and 1000" };
  const [total, logs] = await prisma.$transaction([
    prisma.apiLog.count({ where: filter.where }),
    prisma.apiLog.findMany({ where: filter.where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: Math.min(pageSize, max), select: safeSelect }),
  ]);
  return { page, pageSize, total, logs: logs.map((log) => shapeLog(log as SafeLog)) };
};

export const listApiLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await fetchLogs(req.query, 1000);
    if ("error" in result) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: result.error });
    return res.json({ success: true, count: result.logs.length, data: result.logs, meta: getResponseMeta(req, { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: Math.ceil(result.total / result.pageSize) }) });
  } catch (error) {
    console.error("Admin API log list failed:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to fetch API logs" });
  }
};

const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export const exportApiLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const format = String(req.query.format || "json").toLowerCase();
    if (format !== "csv" && format !== "json") return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "format must be csv or json" });
    const result = await fetchLogs({ ...req.query, page: "1", pageSize: "1000" }, 1000);
    if ("error" in result) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: result.error });
    if (format === "json") return res.json(result.logs);
    const headers = ["timestamp", "apiKey", "userName", "businessName", "endpoint", "method", "responseTime", "statusCode", "ip"];
    const rows = result.logs.map((log) => [log.timestamp, log.apiKey, log.user?.name, log.user?.businessName, log.endpoint, log.method, log.responseTime, log.statusCode, log.ip].map(escapeCsv).join(","));
    res.type("text/csv").setHeader("Content-Disposition", "attachment; filename=api-logs.csv");
    return res.send([headers.join(","), ...rows].join("\r\n"));
  } catch (error) {
    console.error("Admin API log export failed:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to export API logs" });
  }
};
