const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

app.use(express.json());

// Rol verme
app.post('/give-role', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    await giveRoleToUser(userId);
    res.status(200).json({ message: `Role ${ROLE_ID} assigned to user ${userId}` });
  } catch (error) {
    console.error('Error in /give-role:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to give role',
      details: error.response?.data || error.message,
    });
  }
});

// Rol kaldırma
app.post('/remove-role', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    await removeRoleFromUser(userId);
    res.status(200).json({ message: `Role ${ROLE_ID} removed from user ${userId}` });
  } catch (error) {
    console.error('Error in /remove-role:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to remove role',
      details: error.response?.data || error.message,
    });
  }
});

async function sendLog(status, user) {
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

  const url = "https://discord.com/api/webhooks/1370570168945741854/LLLczhAL7lxoHpjAylRc75kk0pXEJ9E9h2yAKNa0_k2ogkGKIrWO1Q1Zq-_aWETBMAGA";
  
  let message;
  if (status === "success") {
    message = `Kullanıcı **"love"** tagını aldı ve rol verildi.`;
  } else {
    message = `Kullanıcı **"love"** tagını bıraktı ve rol kaldırıldı.`;
  }
  
  const data = {
    username: user.username,
    avatar_url: avatarUrl,
    embeds: [
      {
        title: "Rol Güncelleme",
        description: `${message}`,
        color: status === "success" ? 0x00ff00 : 0xff0000,
        thumbnail: {
          url: avatarUrl,
        },
        fields: [
          {
            name: "Kullanıcı Bilgisi",
            value: `**Kullanıcı:** ${user.username}\n**ID:** ${user.id}`,
            inline: true,
          },
        ],
        footer: {
          text: "made by blxze",
        },
      },
    ],
  };

  await axios.post(url, data);
}

async function giveRoleToUser(userId) {
  const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${ROLE_ID}`;
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.put(url, {}, { headers });
  } catch (error) {
    throw new Error('Failed to give role');
  }
}

async function removeRoleFromUser(userId) {
  const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${ROLE_ID}`;
  const headers = {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.delete(url, { headers });
    
  } catch (error) {
    throw new Error('Failed to remove role');
  }
}

// WebSocket bağlantısı
const socket = new WebSocket(GATEWAY_URL);

socket.on("open", () => {
  console.log("Soket bağlantısı yapıldı.");
});

socket.on("message", async (data) => {
  const payload = JSON.parse(data);
  const { t: eventType, op: opCode, d: eventData } = payload;

  if (opCode === 10) {
    const { heartbeat_interval } = eventData;
    heartbeat(heartbeat_interval);
    identify();
  }

  if (!eventType) return;

  if (eventType === "READY") {
    console.log(`Bot bağlantısı yapıldı.`);
  }

  let lastUserStates = {};

  if (eventType === "GUILD_MEMBER_UPDATE") {
    const user = eventData.user;
    if (!user) return;

    console.log("Etkinlik tetiklendi, kullanıcı adı:", user.username);
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
        await sendLog("success", user)
      } catch (error) {
        console.error("Rol verme hatası:", error.response?.data || error.message);
      }
    }

    if ((tag !== "love" || !identityEnabled) && roles.includes(ROLE_ID)) {
      try {
        await removeRoleFromUser(userId);
        await sendLog("error", user)
      } catch (error) {
        console.error("Rol kaldırma hatası:", error.response?.data || error.message);
      }
    }
  }
});

function heartbeat(interval) {
  setInterval(() => {
    socket.send(JSON.stringify({ op: 1, d: null }));
  }, interval);
}

// Kimlik doğrulama (identify)
function identify() {
  const payload = {
    op: 2,
    d: {
      token: TOKEN,
      intents: 32767,
      properties: {
        os: "linux",
        browser: "my_bot",
        device: "my_bot"
      }
    }
  };
  socket.send(JSON.stringify(payload));
}

app.listen(PORT, () => {
  console.log(`Port bağlantısı yapıldı: ${PORT}`);
});
