import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireRootAdmin } from "../middleware/admin.js";
import {
  adminStats,
  adminTimeseries,
  adminPresence,
  adminSessions,
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminGrant,
  adminRevokeGrant,
  adminSuspend,
  adminUnsuspend,
  adminForceLogout,
  adminTempPassword,
  adminSendReset,
  adminSetRole,
  adminExportUsers,
  adminAuditLog,
  adminAudienceList,
  adminAudienceCount,
  adminListBroadcasts,
  adminCreateBroadcast,
} from "../controllers/adminController.js";

const router = Router();

router.use(requireAuth, requireAdmin);

// dashboard
router.get("/stats", adminStats);
router.get("/timeseries", adminTimeseries);

// presence & sessions
router.get("/presence", adminPresence);
router.get("/sessions", adminSessions);

// audit + broadcasts
router.get("/audit", adminAuditLog);
router.get("/audiences", adminAudienceList);
router.get("/audience-count", adminAudienceCount);
router.get("/broadcasts", adminListBroadcasts);
router.post("/broadcasts", adminCreateBroadcast);

// users — list / export / detail
router.get("/users", adminListUsers);
router.get("/users.csv", adminExportUsers);
router.get("/users/:id", adminGetUser);
router.patch("/users/:id", adminUpdateUser);

// users — actions
router.post("/users/:id/grant", adminGrant);
router.delete("/users/:id/grant", adminRevokeGrant);
router.post("/users/:id/suspend", adminSuspend);
router.post("/users/:id/unsuspend", adminUnsuspend);
router.post("/users/:id/logout", adminForceLogout);
router.post("/users/:id/temp-password", adminTempPassword);
router.post("/users/:id/send-reset", adminSendReset);
router.post("/users/:id/role", requireRootAdmin, adminSetRole);

export default router;
