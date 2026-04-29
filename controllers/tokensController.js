const { QueryTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

async function getTokenByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    const rows = await withDbTimeout(
      sequelize.query(
        `SELECT id, user_id, provider, access_token, refresh_token, expires_in
         FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider
         LIMIT 1`,
        {
          replacements: { userId, provider },
          type: QueryTypes.SELECT,
        }
      ),
      'get provider token'
    );

    const token = rows[0] || null;

    return res.json(token || null);
  } catch (error) {
    return sendDbError(res, error, 'Failed to retrieve token');
  }
}

module.exports = {
  getTokenByProvider,
};
