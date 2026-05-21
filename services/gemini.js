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

/**
 * Generic version: filters an array of tracks using Gemini based on a scene description.
 * Uses array indices to avoid issues with non-numeric platform IDs (Spotify/YouTube).
 *
 * @param {Array<{title: string, artist: string}>} tracks - Generic track objects.
 * @param {string} sceneDescription - User's description of the desired scene/mood.
 * @returns {Promise<Array>} Resolves to the filtered subset of the original tracks array.
 */
async function filterTracksForScene(tracks, sceneDescription) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const songList = tracks.map((t, index) => ({
    id: index,
    title: t.title || 'Unknown',
    artist: t.artist || 'Unknown',
  }));

  const prompt = `
You are a music curator. Given a list of songs and a scene description, select the songs that best fit the scene and return their indices.

Scene description: "${sceneDescription}"

Song list (JSON):
${JSON.stringify(songList, null, 2)}

Respond with a valid JSON array of indices (numbers from the list above) that match the scene. Example: [0, 2, 5]
Return ONLY the JSON array — no explanation, no markdown fences.
`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '').trim();

  let indices;
  try {
    indices = JSON.parse(clean);
  } catch {
    throw new Error(`Gemini returned unexpected output: ${text}`);
  }

  if (!Array.isArray(indices)) {
    throw new Error('Gemini response was not an array.');
  }

  return indices
    .filter((i) => typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < tracks.length)
    .map((i) => tracks[i]);
}

const ASSISTANT_SYSTEM = `
You are SortMyScene Assistant, a helpful AI embedded in the SortMyScene music curation app.
You help users with three things:
1. APP USAGE: Explain how to use SortMyScene features (create scenes, connect Spotify/YouTube in Settings, use Sort Studio, manage playlists in Library, edit scenes).
2. MUSIC RECOMMENDATIONS: Suggest moods, genres, artists, or playlist ideas based on what the user describes.
3. CURATION PROMPTS: Help the user write better scene descriptions/prompts for the Gemini AI sort (e.g. "melodic house for a sunset beach bar" or "dark ambient for late-night focus").

Always be concise, friendly, and music-focused. Reply in the same language as the user (French or English).
If asked about something unrelated to music or the app, politely redirect.
`.trim();

/**
 * Multi-turn chat assistant using Gemini.
 * @param {Array<{role: 'user'|'model', parts: string}>} history - Previous turns.
 * @param {string} message - New user message.
 * @returns {Promise<string>} Assistant reply.
 */
async function chatWithAssistant(history, message) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: ASSISTANT_SYSTEM,
  });

  const chat = model.startChat({
    history: history.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.parts }],
    })),
  });

  const result = await chat.sendMessage(message);
  return result.response.text().trim();
}

module.exports = { filterSongsForScene, filterTracksForScene, chatWithAssistant };
