const { SlashCommandBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
    
    // For slash commands
    async execute(interaction, client) {
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.reply('You need to join a voice channel first!');
        }
        
        const player = getMusicPlayer(client, interaction.guild);
        
        // Check if the bot is connected
        if (!player.isConnected()) {
            return interaction.reply('I\'m not playing anything right now.');
        }
        
        // Check if the user is in the same voice channel as the bot
        const botVoiceChannel = interaction.guild.members.me.voice.channel;
        if (botVoiceChannel && interaction.member.voice.channel.id !== botVoiceChannel.id) {
            return interaction.reply('You need to be in the same voice channel as me to stop the music.');
        }
        
        // Stop the player and clear the queue
        player.stop();
        
        return interaction.reply('⏹️ Stopped the music and cleared the queue.');
    },
    
    // For prefix commands
    async executeMessage(context) {
        // Check if user is in a voice channel
        if (!context.member.voice.channel) {
            return context.reply('You need to join a voice channel first!');
        }
        
        const player = getMusicPlayer(context.client, context.guild);
        
        // Check if the bot is connected
        if (!player.isConnected()) {
            return context.reply('I\'m not playing anything right now.');
        }
        
        // Check if the user is in the same voice channel as the bot
        const botVoiceChannel = context.guild.members.me.voice.channel;
        if (botVoiceChannel && context.member.voice.channel.id !== botVoiceChannel.id) {
            return context.reply('You need to be in the same voice channel as me to stop the music.');
        }
        
        // Stop the player and clear the queue
        player.stop();
        
        return context.reply('⏹️ Stopped the music and cleared the queue.');
    },
    
    // Command aliases for prefix commands
    aliases: ['st', 'leave', 'disconnect', 'dc']
};
