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
        `SELECT id, provider FROM \`OAuthToken\`
         WHERE user_id = :userId AND provider = :provider
         LIMIT 1`,
        { replacements: { userId, provider }, type: QueryTypes.SELECT }
      ),
      'get provider token'
    );

    // Retourne 404 si pas de token → le frontend peut utiliser response.ok pour détecter l'état
    if (!rows.length) {
      return res.status(404).json({ connected: false });
    }

    return res.json({ connected: true, provider });
  } catch (error) {
    return sendDbError(res, error, 'Failed to retrieve token');
  }
}

async function deleteTokenByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    await withDbTimeout(
      sequelize.query(
        `DELETE FROM \`OAuthToken\` WHERE user_id = :userId AND provider = :provider`,
        { replacements: { userId, provider } }
      ),
      'delete provider token'
    );

    return res.json({ success: true, provider });
  } catch (error) {
    return sendDbError(res, error, 'Failed to disconnect provider');
  }
}

module.exports = {
  getTokenByProvider,
  deleteTokenByProvider,
};
