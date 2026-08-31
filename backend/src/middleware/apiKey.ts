import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/index.js";

export interface ApiKeyRequest extends Request {
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
      return res.status(401).json({
        success: false,
        error: "API key required",
        message: "Provide your API key using the X-API-Key header",
      });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: {
        key: apiKey,
      },
      include: {
        user: true,
      },
    });

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        error: "Invalid API key",
      });
    }

    if (keyRecord.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        error: "API key is not active",
      });
    }

    if (keyRecord.user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "User account is not active",
      });
    }

    // Update last-used timestamp
    await prisma.apiKey.update({
      where: {
        id: keyRecord.id,
      },
      data: {
        lastUsed: new Date(),
      },
    });

    req.apiKeyId = keyRecord.id;
    req.apiKeyUserId = keyRecord.userId;

    next();
  } catch (error) {
    console.error("API key authentication error:", error);

    return res.status(500).json({
      success: false,
      error: "API key authentication failed",
    });
  }
};