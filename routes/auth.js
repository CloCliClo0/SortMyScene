const express = require('express');
const axios = require('axios');

const router = express.Router();

const DEEZER_AUTH_URL = 'https://connect.deezer.com/oauth/auth.php';
const DEEZER_TOKEN_URL = 'https://connect.deezer.com/oauth/access_token.php';

/**
 * GET /auth/deezer
 * Redirects the user to the Deezer authorization page.
 */
router.get('/deezer', (req, res) => {
  const params = new URLSearchParams({
    app_id: process.env.DEEZER_APP_ID,
    redirect_uri: process.env.DEEZER_REDIRECT_URI,
    perms: 'basic_access,manage_library',
  });

  res.redirect(`${DEEZER_AUTH_URL}?${params.toString()}`);
});

/**
 * GET /auth/deezer/callback
 * Exchanges the authorization code for an access token and saves it in the
 * session, then redirects the user back to the dashboard.
 */
router.get('/deezer/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing.' });
  }

  try {
    const response = await axios.get(DEEZER_TOKEN_URL, {
      params: {
        app_id: process.env.DEEZER_APP_ID,
        secret: process.env.DEEZER_APP_SECRET,
        code,
        output: 'json',
      },
    });

    // Deezer returns a plain text body "access_token=xxx&expires=xxx" unless
    // output=json is requested.  Handle both formats defensively.
    let accessToken;
    if (response.data && typeof response.data === 'object') {
      accessToken = response.data.access_token;
    } else {
      const parsed = new URLSearchParams(String(response.data));
      accessToken = parsed.get('access_token');
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Could not obtain access token from Deezer.' });
    }

    req.session.deezerToken = accessToken;
    res.redirect('/?connected=true');
  } catch (err) {
    console.error('Deezer OAuth error:', err.message);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
});

/**
 * GET /auth/logout
 * Destroys the session and redirects to the home page.
 */
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
