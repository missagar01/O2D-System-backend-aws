import oracledb from "oracledb";
import dotenv from "dotenv";
import { initOracleClient } from "./oracleClient.js";
import { initSSHTunnel, closeSSHTunnel } from "./sshTunnel.js";

// Load environment variables
dotenv.config();

let pool;
let sshTunnelActive = false;
const LOCAL_ORACLE_PORT = parseInt(process.env.LOCAL_ORACLE_PORT || '1521', 10);

// Validate all required environment variables
function validateEnv() {
  const required = [
    'ORACLE_USER',
    'ORACLE_PASSWORD', 
    'SSH_HOST',
    'SSH_USER',
    'SSH_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ All required environment variables are set');
  console.log('🔧 Config:', {
    oracleUser: process.env.ORACLE_USER,
    sshHost: process.env.SSH_HOST,
    sshUser: process.env.SSH_USER,
    sshPort: process.env.SSH_PORT || 22
  });
}

export async function initPool() {
  try {
    console.log("🔐 Initializing SSH tunnel...");
    
    // Validate environment variables first
    validateEnv();
    
    // Initialize SSH tunnel first
    await initSSHTunnel();
    sshTunnelActive = true;
    
    // Wait a moment for tunnel to be fully established
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initialize Oracle client
    initOracleClient();

    console.log("📡 Creating Oracle connection pool...");

    // Connection configuration through SSH tunnel
    const dbConfig = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: `127.0.0.1:${LOCAL_ORACLE_PORT}/ora11g`,
      poolMin: 1,
      poolMax: 4,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 30000,
      connectTimeout: 30000,
    };

    console.log('Database config:', { 
      user: dbConfig.user,
      connectString: dbConfig.connectString
    });

    pool = await oracledb.createPool(dbConfig);
    console.log("✅ Oracle connection pool started");

    // Test connection with retry logic
    console.log("🧪 Testing database connection...");
    await testConnectionWithRetry();
    console.log("✅ Database connection test successful");
    
  } catch (err) {
    console.error("❌ Pool init failed:", err.message);
    await cleanup();
    throw err;
  }
}

async function testConnectionWithRetry(maxRetries = 3, retryDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(`SELECT 1 FROM DUAL`);
      await connection.close();
      console.log(`✅ Connection test successful (attempt ${attempt})`);
      return;
    } catch (err) {
      console.log(`⚠️ Connection test attempt ${attempt} failed:`, err.message);
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('Error closing connection:', closeErr);
        }
      }
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw err;
      }
    }
  }
}

async function cleanup() {
  if (pool) {
    try {
      await pool.close(0);
      pool = null;
      console.log("✅ Pool closed during cleanup");
    } catch (closeErr) {
      console.error("Error closing pool:", closeErr);
    }
  }
  
  if (sshTunnelActive) {
    try {
      await closeSSHTunnel();
      sshTunnelActive = false;
      console.log("✅ SSH tunnel closed during cleanup");
    } catch (tunnelErr) {
      console.error("Error closing SSH tunnel:", tunnelErr);
    }
  }
}

export async function getConnection() {
  if (!pool) {
    await initPool();
  }
  return await pool.getConnection();
}

export async function closePool() {
  await cleanup();
}
