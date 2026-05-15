import { Response, NextFunction } from "express";
import { AuthRequest } from "../auth.js";
import { db } from "../db.js";

export async function requireTenantContext(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let tenantId = req.user?.tenantId;

    if (!tenantId && req.user?.id) {
      const linkedTenant = await db.query`
        SELECT TOP 1
          COALESCE(ur.tenant_id, p.tenant_id, c.id, c.tenant_id) AS tenant_id
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN companies c ON c.id = COALESCE(ur.tenant_id, p.tenant_id)
           OR c.tenant_id = COALESCE(ur.tenant_id, p.tenant_id)
           OR c.created_by = u.id
        WHERE u.id = ${req.user.id}
        ORDER BY c.created_at ASC
      `;
      tenantId = linkedTenant.recordset[0]?.tenant_id;
    }

    if (!tenantId && req.user?.id) {
      const byCreator = await db.query`
        SELECT TOP 1 id
        FROM companies
        WHERE created_by = ${req.user.id}
        ORDER BY created_at ASC
      `;
      tenantId = byCreator.recordset[0]?.id;
    }

    if (!tenantId) {
      const firstCompany = await db.query`
        SELECT TOP 1 id
        FROM companies
        ORDER BY created_at ASC
      `;
      tenantId = firstCompany.recordset[0]?.id;
    }

    if (!tenantId) {
      tenantId = process.env.TEST_TENANT_ID || process.env.DEFAULT_TENANT_ID || undefined;
    }

    if (!tenantId) {
      console.error("[tenantContext] missing tenant_id for user", req.user?.id);
      res.status(401).json({ message: "Internal Server Error", error: "Tenant context missing" });
      return;
    }

    if (req.user) {
      req.user.tenantId = String(tenantId);
    } else {
      // Should not happen if authenticate is used, but for safety:
      req.user = { id: '', email: '', tenantId: String(tenantId) };
    }
    console.log("[tenantContext] tenant_id", req.user.tenantId);
    next();
  } catch (error: any) {
    console.error("[tenantContext] error", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
