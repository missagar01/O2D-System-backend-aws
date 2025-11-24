// import oracledb from "oracledb";

// export function initOracleClient() {
//   try {
//     oracledb.initOracleClient({
//       libDir: "/opt/oracle/instantclient_23_3_arm64",
//     });
//     console.log("✅ Oracle client initialized");
//   } catch (err) {
//     console.error("❌ Failed to initialize Oracle client:", err);
//     process.exit(1);
//   }
// }




// import oracledb from "oracledb";

// export function initOracleClient() {
//   try {
//     // Only initialize locally (Mac)
//     if (process.platform === "darwin") {
//       oracledb.initOracleClient({ libDir: "/opt/oracle/instantclient_23_3_arm64" });
//       console.log("✅ Oracle client initialized (local Mac)");
//     } else {
//       console.log("ℹ️ Skipping Oracle client init (cloud environment)");
//     }
//   } catch (err) {
//     console.error("❌ Failed to initialize Oracle client:", err);
//     process.exit(1);
//   }
// }

// import oracledb from 'oracledb';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export function initOracleClient() {
//   try {
//     // ✅ Absolute path to the Instant Client folder in Render
//     const libDir = '/opt/render/project/src/oracle_client/instantclient_23_26';

//     if (fs.existsSync(libDir)) {
//       oracledb.initOracleClient({ libDir });
//       console.log('✅ Oracle Thick Client initialized at:', libDir);
//     } else {
//       console.log('⚠️ Instant Client not found, using Thin mode');
//     }
//   } catch (err) {
//     console.error('❌ Failed to initialize Oracle Client:', err);
//   }
// }




// import oracledb from 'oracledb';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export function initOracleClient() {
//   try {
//     // ✅ Detect the Instant Client directory dynamically
//     const libDir = path.resolve('oracle_client/instantclient_23_26');

//     if (fs.existsSync(libDir)) {
//       oracledb.initOracleClient({ libDir });
//       console.log('✅ Oracle Thick Client initialized at:', libDir);
//     } else {
//       console.log('⚠️ Instant Client not found, using Thin mode');
//     }
//   } catch (err) {
//     console.error('❌ Failed to initialize Oracle Client:', err);
//   }
// }




// src/config/oracleClient.js

import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initOracleClient() {
  try {
    // Prefer local Windows Instant Client if present, otherwise fallback to bundled path
    const windowsLibDir = path.resolve('C:/oracle/instantclient_23_9');
    const defaultLibDir = path.resolve('/app/oracle_client/instantclient_23_26');

    const libDir = fs.existsSync(windowsLibDir) ? windowsLibDir : defaultLibDir;
    console.log('🔍 Checking Oracle Instant Client at:', libDir);

    if (fs.existsSync(libDir)) {
      const files = fs.readdirSync(libDir);
      console.log('📂 Oracle Client directory contents:', files);

      const hasWinLibs = files.some(f => f.toLowerCase() === 'oci.dll');
      const hasNixLibs = files.some(f => f.includes('libclntsh')) && files.some(f => f.includes('libnnz'));

      if (hasWinLibs || hasNixLibs) {
        // Initialize Thick mode
        oracledb.initOracleClient({ libDir });
        console.log('✅ Oracle Thick Client initialized at:', libDir);
      } else {
        console.warn('⚠️ Oracle libraries not detected in folder, staying in Thin mode.');
      }
    } else {
      console.log('⚠️ Instant Client not found, using Thin mode.');
    }

    // Optional: Display client info
    console.log('🧩 Node-oracledb version:', oracledb.versionString);
  } catch (err) {
    console.error('❌ Failed to initialize Oracle Client:', err);
  }
}
