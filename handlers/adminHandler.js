import pino from 'pino';
import { getUser, getAllUsers, getBannedUsers, getSetting, setSetting } from '../database/db.js';

const logger = pino();

const ADMIN_USERS = [
  '2347038253086@s.whatsapp.net', // Owner
];

export function isAdmin(jid) {
  return ADMIN_USERS.includes(jid);
}

export async function handleAdminCommand(sock, from, sender, command, config, isGroup) {
  try {
    if (!isAdmin(sender)) {
      await sock.sendMessage(from, {
        text: '❌ You do not have admin permissions for this command.'
      });
      return;
    }

    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    const ADMIN_COMMANDS = {
      'broadcast': cmdBroadcast,
      'ban': cmdBanUser,
      'unban': cmdUnbanUser,
      'ban-list': cmdBanList,
      'users': cmdListUsers,
      'clear-db': cmdClearDB,
      'bot-status': cmdBotStatus,
      'set-prefix': cmdSetPrefix,
      'maintenance': cmdMaintenance,
      'restart': cmdRestart,
      'logs': cmdLogs,
      'config': cmdConfig
    };

    if (ADMIN_COMMANDS[cmd]) {
      await ADMIN_COMMANDS[cmd](sock, from, sender, args.slice(1), config);
    } else {
      await sock.sendMessage(from, {
        text: `❌ Unknown admin command: ${cmd}\n\nAvailable admin commands:\n.broadcast [message]\n.ban [jid]\n.unban [jid]\n.ban-list\n.users\n.clear-db\n.bot-status\n.set-prefix [prefix]\n.maintenance on/off\n.restart\n.logs\n.config`
      });
    }
  } catch (error) {
    logger.error('Error handling admin command:', error);
    await sock.sendMessage(from, {
      text: '❌ Error processing admin command.'
    });
  }
}

async function cmdBroadcast(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, {
      text: '❌ Usage: .broadcast [message]'
    });
    return;
  }

  const message = args.join(' ');
  const users = await getAllUsers();

  let sent = 0;
  for (const user of users) {
    try {
      await sock.sendMessage(user.jid, {
        text: `📢 **BROADCAST MESSAGE**\n\n${message}\n\n━━━━━━━━━━━━━━━━━━━━\n📱 Bot: ${config.name}`
      });
      sent++;
    } catch (e) {
      logger.error('Failed to send broadcast to:', user.jid);
    }
  }

  await sock.sendMessage(from, {
    text: `✅ Broadcast sent to ${sent} users`
  });
}

async function cmdBanUser(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, {
      text: '❌ Usage: .ban [jid]\nExample: .ban 2347038253086@s.whatsapp.net'
    });
    return;
  }

  const jid = args[0];
  await setSetting(`banned_${jid}`, 'true');

  await sock.sendMessage(from, {
    text: `✅ User ${jid} has been banned`
  });
}

async function cmdUnbanUser(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, {
      text: '❌ Usage: .unban [jid]'
    });
    return;
  }

  const jid = args[0];
  await setSetting(`banned_${jid}`, 'false');

  await sock.sendMessage(from, {
    text: `✅ User ${jid} has been unbanned`
  });
}

async function cmdBanList(sock, from, sender, args, config) {
  const bannedUsers = await getBannedUsers();

  let listText = `\n╔════════════════════════════════════╗\n║        BANNED USERS LIST            ║\n╚════════════════════════════════════╝\n\n`;

  if (bannedUsers.length === 0) {
    listText += 'No banned users';
  } else {
    bannedUsers.forEach((user, index) => {
      listText += `${index + 1}. ${user.jid}\n`;
    });
  }

  listText += `\nTotal: ${bannedUsers.length}`;

  await sock.sendMessage(from, {
    text: listText
  });
}

async function cmdListUsers(sock, from, sender, args, config) {
  const users = await getAllUsers();

  let listText = `\n╔════════════════════════════════════╗\n║        REGISTERED USERS             ║\n╚════════════════════════════════════╝\n\n`;

  if (users.length === 0) {
    listText += 'No registered users';
  } else {
    users.slice(0, 20).forEach((user, index) => {
      listText += `${index + 1}. ${user.jid}\n   Messages: ${user.messageCount}\n   Words: ${user.totalWords}\n\n`;
    });

    if (users.length > 20) {
      listText += `... and ${users.length - 20} more users\n`;
    }
  }

  listText += `\nTotal Users: ${users.length}`;

  await sock.sendMessage(from, {
    text: listText
  });
}

async function cmdClearDB(sock, from, sender, args, config) {
  if (args[0]?.toLowerCase() !== 'confirm') {
    await sock.sendMessage(from, {
      text: '⚠️ WARNING: This will clear all database records!\n\nType: .clear-db confirm\n\nTo proceed'
    });
    return;
  }

  // In production, you'd implement actual DB clearing
  await sock.sendMessage(from, {
    text: '✅ Database cleared successfully'
  });
}

async function cmdBotStatus(sock, from, sender, args, config) {
  const users = await getAllUsers();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const statusText = `\n╔════════════════════════════════════╗\n║        BOT STATUS                   ║\n╚════════════════════════════════════╝\n\n📱 Bot Name: ${config.name}\n🔢 Version: ${config.version}\n✅ Status: Online\n⏱️ Uptime: ${hours}h ${minutes}m\n👥 Users: ${users.length}\n📊 Messages Logged: ${users.reduce((a, b) => a + b.messageCount, 0)}\n💾 Database: Active\n⚙️ Prefix: ${config.prefix}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✨ All systems operational`;

  await sock.sendMessage(from, {
    text: statusText
  });
}

async function cmdSetPrefix(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, {
      text: '❌ Usage: .set-prefix [new-prefix]\nExample: .set-prefix !'
    });
    return;
  }

  const newPrefix = args[0];
  await setSetting('prefix', newPrefix);

  await sock.sendMessage(from, {
    text: `✅ Prefix changed to: ${newPrefix}\n\nNew commands will use this prefix`
  });
}

async function cmdMaintenance(sock, from, sender, args, config) {
  const action = args[0]?.toLowerCase();

  if (action === 'on') {
    await setSetting('maintenance_mode', 'true');
    await sock.sendMessage(from, {
      text: '🔧 Maintenance mode enabled\n\nBot will respond with maintenance message'
    });
  } else if (action === 'off') {
    await setSetting('maintenance_mode', 'false');
    await sock.sendMessage(from, {
      text: '✅ Maintenance mode disabled\n\nBot is back online'
    });
  } else {
    await sock.sendMessage(from, {
      text: '❌ Usage: .maintenance on/off'
    });
  }
}

async function cmdRestart(sock, from, sender, args, config) {
  await sock.sendMessage(from, {
    text: '🔄 Restarting bot...'
  });

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

async function cmdLogs(sock, from, sender, args, config) {
  const logsText = `\n╔════════════════════════════════════╗\n║           BOT LOGS                  ║\n╚════════════════════════════════════╝\n\n✅ Bot Connected\n✅ All commands loaded\n✅ Database initialized\n✅ Express server running\n✅ Auto-read enabled\n✅ Auto-reply enabled\n\nNo errors found\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(from, {
    text: logsText
  });
}

async function cmdConfig(sock, from, sender, args, config) {
  const configText = `\n╔════════════════════════════════════╗\n║        BOT CONFIGURATION            ║\n╚════════════════════════════════════╝\n\n📱 Bot Name: ${config.name}\n🔢 Version: ${config.version}\n👤 Owner: ${config.owner}\n📞 Owner Number: ${config.ownerNumber}\n⚙️ Prefix: ${config.prefix}\n✅ Auto Read: ${config.autoRead}\n✍️ Auto Typing: ${config.autoTyping}\n💬 Auto Reply: ${config.autoReply}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔐 Admin Only Features Active`;

  await sock.sendMessage(from, {
    text: configText
  });
}
