import { Router } from "express";
import { prisma } from "../config/index.js";
import { getCache, setCache } from "../utils/cache.js";

const router = Router();

// ============================================================
// GET ALL STATES
// ============================================================

router.get("/states", async (req, res) => {
  try {
    const cacheKey = "locations:states";

    // Check Redis cache
    const cached = await getCache<{
      success: boolean;
      count: number;
      data: Array<{
        id: number;
        code: string;
        name: string;
      }>;
    }>(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    // Cache miss - fetch from database
    const states = await prisma.state.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    const response = {
      success: true,
      count: states.length,
      data: states,
    };

    // Store in Redis for 1 hour
    await setCache(cacheKey, response, 3600);

    return res.json({
      ...response,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch states:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch states",
    });
  }
});


// ============================================================
// GET DISTRICTS BY STATE CODE
// ============================================================

router.get("/districts/:stateCode", async (req, res) => {
  try {
    const { stateCode } = req.params;

    const cacheKey = `locations:districts:${stateCode}`;

    // Check Redis cache
    const cached = await getCache<{
      success: boolean;
      state: {
        code: string;
        name: string;
      };
      count: number;
      data: Array<{
        id: number;
        code: string;
        name: string;
      }>;
    }>(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    const state = await prisma.state.findFirst({
      where: {
        code: stateCode,
        status: "ACTIVE",
      },
    });

    if (!state) {
      return res.status(404).json({
        success: false,
        error: "State not found",
      });
    }

    const districts = await prisma.district.findMany({
      where: {
        stateId: state.id,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    const response = {
      success: true,
      state: {
        code: state.code,
        name: state.name,
      },
      count: districts.length,
      data: districts,
    };

    await setCache(cacheKey, response, 3600);

    return res.json({
      ...response,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch districts:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch districts",
    });
  }
});


// ============================================================
// GET SUB-DISTRICTS BY DISTRICT CODE
// ============================================================

router.get("/subdistricts/:districtCode", async (req, res) => {
  try {
    const { districtCode } = req.params;

    const cacheKey = `locations:subdistricts:${districtCode}`;

    // Check Redis cache
    const cached = await getCache<{
      success: boolean;
      district: {
        code: string;
        name: string;
      };
      count: number;
      data: Array<{
        id: number;
        code: string;
        name: string;
      }>;
    }>(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    const district = await prisma.district.findFirst({
      where: {
        code: districtCode,
        status: "ACTIVE",
      },
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        error: "District not found",
      });
    }

    const subDistricts = await prisma.subDistrict.findMany({
      where: {
        districtId: district.id,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    const response = {
      success: true,
      district: {
        code: district.code,
        name: district.name,
      },
      count: subDistricts.length,
      data: subDistricts,
    };

    await setCache(cacheKey, response, 3600);

    return res.json({
      ...response,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch sub-districts:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch sub-districts",
    });
  }
});


// ============================================================
// SEARCH VILLAGES
// IMPORTANT: This MUST come before /villages/:subDistrictCode
// ============================================================

router.get("/villages/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
        example: "/api/v1/villages/search?q=Manibeli",
      });
    }

    const villages = await prisma.village.findMany({
      where: {
        status: "ACTIVE",
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 50,
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

    const data = villages.map(
  (village: typeof villages[number]) => ({
      code: village.code,
      name: village.name,

      subDistrict: {
        code: village.subDistrict.code,
        name: village.subDistrict.name,
      },

      district: {
        code: village.subDistrict.district.code,
        name: village.subDistrict.district.name,
      },

      state: {
        code: village.subDistrict.district.state.code,
        name: village.subDistrict.district.state.name,
      },
    }));

    return res.json({
      success: true,
      query,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Village search failed:", error);

    return res.status(500).json({
      success: false,
      error: "Village search failed",
    });
  }
});


// ============================================================
// GET VILLAGES BY SUB-DISTRICT CODE
// ============================================================

router.get("/villages/:subDistrictCode", async (req, res) => {
  try {
    const { subDistrictCode } = req.params;

    const cacheKey = `locations:villages:${subDistrictCode}`;

    // Check Redis cache
    const cached = await getCache<{
      success: boolean;
      subDistrict: {
        code: string;
        name: string;
      };
      count: number;
      data: Array<{
        id: number;
        code: string;
        name: string;
      }>;
    }>(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    const subDistrict = await prisma.subDistrict.findFirst({
      where: {
        code: subDistrictCode,
        status: "ACTIVE",
      },
    });

    if (!subDistrict) {
      return res.status(404).json({
        success: false,
        error: "Sub-district not found",
      });
    }

    const villages = await prisma.village.findMany({
      where: {
        subDistrictId: subDistrict.id,
        status: "ACTIVE",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
      take: 1000,
    });

    const response = {
      success: true,
      subDistrict: {
        code: subDistrict.code,
        name: subDistrict.name,
      },
      count: villages.length,
      data: villages,
    };

    await setCache(cacheKey, response, 3600);

    return res.json({
      ...response,
      cached: false,
    });
  } catch (error) {
    console.error("Failed to fetch villages:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch villages",
    });
  }
});


export default router;