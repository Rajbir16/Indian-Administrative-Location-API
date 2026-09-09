import { prisma } from "../config/index.js";

export const getStateAccess = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      stateAccess: {
        where: { revokedAt: null },
        select: { scopeType: true, stateCode: true },
      },
    },
  });

  if (!user) {
    return { allStates: false, stateCodes: [] as string[] };
  }

  if (user.role === "ADMIN" || user.stateAccess.some((access) => access.scopeType === "ALL_STATES")) {
    return { allStates: true, stateCodes: [] as string[] };
  }

  return {
    allStates: false,
    stateCodes: user.stateAccess
      .map((access) => access.stateCode)
      .filter((code): code is string => Boolean(code)),
  };
};

export const canAccessState = async (userId: number, stateId: number) => {
  const access = await getStateAccess(userId);
  if (access.allStates) {
    return true;
  }

  const state = await prisma.state.findFirst({
    where: { id: stateId, status: "ACTIVE" },
    select: { code: true },
  });

  return Boolean(state && access.stateCodes.includes(state.code));
};
