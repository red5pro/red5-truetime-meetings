import jwt from 'jsonwebtoken';
import red5Service from '../services/red5Service.js';

/** The bearer token on the request, or '' */
export const bearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
};

/**
 * The claims of a conference token this service issued (signed with the deployment's conference
 * secret), or null when it isn't one. Throws when the master credentials are missing, since then
 * no token can be checked.
 */
export async function verifyConferenceToken(token) {
  const red5Client = await red5Service.getClient();
  const { conferenceSecret } = red5Client.getCredentials();
  try {
    return jwt.verify(token, conferenceSecret, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

/**
 * Lets a request through only with a valid conference token (`Authorization: Bearer <token>`).
 *
 * @param {object} [options]
 * @param {string} [options.roomParam] route parameter that must match the token's room
 * @param {string[]} [options.roles] token roles allowed; any role when omitted
 */
export const requireConferenceToken =
  ({ roomParam, roles } = {}) =>
  async (req, res, next) => {
    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'A conference token is required' });
    }

    let claims;
    try {
      claims = await verifyConferenceToken(token);
    } catch (error) {
      console.error('Cannot verify conference tokens:', error.message);
      return res.status(503).json({ error: 'Cannot verify conference tokens' });
    }
    if (!claims) {
      return res.status(401).json({ error: 'Invalid or expired conference token' });
    }
    if (roomParam && claims.roomId !== req.params[roomParam]) {
      return res.status(403).json({ error: 'The conference token is for another room' });
    }
    if (roles && !roles.includes(claims.role)) {
      return res.status(403).json({ error: 'Not allowed for this role' });
    }

    req.conference = claims;
    next();
  };
