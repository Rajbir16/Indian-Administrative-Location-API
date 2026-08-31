import { createClient } from "redis";
import { env } from "./environment.js";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisAvailable = false;

export const initializeRedis = async (): Promise<void> => {
  // Redis is optional for local development.
  if (!env.REDIS_URL) {
    console.log("Redis not configured - continuing without Redis.");
    return;
  }

  try {
    redisClient = createClient({
      url: env.REDIS_URL,
    });

    redisClient.on("error", (error) => {
      console.error("Redis error:", error.message);
      redisAvailable = false;
    });

    redisClient.on("ready", () => {
      redisAvailable = true;
      console.log("Redis connected");
    });

    await redisClient.connect();

  } catch (error) {
    redisAvailable = false;
    redisClient = null;

    console.warn(
      "Redis unavailable - continuing without Redis."
    );
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // Ignore Redis shutdown errors
    }

    redisClient = null;
    redisAvailable = false;
  }
};

// Graceful disconnection
process.on("SIGINT", async () => {
  await closeRedis();
});

process.on("SIGTERM", async () => {
  await closeRedis();
});