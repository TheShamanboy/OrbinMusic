const { SlashCommandBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

  // For slash commands
  async execute(interaction, client) {
    if (!interaction.member.voice.channel) {
      return interaction.reply('You need to join a voice channel first!');
    }

    const player = getMusicPlayer(client, interaction.guild);

    if (!player.isConnected()) {
      return interaction.reply('I\'m not playing anything right now.');
    }

    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    if (botVoiceChannel && interaction.member.voice.channel.id !== botVoiceChannel.id) {
      return interaction.reply('You need to be in the same voice channel as me to skip.');
    }

    const currentTrack = player.currentTrack;
    if (!currentTrack) {
      return interaction.reply('There\'s no song to skip.');
    }

    player.skip();

    return interaction.reply(`⏭️ Skipped: **${currentTrack.title}**`);
  },

  // For prefix commands
  async executeMessage(context) {
    if (!context.member.voice.channel) {
      return context.reply('You need to join a voice channel first!');
    }

    const player = getMusicPlayer(context.client, context.guild);

    if (!player.isConnected()) {
      return context.reply('I\'m not playing anything right now.');
    }

    const botVoiceChannel = context.guild.members.me.voice.channel;
    if (botVoiceChannel && context.member.voice.channel.id !== botVoiceChannel.id) {
      return context.reply('You need to be in the same voice channel as me to skip.');
    }

    const currentTrack = player.currentTrack;
    if (!currentTrack) {
      return context.reply('There\'s no song to skip.');
    }

    player.skip();

    return context.reply(`⏭️ Skipped: **${currentTrack.title}**`);
  },

  aliases: ['s', 'next']
};
