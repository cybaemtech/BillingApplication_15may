import { Response, NextFunction } from "express";
import { AuthRequest } from "../auth.js";
import { getTenantAllowedFeatures, getTenantRolePermissions } from "../services/featureAccessService.js";

export function requireFeatureAccess(featureKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const actorRole = String(req.user?.role || "").toUpperCase();
      const planBypassFeatures = new Set(["gst.gst_settings"]);

      if (actorRole === "SUPER_ADMIN") {
        next();
        return;
      }

      if (!tenantId) {
        res.status(401).json({ message: "Tenant context missing" });
        return;
      }

      if (planBypassFeatures.has(featureKey) && actorRole === "ADMIN") {
        next();
        return;
      }

      const allowedFeatures = await getTenantAllowedFeatures(tenantId);
      if (!allowedFeatures.includes(featureKey)) {
        res.status(403).json({ message: "Feature not available in your plan" });
        return;
      }

      if (actorRole === "ADMIN") {
        next();
        return;
      }

      const permissions = await getTenantRolePermissions(tenantId);
      if (Object.keys(permissions).length === 0) {
        next();
        return;
      }

      const roleKey = String(req.user?.role || "viewer").toLowerCase();
      const roleFeatures = permissions[roleKey] || [];
      if (!roleFeatures.includes(featureKey)) {
        res.status(403).json({ message: "Access denied for this role" });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  };
}
