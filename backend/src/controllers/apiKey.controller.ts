import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/index.js";
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

    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: "API key name is required",
      });
    }

    const apiKey = `INDIAN_LOC_${crypto
      .randomBytes(32)
      .toString("hex")}`;

    const createdKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
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
      data: createdKey,
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