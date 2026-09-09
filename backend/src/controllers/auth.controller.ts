import { Request, Response } from "express";
import { prisma } from "../config/index.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/jwt.js";

const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "yandex.com",
]);

// ============================================================
// REGISTER
// ============================================================

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      businessEmail,
      businessName,
      gstNumber,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (!businessEmail || !businessName || !password) {
      return res.status(400).json({
        success: false,
        error: "Business email, business name and password are required",
        message:
          "Business email, business name and password are required",
      });
    }

    const email = String(businessEmail).trim().toLowerCase();
    const name = String(businessName).trim();

    // Validate email format
    const emailParts = email.split("@");

    if (
      emailParts.length !== 2 ||
      !emailParts[0] ||
      !emailParts[1]
    ) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid business email",
        message: "Please enter a valid business email",
      });
    }

    // Free email providers are not allowed
    const domain = emailParts[1];

    if (FREE_EMAIL_PROVIDERS.has(domain)) {
      return res.status(400).json({
        success: false,
        error: "Free email providers are not allowed",
        message:
          "Please use a business email address instead of a free email provider",
      });
    }

    // Validate business name
    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        error: "Business name is required",
        message: "Business name is required",
      });
    }

    // Validate phone number
    if (!phoneNumber || !String(phoneNumber).trim()) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
        message: "Phone number is required",
      });
    }

    const phone = String(phoneNumber).trim();

    // Basic phone validation with country code
    if (!/^\+?[0-9\s\-()]{8,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid phone number",
        message: "Please enter a valid phone number",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
        message: "Password must be at least 8 characters",
      });
    }

    // Password complexity
    if (
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain at least one uppercase letter, one lowercase letter and one number",
        message:
          "Password must contain at least one uppercase letter, one lowercase letter and one number",
      });
    }

    // Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
        message: "Passwords do not match",
      });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in pending approval state
    const user = await prisma.user.create({
      data: {
        email,
        name,
        businessEmail: email,
        businessName: name,
        gstNumber: gstNumber
          ? String(gstNumber).trim()
          : null,
        phoneNumber: phone,
        password: hashedPassword,

        // User must be approved before API access
        status: "ACTIVE",
        approvalStatus: "PENDING_APPROVAL",

        // New B2B users start on the free plan
        plan: "FREE",
        role: "B2B_USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        businessEmail: true,
        businessName: true,
        gstNumber: true,
        phoneNumber: true,
        status: true,
        approvalStatus: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    });

    // Do NOT automatically generate a JWT.
    // The account must be approved before the user can access
    // protected B2B functionality.

    return res.status(201).json({
      success: true,
      message:
        "Registration submitted successfully. Your account is pending admin approval.",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      error: "Registration failed",
      message: "Registration failed. Please try again.",
    });
  }
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "User account is not active",
        message: "User account is not active",
      });
    }

    // Pending approval users cannot log in
    if (user.approvalStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "ACCOUNT_PENDING_APPROVAL",
        message:
          "Your account is pending administrator approval.",
      });
    }

    // Verify password
    const passwordValid = await comparePassword(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          businessEmail: user.businessEmail,
          businessName: user.businessName,
          status: user.status,
          approvalStatus: user.approvalStatus,
          role: user.role,
          plan: user.plan,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      error: "Login failed",
      message: "Login failed. Please try again.",
    });
  }
};