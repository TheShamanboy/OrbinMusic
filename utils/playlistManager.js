const fs = require('fs');
const path = require('path');
const { maxPlaylistsPerUser, maxPlaylistSize } = require('../config');

// Create playlists directory if it doesn't exist
const playlistsDir = path.join(__dirname, '../playlists');
if (!fs.existsSync(playlistsDir)) {
    fs.mkdirSync(playlistsDir);
}

/**
 * Save a playlist to the file system
 * @param {string} userId - Discord user ID
 * @param {string} name - Playlist name
 * @param {Array} tracks - Array of track objects
 * @returns {Promise<Object>} - Result of the operation
 */
async function savePlaylist(userId, name, tracks) {
    try {
        // Get user playlists file path
        const userPlaylistsPath = path.join(playlistsDir, `${userId}.json`);
        
        // Get existing playlists or create a new empty object
        let playlists = {};
        if (fs.existsSync(userPlaylistsPath)) {
            const data = fs.readFileSync(userPlaylistsPath, 'utf8');
            playlists = JSON.parse(data);
        }
        
        // Check if user has reached the maximum number of playlists
        if (Object.keys(playlists).length >= maxPlaylistsPerUser && !playlists[name]) {
            return { 
                success: false, 
                message: `You have reached the maximum number of playlists (${maxPlaylistsPerUser}).` 
            };
        }
        
        // Check if playlist has too many tracks
        if (tracks.length > maxPlaylistSize) {
            return { 
                success: false, 
                message: `Playlist has too many tracks. Maximum allowed is ${maxPlaylistSize}.` 
            };
        }
        
        // Save simplified track objects
        const simplifiedTracks = tracks.map(track => ({
            title: track.title,
            url: track.url,
            duration: track.duration,
            source: track.source,
            artist: track.artist || null,
        }));
        
        // Save playlist
        playlists[name] = {
            name,
            tracks: simplifiedTracks,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Write to file
        fs.writeFileSync(userPlaylistsPath, JSON.stringify(playlists, null, 2));
        
        return { 
            success: true, 
            message: `Playlist "${name}" saved with ${tracks.length} tracks.`
        };
    } catch (error) {
        console.error('Error saving playlist:', error);
        return { success: false, message: `Error saving playlist: ${error.message}` };
    }
}

/**
 * Get all playlists for a user
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} - User's playlists
 */
async function getUserPlaylists(userId) {
    try {
        const userPlaylistsPath = path.join(playlistsDir, `${userId}.json`);
        
        if (!fs.existsSync(userPlaylistsPath)) {
            return { success: true, playlists: {} };
        }
        
        const data = fs.readFileSync(userPlaylistsPath, 'utf8');
        const playlists = JSON.parse(data);
        
        return { success: true, playlists };
    } catch (error) {
        console.error('Error getting user playlists:', error);
        return { success: false, message: `Error getting playlists: ${error.message}` };
    }
}

/**
 * Get a specific playlist for a user
 * @param {string} userId - Discord user ID
 * @param {string} name - Playlist name
 * @returns {Promise<Object>} - The requested playlist or an error
 */
async function getPlaylist(userId, name) {
    try {
        const { success, playlists, message } = await getUserPlaylists(userId);
        
        if (!success) {
            return { success: false, message };
        }
        
        if (!playlists[name]) {
            return { success: false, message: `Playlist "${name}" not found.` };
        }
        
        return { success: true, playlist: playlists[name] };
    } catch (error) {
        console.error('Error getting playlist:', error);
        return { success: false, message: `Error getting playlist: ${error.message}` };
    }
}

/**
 * Delete a playlist
 * @param {string} userId - Discord user ID
 * @param {string} name - Playlist name
 * @returns {Promise<Object>} - Result of the operation
 */
async function deletePlaylist(userId, name) {
    try {
        const userPlaylistsPath = path.join(playlistsDir, `${userId}.json`);
        
        if (!fs.existsSync(userPlaylistsPath)) {
            return { success: false, message: 'You have no saved playlists.' };
        }
        
        const data = fs.readFileSync(userPlaylistsPath, 'utf8');
        const playlists = JSON.parse(data);
        
        if (!playlists[name]) {
            return { success: false, message: `Playlist "${name}" not found.` };
        }
        
        delete playlists[name];
        
        // Write updated playlists back to file
        fs.writeFileSync(userPlaylistsPath, JSON.stringify(playlists, null, 2));
        
        return { success: true, message: `Playlist "${name}" deleted.` };
    } catch (error) {
        console.error('Error deleting playlist:', error);
        return { success: false, message: `Error deleting playlist: ${error.message}` };
    }
}

module.exports = {
    savePlaylist,
    getUserPlaylists,
    getPlaylist,
    deletePlaylist
};
