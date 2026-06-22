export function getFileExtension(file) {
  const type = file?.type || "";

  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";

  return "jpg";
}

export function createImageKey({ analysisId, side, file }) {
  const extension = getFileExtension(file);

  return `analyses/${analysisId}/${side}.${extension}`;
}

export async function saveImageToR2({ bucket, key, file }) {
  if (!bucket || !key || !file) {
    return null;
  }

  const arrayBuffer = await file.arrayBuffer();

  await bucket.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  return key;
}

export async function readImageFromR2({ bucket, key }) {
  if (!bucket || !key) {
    return null;
  }

  return bucket.get(key);
}