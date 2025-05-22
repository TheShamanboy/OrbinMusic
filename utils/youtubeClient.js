const ytdl = require('ytdl-core');
const { search } = require('play-dl');
const { youtubeApiKey } = require('../config');

/**
 * Get a stream for a YouTube video or search query
 * @param {string} query - YouTube URL or search query
 * @param {Object} requestedBy - User who requested the track
 * @param {boolean} getStream - Whether to get the actual stream (true) or just track info (false)
 * @returns {Promise<Object>} - Track information and stream
 */
async function getYoutubeStream(query, requestedBy, getStream = false) {
    try {
        let videoId = '';
        let videoInfo = null;
        
        // Check if query is a valid YouTube URL
        if (ytdl.validateURL(query)) {
            videoId = ytdl.getURLVideoID(query);
            videoInfo = await ytdl.getInfo(videoId);
        } else {
            // Search for the video
            const searchResults = await search(query, { limit: 1 });
            
            if (!searchResults || searchResults.length === 0) {
                throw new Error('No results found for the search query.');
            }
            
            const video = searchResults[0];
            videoId = video.id;
            
            // Get video details
            videoInfo = await ytdl.getInfo(videoId);
        }
        
        // Create track object with basic info
        const track = {
            title: videoInfo.videoDetails.title,
            url: videoInfo.videoDetails.video_url,
            duration: formatDuration(Number(videoInfo.videoDetails.lengthSeconds)),
            thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
            author: videoInfo.videoDetails.author.name,
            source: 'youtube',
            requestedBy: requestedBy
        };
        
        // If we need the actual stream, create it
        if (getStream) {
            const stream = ytdl(videoId, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25, // 32MB
                dlChunkSize: 0
            });
            
            return {
                ...track,
                stream,
                type: 'raw'
            };
        }
        
        return track;
    } catch (error) {
        console.error('YouTube client error:', error);
        throw new Error(`YouTube error: ${error.message}`);
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

module.exports = { getYoutubeStream };
