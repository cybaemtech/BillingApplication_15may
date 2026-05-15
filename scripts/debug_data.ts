import { db } from "../server/db";

async function run() {
  console.log("Investigating data separation and counts...");

  // 1. Check companies
  const companies = await db.query`SELECT id, company_name FROM companies`.then(r => r.recordset);
  console.log(`Total companies: ${companies.length}`);
  if (companies.length > 0) {
    console.log("Sample companies:", companies.slice(0, 3));
  }

  // 2. Check invoices and their tenant_ids
  const invoiceTenants = await db.query`SELECT DISTINCT tenant_id FROM invoices`.then(r => r.recordset);
  console.log(`Distinct tenant_ids in invoices: ${invoiceTenants.length}`);
  console.log("Sample tenant_ids from invoices:", invoiceTenants.slice(0, 5));

  // 3. Check if any invoice tenant_id matches a company id
  if (companies.length > 0 && invoiceTenants.length > 0) {
    const companyIds = new Set(companies.map(c => c.id.toLowerCase()));
    const matching = invoiceTenants.filter(it => it.tenant_id && companyIds.has(it.tenant_id.toLowerCase()));
    console.log(`Number of invoice tenant_ids matching a company id: ${matching.length}`);
  }

  // 4. Check users and their association
  const users = await db.query`SELECT id, email, role FROM users`.then(r => r.recordset);
  console.log(`Total users: ${users.length}`);

  const userRoles = await db.query`SELECT user_id, tenant_id, role FROM user_roles`.then(r => r.recordset);
  console.log(`Total user_roles entries: ${userRoles.length}`);
  if (userRoles.length > 0) {
    console.log("Sample user_roles:", userRoles.slice(0, 3));
  }

  process.exit(0);
}

run();
