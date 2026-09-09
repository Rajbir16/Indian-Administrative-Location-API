import { Response } from "express";
import { prisma } from "../config/index.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { getResponseMeta } from "../utils/apiResponse.js";

const pageSizes = new Set([500, 5000, 10000]);

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const resolveState = async (value: string) => {
  const id = parsePositiveInt(value);
  return prisma.state.findFirst({
    where: { ...(id ? { id } : { code: value }), status: "ACTIVE" },
    select: { id: true, code: true },
  });
};

const resolveDistrict = async (value: string, stateId: number) => {
  const id = parsePositiveInt(value);
  return prisma.district.findFirst({
    where: { ...(id ? { id } : { code: value }), stateId, status: "ACTIVE" },
    select: { id: true },
  });
};

const resolveSubDistrict = async (value: string, districtId: number) => {
  const id = parsePositiveInt(value);
  return prisma.subDistrict.findFirst({
    where: { ...(id ? { id } : { code: value }), districtId, status: "ACTIVE" },
    select: { id: true },
  });
};

export const listVillages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stateValue = String(req.query.state || "").trim();
    const districtValue = String(req.query.district || "").trim();
    const subDistrictValue = String(req.query.subDistrict || "").trim();
    const village = String(req.query.village || "").trim();
    const page = parsePositiveInt(req.query.page ?? 1);
    const pageSize = parsePositiveInt(req.query.pageSize ?? 500);

    if (!stateValue || !page || !pageSize || !pageSizes.has(pageSize) || village.length > 100) {
      return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "state, page, and pageSize (500, 5000, or 10000) are required" });
    }

    const state = await resolveState(stateValue);
    if (!state) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "State not found" });

    let districtId: number | undefined;
    if (districtValue) {
      const district = await resolveDistrict(districtValue, state.id);
      if (!district) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "District not found for the selected state" });
      districtId = district.id;
    }

    let subDistrictId: number | undefined;
    if (subDistrictValue) {
      if (!districtId) return res.status(400).json({ success: false, error: "INVALID_QUERY", message: "district is required when subDistrict is supplied" });
      const subDistrict = await resolveSubDistrict(subDistrictValue, districtId);
      if (!subDistrict) return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Sub-district not found for the selected district" });
      subDistrictId = subDistrict.id;
    }

    const where = {
      status: "ACTIVE",
      ...(village ? { name: { contains: village, mode: "insensitive" as const } } : {}),
      subDistrict: {
        ...(subDistrictId ? { id: subDistrictId } : {}),
        ...(districtId ? { districtId } : { district: { stateId: state.id } }),
      },
    };

    const [total, villages] = await prisma.$transaction([
      prisma.village.count({ where }),
      prisma.village.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          code: true,
          name: true,
          subDistrict: {
            select: {
              name: true,
              district: { select: { name: true, state: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    const data = villages.map((item) => ({
      state: item.subDistrict.district.state.name,
      district: item.subDistrict.district.name,
      subDistrict: item.subDistrict.name,
      villageCode: item.code,
      villageName: item.name,
    }));

    return res.json({
      success: true,
      count: data.length,
      data,
      meta: getResponseMeta(req, {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }),
    });
  } catch (error) {
    console.error("Admin village list failed:", error);
    return res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Failed to fetch village data" });
  }
};
