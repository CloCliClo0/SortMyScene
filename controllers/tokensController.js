const prisma = require('../lib/prisma');

async function getTokenByProvider(req, res) {
  try {
    const { provider } = req.params;

    if (!['deezer', 'spotify'].includes(provider)) {
      return res.status(400).json({ message: 'provider must be deezer or spotify' });
    }

    const userId = Number(req.user.id);

    const token = await prisma.oAuthToken.findUnique({
      where: {
        user_id_provider: {
          user_id: userId,
          provider,
        },
      },
    });

    return res.json(token || null);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve token', error: error.message });
  }
}

module.exports = {
  getTokenByProvider,
};
