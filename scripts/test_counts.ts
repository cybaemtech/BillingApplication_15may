import { db } from "../server/db";

async function run() {
  console.log("Fetching table names...");
  
  const tables = await db.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`.then(r => r.recordset.map(x => x.TABLE_NAME)).catch(e => []);
  console.log("Tables:", tables);

  console.log("Checking if 'tenants' table exists and has rows...");
  if (tables.includes('tenants')) {
      const tenants = await db.query`SELECT TOP(1) * FROM tenants`.then(r => r.recordset).catch(e => []);
      console.log("Tenants sample:", tenants);
  }

  process.exit(0);
}

run();
