const { Client, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const welcomeChannel = member.guild.channels.cache.find(
                ch => ch.id === '1371325438894407762' && ch.isTextBased()
            );

            if (!welcomeChannel) {
                console.warn(`[WELCOME] No welcome channel found in ${member.guild.name}`);
                return;
            }

        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00FF88) // Daha canlı bir yeşil tonu (Colors.Green yerine hex kodu)
            .setTitle(`Welcome to ${member.guild.name}! 🎉`) // Başlığa emoji ekleyerek daha sıcak bir karşılama
            .setDescription(`
        Hello <@${member.id}>, we're thrilled to have you in **${member.guild.name}**! 😊

        **Get Started:**
        - Check out our rules in the <#1369816883662033037> channel.
        - Grab your server tag by going to your profile settings and selecting the **LOVE** tag.

        **Have Fun!**
        If you need help, ping our <@&1369803142501367808> or slide into their DMs! 💌
            `) 
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 })) 
            .setImage(member.guild.bannerURL({ dynamic: true, size: 512 }))
            .setFooter({ text: `${member.guild.name} loves you! 💖`, iconURL: member.guild.iconURL() }) 
            .setTimestamp();

        await welcomeChannel.send({
            content: `🎉 <@${member.id}> just joined the party!`,
            embeds: [welcomeEmbed]
        });

            try {
                const dmEmbed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle(`Welcome, ${member.user.username}!`)
                .setDescription(`
                Welcome to **${member.guild.name}**! We're thrilled to have you here! 🎉
                **How to Claim Your Server Tag**
                **Go to Profile Settings**:
                    • Click the **gear icon** in the bottom-left corner of Discord (User Settings).
                    • Navigate to the **Profiles** tab or select **Edit User Profile**.
                **Select the Server Tag**:
                    • Scroll down to the **Server Tag** section.
                    • Click **Select** and choose the **LOVE** tag from the available options.
                    • Your settings will save automatically!
                **Show Off Your Tag**:
                    • The **love** tag will appear on your profile and next to your messages.
                    • If you have tags from multiple servers, you can choose which one to display.

                **Need Help?**
                If you run into issues or have questions, feel free to reach out to our server admins or check the Discord Help Center for more details.
                `)
                .setFooter({ text: 'Have fun <3' })
                .setTimestamp();
                await member.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.warn(`[WELCOME] Failed to send DM to ${member.user.tag}: ${dmError.message}`);
            }

            const pingChannel = member.guild.channels.cache.find(
                ch => ch.id === '1369816928906121340' && ch.isTextBased()
            );
            if (pingChannel) {
                const pingMessage = await pingChannel.send({
                    content: `<@${member.id}>`,
                });

                setTimeout(() => {
                    pingMessage.delete().catch(console.error);
                }, 3000);
            }
            
            const clickChannel = member.guild.channels.cache.find(
                ch => ch.id === '1369816928906121340' && ch.isTextBased()
            );
            if (clickChannel) {
                const clickMessage = await clickChannel.send({
                    content: `<@${member.id}>`,
                });

                setTimeout(() => {
                    clickMessage.delete().catch(console.error);
                }, 3000);
            }
        } catch (error) {
            console.error(`[WELCOME] Error in guildMemberAdd: ${error.message}`);
        }
    }
};