import * as configService from '../services/configService.js';
import red5Service from '../services/red5Service.js';

class HealthController {
    check(req, res) {
        res.json({ status: 'ok' });
    }

    async checkNodeGroupAvailability(req, res) {
        try {
            const red5Client = await red5Service.getClient();

            const config = await configService.read();

            const host = config.VITE_HOST ?? red5Client.credentials.streamManagerHost;

            const response = await fetch(`https://${host}/as/v1/proxy/whip/live/test`);

            if (response.status === 404 || response.status === 500) {
                const data = await response.json().catch(() => ({}));
                if (response.status === 500 && data.error === 'Publisher limit reached.') {
                    return res.status(500).json({ error: 'Publisher limit reached.' });
                }
                return res.status(200).json({
                    isAvailable: false,
                });
            }

            res.status(200).json({
                isAvailable: true,
            });
        } catch (error) {
            if (error.message === 'Master key or secret not configured') {
                return res.status(500).json({ error: 'Master key or secret not configured' });
            }
            res.status(200).json({
                isAvailable: false,
            });
        }
    }
}

export default new HealthController();
