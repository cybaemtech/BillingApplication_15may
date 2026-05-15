import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { User, UserRole } from "../shared/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "billflow-secret-change-in-production";
const SUPER_ADMIN_EMAIL = "ganesh@gmail.com";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  tenantId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export function resolveEffectiveRole(email?: string | null, role?: string | null) {
  if (String(email || "").toLowerCase() === SUPER_ADMIN_EMAIL) {
    return "SUPER_ADMIN";
  }
  return role || null;
}

async function resolveCompanyTenantId(user: any, payload: AuthUser) {
  if (user?.tenant_id) {
    console.log("[tenant] using users.tenant_id", user.tenant_id);
    return String(user.tenant_id);
  }

  const tenantLink = await db.query`
    SELECT TOP 1
      COALESCE(ur.tenant_id, p.tenant_id, c.id, c.tenant_id) AS tenant_id
    FROM users u
    LEFT JOIN profiles p ON p.user_id = u.id
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN companies c ON c.id = COALESCE(ur.tenant_id, p.tenant_id)
       OR c.tenant_id = COALESCE(ur.tenant_id, p.tenant_id)
       OR c.created_by = u.id
    WHERE u.id = ${user.id}
    ORDER BY c.created_at ASC
  `;
  const linkedTenantId = tenantLink.recordset[0]?.tenant_id;
  if (linkedTenantId) {
    console.log("[tenant] using profile/user_role/company link", linkedTenantId);
    return String(linkedTenantId);
  }

  const companyByCreator = await db.query`
    SELECT TOP 1 id
    FROM companies
    WHERE created_by = ${user.id}
    ORDER BY created_at ASC
  `;
  const creatorTenantId = companyByCreator.recordset[0]?.id;
  if (creatorTenantId) {
    console.log("[tenant] using company created_by match", creatorTenantId);
    return String(creatorTenantId);
  }

  if (payload?.tenantId) {
    console.log("[tenant] using token tenantId fallback", payload.tenantId);
    return String(payload.tenantId);
  }

  const envTenantId = process.env.TEST_TENANT_ID || process.env.DEFAULT_TENANT_ID;
  if (envTenantId) {
    console.log("[tenant] using env fallback", envTenantId);
    return String(envTenantId);
  }

  const firstCompany = await db.query`
    SELECT TOP 1 id
    FROM companies
    ORDER BY created_at ASC
  `;
  const firstCompanyId = firstCompany.recordset[0]?.id;
  if (firstCompanyId) {
    console.log("[tenant] using first company fallback", firstCompanyId);
    return String(firstCompanyId);
  }

  return undefined;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    const userResult = await db.query`SELECT * FROM users WHERE id = ${payload.id}`;
    const user = userResult.recordset[0] as User;
    if (!user || !user.is_active) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const roleResult = await db.query`SELECT * FROM user_roles WHERE user_id = ${user.id}`;
    const roleRow = roleResult.recordset[0] as UserRole;
    const tenantId = await resolveCompanyTenantId(user, payload);
    req.user = { id: user.id, email: user.email, role: resolveEffectiveRole(user.email, roleRow?.role), tenantId };
    next();
  } catch (error: any) {
    console.error("[auth] authenticate error", error);
    res.status(401).json({ error: "Invalid token" });
  }
}

