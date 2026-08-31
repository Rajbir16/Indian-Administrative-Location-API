import {
  getRedisClient,
  isRedisAvailable,
} from "../config/redis.js";

const DEFAULT_TTL = 3600; // 1 hour

// Get cached data
export const getCache = async <T>(
  key: string
): Promise<T | null> => {
  if (!isRedisAvailable()) {
    return null;
  }

  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get(key);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error("Redis cache GET error:", error);
    return null;
  }
};


// Set cached data
export const setCache = async (
  key: string,
  data: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> => {
  if (!isRedisAvailable()) {
    return;
  }

  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(key, JSON.stringify(data), {
      EX: ttl,
    });
  } catch (error) {
    console.error("Redis cache SET error:", error);
  }
};


// Delete cached data
export const deleteCache = async (
  key: string
): Promise<void> => {
  if (!isRedisAvailable()) {
    return;
  }

  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis cache DELETE error:", error);
  }
};