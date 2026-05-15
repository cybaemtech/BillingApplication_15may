import { db } from "../server/db";

async function run() {
  try {
    console.log("Testing companies query...");
    const companies = await db.query`
      SELECT
        c.id,
        c.company_name,
        c.created_by
      FROM companies c
    `.then((result) => result.recordset);
    console.log("Companies found:", companies.length);

    console.log("Testing users query...");
    const users = await db.query`
      SELECT DISTINCT
        COALESCE(ur.tenant_id, p.tenant_id) as company_id,
        u.id as user_id,
        u.email,
        u.username,
        u.is_active,
        p.display_name,
        p.phone,
        ur.role
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE COALESCE(ur.tenant_id, p.tenant_id) IS NOT NULL
         OR EXISTS (SELECT 1 FROM companies c WHERE c.created_by = u.id)
    `.then((result) => result.recordset);
    console.log("Users found:", users.length);

  } catch (e) {
    console.error("Query failed:", e);
  }
  process.exit(0);
}

run();
