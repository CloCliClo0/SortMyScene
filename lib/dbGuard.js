const DEFAULT_DB_TIMEOUT_MS = 8000;

function getDbTimeoutMs() {
  const rawValue = Number(process.env.DB_TIMEOUT_MS);
  if (Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue;
  }
  return DEFAULT_DB_TIMEOUT_MS;
}

function withDbTimeout(promise, label = 'database operation') {
  const timeoutMs = getDbTimeoutMs();

  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${label} timed out after ${timeoutMs}ms`);
      error.code = 'DB_TIMEOUT';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function sendDbError(res, error, fallbackMessage) {
  const knownUnavailableCodes = new Set(['P1001', 'P1002', 'DB_TIMEOUT']);
  const status = knownUnavailableCodes.has(error?.code) ? 503 : 500;
  const message = status === 503 ? 'Database unavailable' : fallbackMessage;

  return res.status(status).json({
    message,
    error: error?.message || 'Unknown error',
    code: error?.code || 'UNKNOWN',
  });
}

module.exports = {
  withDbTimeout,
  sendDbError,
};
