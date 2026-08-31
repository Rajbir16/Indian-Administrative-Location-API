import { Request, Response, NextFunction } from "express";
import {
  getRedisClient,
  isRedisAvailable,
} from "../config/redis.js";
import { env } from "../config/environment.js";

export const rateLimit = async (
  req: Request,
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
    const identifier = req.ip || "unknown";
    const key = `rate-limit:${identifier}`;

    const currentCount = await redis.incr(key);

    // Set expiry when the first request is made.
    if (currentCount === 1) {
      await redis.expire(
        key,
        Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000)
      );
    }

    const limit = env.RATE_LIMIT_MAX_REQUESTS;

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, limit - currentCount)
    );

    if (currentCount > limit) {
      return res.status(429).json({
        success: false,
        error: "Too many requests",
        message:
          "Rate limit exceeded. Please try again later.",
      });
    }

    next();
  } catch (error) {
    // Redis failure should NOT bring down the API.
    console.error("Rate limiting error:", error);

    next();
  }
};