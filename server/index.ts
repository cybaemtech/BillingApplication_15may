console.log("STARTING INDEX.TS");
import express from "express";
console.log("IMPORTED EXPRESS");
import path from "path";
import { fileURLToPath } from "url";
console.log("IMPORTED MIDDLEWARES SKIPPED");
import routes from "./routes.js";
import { initializeDb } from "./db.js";
console.log("IMPORTED ROUTES");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.url}`);
  next();
});
const PORT = parseInt(process.env.PORT || "5000", 10);
const isDev = process.env.NODE_ENV !== "production";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(express.json({ limit: "10mb" }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (isDev || process.env.CORS_ORIGIN) {
    const origin = req.headers.origin;
    if (origin && origin.startsWith("http://localhost:")) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", corsOrigin);
    }
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
  }
  next();
});

app.use("/api", routes);

if (!isDev) {
  const distPath = path.join(__dirname, "..", "public");
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

async function startServer() {
  try {
    await initializeDb();
  } catch (err) {
    console.error("Database initialization failed. Server startup aborted.");
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BillFlow server running on port ${PORT}`);
    console.log("Server is fully initialized and ready for requests - VERSION 2");
  });
}

startServer();
