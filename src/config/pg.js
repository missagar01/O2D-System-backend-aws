import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

let pool;

function createPool() {
  if (pool) return pool;

  const useSSL = String(process.env.PG_SSL || "").toLowerCase() === "true";

  pool = new Pool({
    host: process.env.PG_HOST,
    port: Number(process.env.PG_PORT) || 5432,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: 10,
  });

  return pool;
}

export function getPgPool() {
  return createPool();
}

export async function pgQuery(text, params = []) {
  const client = await getPgPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function closePgPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
