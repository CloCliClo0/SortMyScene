const { chatWithAssistant } = require('../services/gemini');

async function chat(req, res) {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI assistant not configured (GEMINI_API_KEY missing)' });
  }

  const safeHistory = Array.isArray(history)
    ? history.filter(
        (h) =>
          h &&
          (h.role === 'user' || h.role === 'model') &&
          typeof h.parts === 'string'
      ).slice(-20)
    : [];

  try {
    const reply = await chatWithAssistant(safeHistory, message.trim());
    return res.json({ reply });
  } catch (error) {
    console.error('[chatController] Gemini error:', error.message);
    return res.status(500).json({ error: 'AI assistant temporarily unavailable' });
  }
}

module.exports = { chat };
