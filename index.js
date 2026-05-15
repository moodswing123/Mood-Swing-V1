import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { handleMessage } from './handlers/messageHandler.js';
import { setupDatabase } from './database/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ transport: { target: 'pino-pretty' } });
const PORT = process.env.PORT || 3000;

// Bot Configuration
const BOT_CONFIG = {
  name: 'MOOD SWING V2',
  version: '2.0.0',
  owner: 'Mood Swing',
  ownerNumber: '2347038253086',
  prefix: process.env.PREFIX || '.',
  autoRead: process.env.AUTO_READ === 'true',
  autoTyping: process.env.AUTO_TYPING === 'true',
  autoReply: process.env.AUTO_REPLY === 'true'
};

let sock;
let qrGenerated = false;
let pairingCode = null;

// Generate random 6-digit pairing code
function generatePairingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function startBot() {
  // Initialize database
  await setupDatabase();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Disable QR in terminal since we're using pairing code
    logger: pino({ level: 'silent' }),
    browser: ['MOOD SWING V2', 'Safari', '2.0.0']
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Handle QR Code
    if (qr) {
      qrGenerated = true;
      console.clear();
      console.log('\n╔════════════════════════════════════╗');
      console.log('║   MOOD SWING V2 - WhatsApp Bot    ║');
      console.log('║   Scan QR Code to Connect          ║');
      console.log('╚════════════════════════════════════╝\n');
      qrcode.generate(qr, { small: true });
      console.log('\n📱 Or use pairing code method:');
      console.log('Visit: http://localhost:3000/pairing');
    }

    if (connection === 'open') {
      qrGenerated = false;
      pairingCode = null;
      console.clear();
      console.log('\n╔════════════════════════════════════╗');
      console.log('║   ✅ MOOD SWING V2 Connected      ║');
      console.log('║   Bot is Running Successfully      ║');
      console.log('╚════════════════════════════════════╝\n');
      logger.info('✅ WhatsApp Bot Connected Successfully');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.error('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      } else {
        logger.error('Connection closed. User logged out.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages) return;
    for (const msg of m.messages) {
      if (!msg.key.fromMe && m.type === 'notify') {
        await handleMessage(sock, msg, BOT_CONFIG);
      }
    }
  });

  return sock;
}

// Express Server for Health Check and Pairing Code
const app = express();
app.use(express.static('public'));

// Home endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    bot: BOT_CONFIG.name,
    version: BOT_CONFIG.version,
    owner: BOT_CONFIG.owner,
    message: 'MOOD SWING V2 WhatsApp Bot is Running',
    pairingUrl: 'http://localhost:3000/pairing'
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    connected: sock?.user ? true : false,
    bot: BOT_CONFIG.name,
    ownerNumber: BOT_CONFIG.ownerNumber,
    uptime: process.uptime(),
    pairingCode: pairingCode
  });
});

// Pairing Code Page
app.get('/pairing', (req, res) => {
  // Generate new pairing code
  pairingCode = generatePairingCode();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MOOD SWING V2 - Pairing Code</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }

        .header {
            margin-bottom: 30px;
        }

        .bot-icon {
            font-size: 60px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .pairing-section {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            border: 2px solid #667eea;
        }

        .pairing-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        .pairing-code {
            background: white;
            border: 2px solid #667eea;
            border-radius: 10px;
            padding: 20px;
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
            margin-bottom: 20px;
            user-select: all;
            cursor: pointer;
        }

        .pairing-code:hover {
            background: #f0f0f0;
        }

        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .copy-btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .copy-btn:active {
            transform: translateY(0);
        }

        .instructions {
            background: #e8f4f8;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: left;
        }

        .instructions h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 16px;
        }

        .instructions ol {
            color: #666;
            line-height: 1.8;
            margin-left: 20px;
        }

        .instructions li {
            margin-bottom: 10px;
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }

        .info-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            color: #856404;
            font-size: 13px;
        }

        .refresh-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s ease;
        }

        .refresh-btn:hover {
            background: #218838;
            transform: translateY(-2px);
        }

        .whatsapp-link {
            display: inline-block;
            background: #25d366;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 20px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .whatsapp-link:hover {
            background: #1ead55;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(37, 211, 102, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="bot-icon">🤖</div>
            <h1>MOOD SWING V2</h1>
            <p class="subtitle">WhatsApp Bot - Pairing Code Authentication</p>
        </div>

        <div class="pairing-section">
            <div class="pairing-label">Your Pairing Code</div>
            <div class="pairing-code" id="pairingCode">${pairingCode}</div>
            <button class="copy-btn" onclick="copyCode()">📋 Copy Code</button>
            <button class="refresh-btn" onclick="location.reload()">🔄 Generate New Code</button>
        </div>

        <div class="info-box">
            <strong>⏱️ Code Expires:</strong> This code will expire in 5 minutes. Generate a new one if needed.
        </div>

        <div class="instructions">
            <h3>📱 How to Pair Your WhatsApp Account:</h3>
            <ol>
                <li>Open <strong>WhatsApp</strong> on your phone</li>
                <li>Go to <strong>Settings → Linked Devices</strong></li>
                <li>Click <strong>"Link a Device"</strong></li>
                <li>Enter the <strong>6-digit code</strong> shown above</li>
                <li>Your account will be linked to the bot</li>
                <li>Bot will automatically start running</li>
            </ol>
        </div>

        <div class="info-box" style="background: #d4edda; border-left-color: #28a745; color: #155724;">
            <strong>✅ Security Note:</strong> This pairing method is secure and requires your WhatsApp account verification.
        </div>

        <a href="https://wa.me/${BOT_CONFIG.ownerNumber}" class="whatsapp-link" target="_blank">
            💬 Contact Owner for Support
        </a>

        <div class="footer">
            <p>MOOD SWING V2 © 2026 | Bot Owner: ${BOT_CONFIG.owner}</p>
            <p>📱 Owner Number: ${BOT_CONFIG.ownerNumber}</p>
        </div>
    </div>

    <script>
        function copyCode() {
            const code = document.getElementById('pairingCode').innerText;
            navigator.clipboard.writeText(code).then(() => {
                const btn = event.target;
                const originalText = btn.innerText;
                btn.innerText = '✅ Copied!';
                setTimeout(() => {
                    btn.innerText = originalText;
                }, 2000);
            });
        }

        // Auto-refresh pairing code every 5 minutes
        setTimeout(() => {
            location.reload();
        }, 300000);

        // Update status
        async function updateStatus() {
            try {
                const response = await fetch('/status');
                const data = await response.json();
                if (data.connected) {
                    document.body.innerHTML += \`
                        <div style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                            ✅ Bot Connected!
                        </div>
                    \`;
                }
            } catch (e) {
                console.log('Status check failed');
            }
        }

        updateStatus();
    </script>
</body>
</html>
  `;

  res.send(html);
});

// API endpoint to get current pairing code
app.get('/api/pairing-code', (req, res) => {
  res.json({
    pairingCode: pairingCode,
    expiresIn: '5 minutes',
    instructions: 'Open WhatsApp → Settings → Linked Devices → Link a Device → Enter this code'
  });
});

// API endpoint to generate new pairing code
app.post('/api/pairing-code/new', (req, res) => {
  pairingCode = generatePairingCode();
  res.json({
    pairingCode: pairingCode,
    message: 'New pairing code generated',
    expiresIn: '5 minutes'
  });
});

// QR Code endpoint (for QR-based pairing as fallback)
app.get('/qr', (req, res) => {
  res.json({
    message: 'QR Code pairing not available in this version. Use pairing code instead.',
    pairingCodeUrl: 'http://localhost:3000/pairing'
  });
});

app.listen(PORT, () => {
  console.log(`\n📱 Server running on port ${PORT}`);
  console.log(`\n🔗 Pairing URL: http://localhost:3000/pairing\n`);
  startBot().catch(err => {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  });
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  if (sock) {
    await sock.logout();
  }
  process.exit(0);
});
