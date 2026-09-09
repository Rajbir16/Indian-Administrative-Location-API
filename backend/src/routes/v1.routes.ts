import { Router } from "express";
import { prisma } from "../config/index.js";
import { ApiRequest, sendError, sendSuccess } from "../utils/apiResponse.js";
import { canAccessState, getStateAccess } from "../utils/stateAccess.js";

const router = Router();

const parseId = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const textFilter = (value: string) => ({
  OR: [
    { code: value },
    { name: { contains: value, mode: "insensitive" as const } },
  ],
});

const getLimit = (value: unknown, defaultValue = 50): number | null => {
  if (value === undefined) {
    return defaultValue;
  }

  const limit = Number(value);
  return Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : null;
};

router.get("/states", async (req: ApiRequest, res) => {
  try {
    const access = await getStateAccess(req.apiKeyUserId!);
    const states = await prisma.state.findMany({
      where: {
        status: "ACTIVE",
        ...(access.allStates ? {} : { code: { in: access.stateCodes } }),
      },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    });

    return sendSuccess(req, res, states, states.length);
  } catch (error) {
    console.error("V1 states request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Failed to fetch states");
  }
});

router.get("/states/:id/districts", async (req: ApiRequest, res) => {
  try {
    const stateId = parseId(req.params.id);
    if (!stateId) {
      return sendError(req, res, 400, "INVALID_QUERY", "State id must be a positive integer");
    }

    const state = await prisma.state.findFirst({
      where: { id: stateId, status: "ACTIVE" },
      select: { id: true, code: true, name: true },
    });

    if (!state) {
      return sendError(req, res, 404, "NOT_FOUND", "State not found");
    }

    if (!(await canAccessState(req.apiKeyUserId!, state.id))) {
      return sendError(req, res, 403, "ACCESS_DENIED", "You do not have access to this state");
    }

    const districts = await prisma.district.findMany({
      where: { stateId: state.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    });

    return sendSuccess(req, res, districts, districts.length);
  } catch (error) {
    console.error("V1 districts request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Failed to fetch districts");
  }
});

router.get("/districts/:id/subdistricts", async (req: ApiRequest, res) => {
  try {
    const districtId = parseId(req.params.id);
    if (!districtId) {
      return sendError(req, res, 400, "INVALID_QUERY", "District id must be a positive integer");
    }

    const district = await prisma.district.findFirst({
      where: { id: districtId, status: "ACTIVE" },
      select: { id: true, stateId: true },
    });

    if (!district) {
      return sendError(req, res, 404, "NOT_FOUND", "District not found");
    }

    if (!(await canAccessState(req.apiKeyUserId!, district.stateId))) {
      return sendError(req, res, 403, "ACCESS_DENIED", "You do not have access to this district's state");
    }

    const subDistricts = await prisma.subDistrict.findMany({
      where: { districtId: district.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    });

    return sendSuccess(req, res, subDistricts, subDistricts.length);
  } catch (error) {
    console.error("V1 sub-districts request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Failed to fetch sub-districts");
  }
});

router.get("/subdistricts/:id/villages", async (req: ApiRequest, res) => {
  try {
    const subDistrictId = parseId(req.params.id);
    if (!subDistrictId) {
      return sendError(req, res, 400, "INVALID_QUERY", "Sub-district id must be a positive integer");
    }

    const subDistrict = await prisma.subDistrict.findFirst({
      where: { id: subDistrictId, status: "ACTIVE" },
      select: { id: true, district: { select: { stateId: true } } },
    });

    if (!subDistrict) {
      return sendError(req, res, 404, "NOT_FOUND", "Sub-district not found");
    }

    if (!(await canAccessState(req.apiKeyUserId!, subDistrict.district.stateId))) {
      return sendError(req, res, 403, "ACCESS_DENIED", "You do not have access to this sub-district's state");
    }

    const villages = await prisma.village.findMany({
      where: { subDistrictId: subDistrict.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
      take: 1000,
      select: { id: true, code: true, name: true },
    });

    return sendSuccess(req, res, villages, villages.length);
  } catch (error) {
    console.error("V1 villages request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Failed to fetch villages");
  }
});

router.get("/search", async (req: ApiRequest, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const limit = getLimit(req.query.limit);
    const state = String(req.query.state || "").trim();
    const district = String(req.query.district || "").trim();
    const subDistrict = String(req.query.subDistrict || "").trim();
    const access = await getStateAccess(req.apiKeyUserId!);

    if (query.length < 2 || !limit) {
      return sendError(req, res, 400, "INVALID_QUERY", "q must contain at least 2 characters and limit must be between 1 and 100");
    }

    const villages = await prisma.village.findMany({
      where: {
        status: "ACTIVE",
        name: { contains: query, mode: "insensitive" },
        ...(state || district || subDistrict
          ? {
              subDistrict: {
                ...(subDistrict ? { OR: [textFilter(subDistrict)] } : {}),
                district: {
                  ...(district ? { OR: [textFilter(district)] } : {}),
                  state: state ? { OR: [textFilter(state)] } : undefined,
                },
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: limit,
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: { include: { country: true } },
              },
            },
          },
        },
      },
    });

    const visibleVillages = access.allStates
      ? villages
      : villages.filter((village) => access.stateCodes.includes(village.subDistrict.district.state.code));

    const data = visibleVillages.map((village) => ({
      value: village.code,
      label: village.name,
      fullAddress: [
        village.name,
        village.subDistrict.name,
        village.subDistrict.district.name,
        village.subDistrict.district.state.name,
        village.subDistrict.district.state.country.name,
      ].join(", "),
      hierarchy: {
        village: { id: village.id, code: village.code, name: village.name },
        subDistrict: village.subDistrict,
        district: village.subDistrict.district,
        state: village.subDistrict.district.state,
        country: village.subDistrict.district.state.country,
      },
    }));

    return sendSuccess(req, res, data, data.length);
  } catch (error) {
    console.error("V1 search request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Search failed");
  }
});

router.get("/autocomplete", async (req: ApiRequest, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const hierarchyLevel = String(req.query.hierarchyLevel || "village").trim().toLowerCase();
    const limit = getLimit(req.query.limit, 10);
    const levels = ["village", "subdistrict", "district", "state"];

    if (query.length < 2 || !limit || !levels.includes(hierarchyLevel)) {
      return sendError(req, res, 400, "INVALID_QUERY", "q must contain at least 2 characters, hierarchyLevel must be valid, and limit must be between 1 and 100");
    }

    const levelFilter = hierarchyLevel === "village"
      ? { name: { contains: query, mode: "insensitive" as const } }
      : hierarchyLevel === "subdistrict"
        ? { subDistrict: { name: { contains: query, mode: "insensitive" as const } } }
        : hierarchyLevel === "district"
          ? { subDistrict: { district: { name: { contains: query, mode: "insensitive" as const } } } }
          : { subDistrict: { district: { state: { name: { contains: query, mode: "insensitive" as const } } } } };

    const access = await getStateAccess(req.apiKeyUserId!);
    const villages = await prisma.village.findMany({
      where: { status: "ACTIVE", ...levelFilter },
      orderBy: { name: "asc" },
      take: limit,
      include: {
        subDistrict: {
          include: {
            district: {
              include: {
                state: { include: { country: true } },
              },
            },
          },
        },
      },
    });

    const visibleVillages = access.allStates
      ? villages
      : villages.filter((village) => access.stateCodes.includes(village.subDistrict.district.state.code));

    const data = visibleVillages.map((village) => ({
      value: village.code,
      label: village.name,
      fullAddress: [
        village.name,
        village.subDistrict.name,
        village.subDistrict.district.name,
        village.subDistrict.district.state.name,
        village.subDistrict.district.state.country.name,
      ].join(", "),
      hierarchy: {
        village: { id: village.id, code: village.code, name: village.name },
        subDistrict: { id: village.subDistrict.id, code: village.subDistrict.code, name: village.subDistrict.name },
        district: { id: village.subDistrict.district.id, code: village.subDistrict.district.code, name: village.subDistrict.district.name },
        state: { id: village.subDistrict.district.state.id, code: village.subDistrict.district.state.code, name: village.subDistrict.district.state.name },
        country: { id: village.subDistrict.district.state.country.id, code: village.subDistrict.district.state.country.code, name: village.subDistrict.district.state.country.name },
      },
    }));

    return sendSuccess(req, res, data, data.length);
  } catch (error) {
    console.error("V1 autocomplete request failed:", error);
    return sendError(req, res, 500, "INTERNAL_ERROR", "Autocomplete failed");
  }
});

export default router;
