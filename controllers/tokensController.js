const prisma = require('../lib/prisma');
const { withDbTimeout, sendDbError } = require('../lib/dbGuard');

async function getTokenByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify', 'youtube'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer, spotify or youtube' });
    }

    const userId = Number(req.user.id);

    const token = await withDbTimeout(prisma.oAuthToken.findUnique({
      where: {
        user_id_provider: {
          user_id: userId,
          provider,
        },
      },
    }), 'get provider token');

    return res.json(token || null);
  } catch (error) {
    return sendDbError(res, error, 'Failed to retrieve token');
  }
}

module.exports = {
  getTokenByProvider,
};
