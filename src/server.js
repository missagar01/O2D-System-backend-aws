import app from "./app.js";
import { initPool, closePool } from "./config/db.js";

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
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM received, closing connections...');
  await closePool();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('⚠️ SIGINT received, closing connections...');
  await closePool();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});