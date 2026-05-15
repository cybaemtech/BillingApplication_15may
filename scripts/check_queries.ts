import { getPool } from "./server/db.js";

async function checkActiveQueries() {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM sys.dm_exec_requests WHERE session_id > 50");
    console.log("Active Queries:", JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error("Error checking active queries:", err);
  } finally {
    process.exit();
  }
}

checkActiveQueries();
