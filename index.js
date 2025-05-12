const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const WebSocket = require('ws');
const { prefix, owner, token, token2, ROLE_ID, GUILD_ID, LOG_CHANNEL_ID } = require("./config.js");
const { readdirSync } = require("fs");
const moment = require("moment");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const c = require('ansi-colors');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.MessageContent
    ],
    shards: "auto",
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember]
});

client.commands = new Collection();
const rest = new REST({ version: '10' }).setToken(token);


let consoleLogs = [];
let lastStats = { online: 0, total: 0, roleCount: 0 };
let isFirstRender = true;


const originalConsoleLog = console.log;
console.log = (...args) => {
    const timestamp = moment().format("DD-MM-YYYY HH:mm:ss");
    const message = args.join(' ');
    consoleLogs.push({ text: `[${timestamp}] ${message}`, createdAt: Date.now() });
    if (consoleLogs.length > (process.stdout.rows - 10)) consoleLogs.shift();
    renderConsole();
};


async function getGuildStats() {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) return { online: 0, total: 0, roleCount: 0 };

        await guild.members.fetch(); 
        const online = guild.members.cache.filter(m => m.presence?.status === 'online' || m.presence?.status === 'idle' || m.presence?.status === 'dnd').size;
        const total = guild.memberCount;
        const roleCount = guild.members.cache.filter(m => m.roles.cache.has(ROLE_ID)).size;

        return { online, total, roleCount };
    } catch (error) {
        console.error("Sunucu istatistikleri alınırken hata:", error);
        return { online: 0, total: 0, roleCount: 0 };
    }
}


async function renderConsole() {
    const stats = await getGuildStats();
    
    const title = c.bold.red('▄▄▄▄· ▄▄▌  ▐▄• ▄ ·▄▄▄▄•▄▄▄ .');
    const title2 = c.bold.red('▐█ ▀█▪██•   █▌█▌▪▪▀·.█▌▀▄.▀·');
    const title3 = c.bold.red('▐█▀▀█▄██▪   ·██· ▄█▀▀▀•▐▀▀▪▄');
    const title4 = c.bold.red('██▄▪▐█▐█▌▐▌▪▐█·█▌█▌▪▄█▀▐█▄▄▌');
    const title5 = c.bold.red('·▀▀▀▀ .▀▀▀ •▀▀ ▀▀·▀▀▀ • ▀▀▀ ');
    const title6 = c.bold.red('');

    const statsLines = [
        `${c.cyan('Toplam Üye:')} ${c.green(stats.total.toString())}`,
        `${c.cyan('Klan Üyesi:')} ${c.green(stats.roleCount.toString())}`
    ];

    // Combine statsLines into a single line with | separator
    const combinedStatsLine = statsLines.join(' | ');

    const consoleWidth = process.stdout.columns || 80;
    // Strip ANSI codes for accurate length calculation
    const stripAnsi = (str) => str.replace(/\x1B\[[0-9;]*m/g, '');
    const maxLineLength = Math.max(
        stripAnsi(title).length,
        stripAnsi(title2).length,
        stripAnsi(title3).length,
        stripAnsi(title4).length,
        stripAnsi(title5).length,
        stripAnsi(title6).length,
        stripAnsi(combinedStatsLine).length
    );
    const padding = Math.floor((consoleWidth - maxLineLength) / 2);

    let output = '';

    if (
        isFirstRender ||
        stats.online !== lastStats.online ||
        stats.total !== lastStats.total ||
        stats.roleCount !== lastStats.roleCount
    ) {
        output += '\x1B[2J\x1B[H'; 
        output += ' '.repeat(padding) + title + '\n';
        output += ' '.repeat(padding) + title2 + '\n';
        output += ' '.repeat(padding) + title3 + '\n';
        output += ' '.repeat(padding) + title4 + '\n';
        output += ' '.repeat(padding) + title5 + '\n';
        output += ' '.repeat(padding) + title6 + '\n';
        output += ' '.repeat(padding) + combinedStatsLine + '\n';
        output += ' '.repeat(padding) + title6 + '\n';
        isFirstRender = false;
        lastStats = { ...stats };
    } else {
        output += `\x1B[8;1H`; 
    }

    const now = Date.now();
    consoleLogs = consoleLogs.filter(log => now - log.createdAt <= 5000);

    const maxLogLines = Math.max(0, (process.stdout.rows || 24) - 9);
    consoleLogs.forEach((log, index) => {
        if (index < maxLogLines) {
            output += `\x1B[${9 + index};1H${' '.repeat(consoleWidth)}\x1B[${9 + index};1H${log.text}\n`;
        }
    });

    for (let i = consoleLogs.length; i < maxLogLines; i++) {
        output += `\x1B[${9 + i};1H${' '.repeat(consoleWidth)}\n`;
    }

    process.stdout.write(output);
}


setInterval(renderConsole, 5000);

const commands = [];
const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./src/commands/${file}`);
    commands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
}

const gatewayURL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const ws = new WebSocket(gatewayURL);

ws.on('open', () => {
    console.log('[BAĞLANTI] Gateway bağlantısı oluşturuldu.');

const identifyPayload = {
    op: 2,
    d: {
        token: token2,
        properties: {
            "$os": "linux",
            "$browser": "my_library",
            "$device": "my_device"
        },
        intents: 32767,
        presence: {
            status: "online", 
            activities: [
                {
                    name: ".gg/thelove",
                    type: 5 // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
                }
            ],
            afk: false
        }
    }
};

    ws.send(JSON.stringify(identifyPayload));
});

ws.on('message', async (data) => {
    const payload = JSON.parse(data);
    const { t: eventType, op: opCode, d: eventData } = payload;

    if (opCode === 10) {
        const { heartbeat_interval } = eventData;
        heartbeat(heartbeat_interval);
        identify();
    }

    if (!eventType) return;

    let lastUserStates = {};

    if (eventType === "GUILD_MEMBER_UPDATE") {
        const user = eventData.user;
        if (!user) return;

        const userId = user.id;
        const tag = user.primary_guild?.tag;
        const identityEnabled = user.primary_guild?.identity_enabled;
        const roles = eventData.roles;

        const previous = lastUserStates[userId];
        const stateKey = JSON.stringify({ tag, identityEnabled, roles });

        if (previous === stateKey) return;
        lastUserStates[userId] = stateKey;

        if (tag === "love" && !roles.includes(ROLE_ID)) {
            try {
                await giveRoleToUser(userId);
                await sendLog("success", user);
            } catch (error) {
                console.error("Rol verme hatası:", error.response?.data || error.message);
            }
        }

        if ((tag !== "love" || !identityEnabled) && roles.includes(ROLE_ID)) {
            try {
                await removeRoleFromUser(userId);
                await sendLog("error", user);
            } catch (error) {
                console.error("Rol kaldırma hatası:", error.response?.data || error.message);
            }
        }
    }
});

ws.on('close', () => {
});

ws.on('error', (error) => {
});

const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.login(token);

async function giveRoleToUser(userId) {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.error("Sunucu bulunamadı.");
            return;
        }

        const member = await guild.members.fetch(userId);
        if (!member) {
            console.error("Kullanıcı bulunamadı.");
            return;
        }

        await member.roles.add(ROLE_ID);
        
    } catch (error) {
        console.error("Rol verme hatası:", error);
    }
}

async function removeRoleFromUser(userId) {
    try {
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.error("Sunucu bulunamadı.");
            return;
        }

        const member = await guild.members.fetch(userId);
        if (!member) {
            console.error("Kullanıcı bulunamadı.");
            return;
        }

        await member.roles.remove(ROLE_ID);
        
    } catch (error) {
        console.error("Rol kaldırma hatası:", error);
    }
}

async function sendLog(status, user) {
    const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    const channelId = LOG_CHANNEL_ID;
    const channel = await client.channels.fetch(channelId);

    let message;
    if (status === "success") {
        message = `Kullanıcı **"love"** tagını aldı ve rol verildi.`;
    } else {
        message = `Kullanıcı **"love"** tagını bıraktı ve rol kaldırıldı.`;
    }

    const embed = {
        title: "Rol Güncelleme",
        description: message,
        color: status === "success" ? 0x00ff00 : 0xff0000,
        thumbnail: { url: avatarUrl },
        fields: [
            {
                name: "Kullanıcı Bilgisi",
                value: `**Kullanıcı:** ${user.username}\n**ID:** ${user.id}`,
                inline: true,
            },
        ],
        footer: { text: "made by blxze" },
    };

    try {
        await channel.send({ embeds: [embed] });
    } catch (error) {
    }
}

function heartbeat(interval) {
    setInterval(() => {
        ws.send(JSON.stringify({ op: 1, d: null }));
    }, interval);
}

function identify() {
    
}