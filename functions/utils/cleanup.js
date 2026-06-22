import {
  deleteAnalysesByIds,
  getExpiredAnalyses,
  getOldAnalysesForSession,
} from "./history-store.js";

async function deleteR2Objects({ bucket, rows }) {
  if (!bucket || !rows?.length) {
    return;
  }

  const keys = rows
    .flatMap((row) => [row.front_image_key, row.back_image_key])
    .filter(Boolean);

  await Promise.allSettled(keys.map((key) => bucket.delete(key)));
}

export async function cleanupAfterSave({
  db,
  bucket,
  sessionId,
  keepPerSession = 20,
  expireAfterDays = 30,
}) {
  if (!db || !bucket || !sessionId) {
    return;
  }

  const oldSessionRows = await getOldAnalysesForSession({
    db,
    sessionId,
    keepLimit: keepPerSession,
  });

  const expiredRows = await getExpiredAnalyses({
    db,
    olderThanDays: expireAfterDays,
  });

  const rowsToDelete = [...oldSessionRows, ...expiredRows];

  if (!rowsToDelete.length) {
    return;
  }

  await deleteR2Objects({
    bucket,
    rows: rowsToDelete,
  });

  const ids = rowsToDelete.map((row) => row.id);

  await deleteAnalysesByIds({
    db,
    ids,
  });
}