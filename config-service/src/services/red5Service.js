import configService from '../services/configService.js';
import Red5Client from '../../red5-client.js';

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

export default new Red5Service();
