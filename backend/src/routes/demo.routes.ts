import { Router, Request, Response } from "express";
import { prisma } from "../config/index.js";
import {
  getRedisClient,
  isRedisAvailable,
} from "../config/redis.js";

const router = Router();

const DAILY_LIMIT = 100;
const RATE_LIMIT_TTL = 60 * 60 * 24;

// ============================================================
// DEMO CLIENT RATE LIMIT
// Maharashtra-only, no authentication
// ============================================================

const getClientIdentifier = (req: Request): string => {
  return req.ip || "unknown";
};

const checkDemoRateLimit = async (
  req: Request,
  res: Response
): Promise<boolean> => {
  if (!isRedisAvailable()) {
    return true;
  }

  const redis = getRedisClient();

  if (!redis) {
    return true;
  }

  try {
    const clientId = getClientIdentifier(req);
    const today = new Date().toISOString().slice(0, 10);
    const key = `demo-client:${today}:${clientId}`;

    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      await redis.expire(key, RATE_LIMIT_TTL);
    }

    res.setHeader("X-Demo-RateLimit-Limit", DAILY_LIMIT);
    res.setHeader(
      "X-Demo-RateLimit-Remaining",
      Math.max(DAILY_LIMIT - currentCount, 0)
    );

    if (currentCount > DAILY_LIMIT) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Demo rate limit error:", error);
    return true;
  }
};

// ============================================================
// DEMO RATE LIMIT MIDDLEWARE
// ============================================================

const demoRateLimit = async (
  req: Request,
  res: Response,
  next: () => void
) => {
  const allowed = await checkDemoRateLimit(req, res);

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: "RATE_LIMITED",
      message:
        "Demo client daily limit of 100 requests has been exceeded.",
    });
  }

  next();
};

// ============================================================
// DEMO AUTOCOMPLETE
// GET /api/demo/autocomplete?q=Manibeli
// ============================================================

router.get(
  "/autocomplete",
  demoRateLimit,
  async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || "").trim();

      if (query.length < 2) {
        return res.status(400).json({
          success: false,
          error: "INVALID_QUERY",
          message: "Search query must contain at least 2 characters.",
        });
      }

      const villages = await prisma.village.findMany({
        where: {
          status: "ACTIVE",

          name: {
            contains: query,
            mode: "insensitive",
          },

          subDistrict: {
            district: {
              state: {
                name: {
                  equals: "MAHARASHTRA",
                  mode: "insensitive",
                },
                status: "ACTIVE",
              },
            },
          },
        },

        orderBy: {
          name: "asc",
        },

        take: 10,

        include: {
          subDistrict: {
            include: {
              district: {
                include: {
                  state: true,
                },
              },
            },
          },
        },
      });

      const data = villages.map((village) => {
        const subDistrict = village.subDistrict;
        const district = subDistrict.district;
        const state = district.state;

        return {
          value: village.code,

          label: village.name,

          fullAddress: [
            village.name,
            subDistrict.name,
            district.name,
            state.name,
            "India",
          ].join(", "),

          hierarchy: {
            village: {
              id: village.id,
              code: village.code,
              name: village.name,
            },

            subDistrict: {
              id: subDistrict.id,
              code: subDistrict.code,
              name: subDistrict.name,
            },

            district: {
              id: district.id,
              code: district.code,
              name: district.name,
            },

            state: {
              id: state.id,
              code: state.code,
              name: state.name,
            },

            country: {
              name: "India",
            },
          },
        };
      });

      return res.json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      console.error("Demo autocomplete failed:", error);

      return res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Unable to perform demo autocomplete.",
      });
    }
  }
);

// ============================================================
// DEMO VILLAGE SEARCH
// GET /api/demo/search?q=Manibeli
// ============================================================

router.get(
  "/search",
  demoRateLimit,
  async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q || "").trim();

      if (query.length < 2) {
        return res.status(400).json({
          success: false,
          error: "INVALID_QUERY",
          message: "Search query must contain at least 2 characters.",
        });
      }

      const villages = await prisma.village.findMany({
        where: {
          status: "ACTIVE",

          name: {
            contains: query,
            mode: "insensitive",
          },

          subDistrict: {
            district: {
              state: {
                name: {
                  equals: "MAHARASHTRA",
                  mode: "insensitive",
                },
                status: "ACTIVE",
              },
            },
          },
        },

        orderBy: {
          name: "asc",
        },

        take: 20,

        include: {
          subDistrict: {
            include: {
              district: {
                include: {
                  state: true,
                },
              },
            },
          },
        },
      });

      const data = villages.map((village) => {
        const subDistrict = village.subDistrict;
        const district = subDistrict.district;
        const state = district.state;

        return {
          code: village.code,
          name: village.name,

          subDistrict: {
            code: subDistrict.code,
            name: subDistrict.name,
          },

          district: {
            code: district.code,
            name: district.name,
          },

          state: {
            code: state.code,
            name: state.name,
          },

          fullAddress: [
            village.name,
            subDistrict.name,
            district.name,
            state.name,
            "India",
          ].join(", "),
        };
      });

      return res.json({
        success: true,
        query,
        count: data.length,
        data,
      });
    } catch (error) {
      console.error("Demo village search failed:", error);

      return res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Unable to perform demo search.",
      });
    }
  }
);

// ============================================================
// DEMO CONTACT FORM
// POST /api/demo/contact
// ============================================================

router.post(
  "/contact",
  demoRateLimit,
  async (req: Request, res: Response) => {
    try {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const message = String(req.body?.message || "").trim();
      const villageCode = String(req.body?.villageCode || "").trim();

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: "INVALID_QUERY",
          message: "Name, email and message are required.",
        });
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        return res.status(400).json({
          success: false,
          error: "INVALID_QUERY",
          message: "Please provide a valid email address.",
        });
      }

      if (
        name.length > 100 ||
        email.length > 200 ||
        message.length > 2000
      ) {
        return res.status(400).json({
          success: false,
          error: "INVALID_QUERY",
          message: "One or more fields exceed the allowed length.",
        });
      }

      console.log("Demo contact request received:", {
        name,
        email,
        message,
        villageCode: villageCode || null,
        createdAt: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message:
          "Thank you. Your request has been received successfully.",
      });
    } catch (error) {
      console.error("Demo contact request failed:", error);

      return res.status(500).json({
        success: false,
        error: "INTERNAL_ERROR",
        message: "Unable to submit contact request.",
      });
    }
  }
);

export default router;