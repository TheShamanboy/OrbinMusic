const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMusicPlayer } = require('../utils/musicPlayer');
const { savePlaylist, getUserPlaylists, getPlaylist, deletePlaylist } = require('../utils/playlistManager');
const { embedColor } = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage your playlists')
        .addSubcommand(subcommand =>
            subcommand
                .setName('save')
                .setDescription('Save the current queue as a playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the playlist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('load')
                .setDescription('Load a saved playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the playlist to load')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your saved playlists'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a saved playlist')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name of the playlist to delete')
                        .setRequired(true))),
    
    // For slash commands
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        
        switch (subcommand) {
            case 'save':
                return await this.savePlaylists(interaction, client);
            case 'load':
                return await this.loadPlaylist(interaction, client);
            case 'list':
                return await this.listPlaylists(interaction, client);
            case 'delete':
                return await this.deletePlaylist(interaction, client);
            default:
                return interaction.reply('Invalid subcommand.');
        }
    },
    
    // For prefix commands
    async executeMessage(context) {
        if (context.args.length === 0) {
            return context.reply('Please specify a subcommand: `save`, `load`, `list`, or `delete`.');
        }
        
        const subcommand = context.args[0].toLowerCase();
        
        switch (subcommand) {
            case 'save':
                return await this.savePlaylistsMessage(context);
            case 'load':
                return await this.loadPlaylistMessage(context);
            case 'list':
                return await this.listPlaylistsMessage(context);
            case 'delete':
                return await this.deletePlaylistMessage(context);
            default:
                return context.reply('Invalid subcommand. Available subcommands: `save`, `load`, `list`, or `delete`.');
        }
    },
    
    // Save the current queue as a playlist (slash command)
    async savePlaylists(interaction, client) {
        const name = interaction.options.getString('name');
        
        // Check if the name is valid
        if (name.length > 32) {
            return interaction.reply('Playlist name is too long. Maximum length is 32 characters.');
        }
        
        // Get the player and queue
        const player = getMusicPlayer(client, interaction.guild);
        const queueData = player.getQueue();
        
        // Check if the queue is empty
        if (!queueData.current && queueData.upcoming.length === 0) {
            return interaction.reply('The queue is empty. Add some songs before saving a playlist.');
        }
        
        // Prepare tracks to save
        const tracks = [];
        
        if (queueData.current) {
            tracks.push(queueData.current);
        }
        
        tracks.push(...queueData.upcoming);
        
        // Save the playlist
        const result = await savePlaylist(interaction.user.id, name, tracks);
        
        if (result.success) {
            return interaction.reply(`✅ ${result.message}`);
        } else {
            return interaction.reply(`❌ ${result.message}`);
        }
    },
    
    // Save the current queue as a playlist (message command)
    async savePlaylistsMessage(context) {
        if (context.args.length < 2) {
            return context.reply('Please provide a name for the playlist.');
        }
        
        const name = context.args[1];
        
        // Check if the name is valid
        if (name.length > 32) {
            return context.reply('Playlist name is too long. Maximum length is 32 characters.');
        }
        
        // Get the player and queue
        const player = getMusicPlayer(context.client, context.guild);
        const queueData = player.getQueue();
        
        // Check if the queue is empty
        if (!queueData.current && queueData.upcoming.length === 0) {
            return context.reply('The queue is empty. Add some songs before saving a playlist.');
        }
        
        // Prepare tracks to save
        const tracks = [];
        
        if (queueData.current) {
            tracks.push(queueData.current);
        }
        
        tracks.push(...queueData.upcoming);
        
        // Save the playlist
        const result = await savePlaylist(context.user.id, name, tracks);
        
        if (result.success) {
            return context.reply(`✅ ${result.message}`);
        } else {
            return context.reply(`❌ ${result.message}`);
        }
    },
    
    // Load a saved playlist (slash command)
    async loadPlaylist(interaction, client) {
        await interaction.deferReply();
        
        const name = interaction.options.getString('name');
        
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return interaction.followUp('You need to join a voice channel first!');
        }
        
        // Get the playlist
        const result = await getPlaylist(interaction.user.id, name);
        
        if (!result.success) {
            return interaction.followUp(`❌ ${result.message}`);
        }
        
        const playlist = result.playlist;
        
        // Get the player
        const player = getMusicPlayer(client, interaction.guild);
        
        // Join the voice channel if not already connected
        if (!player.isConnected()) {
            const joined = await player.join(interaction.member.voice.channel, interaction.channel);
            
            if (!joined) {
                return interaction.followUp('Failed to join the voice channel.');
            }
        }
        
        // Add each track to the queue
        let addedCount = 0;
        let errorCount = 0;
        
        for (const track of playlist.tracks) {
            try {
                const result = await player.addTrack(track.url, interaction.user);
                
                if (result.success) {
                    addedCount++;
                } else {
                    errorCount++;
                }
                
                // Add a small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error adding track from playlist:', error);
                errorCount++;
            }
        }
        
        // Send a summary of the loading process
        const embed = new EmbedBuilder()
            .setTitle('Playlist Loaded')
            .setColor(embedColor)
            .setDescription(`Loaded playlist **${name}**`)
            .addFields([
                { name: 'Tracks Added', value: `${addedCount}`, inline: true },
                { name: 'Errors', value: `${errorCount}`, inline: true },
                { name: 'Total Tracks', value: `${playlist.tracks.length}`, inline: true }
            ]);
        
        return interaction.followUp({ embeds: [embed] });
    },
    
    // Load a saved playlist (message command)
    async loadPlaylistMessage(context) {
        if (context.args.length < 2) {
            return context.reply('Please provide the name of the playlist to load.');
        }
        
        const name = context.args[1];
        
        // Check if user is in a voice channel
        if (!context.member.voice.channel) {
            return context.reply('You need to join a voice channel first!');
        }
        
        // Get the playlist
        const result = await getPlaylist(context.user.id, name);
        
        if (!result.success) {
            return context.reply(`❌ ${result.message}`);
        }
        
        const playlist = result.playlist;
        
        // Send initial message
        const loadingMsg = await context.reply(`Loading playlist **${name}** with ${playlist.tracks.length} tracks...`);
        
        // Get the player
        const player = getMusicPlayer(context.client, context.guild);
        
        // Join the voice channel if not already connected
        if (!player.isConnected()) {
            const joined = await player.join(context.member.voice.channel, context.channel);
            
            if (!joined) {
                return context.channel.send('Failed to join the voice channel.');
            }
        }
        
        // Add each track to the queue
        let addedCount = 0;
        let errorCount = 0;
        
        for (const track of playlist.tracks) {
            try {
                const result = await player.addTrack(track.url, context.user);
                
                if (result.success) {
                    addedCount++;
                } else {
                    errorCount++;
                }
                
                // Add a small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error adding track from playlist:', error);
                errorCount++;
            }
        }
        
        // Send a summary of the loading process
        const embed = new EmbedBuilder()
            .setTitle('Playlist Loaded')
            .setColor(embedColor)
            .setDescription(`Loaded playlist **${name}**`)
            .addFields([
                { name: 'Tracks Added', value: `${addedCount}`, inline: true },
                { name: 'Errors', value: `${errorCount}`, inline: true },
                { name: 'Total Tracks', value: `${playlist.tracks.length}`, inline: true }
            ]);
        
        // Try to edit the loading message if we can
        if (loadingMsg && typeof loadingMsg.edit === 'function') {
            return loadingMsg.edit({ content: null, embeds: [embed] });
        } else {
            return context.reply({ embeds: [embed] });
        }
    },
    
    // List saved playlists (slash command)
    async listPlaylists(interaction, client) {
        // Get the user's playlists
        const result = await getUserPlaylists(interaction.user.id);
        
        if (!result.success) {
            return interaction.reply(`❌ ${result.message}`);
        }
        
        const playlists = result.playlists;
        
        if (Object.keys(playlists).length === 0) {
            return interaction.reply('You don\'t have any saved playlists.');
        }
        
        // Create an embed with the list of playlists
        const embed = new EmbedBuilder()
            .setTitle('Your Playlists')
            .setColor(embedColor)
            .setDescription('Here are your saved playlists:');
        
        for (const [name, playlist] of Object.entries(playlists)) {
            embed.addFields([
                { 
                    name: name, 
                    value: `${playlist.tracks.length} tracks • Created: ${new Date(playlist.createdAt).toLocaleDateString()}` 
                }
            ]);
        }
        
        return interaction.reply({ embeds: [embed] });
    },
    
    // List saved playlists (message command)
    async listPlaylistsMessage(context) {
        // Get the user's playlists
        const result = await getUserPlaylists(context.user.id);
        
        if (!result.success) {
            return context.reply(`❌ ${result.message}`);
        }
        
        const playlists = result.playlists;
        
        if (Object.keys(playlists).length === 0) {
            return context.reply('You don\'t have any saved playlists.');
        }
        
        // Create an embed with the list of playlists
        const embed = new EmbedBuilder()
            .setTitle('Your Playlists')
            .setColor(embedColor)
            .setDescription('Here are your saved playlists:');
        
        for (const [name, playlist] of Object.entries(playlists)) {
            embed.addFields([
                { 
                    name: name, 
                    value: `${playlist.tracks.length} tracks • Created: ${new Date(playlist.createdAt).toLocaleDateString()}` 
                }
            ]);
        }
        
        return context.reply({ embeds: [embed] });
    },
    
    // Delete a saved playlist (slash command)
    async deletePlaylist(interaction, client) {
        const name = interaction.options.getString('name');
        
        // Delete the playlist
        const result = await deletePlaylist(interaction.user.id, name);
        
        if (result.success) {
            return interaction.reply(`✅ ${result.message}`);
        } else {
            return interaction.reply(`❌ ${result.message}`);
        }
    },
    
    // Delete a saved playlist (message command)
    async deletePlaylistMessage(context) {
        if (context.args.length < 2) {
            return context.reply('Please provide the name of the playlist to delete.');
        }
        
        const name = context.args[1];
        
        // Delete the playlist
        const result = await deletePlaylist(context.user.id, name);
        
        if (result.success) {
            return context.reply(`✅ ${result.message}`);
        } else {
            return context.reply(`❌ ${result.message}`);
        }
    },
    
    // Command aliases for prefix commands
    aliases: ['pl']
};
