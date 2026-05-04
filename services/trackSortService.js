/**
 * Service pour le tri des tracks selon différents critères
 */

/**
 * Options de tri disponibles
 */
const SORT_OPTIONS = {
  popularity: { label: 'Popularity', compareFn: (a, b) => (b.popularity || 0) - (a.popularity || 0) },
  alphabetical: { label: 'A-Z', compareFn: (a, b) => (a.title || '').localeCompare(b.title || '') },
  duration_asc: { label: 'Duration (Short to Long)', compareFn: (a, b) => (a.duration_ms || 0) - (b.duration_ms || 0) },
  duration_desc: { label: 'Duration (Long to Short)', compareFn: (a, b) => (b.duration_ms || 0) - (a.duration_ms || 0) },
  artist: { label: 'Artist', compareFn: (a, b) => (a.artist || '').localeCompare(b.artist || '') },
  recent: { label: 'Recently Added', compareFn: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) },
};

/**
 * Trie un tableau de tracks selon le critère spécifié
 */
function sortTracks(tracks, sortBy = 'popularity') {
  const tracksCopy = [...tracks];
  const sortOption = SORT_OPTIONS[sortBy] || SORT_OPTIONS.popularity;
  
  return tracksCopy.sort(sortOption.compareFn);
}

/**
 * Filtre les tracks selon certains critères
 */
function filterTracks(tracks, filters = {}) {
  let filtered = [...tracks];

  // Filtre par durée minimale (en ms)
  if (filters.minDuration !== undefined) {
    filtered = filtered.filter(t => (t.duration_ms || 0) >= filters.minDuration);
  }

  // Filtre par durée maximale (en ms)
  if (filters.maxDuration !== undefined) {
    filtered = filtered.filter(t => (t.duration_ms || 0) <= filters.maxDuration);
  }

  // Filtre par popularité minimale (0-100)
  if (filters.minPopularity !== undefined) {
    filtered = filtered.filter(t => (t.popularity || 0) >= filters.minPopularity);
  }

  // Filtre par artiste (recherche partielle)
  if (filters.artist !== undefined && filters.artist.trim()) {
    const searchTerm = filters.artist.toLowerCase().trim();
    filtered = filtered.filter(t => (t.artist || '').toLowerCase().includes(searchTerm));
  }

  // Filtre par titre (recherche partielle)
  if (filters.title !== undefined && filters.title.trim()) {
    const searchTerm = filters.title.toLowerCase().trim();
    filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(searchTerm));
  }

  // Filtre par provider
  if (filters.provider !== undefined) {
    filtered = filtered.filter(t => t.provider === filters.provider);
  }

  return filtered;
}

/**
 * Trie et filtre les tracks
 */
function processTracks(tracks, sortBy = 'popularity', filters = {}) {
  const filtered = filterTracks(tracks, filters);
  const sorted = sortTracks(filtered, sortBy);
  return sorted;
}

/**
 * Récupère les options de tri disponibles
 */
function getSortOptions() {
  return Object.entries(SORT_OPTIONS).map(([key, value]) => ({
    key,
    label: value.label,
  }));
}

/**
 * Récupère les statistiques des tracks
 */
function getTrackStats(tracks) {
  if (!tracks || tracks.length === 0) {
    return {
      total: 0,
      averageDuration: 0,
      averagePopularity: 0,
      totalDuration: 0,
      minDuration: 0,
      maxDuration: 0,
    };
  }

  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const totalPopularity = tracks.reduce((sum, t) => sum + (t.popularity || 0), 0);
  const durations = tracks.map(t => t.duration_ms || 0).sort((a, b) => a - b);

  return {
    total: tracks.length,
    averageDuration: Math.round(totalDuration / tracks.length),
    averagePopularity: Math.round(totalPopularity / tracks.length),
    totalDuration,
    minDuration: durations[0] || 0,
    maxDuration: durations[durations.length - 1] || 0,
  };
}

module.exports = {
  sortTracks,
  filterTracks,
  processTracks,
  getSortOptions,
  getTrackStats,
  SORT_OPTIONS,
};
