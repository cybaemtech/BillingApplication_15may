import mssql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
  driver: "msnodesqlv8",
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=billing_application;Trusted_Connection=yes;TrustServerCertificate=yes;`,
  requestTimeout: 10000,
  connectionTimeout: 10000,
};

async function test() {
  try {
    console.log("Connecting to localhost\\SQLEXPRESS...");
    const pool = await mssql.connect(config);
    console.log("Connected!");
    const result = await pool.request().query("SELECT TOP 1 * FROM users");
    console.log("User Found:", result.recordset[0]?.email);
    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  }
}

test();
