export function createAnalysisId() {
  return crypto.randomUUID();
}

function safeString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function safeInteger(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  return Math.trunc(number);
}

export async function saveAnalysis({
  db,
  analysisId,
  sessionId,
  result,
  frontImageKey,
  backImageKey,
}) {
  if (!db || !analysisId || !result) {
    return null;
  }

  const detectedCard = result.detectedCard || {};
  const grade = result.grade || {};
  const matchStatus = result.matchStatus || {};

  const createdAt = new Date().toISOString();

  await db
    .prepare(
      `
      INSERT INTO analyses (
        id,
        session_id,
        created_at,
        card_name,
        card_set,
        card_number,
        rarity,
        grade_score,
        grade_label,
        match_status,
        front_image_key,
        back_image_key,
        result_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      analysisId,
      safeString(sessionId),
      createdAt,
      safeString(detectedCard.name),
      safeString(detectedCard.set),
      safeString(detectedCard.number),
      safeString(detectedCard.rarity),
      safeInteger(grade.score),
      safeString(grade.label),
      safeString(matchStatus.status),
      safeString(frontImageKey),
      safeString(backImageKey),
      JSON.stringify(result)
    )
    .run();

  return {
    id: analysisId,
    sessionId,
    createdAt,
    frontImageKey,
    backImageKey,
  };
}

export async function listAnalyses({ db, sessionId, limit = 20 }) {
  if (!db || !sessionId) {
    return [];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const response = await db
    .prepare(
      `
      SELECT
        id,
        created_at,
        card_name,
        card_set,
        card_number,
        rarity,
        grade_score,
        grade_label,
        match_status,
        front_image_key,
        back_image_key
      FROM analyses
      WHERE session_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT ?
      `
    )
    .bind(sessionId, safeLimit)
    .all();

  return response.results || [];
}

export async function getAnalysisById({ db, id, sessionId }) {
  if (!db || !id || !sessionId) {
    return null;
  }

  const row = await db
    .prepare(
      `
      SELECT
        id,
        created_at,
        front_image_key,
        back_image_key,
        result_json
      FROM analyses
      WHERE id = ?
      AND session_id = ?
      LIMIT 1
      `
    )
    .bind(id, sessionId)
    .first();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    frontImageKey: row.front_image_key,
    backImageKey: row.back_image_key,
    result: JSON.parse(row.result_json),
  };
}

export async function getOldAnalysesForSession({
  db,
  sessionId,
  keepLimit = 20,
}) {
  if (!db || !sessionId) {
    return [];
  }

  const safeKeepLimit = Math.max(Number(keepLimit) || 20, 1);

  const response = await db
    .prepare(
      `
      SELECT
        id,
        front_image_key,
        back_image_key
      FROM analyses
      WHERE session_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT -1 OFFSET ?
      `
    )
    .bind(sessionId, safeKeepLimit)
    .all();

  return response.results || [];
}

export async function getExpiredAnalyses({ db, olderThanDays = 30 }) {
  if (!db) {
    return [];
  }

  const safeOlderThanDays = Math.max(Number(olderThanDays) || 30, 1);

  const response = await db
    .prepare(
      `
      SELECT
        id,
        front_image_key,
        back_image_key
      FROM analyses
      WHERE datetime(created_at) < datetime('now', ?)
      LIMIT 100
      `
    )
    .bind(`-${safeOlderThanDays} days`)
    .all();

  return response.results || [];
}

export async function deleteAnalysesByIds({ db, ids }) {
  if (!db || !ids?.length) {
    return;
  }

  const placeholders = ids.map(() => "?").join(",");

  await db
    .prepare(
      `
      DELETE FROM analyses
      WHERE id IN (${placeholders})
      `
    )
    .bind(...ids)
    .run();
}