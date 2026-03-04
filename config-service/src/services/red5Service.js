const configService = require('../services/configService');
const Red5Client = require('../../red5-client');

class Red5Service {
  async getClient() {
    const masterKey = process.env.CONFERENCE_MASTER_KEY;
    const masterSecret = process.env.CONFERENCE_MASTER_SECRET;
    const config = await configService.read();

    const host = config.VITE_HOST;

    if (!masterKey || !masterSecret) {
      throw new Error('Master key or secret not configured');
    }

    return new Red5Client(masterKey, masterSecret, host);
  }
}

module.exports = new Red5Service();
