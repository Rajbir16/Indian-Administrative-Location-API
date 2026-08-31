import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import {
  env,
  initializeRedis,
  prisma,
} from "./config/index.js";

import locationRoutes from "./routes/location.routes.js";
import authRoutes from "./routes/auth.routes.js";
import apiKeyRoutes from "./routes/apiKey.routes.js";

import {
  authenticate,
  AuthenticatedRequest,
} from "./middleware/auth.js";

import {
  authenticateApiKey,
  ApiKeyRequest,
} from "./middleware/apiKey.js";

import { rateLimit } from "./middleware/rateLimit.js";

// Initialize Express app
const app = express();

// ==================================================
// MIDDLEWARE SETUP
// ==================================================

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
// API ROUTES
// ==================================================

// Location APIs
app.use("/api/v1", rateLimit, locationRoutes);

// Authentication APIs
app.use("/api/auth", rateLimit, authRoutes);

// API key management APIs
app.use(
  "/api/auth/api-keys",
  rateLimit,
  apiKeyRoutes
);

// ==================================================
// JWT PROTECTED TEST ENDPOINT
// ==================================================

app.get(
  "/api/auth/me",
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: "Authentication successful",
      user: req.user,
    });
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