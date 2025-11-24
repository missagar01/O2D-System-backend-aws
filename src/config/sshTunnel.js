import { Client } from 'ssh2';
import net from 'net';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

let sshClient = null;
let tunnelServer = null;
const LOCAL_PORT = parseInt(process.env.LOCAL_ORACLE_PORT || '1521', 10);

export async function initSSHTunnel() {
  return new Promise((resolve, reject) => {
    // Get environment variables with validation
    const SSH_HOST = process.env.SSH_HOST;
    const SSH_PORT = parseInt(process.env.SSH_PORT) || 22;
    const SSH_USER = process.env.SSH_USER;
    const SSH_PASSWORD = process.env.SSH_PASSWORD;

    console.log("🔐 Creating SSH tunnel to", SSH_HOST);
    console.log("🔐 SSH User:", SSH_USER ? '***' : 'NOT SET');
    console.log("🔐 SSH Port:", SSH_PORT);

    // Validate required environment variables
    if (!SSH_HOST) {
      reject(new Error('SSH_HOST environment variable is required'));
      return;
    }
    if (!SSH_USER) {
      reject(new Error('SSH_USER environment variable is required'));
      return;
    }
    if (!SSH_PASSWORD) {
      reject(new Error('SSH_PASSWORD environment variable is required'));
      return;
    }

    sshClient = new Client();
    
    sshClient.on('ready', () => {
      console.log('✅ SSH Client ready');
      
      // Create a local TCP server that forwards to remote Oracle
      tunnelServer = net.createServer((localSocket) => {
        console.log('🔗 Local connection received for Oracle');
    sshClient.forwardOut(
  '127.0.0.1',
  LOCAL_PORT,
  '127.0.0.1', // ✅ forward to the remote Oracle listener on localhost
  1521,
  (err, remoteStream) => {
    if (err) {
      console.error('❌ SSH forward error:', err);
      localSocket.destroy();
      return;
    }

    console.log('✅ SSH forward established');
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
        resolve({ sshClient, tunnelServer });
      });

      tunnelServer.on('error', (err) => {
        console.error('❌ Tunnel server error:', err);
        reject(err);
      });
    });

    sshClient.on('error', (err) => {
      console.error('❌ SSH connection error:', err);
      reject(err);
    });

    sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      // Some servers require keyboard-interactive even when password is provided
      finish([SSH_PASSWORD]);
    });

    // SSH connection configuration
    const sshConfig = {
      host: SSH_HOST,
      port: SSH_PORT,
      username: SSH_USER,
      password: SSH_PASSWORD,
      tryKeyboard: true, // allow keyboard-interactive fallback if server requires it
      readyTimeout: 30000,
      keepaliveInterval: 10000,
      algorithms: {
        kex: [
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384', 
          'ecdh-sha2-nistp521',
          'diffie-hellman-group14-sha256'
        ]
      }
    };

    console.log(`🔐 Connecting to SSH with user: ${SSH_USER}`);
    sshClient.connect(sshConfig);
  });
}

export async function closeSSHTunnel() {
  return new Promise((resolve) => {
    console.log('🛑 Closing SSH tunnel...');
    
    if (tunnelServer) {
      tunnelServer.close((err) => {
        if (err) console.error('Error closing tunnel server:', err);
        if (sshClient) {
          sshClient.end();
        }
        sshClient = null;
        tunnelServer = null;
        console.log('✅ SSH tunnel closed');
        resolve();
      });
    } else if (sshClient) {
      sshClient.end();
      sshClient = null;
      console.log('✅ SSH tunnel closed');
      resolve();
    } else {
      console.log('✅ SSH tunnel already closed');
      resolve();
    }
  });
}
