const MEETINGS_CONFIG_ADMIN_TOKEN = process.env.MEETINGS_CONFIG_ADMIN_TOKEN || 'default-admin-token-change-me';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (token !== MEETINGS_CONFIG_ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Invalid authentication token' });
    }

    next();
};

module.exports = authMiddleware;
