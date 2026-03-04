const red5Service = require('../services/red5Service');

class RoomController {
  async getUsers(req, res) {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        return res.status(400).json({ error: 'roomId is required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.getUserList(roomId);

      res.json({
        success: true,
        users: result.users ?? [],
        userCount: result.userCount ?? 0,
      });
    } catch (error) {
      // Original code returns success: false and empty users on error
      if (error.message === 'Master key or secret not configured') {
        return res.status(500).json({ error: 'Master key or secret not configured' });
      }
      res.json({
        success: false,
        users: {
          userCount: 0,
          users: [],
        },
      });
    }
  }

  async checkUserJoined(req, res) {
    try {
      const { roomId, userId } = req.params;
      if (!roomId || !userId) {
        return res.status(400).json({ error: 'roomId and userId are required' });
      }

      const red5Client = await red5Service.getClient();
      const status = await red5Client.isUserJoined(roomId, userId);

      res.json(status);
    } catch (error) {
      console.error('Error checking join status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getExternalStreams(req, res) {
    try {
      const red5Client = await red5Service.getClient();
      const result = await red5Client.getExternalStreams();
      res.json(result);
    } catch (error) {
      console.error('Error getting external streams:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async addExternalStream(req, res) {
    try {
      const { roomName, streamId } = req.params;
      if (!roomName || !streamId) {
        return res.status(400).json({ error: 'roomName and streamId are required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.addExternalStream(roomName, streamId);
      res.json(result);
    } catch (error) {
      console.error('Error adding external stream:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async removeExternalStream(req, res) {
    try {
      const { roomName, streamId } = req.params;
      if (!roomName || !streamId) {
        return res.status(400).json({ error: 'roomName and streamId are required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.removeExternalStream(roomName, streamId);
      res.json(result);
    } catch (error) {
      console.error('Error removing external stream:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async startRecording(req, res) {
    try {
      const { roomName } = req.params;
      if (!roomName) {
        return res.status(400).json({ error: 'roomName is required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.startRecording(roomName);
      res.json(result);
    } catch (error) {
      console.error('Error starting recording:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async stopRecording(req, res) {
    try {
      const { roomName } = req.params;
      if (!roomName) {
        return res.status(400).json({ error: 'roomName is required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.stopRecording(roomName);
      res.json(result);
    } catch (error) {
      console.error('Error stopping recording:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async blockUser(req, res) {
    try {
      const { roomName, userId } = req.params;
      if (!roomName || !userId) {
        return res.status(400).json({ error: 'roomName and userId are required' });
      }

      const blockDuration = req.query.blockDuration ? parseInt(req.query.blockDuration) : 1;
      const red5Client = await red5Service.getClient();
      const result = await red5Client.blockUser(roomName, userId, blockDuration);
      res.json(result);
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async unblockUser(req, res) {
    try {
      const { roomName, userId } = req.params;
      if (!roomName || !userId) {
        return res.status(400).json({ error: 'roomName and userId are required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.unblockUser(roomName, userId);
      res.json(result);
    } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getTranscriptions(req, res) {
    try {
      const { roomName } = req.params;
      if (!roomName) {
        return res.status(400).json({ error: 'roomName is required' });
      }

      const { startTime, endTime } = req.query;
      const red5Client = await red5Service.getClient();
      const result = await red5Client.getTranscriptions(roomName, startTime, endTime);
      res.json(result);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async startTranscription(req, res) {
    try {
      const { roomName, userId } = req.params;
      if (!roomName || !userId) {
        return res.status(400).json({ error: 'roomName and userId are required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.startTranscription(roomName, userId);
      res.json(result);
    } catch (error) {
      console.error('Error starting transcription:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async stopTranscription(req, res) {
    try {
      const { roomName, userId } = req.params;
      if (!roomName || !userId) {
        return res.status(400).json({ error: 'roomName and userId are required' });
      }

      const red5Client = await red5Service.getClient();
      const result = await red5Client.stopTranscription(roomName, userId);
      res.json(result);
    } catch (error) {
      console.error('Error stopping transcription:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RoomController();
