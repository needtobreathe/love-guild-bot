const { ActivityType } = require("discord.js")
const { Client, EmbedBuilder, Colors } = require('discord.js');
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
    let activities = [ `.gg/thelove`, `${client.user.username}` ], i = 0;
    setInterval(() => client.user.setActivity({ name: `${activities[i++ % activities.length]}`, type: ActivityType.Competing }), 22000);
	console.log(`[BAĞLANTI] ${client.user.username} olarak giriş yapıldı!`);
	}
}