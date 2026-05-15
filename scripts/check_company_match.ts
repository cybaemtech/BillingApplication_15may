import { db } from "../server/db";

async function run() {
  const tenantId = "8EB10D16-D6AF-48A0-A54B-A6108C23A1AD";
  console.log(`Checking company for tenantId ${tenantId}...`);
  
  const company = await db.query`
    SELECT id, company_name FROM companies WHERE id = ${tenantId}
  `.then(r => r.recordset);
  
  console.log("Company data:", company);
  process.exit(0);
}

run();
