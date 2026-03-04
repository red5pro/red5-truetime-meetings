import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import PubNub from 'pubnub';
import axios from 'axios';

class Red5Client {
  constructor(masterKey, masterSecret, host) {
    this.host = host;
    this.masterKey = masterKey;
    this.masterSecret = masterSecret;

    // Extract credentials on initialization
    this.credentials = this._extractCredentials();

    if (!this.credentials || !this._validateCredentials(this.credentials)) {
      console.error('Failed to initialize Red5Client: Missing or invalid credentials');
      return;
    }

    // Initialize PubNub client
    this.pubnub = new PubNub({
      subscribeKey: this.credentials.subKey,
      publishKey: this.credentials.pubKey,
      secretKey: this.credentials.pubnubSecret,
      userId: this.masterKey, // Default userId for SDK
    });
  }

  _validateCredentials(credentials) {
    if (!credentials) {
      return false;
    }

    const required = ['conferenceSecret', 'pubnubSecret', 'pubKey', 'subKey', 'streamManagerHost'];
    const missing = required.filter((key) => !credentials[key]);

    if (missing.length > 0) {
      console.error('Missing required credentials:', missing.join(', '));
      return false;
    }

    return true;
  }

  /**
   * Extract original service credentials from master key/secret
   * @private
   */
  _extractCredentials() {
    try {
      // Decode master secret to get encrypted credentials
      const encryptedCredentials = Buffer.from(this.masterSecret, 'base64').toString();

      // Decrypt using master key
      const decryptedBundle = this._decryptCredentials(encryptedCredentials, this.masterKey);

      // Parse the credentials
      const [conferenceSecret, pubnubSecret, pubKey, subKey, streamManagerHost] =
        decryptedBundle.split('|');

      if (!this.host) {
        this.host = streamManagerHost;
      }

      return {
        conferenceSecret,
        pubnubSecret,
        pubKey,
        subKey,
        streamManagerHost,
      };
    } catch (error) {
      throw new Error('Failed to extract credentials from master key/secret', { cause: error });
    }
  }

  /**
   * Decrypt credentials using AES decryption
   * @private
   */
  _decryptCredentials(encryptedHex, key) {
    try {
      // Derive key the same way createDecipher did internally
      const keyBuffer = Buffer.from(key.substring(0, 16));
      const hash = crypto.createHash('md5').update(keyBuffer).digest();

      const decipher = crypto.createDecipheriv('aes-128-ecb', hash, null);
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt credentials', { cause: error });
    }
  }

  /**
   * Create Conference JWT token with embedded PubNub token
   * @private
   */
  async _createConferenceToken(
    secretKey,
    uid,
    roomId,
    role,
    pubnubSubscribeKey,
    pubnubPublishKey,
    pubnubToken,
    expirationMinutes = 60,
  ) {
    const payload = {
      uid: uid,
      roomId: roomId,
      role: role,
      pubnubSubscribeKey: pubnubSubscribeKey,
      pubnubPublishKey: pubnubPublishKey,
      pubnubToken: pubnubToken, // Embed PubNub token inside Conference JWT
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expirationMinutes * 60,
    };

    const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });

    return token;
  }

  /**
   * Generate PubNub token for the given room and user
   * @private
   */
  async _generatePubnubToken(userId, roomId, ttlMinutes = 60) {
    try {
      const token = await this.pubnub.grantToken({
        ttl: ttlMinutes,
        authorized_uuid: userId,
        resources: {
          channels: {
            [roomId]: {
              read: true,
              write: true,
            },
            [`${roomId}-pnpres`]: {
              read: true,
              write: true,
            },
          },
        },
      });

      return token;
    } catch (error) {
      throw new Error('Failed to generate PubNub token', { cause: error });
    }
  }

  /**
   * Generate chat token for the given channel and user
   * @private
   */
  async getChatToken(userId, channelId, read, write, ttlMinutes = 60) {
    try {
      const token = await this.pubnub.grantToken({
        ttl: ttlMinutes,
        authorized_uuid: userId,
        resources: {
          channels: {
            [channelId]: {
              read: read,
              write: write,
            },
            [`${channelId}-pnpres`]: {
              read: read,
              write: write,
            },
          },
        },
      });

      return token;
    } catch (error) {
      throw new Error('Failed to generate chat token', { cause: error });
    }
  }

  /**
   * Get conference token
   * @param {string} userId - User ID for token authentication
   * @param {string} roomId - Room ID for the conference
   * @param {string} role - User role (e.g., 'admin', 'publisher', 'subscriber')
   * @param {number} expirationMinutes - Token expiration time in minutes (default: 60)
   * @returns {Promise<{token: string, userId: string, roomId: string, role: string, expiresAt: string}>}
   */
  async getConferenceToken(userId, roomId, role = 'publisher', expirationMinutes = 60) {
    if (!userId || !roomId) {
      throw new Error('userId and roomId are required');
    }

    if (!role) {
      throw new Error('role is required');
    }

    try {
      // First generate PubNub token
      const pubnubToken = await this._generatePubnubToken(
        userId.trim(),
        roomId.trim(),
        expirationMinutes,
      );

      // Then embed it inside Conference JWT token
      const conferenceToken = await this._createConferenceToken(
        this.credentials.conferenceSecret,
        userId.trim(),
        roomId.trim(),
        role,
        this.credentials.subKey,
        this.credentials.pubKey,
        pubnubToken, // Embed PubNub token
        expirationMinutes,
      );

      return conferenceToken;
    } catch (error) {
      throw new Error('Failed to generate token', { cause: error });
    }
  }

  /**
   * Get the extracted service credentials (for debugging/verification)
   * @returns {Object} The extracted credentials
   */
  getCredentials() {
    return {
      conferenceSecret: this.credentials.conferenceSecret,
      pubnubSecret: this.credentials.pubnubSecret,
      pubKey: this.credentials.pubKey,
      subKey: this.credentials.subKey,
      streamManagerHost: this.credentials.streamManagerHost,
    };
  }

  /**
   * Validate if conference token is still valid
   * @param {string} conferenceToken - The conference JWT token to validate
   * @returns {boolean} True if token is still valid
   */
  validateConferenceToken(conferenceToken) {
    try {
      // Decode JWT payload without verification (just to check expiry)
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const now = Math.floor(Date.now() / 1000);

      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * Extract PubNub token from Conference JWT token
   * @param {string} conferenceToken - The conference JWT token
   * @returns {string|null} The embedded PubNub token or null if not found
   */
  extractPubnubToken(conferenceToken) {
    try {
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.pubnubToken || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode conference token to get all payload data
   * @param {string} conferenceToken - The conference JWT token
   * @returns {Object|null} The decoded payload or null if invalid
   */
  decodeToken(conferenceToken) {
    try {
      const parts = conferenceToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return {
        userId: payload.uid,
        roomId: payload.roomId,
        role: payload.role,
        pubnubToken: payload.pubnubToken,
        issuedAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isValid: payload.exp > Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      return null;
    }
  }

  // ============ Conference API Methods ============

  /**
   * Generate admin token for Conference API calls (simplified, no PubNub fields needed)
   * @private
   * @param {string} roomId - Room ID for the admin token
   * @param {number} expirationMinutes - Token expiration time in minutes (default: 60)
   * @returns {string} Admin token
   */
  _generateAdminToken(roomId, expirationMinutes = 60) {
    try {
      const payload = {
        uid: 'admin',
        roomId: roomId,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expirationMinutes * 60,
      };

      const token = jwt.sign(payload, this.credentials.conferenceSecret, { algorithm: 'HS256' });
      return token;
    } catch (error) {
      throw new Error('Failed to generate admin token', { cause: error });
    }
  }

  /**
   * Make authenticated request to Conference API
   * @private
   */
  async _makeConferenceRequest(method, endpoint, roomId, data = null, params = null) {
    const adminToken = this._generateAdminToken(roomId);
    const url = `https://${this.host}/as/v1/conference${endpoint}`;

    try {
      const config = {
        method,
        url,
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (params) {
        config.params = params;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `Conference API error: ${error.response.data.message || error.response.statusText}`,
          { cause: error },
        );
      }
      throw new Error('Failed to make conference request', { cause: error });
    }
  }

  /**
   * Get user status in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User status information
   */
  async getUserStatus(roomId, userId) {
    if (!roomId || !userId) {
      throw new Error('roomId and userId are required');
    }
    return await this._makeConferenceRequest('GET', `/room/${roomId}/user/${userId}`, roomId);
  }

  /**
   * Block a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to block
   * @param {number} blockDurationSeconds - Block duration in seconds (default: 1)
   * @returns {Promise<Object>} Block confirmation
   */
  async blockUser(roomId, userId, blockDurationSeconds = 1) {
    if (!roomId || !userId) {
      throw new Error('roomId and userId are required');
    }
    return await this._makeConferenceRequest(
      'POST',
      `/room/${roomId}/user/${userId}/block`,
      roomId,
      null,
      { blockDuration: blockDurationSeconds },
    );
  }

  /**
   * Unblock a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to unblock
   * @returns {Promise<Object>} Unblock confirmation
   */
  async unblockUser(roomId, userId) {
    if (!roomId || !userId) {
      throw new Error('roomId and userId are required');
    }
    return await this._makeConferenceRequest(
      'POST',
      `/room/${roomId}/user/${userId}/unblock`,
      roomId,
    );
  }

  /**
   * Get list of users in a room
   * @param {string} roomId - Room ID
   * @param {number} limit - Maximum number of users to return (default: 100)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} User list with count
   */
  async getUserList(roomId, limit = 100, offset = 0) {
    if (!roomId) {
      throw new Error('roomId is required');
    }
    return await this._makeConferenceRequest('GET', `/room/${roomId}/users`, roomId, null, {
      limit,
      offset,
    });
  }

  /**
   * Get list of hosts (publishers) in a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Host list with count
   */
  async getHostList(roomId) {
    if (!roomId) {
      throw new Error('roomId is required');
    }
    return await this._makeConferenceRequest('GET', `/room/${roomId}/hosts`, roomId);
  }

  /**
   * Get list of all rooms based on state
   * @param {string} state - Room state filter ('active', 'inactive', or 'all') (default: 'active')
   * @param {number} limit - Maximum number of rooms to return (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} Room list with count
   */
  async getRoomList(state = 'active', limit = 50, offset = 0) {
    // For getRoomList, we need admin token but roomId doesn't matter, using 'admin' as placeholder
    return await this._makeConferenceRequest('GET', '/rooms', 'admin', null, {
      limit,
      offset,
      state,
    });
  }

  /**
   * Start recording for a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Recording start confirmation with recording stream name
   */
  async startRecording(roomId) {
    if (!roomId) {
      throw new Error('roomId is required');
    }
    return await this._makeConferenceRequest('POST', `/room/${roomId}/startRecording`, roomId);
  }

  /**
   * Stop recording for a room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Recording stop confirmation
   */
  async stopRecording(roomId) {
    if (!roomId) {
      throw new Error('roomId is required');
    }
    return await this._makeConferenceRequest('POST', `/room/${roomId}/stopRecording`, roomId);
  }

  /**
   * Check if a user is joined to a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Join status information
   */
  async isUserJoined(roomId, userId) {
    if (!roomId || !userId) {
      throw new Error('roomId and userId are required');
    }
    return await this._makeConferenceRequest(
      'GET',
      `/room/${roomId}/user/${userId}/isJoined`,
      roomId,
    );
  }

  /**
   * Start transcription for a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID who will receive transcriptions
   * @returns {Promise<Object>} Transcription start confirmation
   */
  async startTranscription(roomId, userId) {
    if (!roomId || !userId) {
      throw new Error('roomId and userId are required');
    }
    return await this._makeConferenceRequest(
      'POST',
      `/room/${roomId}/user/${userId}/start-transcription`,
      roomId,
    );
  }

  /**
   * Stop transcription for a user in a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to stop receiving transcriptions
   * @returns {Promise<Object>} Transcription stop confirmation
   */
  async stopTranscription(roomId, userId) {
    if (!roomId) {
      throw new Error('roomId is required');
    }
    if (!userId) {
      throw new Error('userId is required');
    }
    return await this._makeConferenceRequest(
      'POST',
      `/room/${roomId}/user/${userId}/stop-transcription`,
      roomId,
    );
  }

  /**
   * Get list of all external streams
   * @returns {Promise<Object>} External streams list
   */
  async getExternalStreams() {
    return await this._makeConferenceRequest('GET', '/external-streams', 'admin');
  }

  /**
   * Add an external stream to a room
   * @param {string} roomName - Room name
   * @param {string} streamId - External stream ID
   * @returns {Promise<Object>} Confirmation
   */
  async addExternalStream(roomName, streamId) {
    if (!roomName || !streamId) {
      throw new Error('roomName and streamId are required');
    }
    return await this._makeConferenceRequest(
      'POST',
      `/room/${roomName}/external-stream/${streamId}`,
      roomName,
    );
  }

  /**
   * Remove an external stream from a room
   * @param {string} roomName - Room name
   * @param {string} streamId - External stream ID
   * @returns {Promise<Object>} Confirmation
   */
  async removeExternalStream(roomName, streamId) {
    if (!roomName || !streamId) {
      throw new Error('roomName and streamId are required');
    }
    return await this._makeConferenceRequest(
      'DELETE',
      `/room/${roomName}/external-stream/${streamId}`,
      roomName,
    );
  }

  /**
   * Get transcriptions for a room
   * @param {string} roomName - Room name
   * @param {number|string} [startTime] - Start time filter (unix ms)
   * @param {number|string} [endTime] - End time filter (unix ms)
   * @returns {Promise<Object>} Transcription data
   */
  async getTranscriptions(roomName, startTime, endTime) {
    if (!roomName) {
      throw new Error('roomName is required');
    }
    const params = {};
    if (startTime !== undefined) params.startTime = startTime;
    if (endTime !== undefined) params.endTime = endTime;
    return await this._makeConferenceRequest(
      'GET',
      `/room/${roomName}/transcriptions`,
      roomName,
      null,
      Object.keys(params).length ? params : null,
    );
  }
}

export default Red5Client;
