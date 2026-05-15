import { db } from "../server/db";

async function run() {
  console.log("Checking subscriptions table...");
  const subscriptions = await db.query`SELECT count(*) as c FROM subscriptions`.then(r => r.recordset[0]);
  console.log("Subscriptions count:", subscriptions);
  
  const sample = await db.query`SELECT TOP(3) * FROM subscriptions`.then(r => r.recordset);
  console.log("Sample subscriptions:", sample);
  
  process.exit(0);
}

run();
