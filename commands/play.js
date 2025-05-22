const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');
const { embedColor } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song title, URL, or playlist URL to play')
                .setRequired(true)),
    
    // For slash commands
    async execute(interaction, client) {
        await interaction.deferReply();
        
        const query = interaction.options.getString('query');
        
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.followUp('You need to join a voice channel first!');
        }
        
        const player = getMusicPlayer(client, interaction.guild);
        
        // Join the voice channel if not already connected
        if (!player.isConnected()) {
            const joined = await player.join(interaction.member.voice.channel, interaction.channel);
            
            if (!joined) {
                return interaction.followUp('Failed to join the voice channel.');
            }
        }
        
        try {
            const result = await player.addTrack(query, interaction.user);
            
            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle('🎵 Added to Queue')
                    .setDescription(`[${result.track.title}](${result.track.url})`)
                    .addFields([
                        { name: 'Position in Queue', value: `${result.position}`, inline: true },
                        { name: 'Requested By', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Duration', value: result.track.duration || 'Unknown', inline: true }
                    ]);
                
                if (result.track.thumbnail) {
                    embed.setThumbnail(result.track.thumbnail);
                }
                
                return interaction.followUp({ embeds: [embed] });
            } else {
                return interaction.followUp(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Play command error:', error);
            return interaction.followUp(`An error occurred: ${error.message}`);
        }
    },
    
    // For prefix commands
    async executeMessage(context) {
        if (!context.args.length) {
            return context.reply('Please provide a song title or URL to play.');
        }
        
        const query = context.args.join(' ');
        
        // Check if user is in a voice channel
        if (!context.member.voice.channel) {
            return context.reply('You need to join a voice channel first!');
        }
        
        const player = getMusicPlayer(context.client, context.guild);
        
        // Join the voice channel if not already connected
        if (!player.isConnected()) {
            const joined = await player.join(context.member.voice.channel, context.channel);
            
            if (!joined) {
                return context.reply('Failed to join the voice channel.');
            }
        }
        
        try {
            // Show a "Searching..." message
            const searchMsg = await context.reply('🔍 Searching...');
            
            const result = await player.addTrack(query, context.user);
            
            if (result.success) {
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle('🎵 Added to Queue')
                    .setDescription(`[${result.track.title}](${result.track.url})`)
                    .addFields([
                        { name: 'Position in Queue', value: `${result.position}`, inline: true },
                        { name: 'Requested By', value: `<@${context.user.id}>`, inline: true },
                        { name: 'Duration', value: result.track.duration || 'Unknown', inline: true }
                    ]);
                
                if (result.track.thumbnail) {
                    embed.setThumbnail(result.track.thumbnail);
                }
                
                // Try to edit the previous message if we can
                if (searchMsg && typeof searchMsg.edit === 'function') {
                    return searchMsg.edit({ content: null, embeds: [embed] });
                } else {
                    return context.reply({ embeds: [embed] });
                }
            } else {
                if (searchMsg && typeof searchMsg.edit === 'function') {
                    return searchMsg.edit(`Error: ${result.message}`);
                } else {
                    return context.reply(`Error: ${result.message}`);
                }
            }
        } catch (error) {
            console.error('Play command error:', error);
            return context.reply(`An error occurred: ${error.message}`);
        }
    },
    
    // Command aliases for prefix commands
    aliases: ['p']
};
