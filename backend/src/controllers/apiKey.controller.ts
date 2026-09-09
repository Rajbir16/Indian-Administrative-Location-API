import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/index.js";
import { hashPassword } from "../utils/bcrypt.js";
import { AuthenticatedRequest } from "../middleware/auth.js";


// ============================================================
// CREATE API KEY
// ============================================================

export const createApiKey = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const owner = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true, approvalStatus: true },
    });

    if (!owner || owner.status !== "ACTIVE" || owner.approvalStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "ACCESS_DENIED",
        message: "Account approval is required before creating API keys",
      });
    }

    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: "API key name is required",
      });
    }

    const activeKeyCount = await prisma.apiKey.count({
      where: {
        userId: req.user.userId,
        status: "ACTIVE",
      },
    });

    if (activeKeyCount >= 5) {
      return res.status(409).json({
        success: false,
        error: "API_KEY_LIMIT_REACHED",
        message: "A user may have a maximum of 5 active API keys",
      });
    }

    const apiKey = `ak_${crypto
      .randomBytes(16)
      .toString("hex")}`;
    const apiSecret = `as_${crypto
      .randomBytes(16)
      .toString("hex")}`;
    const secretHash = await hashPassword(apiSecret);

    const createdKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        secretHash,
        name: String(name).trim(),
        userId: req.user.userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        key: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        ...createdKey,
        secret: apiSecret,
        secretNotice: "This secret is shown only once. Store it securely.",
      },
    });
  } catch (error) {
    console.error("Create API key error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create API key",
    });
  }
};


// ============================================================
// LIST API KEYS
// ============================================================

export const listApiKeys = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const keys = await prisma.apiKey.findMany({
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: keys.length,
      data: keys,
    });
  } catch (error) {
    console.error("List API keys error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch API keys",
    });
  }
};


// ============================================================
// REVOKE API KEY
// ============================================================

export const revokeApiKey = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const keyId = Number(req.params.id);

    if (!Number.isInteger(keyId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid API key ID",
      });
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: req.user.userId,
      },
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        error: "API key not found",
      });
    }

    const updatedKey = await prisma.apiKey.update({
      where: {
        id: keyId,
      },
      data: {
        status: "REVOKED",
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      message: "API key revoked successfully",
      data: updatedKey,
    });
  } catch (error) {
    console.error("Revoke API key error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to revoke API key",
    });
  }
};

export const rotateApiSecret = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const keyId = Number(req.params.id);
    if (!Number.isInteger(keyId) || keyId <= 0) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Invalid API key ID" });
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: req.user.userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!existingKey) {
      return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Active API key not found" });
    }

    const apiSecret = `as_${crypto.randomBytes(16).toString("hex")}`;
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { secretHash: await hashPassword(apiSecret) },
    });

    return res.json({
      success: true,
      message: "API secret rotated successfully",
      data: {
        apiKeyId: keyId,
        secret: apiSecret,
        secretNotice: "This secret is shown only once. The previous secret is invalid.",
      },
    });
  } catch (error) {
    console.error("Rotate API secret error:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to rotate API secret" });
  }
};