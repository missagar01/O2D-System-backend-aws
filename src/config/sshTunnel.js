import { Client } from 'ssh2';
import net from 'net';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

let sshClient = null;
let tunnelServer = null;
let reconnectTimer = null;
let reconnectDelayMs = 5000; // start with 5s backoff
const LOCAL_PORT = parseInt(process.env.LOCAL_ORACLE_PORT || '1522', 10); // 👈 1522
const REMOTE_ORACLE_HOST = process.env.ORACLE_HOST || '127.0.0.1';
const REMOTE_ORACLE_PORT = parseInt(process.env.ORACLE_PORT || '1521', 10);
const MAX_INITIAL_RETRIES = parseInt(process.env.SSH_MAX_INITIAL_RETRIES || '3', 10);
const MAX_BACKOFF_MS = 30000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetBackoff() {
  reconnectDelayMs = 5000;
}

function cleanupTunnelServer() {
  if (tunnelServer) {
    try {
      tunnelServer.close();
    } catch (err) {
      console.error('❌ Error closing tunnel server:', err);
    }
    tunnelServer = null;
  }
}

function cleanupClient() {
  if (sshClient) {
    try {
      sshClient.end();
    } catch (err) {
      console.error('❌ Error ending SSH client:', err);
    }
    sshClient = null;
  }
}

async function scheduleReconnect() {
  if (reconnectTimer) return;

  const delayMs = Math.min(reconnectDelayMs, MAX_BACKOFF_MS);
  console.warn(`🔄 Scheduling SSH reconnect in ${delayMs / 1000}s...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_BACKOFF_MS);
    try {
      await establishTunnel(); // background reconnect; errors will be logged
    } catch (err) {
      console.error('❌ Reconnect attempt failed:', err.message);
      scheduleReconnect();
    }
  }, delayMs);
}

async function establishTunnel() {
  return new Promise((resolve, reject) => {
    const SSH_HOST = process.env.SSH_HOST;
    const SSH_PORT = parseInt(process.env.SSH_PORT || '22', 10);
    const SSH_USER = process.env.SSH_USER;
    const SSH_PASSWORD = process.env.SSH_PASSWORD;

    console.log("🔐 Creating SSH tunnel to", SSH_HOST);
    console.log("🔐 SSH User:", SSH_USER ? '***' : 'NOT SET');
    console.log("🔐 SSH Port:", SSH_PORT);

    if (!SSH_HOST) return reject(new Error('SSH_HOST environment variable is required'));
    if (!SSH_USER) return reject(new Error('SSH_USER environment variable is required'));
    if (!SSH_PASSWORD) return reject(new Error('SSH_PASSWORD environment variable is required'));

    cleanupTunnelServer();
    cleanupClient();

    sshClient = new Client();

    let resolved = false;

    sshClient.on('ready', () => {
      console.log('✅ SSH Client ready');

      tunnelServer = net.createServer((localSocket) => {
        console.log('🔗 Local connection received for Oracle');

        sshClient.forwardOut(
          localSocket.localAddress || '127.0.0.1',
          localSocket.localPort || 0,
          REMOTE_ORACLE_HOST, // remote Oracle listener host
          REMOTE_ORACLE_PORT, // remote Oracle listener port
          (err, remoteStream) => {
            if (err) {
              console.error('❌ SSH forward error:', err);
              localSocket.destroy();
              return;
            }

            console.log('✅ SSH forward established');
            localSocket.on('error', (socketErr) => {
              console.error('⚠️ Local socket error:', socketErr.message);
            });
            remoteStream.on('error', (remoteErr) => {
              console.error('⚠️ Remote stream error:', remoteErr.message);
            });
            localSocket.pipe(remoteStream).pipe(localSocket);
          }
        );
      });

      tunnelServer.listen(LOCAL_PORT, '127.0.0.1', (err) => {
        if (err) {
          console.error('❌ Tunnel server error:', err);
          reject(err);
          return;
        }

        console.log(`✅ SSH tunnel established on 127.0.0.1:${LOCAL_PORT}`);
        resetBackoff();
        resolved = true;
        resolve({ sshClient, tunnelServer });
      });

      tunnelServer.on('error', (err) => {
        console.error('❌ Tunnel server error:', err);
        reject(err);
      });
    });

    const handleDisconnect = (label) => (err) => {
      console.error(`❌ SSH ${label}:`, err);
      cleanupTunnelServer();
      if (!resolved) {
        reject(err);
        return;
      }
      scheduleReconnect();
    };

    sshClient.on('error', handleDisconnect('connection error'));
    sshClient.on('end', handleDisconnect('connection ended'));
    sshClient.on('close', handleDisconnect('connection closed'));

    sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      console.log('⌨️ keyboard-interactive auth requested. Prompts:', prompts.map(p => p.prompt));
      if (SSH_PASSWORD) {
        finish(prompts.map(() => SSH_PASSWORD));
      } else {
        finish([]);
      }
    });

    const sshConfig = {
      host: SSH_HOST,
      port: SSH_PORT,
      username: SSH_USER,
      password: SSH_PASSWORD,
      tryKeyboard: true,
      readyTimeout: 30000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 5,
      algorithms: {
        kex: [
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384',
          'ecdh-sha2-nistp521',
          'diffie-hellman-group14-sha256',
        ],
      },
    };

    console.log(`🔐 Connecting to SSH with user: ${SSH_USER}`);
    sshClient.connect(sshConfig);
  });
}

export async function initSSHTunnel() {
  let attempt = 1;
  while (attempt <= MAX_INITIAL_RETRIES) {
    try {
      const result = await establishTunnel();
      return result;
    } catch (err) {
      console.error(`⚠️ SSH tunnel attempt ${attempt} failed:`, err.message);
      if (attempt >= MAX_INITIAL_RETRIES) {
        throw err;
      }
      const waitMs = Math.min(2000 * attempt, MAX_BACKOFF_MS);
      console.log(`🔄 Retrying SSH tunnel in ${waitMs / 1000}s...`);
      await delay(waitMs);
      attempt += 1;
    }
  }
}

export async function closeSSHTunnel() {
  return new Promise((resolve) => {
    console.log('🛑 Closing SSH tunnel...');

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    resetBackoff();

    if (tunnelServer) {
      tunnelServer.close((err) => {
        if (err) console.error('Error closing tunnel server:', err);
        cleanupClient();
        tunnelServer = null;
        console.log('✅ SSH tunnel closed');
        resolve();
      });
    } else if (sshClient) {
      cleanupClient();
      console.log('✅ SSH tunnel closed');
      resolve();
    } else {
      console.log('✅ SSH tunnel already closed');
      resolve();
    }
  });
}
