import { db } from "../server/db";
import * as fs from "fs";

async function run() {
  const result: any = { companies: 0, users: 0, error: null };
  try {
    const companies = await db.query`SELECT id FROM companies`.then(r => r.recordset);
    result.companies = companies.length;

    const users = await db.query`
      SELECT DISTINCT
        COALESCE(ur.tenant_id, p.tenant_id) as company_id,
        u.id as user_id
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE COALESCE(ur.tenant_id, p.tenant_id) IS NOT NULL
         OR EXISTS (SELECT 1 FROM companies c WHERE c.created_by = u.id)
    `.then(r => r.recordset);
    result.users = users.length;

  } catch (e: any) {
    result.error = e.message;
  }
  fs.writeFileSync("query_result.json", JSON.stringify(result, null, 2));
  process.exit(0);
}

run();
