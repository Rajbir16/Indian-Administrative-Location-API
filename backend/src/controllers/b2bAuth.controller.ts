import { Request, Response } from "express";
import { prisma } from "../config/index.js";
import { hashPassword } from "../utils/bcrypt.js";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

const phonePattern = /^\+[1-9]\d{7,14}$/;
const gstPattern = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/i;

export const registerB2B = async (req: Request, res: Response) => {
  try {
    const {
      businessEmail,
      businessName,
      gstNumber,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    const email = String(businessEmail || "").trim().toLowerCase();
    const name = String(businessName || "").trim();
    const phone = String(phoneNumber || "").trim();
    const gst = gstNumber ? String(gstNumber).trim().toUpperCase() : undefined;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "A valid business email is required" });
    }

    const domain = email.split("@")[1];
    if (PUBLIC_EMAIL_DOMAINS.has(domain)) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "A business email address is required" });
    }

    if (!name) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Business name is required" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Password must be at least 8 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Password and confirm password must match" });
    }

    if (!phonePattern.test(phone)) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "Phone number must include a valid country code" });
    }

    if (gst && !gstPattern.test(gst)) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "GST number format is invalid" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: "ACCOUNT_EXISTS", message: "Registration could not be completed with these details" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: await hashPassword(password),
        status: "ACTIVE",
        approvalStatus: "PENDING_APPROVAL",
        role: "B2B_USER",
        businessEmail: email,
        businessName: name,
        gstNumber: gst,
        phoneNumber: phone,
      },
      select: {
        id: true,
        businessEmail: true,
        businessName: true,
        gstNumber: true,
        phoneNumber: true,
        approvalStatus: true,
        plan: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Registration submitted for approval",
      data: user,
    });
  } catch (error) {
    console.error("B2B registration error:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Registration failed" });
  }
};
