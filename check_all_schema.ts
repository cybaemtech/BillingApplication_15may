import { getDb, initializeDb } from "./server/db.js";

async function main() {
  await initializeDb();
  try {
    const pool = await getDb();
    
    // Get all user tables
    const tablesRes = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
    const allTables = tablesRes.recordset.map(t => t.TABLE_NAME);
    
    // Get tables with tenant_id
    const tenantColsRes = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = 'tenant_id'");
    const tablesWithTenantId = new Set(tenantColsRes.recordset.map(t => t.TABLE_NAME));
    
    const missing = allTables.filter(t => !tablesWithTenantId.has(t) && t !== 'sysdiagrams' && t !== 'users' && t !== 'sessions' && t !== 'plans');
    
    console.log("Tables MISSING tenant_id:");
    console.log(missing);

  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
