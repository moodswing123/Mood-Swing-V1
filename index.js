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

async function startBot() {
  // Initialize database
  await setupDatabase();

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['MOOD SWING V2', 'Safari', '2.0.0']
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrGenerated = true;
      console.clear();
      console.log('\n╔════════════════════════════════════╗');
      console.log('║   MOOD SWING V2 - WhatsApp Bot    ║');
      console.log('║   Scan QR Code to Connect          ║');
      console.log('╚════════════════════════════════════╝\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      qrGenerated = false;
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

// Express Server for Health Check
const app = express();

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    bot: BOT_CONFIG.name,
    version: BOT_CONFIG.version,
    owner: BOT_CONFIG.owner,
    message: 'MOOD SWING V2 WhatsApp Bot is Running'
  });
});

app.get('/status', (req, res) => {
  res.json({
    connected: sock?.user ? true : false,
    bot: BOT_CONFIG.name,
    ownerNumber: BOT_CONFIG.ownerNumber,
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`\n📱 Server running on port ${PORT}`);
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
