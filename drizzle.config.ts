import { defineConfig } from "drizzle-kit";

const dbConfig = {
  server: process.env.DB_SERVER || process.env.DATABASE_SERVER || "localhost",
  port: Number(process.env.DB_PORT || process.env.DATABASE_PORT || 1433),
  user: process.env.DB_USER || process.env.DATABASE_USER,
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
  database: process.env.DB_NAME || process.env.DATABASE_NAME || "billing_application",
  instanceName: process.env.DATABASE_INSTANCE,
  windowsAuth: (process.env.DATABASE_WINDOWS_AUTH || "false").toLowerCase() === "true",
  encrypt: (process.env.DATABASE_ENCRYPT || "false").toLowerCase() === "true",
};

const databaseServerHost = dbConfig.server.includes("\\") ? dbConfig.server.split("\\")[0] : dbConfig.server;
const databaseServer = databaseServerHost === "." || databaseServerHost.toLowerCase() === "(local)" ? "localhost" : databaseServerHost;

export default defineConfig({
  out: "./drizzle",
  schema: "./shared/schema.ts",
  dialect: "mssql",
  dbCredentials: {
    server: databaseServer,
    database: dbConfig.database,
    user: dbConfig.user || "",
    password: dbConfig.password || "",
    options: {
      encrypt: dbConfig.encrypt,
      trustServerCertificate: true,
      ...(dbConfig.instanceName && !dbConfig.port ? { instanceName: dbConfig.instanceName } : {}),
    },
    port: dbConfig.port || 1433,
  }
});
