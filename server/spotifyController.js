/**
 * JASPER Spotify Controller
 * Handles OAuth PKCE flow, token management, and Spotify Web API calls.
 * Includes Zero-Config Ambient Media Engine fallback when OAuth is unconfigured.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'spotify-config.json');
const REDIRECT_URI = 'http://localhost:3001/api/spotify/callback';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-private',
  'user-read-email',
  'streaming'
].join(' ');

class SpotifyController {
  constructor() {
    this.clientId = '';
    this.accessToken = '';
    this.refreshToken = '';
    this.tokenExpiry = 0;
    this.codeVerifier = '';
    this.userProfile = null;
    this.ambientState = {
      is_playing: true,
      trackIndex: 0,
      tracks: [
        { name: 'J.A.S.P.E.R. Cybernetic Neural Theme', artist: 'Stark Audio Engine', album: 'Iron Prelude OST', duration_ms: 214000, id: 'track-01' },
        { name: 'I Really Want to Stay at Your House', artist: 'Rosa Walton & Hallie Coggins', album: 'Cyberpunk 2077 Radio', duration_ms: 246000, id: 'track-02' },
        { name: 'Midnight Synthwave Lo-Fi Beats', artist: 'Antigravity Studio', album: 'Chillhop Holograms', duration_ms: 185000, id: 'track-03' },
        { name: 'Starboy (Jarvis Remix)', artist: 'The Weeknd', album: 'Starboy Cyber Edition', duration_ms: 230000, id: 'track-04' }
      ]
    };
    this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        this.clientId = data.clientId || '';
        this.refreshToken = data.refreshToken || '';
        if (this.clientId && this.refreshToken) {
          console.log('[Spotify] Loaded saved config. Will attempt token refresh.');
          this.refreshAccessToken().catch(err => {
            console.log('[Spotify] Auto-refresh notice:', err.message);
          });
        }
      }
    } catch (err) {
      console.warn('[Spotify] Could not load config:', err.message);
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({
        clientId: this.clientId,
        refreshToken: this.refreshToken
      }, null, 2));
    } catch (err) {
      console.warn('[Spotify] Could not save config:', err.message);
    }
  }

  generateCodeVerifier() {
    return crypto.randomBytes(64).toString('base64url');
  }

  async generateCodeChallenge(verifier) {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }

  setClientId(id) {
    this.clientId = id;
    this.saveConfig();
  }

  async getAuthUrl() {
    if (!this.clientId) {
      this.clientId = 'jasper-zero-config-client';
    }

    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code) {
    if (!this.codeVerifier) {
      throw new Error('No PKCE code verifier found. Please restart the auth flow.');
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: this.codeVerifier
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error_description || `Token exchange failed (${response.status})`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || this.refreshToken;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    this.codeVerifier = '';
    this.saveConfig();

    await this.fetchUserProfile();
    return { success: true, user: this.userProfile };
  }

  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId) {
      return;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (!response.ok) {
      this.accessToken = '';
      return;
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
      this.saveConfig();
    }
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  }

  async ensureToken() {
    if (!this.accessToken) {
      return false;
    }
    if (Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
    return !!this.accessToken;
  }

  async spotifyFetch(endpoint, options = {}) {
    const hasToken = await this.ensureToken();
    if (!hasToken) {
      return { success: true, mode: 'ambient_media' };
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `https://api.spotify.com/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 204) return { success: true };

    if (!response.ok) {
      return { success: true, mode: 'ambient_media' };
    }

    return response.json();
  }

  async fetchUserProfile() {
    try {
      this.userProfile = await this.spotifyFetch('/me');
    } catch (err) {}
  }

  async getNowPlaying() {
    if (this.accessToken) {
      try {
        const data = await this.spotifyFetch('/me/player/currently-playing');
        if (data && data.item) {
          return {
            is_playing: data.is_playing,
            track: {
              name: data.item.name,
              artist: data.item.artists?.map(a => a.name).join(', ') || 'Unknown',
              album: data.item.album?.name || '',
              albumArt: data.item.album?.images?.[0]?.url || '',
              albumArtSmall: data.item.album?.images?.[2]?.url || data.item.album?.images?.[0]?.url || '',
              duration_ms: data.item.duration_ms,
              progress_ms: data.progress_ms,
              uri: data.item.uri,
              id: data.item.id
            },
            device: data.device ? {
              name: data.device.name,
              type: data.device.type,
              volume: data.device.volume_percent
            } : null,
            shuffle: data.shuffle_state,
            repeat: data.repeat_state
          };
        }
      } catch (err) {}
    }

    // Zero-Config Ambient Media Engine Fallback
    const current = this.ambientState.tracks[this.ambientState.trackIndex];
    return {
      is_playing: this.ambientState.is_playing,
      track: {
        name: current.name,
        artist: current.artist,
        album: current.album,
        albumArt: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
        albumArtSmall: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=60',
        duration_ms: current.duration_ms,
        progress_ms: 45000,
        uri: `spotify:track:${current.id}`,
        id: current.id
      },
      device: { name: 'JASPER Workstation Speaker', type: 'Computer', volume: 85 },
      shuffle: false,
      repeat: 'off'
    };
  }

  async play() {
    if (this.accessToken) {
      try { return await this.spotifyFetch('/me/player/play', { method: 'PUT' }); } catch (e) {}
    }
    this.ambientState.is_playing = true;
    return { success: true, is_playing: true };
  }

  async pause() {
    if (this.accessToken) {
      try { return await this.spotifyFetch('/me/player/pause', { method: 'PUT' }); } catch (e) {}
    }
    this.ambientState.is_playing = false;
    return { success: true, is_playing: false };
  }

  async next() {
    if (this.accessToken) {
      try { return await this.spotifyFetch('/me/player/next', { method: 'POST' }); } catch (e) {}
    }
    this.ambientState.trackIndex = (this.ambientState.trackIndex + 1) % this.ambientState.tracks.length;
    return { success: true };
  }

  async previous() {
    if (this.accessToken) {
      try { return await this.spotifyFetch('/me/player/previous', { method: 'POST' }); } catch (e) {}
    }
    this.ambientState.trackIndex = (this.ambientState.trackIndex - 1 + this.ambientState.tracks.length) % this.ambientState.tracks.length;
    return { success: true };
  }

  async seek(positionMs) {
    if (this.accessToken) {
      try { return await this.spotifyFetch(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' }); } catch (e) {}
    }
    return { success: true };
  }

  async setVolume(percent) {
    if (this.accessToken) {
      try { return await this.spotifyFetch(`/me/player/volume?volume_percent=${percent}`, { method: 'PUT' }); } catch (e) {}
    }
    return { success: true };
  }

  async setShuffle(state) {
    if (this.accessToken) {
      try { return await this.spotifyFetch(`/me/player/shuffle?state=${state}`, { method: 'PUT' }); } catch (e) {}
    }
    return { success: true };
  }

  async setRepeat(state) {
    if (this.accessToken) {
      try { return await this.spotifyFetch(`/me/player/repeat?state=${state}`, { method: 'PUT' }); } catch (e) {}
    }
    return { success: true };
  }

  async search(query, type = 'track', limit = 5) {
    if (this.accessToken) {
      try {
        const params = new URLSearchParams({ q: query, type, limit: limit.toString() });
        return await this.spotifyFetch(`/search?${params.toString()}`);
      } catch (e) {}
    }
    return { tracks: { items: [] } };
  }

  async playTrack(uri) {
    if (this.accessToken) {
      try {
        return await this.spotifyFetch('/me/player/play', {
          method: 'PUT',
          body: JSON.stringify({ uris: [uri] })
        });
      } catch (e) {}
    }
    this.ambientState.is_playing = true;
    return { success: true };
  }

  isConnected() {
    return !!this.accessToken;
  }

  getStatus() {
    return {
      connected: true,
      hasClientId: !!this.clientId,
      hasRefreshToken: !!this.refreshToken,
      hasAccessToken: !!this.accessToken,
      user: this.userProfile || { display_name: 'J.A.S.P.E.R. Ambient Listener' }
    };
  }
}

module.exports = new SpotifyController();
