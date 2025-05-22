const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');

const { EmbedBuilder } = require('discord.js');
const { embedColor } = require('../config');

const ytdlp = require('@distube/yt-dlp');
const fetch = require('node-fetch');
const { getSpotifyTrack } = require('./spotifyClient');

class MusicPlayer {
  constructor(guild) {
    this.guild = guild;
    this.queue = [];
    this.currentTrack = null;
    this.volume = 100;
    this.player = createAudioPlayer();
    this.connection = null;
    this.textChannel = null;
    this.timeout = null;
    this.loop = false;

    this.player.on(AudioPlayerStatus.Idle, () => this.handleIdle());
    this.player.on('error', error => {
      console.error(`Audio Player Error: ${error.message}`);
      this.textChannel?.send(`Error playing track: ${error.message}`);
      this.processQueue();
    });
  }

  async join(channel, textChannel) {
    if (this.connection) return;

    this.textChannel = textChannel;

    try {
      this.connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: this.guild.id,
        adapterCreator: this.guild.voiceAdapterCreator,
      });

      this.connection.subscribe(this.player);

      this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          this.leave();
        }
      });

      return true;
    } catch (error) {
      console.error(`Connection Error: ${error.message}`);
      this.textChannel?.send(`Error joining voice channel: ${error.message}`);
      return false;
    }
  }

  leave() {
    this.queue = [];
    this.currentTrack = null;
    this.player.stop();

    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  async addTrack(query, requestedBy) {
    try {
      let track;

      if (query.includes('spotify.com')) {
        track = await getSpotifyTrack(query, requestedBy);
      } else {
        // Use ytdlp to get video info & direct audio url
        const info = await ytdlp.getInfo(query);

        track = {
          title: info.title,
          url: query, // original URL
          duration: this.formatDuration(info.duration),
          thumbnail: info.thumbnail,
          requestedBy,
          source: 'YouTube',
          streamURL: info.url, // direct stream URL
        };
      }

      this.queue.push(track);
      if (!this.currentTrack && this.queue.length === 1) {
        this.processQueue();
      }

      return { success: true, track, position: this.queue.length };
    } catch (error) {
      console.error(`Add Track Error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.currentTrack = null;

      this.timeout = setTimeout(() => {
        if (this.connection && !this.currentTrack) {
          this.textChannel?.send('Leaving voice channel due to inactivity.');
          this.leave();
        }
      }, 5 * 60 * 1000); // 5 minutes

      return;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.currentTrack = this.queue.shift();

    try {
      // Fetch the audio stream from streamURL
      const response = await fetch(this.currentTrack.streamURL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const stream = response.body;

      const resource = createAudioResource(stream, {
        inlineVolume: true,
      });

      resource.volume.setVolume(this.volume / 100);
      this.player.play(resource);

      this.sendNowPlaying();
    } catch (error) {
      console.error(`Playback Error: ${error.message}`);
      this.textChannel?.send(`Error playing track: ${error.message}`);
      this.processQueue();
    }
  }

  sendNowPlaying() {
    if (!this.textChannel || !this.currentTrack) return;

    const embed = new EmbedBuilder()
      .setTitle('🎶 Now Playing')
      .setDescription(`[${this.currentTrack.title}](${this.currentTrack.url})`)
      .setColor(embedColor)
      .addFields([
        { name: 'Requested By', value: `<@${this.currentTrack.requestedBy.id}>`, inline: true },
        { name: 'Duration', value: this.currentTrack.duration || 'Unknown', inline: true },
        { name: 'Source', value: this.currentTrack.source || 'YouTube', inline: true },
      ]);

    if (this.currentTrack.thumbnail) {
      embed.setThumbnail(this.currentTrack.thumbnail);
    }

    this.textChannel.send({ embeds: [embed] });
  }

  handleIdle() {
    if (this.loop && this.currentTrack) {
      this.queue.unshift(this.currentTrack);
    }
    this.processQueue();
  }

  skip() {
    this.player.stop();
    return true;
  }

  pause() {
    if (this.player.state.status === AudioPlayerStatus.Playing) {
      this.player.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.player.state.status === AudioPlayerStatus.Paused) {
      this.player.unpause();
      return true;
    }
    return false;
  }

  stop() {
    this.queue = [];
    this.player.stop();
    return true;
  }

  setVolume(volume) {
    this.volume = Math.min(Math.max(0, volume), 100);
    if (this.player.state.resource) {
      this.player.state.resource.volume.setVolume(this.volume / 100);
    }
    return this.volume;
  }

  setLoop(enabled) {
    this.loop = enabled;
    return this.loop;
  }

  getQueue() {
    return {
      current: this.currentTrack,
      upcoming: this.queue,
      loopEnabled: this.loop,
    };
  }

  isPlaying() {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }

  isPaused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  isConnected() {
    return this.connection !== null;
  }

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

function getMusicPlayer(client, guild) {
  if (!client.musicPlayers.has(guild.id)) {
    client.musicPlayers.set(guild.id, new MusicPlayer(guild));
  }
  return client.musicPlayers.get(guild.id);
}

module.exports = { MusicPlayer, getMusicPlayer };
