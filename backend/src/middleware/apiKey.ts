import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/index.js";
import { comparePassword } from "../utils/bcrypt.js";
import { ApiRequest, sendError } from "../utils/apiResponse.js";

export interface ApiKeyRequest extends ApiRequest {
  apiKeyId?: number;
  apiKeyUserId?: number;
}

export const authenticateApiKey = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      return sendError(req, res, 401, "INVALID_API_KEY", "A valid X-API-Key header is required");
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
      },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        secretHash: true,
        user: {
          select: {
            status: true,
            approvalStatus: true,
          },
        },
      },
    });

    if (!keyRecord) {
      return sendError(req, res, 401, "INVALID_API_KEY", "The API key is invalid");
    }

    if (keyRecord.status !== "ACTIVE") {
      return sendError(req, res, 401, "INVALID_API_KEY", "The API key is not active");
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt <= new Date()) {
      return sendError(req, res, 401, "INVALID_API_KEY", "The API key has expired");
    }

    if (
      keyRecord.user.status !== "ACTIVE" ||
      keyRecord.user.approvalStatus !== "ACTIVE"
    ) {
      return sendError(req, res, 403, "ACCESS_DENIED", "The associated user is not allowed to access the API");
    }

    await prisma.apiKey.update({
      where: {
        id: keyRecord.id,
      },
      data: {
        lastUsed: new Date(),
        requestCount: {
          increment: 1,
        },
      },
    });

    req.apiKeyId = keyRecord.id;
    req.apiKeyUserId = keyRecord.userId;

    next();
  } catch (error) {
    console.error("API key authentication error:", error);

    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "API key authentication failed",
    });
  }
};

export const authenticateApiSecret = async (
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiSecret = req.headers["x-api-secret"];

    if (!apiSecret || typeof apiSecret !== "string" || !req.apiKeyId) {
      return sendError(req, res, 403, "ACCESS_DENIED", "A valid X-API-Secret header is required");
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { id: req.apiKeyId },
      select: { secretHash: true },
    });

    if (!keyRecord?.secretHash || !(await comparePassword(apiSecret, keyRecord.secretHash))) {
      return sendError(req, res, 403, "ACCESS_DENIED", "The API secret is invalid");
    }

    next();
  } catch (error) {
    console.error("API secret authentication error:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "API secret authentication failed");
  }
};