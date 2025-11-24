import { Client } from 'ssh2';
import net from 'net';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

let sshClient = null;
let tunnelServer = null;
const LOCAL_PORT = parseInt(process.env.LOCAL_ORACLE_PORT || '1522', 10); // 👈 1522

export async function initSSHTunnel() {
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

    sshClient = new Client();

    sshClient.on('ready', () => {
      console.log('✅ SSH Client ready');

      tunnelServer = net.createServer((localSocket) => {
        console.log('🔗 Local connection received for Oracle');

        sshClient.forwardOut(
          localSocket.localAddress || '127.0.0.1',
          localSocket.localPort || 0,
          '127.0.0.1', // remote Oracle listener host
          1521,        // remote Oracle listener port
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

export async function closeSSHTunnel() {
  return new Promise((resolve) => {
    console.log('🛑 Closing SSH tunnel...');

    if (tunnelServer) {
      tunnelServer.close((err) => {
        if (err) console.error('Error closing tunnel server:', err);
        if (sshClient) sshClient.end();
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
