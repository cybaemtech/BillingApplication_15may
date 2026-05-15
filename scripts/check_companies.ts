import { db } from "../server/db";

async function run() {
  console.log("Checking companies schema and sample...");
  
  const columns = await db.query`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'companies'
  `.then(r => r.recordset);
  console.log("Columns:", columns);

  const sample = await db.query`SELECT TOP(3) * FROM companies`.then(r => r.recordset);
  console.log("Sample rows:", JSON.stringify(sample, null, 2));

  process.exit(0);
}

run();
