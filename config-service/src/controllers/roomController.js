const red5Service = require('../services/red5Service');

class RoomController {
    async getUsers(req, res) {
        try {
            const { roomId } = req.params;
            if (!roomId) {
                return res.status(400).json({ error: 'roomId is required' });
            }

            const red5Client = await red5Service.getClient();
            const users = await red5Client.getUserList(roomId);

            res.json({
                success: true,
                users: users
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
                    users: []
                }
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
}

module.exports = new RoomController();
