const SpotifyWebApi = require('spotify-web-api-node');
const { spotifyClientId, spotifyClientSecret } = require('../config');
const { getYoutubeStream } = require('./youtubeClient');

// Create Spotify API client
const spotifyApi = new SpotifyWebApi({
    clientId: spotifyClientId,
    clientSecret: spotifyClientSecret
});

// Token refresh time
let tokenExpirationTime = 0;

/**
 * Refresh the Spotify access token if needed
 */
async function refreshToken() {
    const now = Date.now();
    
    // Check if token has expired
    if (now >= tokenExpirationTime) {
        try {
            const data = await spotifyApi.clientCredentialsGrant();
            spotifyApi.setAccessToken(data.body['access_token']);
            
            // Set expiration time (subtract 60 seconds as a buffer)
            tokenExpirationTime = now + (data.body['expires_in'] * 1000) - 60000;
            console.log('Spotify token refreshed');
        } catch (error) {
            console.error('Error refreshing Spotify token:', error);
            throw new Error(`Failed to refresh Spotify token: ${error.message}`);
        }
    }
}

/**
 * Get track information from a Spotify URL
 * @param {string} url - Spotify track, album, or playlist URL
 * @param {Object} requestedBy - User who requested the track
 * @returns {Promise<Object|Array>} - Track information or array of tracks
 */
async function getSpotifyTrack(url, requestedBy) {
    try {
        await refreshToken();
        
        // Parse the URL to determine the type and ID
        let type, id;
        
        if (url.includes('track')) {
            type = 'track';
            id = url.split('track/')[1].split('?')[0];
            return await getTrack(id, requestedBy);
        } else if (url.includes('album')) {
            type = 'album';
            id = url.split('album/')[1].split('?')[0];
            throw new Error('Album playback is not yet implemented.');
        } else if (url.includes('playlist')) {
            type = 'playlist';
            id = url.split('playlist/')[1].split('?')[0];
            throw new Error('Playlist playback is not yet implemented.');
        } else {
            throw new Error('Invalid Spotify URL. Must be a track, album, or playlist URL.');
        }
    } catch (error) {
        console.error('Spotify client error:', error);
        throw new Error(`Spotify error: ${error.message}`);
    }
}

/**
 * Get track information from a Spotify track ID
 * @param {string} trackId - Spotify track ID
 * @param {Object} requestedBy - User who requested the track
 * @returns {Promise<Object>} - Track information
 */
async function getTrack(trackId, requestedBy) {
    try {
        const response = await spotifyApi.getTrack(trackId);
        const track = response.body;
        
        const artists = track.artists.map(artist => artist.name).join(', ');
        const duration = formatDuration(track.duration_ms / 1000);
        
        return {
            title: track.name,
            artist: artists,
            url: track.external_urls.spotify,
            duration: duration,
            thumbnail: track.album.images[0]?.url,
            source: 'spotify',
            requestedBy: requestedBy
        };
    } catch (error) {
        console.error('Error getting Spotify track:', error);
        throw new Error(`Failed to get Spotify track: ${error.message}`);
    }
}

/**
 * Format seconds into a human-readable duration string
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g., "3:45")
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

module.exports = { getSpotifyTrack };
