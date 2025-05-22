module.exports = {
    // Bot configuration
    prefix: '+',
    
    // Discord API
    clientId: process.env.CLIENT_ID || '',
    token: process.env.DISCORD_TOKEN || '',
    
    // Guild ID for slash commands deployment (dev mode)
    guildId: process.env.GUILD_ID || '',
    
    // Spotify API Credentials
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    
    // YouTube API Key
    youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
    
    // Music settings
    defaultVolume: 50, // 0-100
    maxQueueSize: 100, // maximum songs in queue
    
    // Playlist settings
    maxPlaylistSize: 50, // maximum songs in a saved playlist
    maxPlaylistsPerUser: 5, // maximum number of playlists a user can save
    
    // Color for embeds
    embedColor: '#FF0000', // Red color
    
    // Bot activity status
    activity: {
        type: 'LISTENING',
        text: '+help | /help'
    }
};
