import { Response, NextFunction } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "./auth.js";

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true, status: true, approvalStatus: true },
    });

    if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "ACCESS_DENIED",
        message: "Administrator access is required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    return res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Authorization check failed",
    });
  }
};
