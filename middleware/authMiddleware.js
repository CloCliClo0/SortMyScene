const jwt = require('jsonwebtoken');

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return jwt.verify(token, secret);
}

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, is_admin: Boolean(payload.is_admin) };

    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth };
