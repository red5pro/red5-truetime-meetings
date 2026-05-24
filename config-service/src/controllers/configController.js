import configService from '../services/configService.js';
import { validateConfig } from '../utils/validation.js';

class ConfigController {
  async getConfig(req, res) {
    try {
      const config = await configService.read();
      res.json(configService.maskSensitiveFields(config));
    } catch {
      res.status(500).json({ error: 'Failed to read configuration' });
    }
  }

  async updateConfig(req, res) {
    try {
      // Sanitize VITE_HOST and VITE_BACKEND_HOST
      if (req.body.VITE_HOST) {
        req.body.VITE_HOST = req.body.VITE_HOST.replace(/^https?:\/\//, '');
      }
      if (req.body.VITE_BACKEND_HOST) {
        req.body.VITE_BACKEND_HOST = req.body.VITE_BACKEND_HOST.replace(/^https?:\/\//, '');
      }

      // Validate incoming config
      const validationErrors = validateConfig(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationErrors,
        });
      }

      const updatedConfig = await configService.update(req.body);

      console.log('Configuration updated:', Object.keys(req.body));

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        config: configService.maskSensitiveFields(updatedConfig),
      });
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  }

  async replaceConfig(req, res) {
    try {
      // Sanitize VITE_HOST and VITE_BACKEND_HOST
      if (req.body.VITE_HOST) {
        req.body.VITE_HOST = req.body.VITE_HOST.replace(/^https?:\/\//, '');
      }
      if (req.body.VITE_BACKEND_HOST) {
        req.body.VITE_BACKEND_HOST = req.body.VITE_BACKEND_HOST.replace(/^https?:\/\//, '');
      }

      // Validate incoming config
      const validationErrors = validateConfig(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: validationErrors,
        });
      }

      const newConfig = await configService.replace(req.body);

      console.log('Configuration replaced entirely');

      res.json({
        success: true,
        message: 'Configuration replaced successfully',
        config: configService.maskSensitiveFields(newConfig),
      });
    } catch (error) {
      console.error('Error replacing config:', error);
      res.status(500).json({ error: 'Failed to replace configuration' });
    }
  }
}

export default new ConfigController();
