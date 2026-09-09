import { Router } from "express";
import {
  approveUser,
  listPendingUsers,
  rejectUser,
  reactivateUser,
  suspendUser,
} from "../controllers/approval.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import {
  bulkAction,
  getUserDetail,
  getUserStateAccess,
  grantAllStates,
  listUsers,
  replaceSelectedStates,
  revokeStateAccess,
} from "../controllers/adminUser.controller.js";
import { listVillages } from "../controllers/adminVillage.controller.js";
import { exportApiLogs, listApiLogs } from "../controllers/adminLogs.controller.js";
import { getUserPlan, listPlans, updateUserPlan } from "../controllers/plan.controller.js";
import { getAnalytics, getAnalyticsSummary } from "../controllers/analytics.controller.js";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/plans", listPlans);
router.get("/analytics", getAnalytics);
router.get("/analytics/summary", getAnalyticsSummary);
router.get("/users/:id/plan", getUserPlan);
router.put("/users/:id/plan", updateUserPlan);
router.get("/villages", listVillages);
router.get("/api-logs", listApiLogs);
router.get("/api-logs/export", exportApiLogs);
router.get("/users", listUsers);
router.get("/users/pending", listPendingUsers);
router.get("/users/:id", getUserDetail);
router.post("/users/bulk-action", bulkAction);
router.post("/users/:id/approve", approveUser);
router.post("/users/:id/reject", rejectUser);
router.post("/users/:id/suspend", suspendUser);
router.post("/users/:id/reactivate", reactivateUser);
router.get("/users/:id/state-access", getUserStateAccess);
router.post("/users/:id/state-access/all", grantAllStates);
router.put("/users/:id/state-access", replaceSelectedStates);
router.delete("/users/:id/state-access/:stateId", revokeStateAccess);

export default router;
