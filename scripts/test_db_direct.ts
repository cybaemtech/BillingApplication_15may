import mssql from "mssql/msnodesqlv8.js";
import dotenv from "dotenv";
dotenv.config();

const databaseServerRaw = process.env.DATABASE_SERVER;
const databaseName = process.env.DATABASE_NAME;

const config = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=billing_application;Trusted_Connection=yes;TrustServerCertificate=yes;`,
  requestTimeout: 10000,
  connectionTimeout: 10000,
};

async function test() {
  try {
    console.log("Connecting with config:", config);
    const pool = await mssql.connect(config);
    console.log("Connected!");
    const result = await pool.request().query("SELECT 1 as result");
    console.log("Query Result:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("Test Error:", err);
    process.exit(1);
  }
}

test();
