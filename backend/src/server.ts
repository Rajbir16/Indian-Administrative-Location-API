import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import demoRoutes from "./routes/demo.routes.js";

import {
  env,
  initializeRedis,
  prisma,
} from "./config/index.js";

import locationRoutes from "./routes/location.routes.js";
import authRoutes from "./routes/auth.routes.js";
import apiKeyRoutes from "./routes/apiKey.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import v1Routes from "./routes/v1.routes.js";

import {
  authenticate,
  AuthenticatedRequest,
} from "./middleware/auth.js";

import {
  authenticateApiKey,
  ApiKeyRequest,
} from "./middleware/apiKey.js";

import { rateLimit } from "./middleware/rateLimit.js";
import { getOwnUsage, getOwnUsageHistory } from "./controllers/usage.controller.js";
import {
  apiErrorHandler,
  apiNotFound,
  recordApiUsage,
  requestContext,
} from "./middleware/apiFoundation.js";

// Initialize Express app
const app = express();

// ==================================================
// MIDDLEWARE SETUP
// ==================================================

app.use(requestContext);

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);

app.use(morgan("combined"));

// ==================================================
// SWAGGER / OPENAPI DOCUMENTATION
// ==================================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ==================================================
// API ROUTES
// ==================================================

// Location APIs
app.use("/api/v1", rateLimit, locationRoutes);

// Phase 2 API: API-key protected, versioned endpoints
app.use("/v1", authenticateApiKey, rateLimit, recordApiUsage, v1Routes);
app.use("/v1", apiNotFound);

// Authentication APIs
app.use("/api/auth", rateLimit, authRoutes);

// API key management APIs
app.use(
  "/api/auth/api-keys",
  rateLimit,
  apiKeyRoutes
);

app.use("/api/admin", rateLimit, adminRoutes);
app.use("/api/demo", demoRoutes);

app.get("/api/usage", authenticate, getOwnUsage);
app.get("/api/usage/history", authenticate, getOwnUsageHistory);

// ==================================================
// JWT PROTECTED TEST ENDPOINT
// ==================================================

app.get(
  "/api/auth/me",
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approvalStatus: true,
          plan: true,
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      return res.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.name,
          lastName: null,
          role: user.role,
          approvalStatus: user.approvalStatus,
          plan: user.plan,
        },
      });
    } catch (error) {
      console.error("Session lookup error:", error);
      return res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Unable to load the authenticated user",
      });
    }
  }
);

// ==================================================
// API KEY PROTECTED TEST ENDPOINT
// ==================================================

app.get(
  "/api/auth/api-key-test",
  authenticateApiKey,
  (req: ApiKeyRequest, res: Response) => {
    res.json({
      success: true,
      message: "API key authentication successful",
      apiKeyId: req.apiKeyId,
      userId: req.apiKeyUserId,
    });
  }
);

// ==================================================
// HEALTH CHECK
// ==================================================

app.get(
  "/health",
  (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date(),
      environment: env.NODE_ENV,
    });
  }
);

// ==================================================
// 404 HANDLER
// ==================================================

app.use(
  (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "Not Found",
      message: "The requested resource was not found",
    });
  }
);

app.use(apiErrorHandler);

// ==================================================
// SERVER STARTUP
// ==================================================

const startServer = async () => {
  try {
    console.log("✓ Environment validated");

    console.log("Connecting to database...");
    await prisma.$connect();
    console.log("✓ Database connected");

    console.log("Initializing Redis...");
    await initializeRedis();

    const port = env.PORT;

    app.listen(port, () => {
      console.log(`✓ Server started on port ${port}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log(`http://localhost:${port}`);
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
};

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
startServer();

export default app;