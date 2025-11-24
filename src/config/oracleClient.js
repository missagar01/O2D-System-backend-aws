// src/config/oracleClient.js

import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initOracleClient() {
  try {
    // EC2 Linux ke liye yahi path use kar rahe ho
    const libDir = path.resolve('/app/oracle_client/instantclient_23_26');

    console.log('🧾 Platform:', process.platform, process.arch);
    console.log('🔍 Checking Oracle Instant Client at:', libDir);

    if (!fs.existsSync(libDir)) {
      throw new Error(`Instant Client folder not found: ${libDir}`);
    }

    const files = fs.readdirSync(libDir);
    console.log('📂 Oracle Client directory contents:', files);

    const hasNixLibs =
      files.some((f) => f.includes('libclntsh')) &&
      files.some((f) => f.includes('libnnz'));

    if (!hasNixLibs) {
      throw new Error(
        `Oracle client libraries (libclntsh / libnnz) not found in ${libDir}`
      );
    }

    // 👉 Yaha Thick mode FORCE kar rahe hain
    oracledb.initOracleClient({ libDir });
    console.log('✅ Oracle Thick Client initialized at:', libDir);
    console.log('🧩 Node-oracledb version:', oracledb.versionString);
  } catch (err) {
    console.error('❌ Failed to initialize Oracle Client (Thick mode required):', err);
    // 👉 Yaha rethrow karna IMPORTANT hai
    throw err;
  }
}
