const { owner, prefix } = require('../../config.js');
module.exports = {
	name: 'messageReactionAdd',
	execute: async(reaction, user) => {
    if (user.bot) return;

    if (reaction.message.channel.id !== '1370402273464811652') return;

    const member = reaction.message.guild.members.cache.get(user.id);
    if (!member) return;

    if (reaction.emoji.name === '🇹🇷') {
        const role = reaction.message.guild.roles.cache.get('1371337350952783943');
        if (role) {
            member.roles.add(role);
        }
    }

    if (reaction.emoji.name === '🌍') {
        const role = reaction.message.guild.roles.cache.get('1371337380233220146');
        if (role) {
            member.roles.add(role);
        }
    }
    },
};
