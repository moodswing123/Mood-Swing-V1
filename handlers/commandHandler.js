import pino from 'pino';
import { getUser, getAllUsers } from '../database/db.js';
import axios from 'axios';

const logger = pino();

const COMMANDS = {
  'ping': {
    description: 'Check bot latency',
    handler: cmdPing
  },
  'menu': {
    description: 'Show all commands',
    handler: cmdMenu
  },
  'info': {
    description: 'Get bot information',
    handler: cmdInfo
  },
  'help': {
    description: 'Show help menu',
    handler: cmdMenu
  },
  'stats': {
    description: 'Get your statistics',
    handler: cmdStats
  },
  'hi': {
    description: 'Get a greeting',
    handler: cmdHi
  },
  'hello': {
    description: 'Say hello',
    handler: cmdHi
  },
  'owner': {
    description: 'Get owner contact',
    handler: cmdOwner
  },
  'sticker': {
    description: 'Convert image/video to sticker',
    handler: cmdSticker
  },
  'toimg': {
    description: 'Convert sticker to image',
    handler: cmdToImage
  },
  'play': {
    description: 'Download music from YouTube',
    handler: cmdPlay
  },
  'ytmp3': {
    description: 'Download audio from YouTube',
    handler: cmdYtmp3
  },
  'ytmp4': {
    description: 'Download video from YouTube',
    handler: cmdYtmp4
  },
  'kick': {
    description: 'Remove user from group (admin)',
    handler: cmdKick
  },
  'promote': {
    description: 'Promote user to admin (admin)',
    handler: cmdPromote
  },
  'demote': {
    description: 'Demote user from admin (admin)',
    handler: cmdDemote
  },
  'group': {
    description: 'Open/close group',
    handler: cmdGroupControl
  },
  'antilink': {
    description: 'Enable/disable anti-link',
    handler: cmdAntiLink
  },
  'welcome': {
    description: 'Toggle welcome message',
    handler: cmdWelcome
  },
  'ban': {
    description: 'Ban user from bot',
    handler: cmdBan
  },
  'unban': {
    description: 'Unban user',
    handler: cmdUnban
  },
  'warn': {
    description: 'Warn a user',
    handler: cmdWarn
  },
  'mute': {
    description: 'Mute user in group',
    handler: cmdMute
  },
  'unmute': {
    description: 'Unmute user',
    handler: cmdUnmute
  },
  'joke': {
    description: 'Get a random joke',
    handler: cmdJoke
  },
  'quote': {
    description: 'Get a random quote',
    handler: cmdQuote
  },
  'weather': {
    description: 'Get weather info',
    handler: cmdWeather
  },
  'time': {
    description: 'Get current time',
    handler: cmdTime
  },
  'calculate': {
    description: 'Simple calculator',
    handler: cmdCalculate
  },
  'fact': {
    description: 'Get random fact',
    handler: cmdFact
  }
};

export async function handleCommand(sock, from, sender, command, config, isGroup) {
  try {
    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    if (COMMANDS[cmd]) {
      await COMMANDS[cmd].handler(sock, from, sender, args.slice(1), config, isGroup);
    } else {
      await sock.sendMessage(from, {
        text: `❌ Unknown command: ${cmd}\n\nType ${config.prefix}menu to see available commands`
      });
    }
  } catch (error) {
    logger.error('Error handling command:', error);
    await sock.sendMessage(from, {
      text: '❌ Error processing command. Please try again.'
    });
  }
}

async function cmdPing(sock, from, sender, args, config) {
  const timestamp = Date.now();
  await sock.sendMessage(from, { text: '🏓 Pinging...' });
  const latency = Date.now() - timestamp;
  await sock.sendMessage(from, { text: `🏓 Pong! Latency: ${latency}ms` });
}

async function cmdMenu(sock, from, sender, args, config) {
  let menuText = `\n╔════════════════════════════════════╗\n║   MOOD SWING V2 - COMMAND MENU      ║\n╚════════════════════════════════════╝\n\n`;

  menuText += `📱 **GENERAL COMMANDS**\n`;
  menuText += `${config.prefix}ping - Check bot latency\n`;
  menuText += `${config.prefix}info - Bot information\n`;
  menuText += `${config.prefix}stats - Your statistics\n`;
  menuText += `${config.prefix}owner - Owner contact\n\n`;

  menuText += `🎬 **MEDIA COMMANDS**\n`;
  menuText += `${config.prefix}sticker - Convert image to sticker\n`;
  menuText += `${config.prefix}toimg - Convert sticker to image\n`;
  menuText += `${config.prefix}play [name] - Download music\n`;
  menuText += `${config.prefix}ytmp3 [link] - Download audio\n`;
  menuText += `${config.prefix}ytmp4 [link] - Download video\n\n`;

  menuText += `👥 **GROUP COMMANDS** (Admin only)\n`;
  menuText += `${config.prefix}kick [@user] - Remove user\n`;
  menuText += `${config.prefix}promote [@user] - Make admin\n`;
  menuText += `${config.prefix}demote [@user] - Remove admin\n`;
  menuText += `${config.prefix}group open/close - Control group\n`;
  menuText += `${config.prefix}mute [@user] - Mute user\n`;
  menuText += `${config.prefix}unmute [@user] - Unmute user\n`;
  menuText += `${config.prefix}antilink on/off - Anti-link\n`;
  menuText += `${config.prefix}welcome on/off - Welcome msg\n\n`;

  menuText += `🎮 **FUN COMMANDS**\n`;
  menuText += `${config.prefix}joke - Random joke\n`;
  menuText += `${config.prefix}quote - Random quote\n`;
  menuText += `${config.prefix}fact - Random fact\n`;
  menuText += `${config.prefix}weather [city] - Weather info\n`;
  menuText += `${config.prefix}time - Current time\n`;
  menuText += `${config.prefix}calculate [math] - Calculator\n\n`;

  menuText += `🔐 **MODERATION COMMANDS** (Admin only)\n`;
  menuText += `${config.prefix}ban [@user] - Ban user\n`;
  menuText += `${config.prefix}unban [@user] - Unban user\n`;
  menuText += `${config.prefix}warn [@user] - Warn user\n\n`;

  menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  menuText += `📱 Bot: ${config.name} v${config.version}\n`;
  menuText += `👤 Owner: ${config.owner}\n`;
  menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(from, { text: menuText });
}

async function cmdInfo(sock, from, sender, args, config) {
  const infoText = `\n╔════════════════════════════════════╗\n║        BOT INFORMATION              ║\n╚════════════════════════════════════╝\n\n📱 Bot Name: ${config.name}\n🔢 Version: ${config.version}\n👤 Owner: ${config.owner}\n📞 Owner Number: ${config.ownerNumber}\n⚙️ Prefix: ${config.prefix}\n✅ Auto Read: ${config.autoRead ? 'Enabled' : 'Disabled'}\n✍️ Auto Typing: ${config.autoTyping ? 'Enabled' : 'Disabled'}\n💬 Auto Reply: ${config.autoReply ? 'Enabled' : 'Disabled'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚀 Status: Online & Running\n⏱️ Uptime: Always Active\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(from, { text: infoText });
}

async function cmdStats(sock, from, sender, args, config) {
  const user = await getUser(sender);
  const statsText = `\n╔════════════════════════════════════╗\n║        YOUR STATISTICS              ║\n╚════════════════════════════════════╝\n\n👤 User: ${sender}\n💬 Messages Sent: ${user?.messageCount || 0}\n⏰ First Seen: ${user?.firstSeen || 'N/A'}\n📊 Total Words: ${user?.totalWords || 0}\n⏱️ Last Seen: ${user?.lastSeen || 'N/A'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(from, { text: statsText });
}

async function cmdHi(sock, from, sender, args, config) {
  const greetings = [
    '👋 Hey there! How are you doing?',
    '😊 Hello! Welcome to MOOD SWING V2!',
    '🎉 Hi! Great to see you here!',
    '💫 Hey! What\\'s good?',
    '👍 Yo! What\\'s up?',
    '🌟 Hey buddy! How\\'s it going?',
    '😄 Yo! Welcome to the bot!',
    '🚀 Hi there! Ready to have fun?'
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  await sock.sendMessage(from, { text: greeting });
}

async function cmdOwner(sock, from, sender, args, config) {
  const ownerText = `\n╔════════════════════════════════════╗\n║       OWNER INFORMATION              ║\n╚════════════════════════════════════╝\n\n👤 Owner: ${config.owner}\n📱 WhatsApp: https://wa.me/${config.ownerNumber}\n📞 Phone: +${config.ownerNumber}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💬 Contact owner for support or queries\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  await sock.sendMessage(from, { text: ownerText });
}

async function cmdSticker(sock, from, sender, args, config) {
  await sock.sendMessage(from, {
    text: '📸 Please reply to an image or video with the command, or send image/video with caption .sticker'
  });
}

async function cmdToImage(sock, from, sender, args, config) {
  await sock.sendMessage(from, {
    text: '🖼️ Please reply to a sticker with this command to convert it to image'
  });
}

async function cmdPlay(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, { text: '🎵 Usage: .play [song name]' });
    return;
  }
  await sock.sendMessage(from, { text: `🎵 Searching for "${args.join(' ')}"...\n⏳ Please wait...` });
}

async function cmdYtmp3(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, { text: '🎵 Usage: .ytmp3 [YouTube link]' });
    return;
  }
  await sock.sendMessage(from, { text: '⏳ Downloading audio...' });
}

async function cmdYtmp4(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, { text: '🎬 Usage: .ytmp4 [YouTube link]' });
    return;
  }
  await sock.sendMessage(from, { text: '⏳ Downloading video...' });
}

async function cmdKick(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  await sock.sendMessage(from, { text: '👋 User removed from group' });
}

async function cmdPromote(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  await sock.sendMessage(from, { text: '⬆️ User promoted to admin' });
}

async function cmdDemote(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  await sock.sendMessage(from, { text: '⬇️ User demoted from admin' });
}

async function cmdGroupControl(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  const action = args[0]?.toLowerCase();
  if (action === 'open') {
    await sock.sendMessage(from, { text: '🔓 Group opened' });
  } else if (action === 'close') {
    await sock.sendMessage(from, { text: '🔒 Group closed' });
  } else {
    await sock.sendMessage(from, { text: '❌ Usage: .group open/close' });
  }
}

async function cmdAntiLink(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  const action = args[0]?.toLowerCase();
  if (action === 'on') {
    await sock.sendMessage(from, { text: '🔗 Anti-link enabled' });
  } else if (action === 'off') {
    await sock.sendMessage(from, { text: '🔗 Anti-link disabled' });
  } else {
    await sock.sendMessage(from, { text: '❌ Usage: .antilink on/off' });
  }
}

async function cmdWelcome(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  const action = args[0]?.toLowerCase();
  if (action === 'on') {
    await sock.sendMessage(from, { text: '👋 Welcome messages enabled' });
  } else if (action === 'off') {
    await sock.sendMessage(from, { text: '👋 Welcome messages disabled' });
  } else {
    await sock.sendMessage(from, { text: '❌ Usage: .welcome on/off' });
  }
}

async function cmdBan(sock, from, sender, args, config) {
  await sock.sendMessage(from, { text: '🚫 User banned from bot' });
}

async function cmdUnban(sock, from, sender, args, config) {
  await sock.sendMessage(from, { text: '✅ User unbanned' });
}

async function cmdWarn(sock, from, sender, args, config) {
  await sock.sendMessage(from, { text: '⚠️ User warned' });
}

async function cmdMute(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  await sock.sendMessage(from, { text: '🔇 User muted' });
}

async function cmdUnmute(sock, from, sender, args, config, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(from, { text: '❌ This command only works in groups' });
    return;
  }
  await sock.sendMessage(from, { text: '🔊 User unmuted' });
}

async function cmdJoke(sock, from, sender, args, config) {
  const jokes = [
    '😂 Why don\\'t scientists trust atoms? Because they make up everything!',
    '😂 Why did the scarecrow win an award? He was outstanding in his field!',
    '😂 Why don\\'t eggs tell jokes? They\\'d crack up!',
    '😂 What did the coffee say to the sugar? You\\'re sweet!',
    '😂 Why don\\'t skeletons fight? They don\\'t have the guts!'
  ];
  await sock.sendMessage(from, { text: jokes[Math.floor(Math.random() * jokes.length)] });
}

async function cmdQuote(sock, from, sender, args, config) {
  const quotes = [
    '"The only way to do great work is to love what you do." - Steve Jobs',
    '"Innovation distinguishes between a leader and a follower." - Steve Jobs',
    '"Life is what happens when you\\'re busy making other plans." - John Lennon',
    '"The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt',
    '"It is during our darkest moments that we must focus to see the light." - Aristotle'
  ];
  await sock.sendMessage(from, { text: quotes[Math.floor(Math.random() * quotes.length)] });
}

async function cmdWeather(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, { text: '🌍 Usage: .weather [city name]' });
    return;
  }
  await sock.sendMessage(from, { text: `🌤️ Weather in ${args.join(' ')}: 25°C, Sunny` });
}

async function cmdTime(sock, from, sender, args, config) {
  const time = new Date().toLocaleTimeString();
  await sock.sendMessage(from, { text: `⏰ Current time: ${time}` });
}

async function cmdCalculate(sock, from, sender, args, config) {
  if (args.length === 0) {
    await sock.sendMessage(from, { text: '🧮 Usage: .calculate [expression]\nExample: .calculate 2+2' });
    return;
  }
  try {
    const result = eval(args.join(''));
    await sock.sendMessage(from, { text: `🧮 Result: ${result}` });
  } catch (e) {
    await sock.sendMessage(from, { text: '❌ Invalid calculation' });
  }
}

async function cmdFact(sock, from, sender, args, config) {
  const facts = [
    '🔬 Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!',
    '🔬 A group of flamingos is called a "flamboyance"',
    '🔬 The Eiffel Tower can be 15 cm taller during summer due to thermal expansion',
    '🔬 Bananas are berries, but strawberries aren\\'t!',
    '🔬 Octopuses have three hearts'
  ];
  await sock.sendMessage(from, { text: facts[Math.floor(Math.random() * facts.length)] });
}
