import { readImageFromR2 } from "../../utils/r2-images.js";

function getImageKeyFromUrl(requestUrl) {
  const url = new URL(requestUrl);
  const prefix = "/api/image/";
  const pathname = url.pathname;

  if (!pathname.startsWith(prefix)) {
    return "";
  }

  const rawKey = pathname.slice(prefix.length);

  return decodeURIComponent(rawKey);
}

export async function onRequestGet(context) {
  try {
    const bucket = context.env.slabworth_card_images;

    if (!bucket) {
      return Response.json(
        {
          success: false,
          message: "Missing slabworth_card_images R2 binding.",
        },
        { status: 500 }
      );
    }

    const key = getImageKeyFromUrl(context.request.url);

    if (!key) {
      return Response.json(
        {
          success: false,
          message: "Image key is required.",
        },
        { status: 400 }
      );
    }

    const object = await readImageFromR2({
      bucket,
      key,
    });

    if (!object) {
      return Response.json(
        {
          success: false,
          message: "Image not found.",
        },
        { status: 404 }
      );
    }

    const headers = new Headers();

    object.writeHttpMetadata(headers);

    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "private, max-age=3600");

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while loading the image.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}