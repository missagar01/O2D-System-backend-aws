// ⬇️ NEW: sabse upar ye imports add/confirm karo
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import app from "./app.js";
import { initPool, closePool } from "./config/db.js";

// ⬇️ NEW: __dirname nikal ke .env ko force load karo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),  // <- yahi wali .env file use hogi
});

const port = process.env.PORT || 3006;

const server = app.listen(port, async () => {
  try {
    await initPool();
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("⚠️ SIGTERM received, closing connections...");
  await closePool();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("⚠️ SIGINT received, closing connections...");
  await closePool();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
