import { db, initializeDb } from "./server/db.js";

async function main() {
  await initializeDb();
  try {
    const plans = await db.query`SELECT * FROM plans`;
    console.log(JSON.stringify(plans.recordset, null, 2));
    const columns = await db.query`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'plans'`;
    console.log("COLUMNS:");
    console.log(JSON.stringify(columns.recordset, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
