import crypto from "crypto";
import { NextFunction, Response } from "express";
import { prisma } from "../config/index.js";
import { ApiRequest, sendError } from "../utils/apiResponse.js";

export const requestContext = (
  req: ApiRequest,
  res: Response,
  next: NextFunction
) => {
  req.requestId = `req_${crypto.randomUUID()}`;
  req.requestStartedAt = Date.now();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

const maskIp = (ip: string | undefined): string | undefined => {
  if (!ip) {
    return undefined;
  }

  if (ip.includes(".")) {
    const parts = ip.split(".");
    parts[parts.length - 1] = "0";
    return parts.join(".");
  }

  const parts = ip.split(":");
  return `${parts.slice(0, 4).join(":")}::`;
};

export const recordApiUsage = (
  req: ApiRequest,
  res: Response,
  next: NextFunction
) => {
  res.on("finish", () => {
    if (!req.apiKeyId || !req.apiKeyUserId) {
      return;
    }

    void prisma.apiLog.create({
      data: {
        userId: req.apiKeyUserId,
        apiKeyId: req.apiKeyId,
        endpoint: `${req.baseUrl}${req.path}`,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: Date.now() - (req.requestStartedAt || Date.now()),
        maskedIp: maskIp(req.ip),
        requestId: req.requestId,
        userAgent: req.get("user-agent"),
      },
    }).catch((error) => {
      console.error("API usage logging failed:", error);
    });
  });

  next();
};

export const apiNotFound = (req: ApiRequest, res: Response) => {
  return sendError(req, res, 404, "NOT_FOUND", "The requested resource was not found");
};

export const apiErrorHandler = (
  error: unknown,
  req: ApiRequest,
  res: Response,
  _next: NextFunction
) => {
  console.error("API request failed:", error);
  return sendError(req, res, 500, "INTERNAL_ERROR", "An internal server error occurred");
};
