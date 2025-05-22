const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');
const { embedColor } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the currently playing song'),
    
    // For slash commands
    async execute(interaction, client) {
        const player = getMusicPlayer(client, interaction.guild);
        
        // Check if the player is connected and playing something
        if (!player.isConnected() || !player.currentTrack) {
            return interaction.reply('I\'m not playing anything right now.');
        }
        
        const currentTrack = player.currentTrack;
        
        // Create an embed with the current track information
        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`[${currentTrack.title}](${currentTrack.url})`)
            .setColor(embedColor)
            .addFields([
                { name: 'Requested By', value: `<@${currentTrack.requestedBy.id}>`, inline: true },
                { name: 'Duration', value: currentTrack.duration || 'Unknown', inline: true },
                { name: 'Source', value: currentTrack.source.charAt(0).toUpperCase() + currentTrack.source.slice(1), inline: true }
            ]);
        
        if (currentTrack.thumbnail) {
            embed.setThumbnail(currentTrack.thumbnail);
        }
        
        // Add information about the queue
        const queueData = player.getQueue();
        embed.addFields([
            { name: 'Queue', value: `${queueData.upcoming.length} songs in queue` }
        ]);
        
        // Add playback status
        const status = player.isPaused() ? '⏸️ Paused' : '▶️ Playing';
        embed.addFields([
            { name: 'Status', value: status }
        ]);
        
        return interaction.reply({ embeds: [embed] });
    },
    
    // For prefix commands
    async executeMessage(context) {
        const player = getMusicPlayer(context.client, context.guild);
        
        // Check if the player is connected and playing something
        if (!player.isConnected() || !player.currentTrack) {
            return context.reply('I\'m not playing anything right now.');
        }
        
        const currentTrack = player.currentTrack;
        
        // Create an embed with the current track information
        const embed = new EmbedBuilder()
            .setTitle('🎵 Now Playing')
            .setDescription(`[${currentTrack.title}](${currentTrack.url})`)
            .setColor(embedColor)
            .addFields([
                { name: 'Requested By', value: `<@${currentTrack.requestedBy.id}>`, inline: true },
                { name: 'Duration', value: currentTrack.duration || 'Unknown', inline: true },
                { name: 'Source', value: currentTrack.source.charAt(0).toUpperCase() + currentTrack.source.slice(1), inline: true }
            ]);
        
        if (currentTrack.thumbnail) {
            embed.setThumbnail(currentTrack.thumbnail);
        }
        
        // Add information about the queue
        const queueData = player.getQueue();
        embed.addFields([
            { name: 'Queue', value: `${queueData.upcoming.length} songs in queue` }
        ]);
        
        // Add playback status
        const status = player.isPaused() ? '⏸️ Paused' : '▶️ Playing';
        embed.addFields([
            { name: 'Status', value: status }
        ]);
        
        return context.reply({ embeds: [embed] });
    },
    
    // Command aliases for prefix commands
    aliases: ['np', 'current']
};
