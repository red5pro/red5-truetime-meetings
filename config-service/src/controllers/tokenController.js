const red5Service = require('../services/red5Service');

class TokenController {
  async generateToken(req, res) {
    try {
      const red5Client = await red5Service.getClient();

      const conferenceToken = await red5Client.getConferenceToken(
        req.body.userId,
        req.body.roomId,
        req.body.role,
        req.body.expirationMinutes,
      );

      res.json({
        success: true,
        token: conferenceToken,
      });
    } catch (error) {
      console.error('Error generating token:', error);
      if (error.message === 'Master key or secret not configured') {
        return res.status(401).json({ error: 'Master key or secret not found' });
      }
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }
}

module.exports = new TokenController();
