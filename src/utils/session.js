const SESSION_STORAGE_KEY = "slabworth_session_id";

export function getSessionId() {
  const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = crypto.randomUUID();

  localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);

  return newSessionId;
}