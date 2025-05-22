const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');
const { embedColor } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('The page of the queue to view')
                .setRequired(false)),
    
    // For slash commands
    async execute(interaction, client) {
        const player = getMusicPlayer(client, interaction.guild);
        const queueData = player.getQueue();
        
        // Check if the queue is empty
        if (!queueData.current && queueData.upcoming.length === 0) {
            return interaction.reply('The queue is empty. Add some songs with the `/play` command!');
        }
        
        // Set up pagination
        const itemsPerPage = 10;
        const page = interaction.options.getInteger('page') || 1;
        const totalPages = Math.ceil((queueData.upcoming.length + (queueData.current ? 1 : 0)) / itemsPerPage);
        
        if (page < 1 || page > totalPages) {
            return interaction.reply(`Invalid page number. Please enter a page number between 1 and ${totalPages}.`);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Queue')
            .setColor(embedColor);
        
        let description = '';
        
        // Add the current song
        if (queueData.current) {
            description += `**Now Playing:**\n`;
            description += `[${queueData.current.title}](${queueData.current.url}) - Requested by <@${queueData.current.requestedBy.id}>\n\n`;
        }
        
        // Add the upcoming songs
        if (queueData.upcoming.length > 0) {
            description += `**Upcoming Songs:**\n`;
            
            const startIdx = (page - 1) * itemsPerPage - (queueData.current ? 0 : 1);
            const endIdx = startIdx + itemsPerPage - (queueData.current && page === 1 ? 1 : 0);
            
            const displayedSongs = queueData.upcoming.slice(Math.max(0, startIdx), Math.min(queueData.upcoming.length, endIdx));
            
            displayedSongs.forEach((song, index) => {
                const position = startIdx + index + 1;
                description += `${position}. [${song.title}](${song.url}) - Requested by <@${song.requestedBy.id}>\n`;
            });
            
            // Add pagination info
            description += `\nPage ${page}/${totalPages} | ${queueData.upcoming.length} song(s) in queue`;
            
            // Add loop info
            if (queueData.loopEnabled) {
                description += ' | 🔄 Loop enabled';
            }
        } else if (queueData.current) {
            description += `**No songs in queue**\n`;
            
            // Add loop info
            if (queueData.loopEnabled) {
                description += '\n🔄 Loop enabled';
            }
        }
        
        embed.setDescription(description);
        
        return interaction.reply({ embeds: [embed] });
    },
    
    // For prefix commands
    async executeMessage(context) {
        const player = getMusicPlayer(context.client, context.guild);
        const queueData = player.getQueue();
        
        // Check if the queue is empty
        if (!queueData.current && queueData.upcoming.length === 0) {
            return context.reply('The queue is empty. Add some songs with the `+play` command!');
        }
        
        // Set up pagination
        const itemsPerPage = 10;
        const page = context.args.length > 0 && !isNaN(context.args[0]) ? parseInt(context.args[0]) : 1;
        const totalPages = Math.ceil((queueData.upcoming.length + (queueData.current ? 1 : 0)) / itemsPerPage);
        
        if (page < 1 || page > totalPages) {
            return context.reply(`Invalid page number. Please enter a page number between 1 and ${totalPages}.`);
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Queue')
            .setColor(embedColor);
        
        let description = '';
        
        // Add the current song
        if (queueData.current) {
            description += `**Now Playing:**\n`;
            description += `[${queueData.current.title}](${queueData.current.url}) - Requested by <@${queueData.current.requestedBy.id}>\n\n`;
        }
        
        // Add the upcoming songs
        if (queueData.upcoming.length > 0) {
            description += `**Upcoming Songs:**\n`;
            
            const startIdx = (page - 1) * itemsPerPage - (queueData.current ? 0 : 1);
            const endIdx = startIdx + itemsPerPage - (queueData.current && page === 1 ? 1 : 0);
            
            const displayedSongs = queueData.upcoming.slice(Math.max(0, startIdx), Math.min(queueData.upcoming.length, endIdx));
            
            displayedSongs.forEach((song, index) => {
                const position = startIdx + index + 1;
                description += `${position}. [${song.title}](${song.url}) - Requested by <@${song.requestedBy.id}>\n`;
            });
            
            // Add pagination info
            description += `\nPage ${page}/${totalPages} | ${queueData.upcoming.length} song(s) in queue`;
            
            // Add loop info
            if (queueData.loopEnabled) {
                description += ' | 🔄 Loop enabled';
            }
        } else if (queueData.current) {
            description += `**No songs in queue**\n`;
            
            // Add loop info
            if (queueData.loopEnabled) {
                description += '\n🔄 Loop enabled';
            }
        }
        
        embed.setDescription(description);
        
        return context.reply({ embeds: [embed] });
    },
    
    // Command aliases for prefix commands
    aliases: ['q', 'list']
};
