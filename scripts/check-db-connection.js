import fs from "node:fs";
import path from "node:path";
import sql from "mssql";

function readDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  const result = {};
  if (!fs.existsSync(envPath)) return result;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

const dotenv = readDotEnv();
const getEnv = (key, fallback = "") => process.env[key] || dotenv[key] || fallback;

const databaseServerRaw = getEnv("DB_SERVER", getEnv("DATABASE_SERVER", "localhost"));
const databaseName = getEnv("DB_NAME", getEnv("DATABASE_NAME", "billing_application"));
const databaseInstance = getEnv("DATABASE_INSTANCE", "");
const databasePort = getEnv("DB_PORT", "") ? Number(getEnv("DB_PORT", "")) : (getEnv("DATABASE_PORT", "") ? Number(getEnv("DATABASE_PORT", "")) : undefined);
const databaseServerHost = databaseServerRaw.includes("\\") ? databaseServerRaw.split("\\")[0] : databaseServerRaw;
const databaseServer = databaseServerHost === "." || databaseServerHost.toLowerCase() === "(local)" ? "localhost" : databaseServerHost;
const windowsAuth = getEnv("DATABASE_WINDOWS_AUTH", "false").toLowerCase() === "true";
const encrypt = getEnv("DATABASE_ENCRYPT", "false").toLowerCase() === "true";

const buildConfig = (server) => {
  const cfg = {
    server,
    database: databaseName,
    options: {
      encrypt,
      trustServerCertificate: true,
      enableArithAbort: true,
      trustedConnection: windowsAuth,
      ...(databaseInstance && !databasePort ? { instanceName: databaseInstance } : {}),
    },
    ...(databasePort ? { port: databasePort } : {}),
    connectionTimeout: Number(getEnv("DATABASE_CONNECTION_TIMEOUT", "15000")),
    requestTimeout: Number(getEnv("DATABASE_REQUEST_TIMEOUT", "15000")),
  };

  const user = getEnv("DB_USER", getEnv("DATABASE_USER", ""));
  const password = getEnv("DB_PASSWORD", getEnv("DATABASE_PASSWORD", ""));

  if (!windowsAuth && user) {
    cfg.user = user;
    cfg.password = password;
  }

  return cfg;
};

const requiredTables = [
  "users",
  "customers",
  "vendors",
  "items",
  "invoices",
  "bills",
  "expenses",
  "journal_entries",
  "gst_settings",
  "pos_sessions",
  "workflows",
];

async function main() {
  let pool;
  try {
    const hostCandidates = [databaseServer, "localhost", "127.0.0.1"].filter((v, i, arr) => arr.indexOf(v) === i);
    let lastError = null;

    for (const host of hostCandidates) {
      try {
        pool = await sql.connect(buildConfig(host));
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!pool) {
      throw lastError || new Error("Unable to connect to SQL Server");
    }

    const info = await pool
      .request()
      .query("SELECT @@SERVERNAME AS server_name, DB_NAME() AS db_name, SUSER_SNAME() AS login_name");

    const tableCount = await pool.request().query(`
      SELECT COUNT(*) AS table_count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
    `);

    const tableList = requiredTables.map((t) => `'${t}'`).join(",");
    const existing = await pool.request().query(`
      SELECT name
      FROM sys.tables
      WHERE schema_id = SCHEMA_ID('dbo') AND name IN (${tableList})
      ORDER BY name
    `);

    console.log("DB Connection: OK");
    console.log(`Server: ${info.recordset[0].server_name}`);
    console.log(`Database: ${info.recordset[0].db_name}`);
    console.log(`Login: ${info.recordset[0].login_name}`);
    console.log(`Total dbo tables: ${tableCount.recordset[0].table_count}`);
    console.log(`Core tables found (${existing.recordset.length}/${requiredTables.length}): ${existing.recordset.map((r) => r.name).join(", ")}`);
  } catch (error) {
    console.error("DB Connection: FAILED");
    console.error(error?.message || String(error));
    process.exitCode = 1;
  } finally {
    if (pool) await pool.close();
  }
}

main();
