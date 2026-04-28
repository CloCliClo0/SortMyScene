const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Asks Gemini to filter a list of Deezer tracks based on a scene description.
 *
 * @param {Array<object>} tracks - Array of Deezer track objects.
 * @param {string} sceneDescription - User's description of the desired scene/mood.
 * @returns {Promise<number[]>} Resolves to an array of track IDs that match the scene.
 */
async function filterSongsForScene(tracks, sceneDescription) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Build a compact representation so we stay within token limits
  const songList = tracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist?.name ?? 'Unknown',
    album: t.album?.title ?? 'Unknown',
  }));

  const prompt = `
You are a music curator. Given a list of songs and a scene description, return ONLY the IDs of the songs that best fit the scene.

Scene description: "${sceneDescription}"

Song list (JSON):
${JSON.stringify(songList, null, 2)}

Respond with a valid JSON array of track IDs (numbers) that match the scene. Example: [123, 456, 789]
Return ONLY the JSON array — no explanation, no markdown fences.
`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown code fences
  const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

  let ids;
  try {
    ids = JSON.parse(clean);
  } catch {
    throw new Error(`Gemini returned unexpected output: ${text}`);
  }

  if (!Array.isArray(ids)) {
    throw new Error('Gemini response was not an array.');
  }

  return ids.filter((id) => typeof id === 'number');
}

module.exports = { filterSongsForScene };
