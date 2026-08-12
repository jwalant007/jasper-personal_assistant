/**
 * JASPER Spotify Controller
 * Handles OAuth PKCE flow, token management, and Spotify Web API calls.
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
    this.loadConfig();
  }

  // --- Config persistence ---

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        this.clientId = data.clientId || '';
        this.refreshToken = data.refreshToken || '';
        if (this.clientId && this.refreshToken) {
          console.log('[Spotify] Loaded saved config. Will attempt token refresh.');
          // Auto-refresh token on startup
          this.refreshAccessToken().catch(err => {
            console.log('[Spotify] Auto-refresh failed:', err.message);
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

  // --- PKCE helpers ---

  generateCodeVerifier() {
    return crypto.randomBytes(64).toString('base64url');
  }

  async generateCodeChallenge(verifier) {
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return hash.toString('base64url');
  }

  // --- OAuth flow ---

  setClientId(id) {
    this.clientId = id;
    this.saveConfig();
  }

  async getAuthUrl() {
    if (!this.clientId) {
      throw new Error('Spotify Client ID is not configured.');
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
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1min early
    this.codeVerifier = '';
    this.saveConfig();

    // Fetch user profile
    await this.fetchUserProfile();

    console.log(`[Spotify] Connected as: ${this.userProfile?.display_name || 'Unknown'}`);
    return { success: true, user: this.userProfile };
  }

  async refreshAccessToken() {
    if (!this.refreshToken || !this.clientId) {
      throw new Error('No refresh token or client ID available.');
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
      const err = await response.json().catch(() => ({}));
      this.accessToken = '';
      throw new Error(err.error_description || `Token refresh failed (${response.status})`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
      this.saveConfig();
    }
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

    console.log('[Spotify] Token refreshed successfully.');
  }

  async ensureToken() {
    if (!this.accessToken) {
      throw new Error('Not connected to Spotify. Please authenticate first.');
    }
    if (Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  // --- Spotify API calls ---

  async spotifyFetch(endpoint, options = {}) {
    await this.ensureToken();

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

    // 204 = success with no body (common for player endpoints)
    if (response.status === 204) return { success: true };

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Spotify API error (${response.status})`);
    }

    return response.json();
  }

  async fetchUserProfile() {
    try {
      this.userProfile = await this.spotifyFetch('/me');
    } catch (err) {
      console.warn('[Spotify] Could not fetch user profile:', err.message);
    }
  }

  async getNowPlaying() {
    try {
      const data = await this.spotifyFetch('/me/player/currently-playing');

      if (!data || !data.item) {
        return { is_playing: false, track: null };
      }

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
    } catch (err) {
      // 204 or empty = nothing playing
      if (err.message.includes('204') || err.message.includes('No active')) {
        return { is_playing: false, track: null };
      }
      throw err;
    }
  }

  async play() { return this.spotifyFetch('/me/player/play', { method: 'PUT' }); }
  async pause() { return this.spotifyFetch('/me/player/pause', { method: 'PUT' }); }
  async next() { return this.spotifyFetch('/me/player/next', { method: 'POST' }); }
  async previous() { return this.spotifyFetch('/me/player/previous', { method: 'POST' }); }

  async seek(positionMs) {
    return this.spotifyFetch(`/me/player/seek?position_ms=${positionMs}`, { method: 'PUT' });
  }

  async setVolume(percent) {
    return this.spotifyFetch(`/me/player/volume?volume_percent=${percent}`, { method: 'PUT' });
  }

  async setShuffle(state) {
    return this.spotifyFetch(`/me/player/shuffle?state=${state}`, { method: 'PUT' });
  }

  async setRepeat(state) {
    // state: track, context, off
    return this.spotifyFetch(`/me/player/repeat?state=${state}`, { method: 'PUT' });
  }

  async search(query, type = 'track', limit = 5) {
    const params = new URLSearchParams({ q: query, type, limit: limit.toString() });
    return this.spotifyFetch(`/search?${params.toString()}`);
  }

  async playTrack(uri) {
    return this.spotifyFetch('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] })
    });
  }

  // --- Status helpers ---

  isConnected() {
    return !!this.accessToken;
  }

  getStatus() {
    return {
      connected: this.isConnected(),
      clientId: this.clientId || '',
      user: this.userProfile ? {
        name: this.userProfile.display_name,
        email: this.userProfile.email,
        image: this.userProfile.images?.[0]?.url || '',
        product: this.userProfile.product // 'premium' or 'free'
      } : null
    };
  }

  disconnect() {
    this.accessToken = '';
    this.refreshToken = '';
    this.tokenExpiry = 0;
    this.userProfile = null;
    // Keep clientId but remove refresh token from config
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ clientId: this.clientId }, null, 2));
    } catch (e) {}
    console.log('[Spotify] Disconnected.');
  }
}

module.exports = new SpotifyController();
