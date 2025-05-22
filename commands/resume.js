const { SlashCommandBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the currently paused song'),
    
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
            return interaction.reply('You need to be in the same voice channel as me to resume.');
        }
        
        // Resume the player
        if (player.isPaused()) {
            player.resume();
            return interaction.reply('▶️ Resumed the music.');
        } else {
            return interaction.reply('The music is already playing. Use `/pause` to pause playback.');
        }
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
            return context.reply('You need to be in the same voice channel as me to resume.');
        }
        
        // Resume the player
        if (player.isPaused()) {
            player.resume();
            return context.reply('▶️ Resumed the music.');
        } else {
            return context.reply('The music is already playing. Use `+pause` to pause playback.');
        }
    },
    
    // Command aliases for prefix commands
    aliases: ['r', 'unpause', 'continue']
};
