import jwt from "jsonwebtoken";
import { db } from "./db.js";
const JWT_SECRET = process.env.JWT_SECRET || "billflow-secret-change-in-production";
const SUPER_ADMIN_EMAIL = "ganesh@gmail.com";
export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
export function resolveEffectiveRole(email, role) {
    if (String(email || "").toLowerCase() === SUPER_ADMIN_EMAIL) {
        return "SUPER_ADMIN";
    }
    return role || null;
}

async function resolveCompanyTenantId(user, payload) {
    if (user?.tenant_id) {
        console.log("[tenant] using users.tenant_id", user.tenant_id);
        return String(user.tenant_id);
    }
    const tenantLink = await db.query `
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
    const companyByCreator = await db.query `
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
    if (process.env.NODE_ENV === "test" && process.env.TEST_TENANT_ID) {
        return process.env.TEST_TENANT_ID;
    }
    return undefined;
}
export async function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = verifyToken(token);
        const userResult = await db.query `SELECT * FROM users WHERE id = ${payload.id}`;
        const user = userResult.recordset[0];
        if (!user || !user.is_active) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const roleResult = await db.query `SELECT * FROM user_roles WHERE user_id = ${user.id}`;
        const roleRow = roleResult.recordset[0];
        const tenantId = await resolveCompanyTenantId(user, payload);
        req.user = { id: user.id, email: user.email, role: resolveEffectiveRole(user.email, roleRow?.role), tenantId };
        next();
    }
    catch (error) {
        console.error("[auth] authenticate error", error);
        res.status(401).json({ error: "Invalid token" });
    }
}
