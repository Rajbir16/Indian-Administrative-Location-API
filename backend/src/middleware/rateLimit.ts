import { Response, NextFunction } from "express";
import {
  getRedisClient,
  isRedisAvailable,
} from "../config/redis.js";
import { env } from "../config/environment.js";
import { ApiRequest, sendError } from "../utils/apiResponse.js";
import { getPlanDefinition } from "../services/plan.service.js";
import { prisma } from "../config/index.js";

export const rateLimit = async (
  req: ApiRequest,
  res: Response,
  next: NextFunction
) => {
  // If Redis is unavailable, continue normally.
  // This keeps local development working.
  if (!isRedisAvailable()) {
    return next();
  }

  const redis = getRedisClient();

  if (!redis) {
    return next();
  }

  try {
    let limit = env.RATE_LIMIT_MAX_REQUESTS;
    let windowMs = env.RATE_LIMIT_WINDOW_MS;
    if (req.apiKeyUserId) {
      const user = await prisma.user.findUnique({ where: { id: req.apiKeyUserId }, select: { plan: true } });
      if (user) {
        limit = getPlanDefinition(user.plan).burstPerMinuteLimit;
        windowMs = 60 * 1000;
      }
    }

    const identifier = req.apiKeyId ? `key:${req.apiKeyId}` : req.ip || "unknown";
    const key = `rate-limit:${identifier}`;

    const currentCount = await redis.incr(key);
    const dailyKey = `daily-rate-limit:${identifier}:${new Date().toISOString().slice(0, 10)}`;
    const dailyCount = await redis.incr(dailyKey);

    // Set expiry when the first request is made.
    if (currentCount === 1) {
      await redis.expire(
        key,
        Math.ceil(windowMs / 1000)
      );
    }
    if (dailyCount === 1) {
      await redis.expire(dailyKey, 24 * 60 * 60);
    }

    const reset = new Date(
      Date.now() + windowMs
    ).toISOString();

    res.locals.rateLimit = {
      remaining: Math.max(0, limit - currentCount),
      limit,
      reset,
    };

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, limit - currentCount)
    );
    res.setHeader("X-RateLimit-Reset", reset);

    if (currentCount > limit) {
      return sendError(
        req,
        res,
        429,
        "RATE_LIMITED",
        "Rate limit exceeded. Please try again later."
      );
    }

    const dailyLimit = req.apiKeyUserId
      ? getPlanDefinition((await prisma.user.findUnique({ where: { id: req.apiKeyUserId }, select: { plan: true } }))?.plan || "FREE").dailyRequestLimit
      : undefined;
    if (dailyLimit !== undefined && dailyCount > dailyLimit) {
      return sendError(req, res, 429, "RATE_LIMITED", "Daily request limit exceeded");
    }

    next();
  } catch (error) {
    // Redis failure should NOT bring down the API.
    console.error("Rate limiting error:", error);

    next();
  }
};