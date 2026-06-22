import { getAnalysisById, listAnalyses } from "../utils/history-store.js";

function buildImageUrl(key) {
  if (!key) return "";

  return `/api/image/${encodeURIComponent(key)}`;
}

function mapHistoryRow(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    cardName: row.card_name || "Unknown card",
    cardSet: row.card_set || "",
    cardNumber: row.card_number || "",
    rarity: row.rarity || "",
    gradeScore: row.grade_score,
    gradeLabel: row.grade_label || "",
    matchStatus: row.match_status || "",
    frontImageKey: row.front_image_key || "",
    backImageKey: row.back_image_key || "",
    frontImageUrl: buildImageUrl(row.front_image_key),
    backImageUrl: buildImageUrl(row.back_image_key),
  };
}

function attachImageUrlsToResult(analysis) {
  const result = analysis.result || {};

  return {
    ...result,
    analysis: {
      ...(result.analysis || {}),
      id: analysis.id,
      createdAt: analysis.createdAt,
      frontImageKey: analysis.frontImageKey || "",
      backImageKey: analysis.backImageKey || "",
      frontImageUrl: buildImageUrl(analysis.frontImageKey),
      backImageUrl: buildImageUrl(analysis.backImageKey),
    },
  };
}

export async function onRequestGet(context) {
  try {
    const db = context.env.slabworth_history;

    if (!db) {
      return Response.json(
        {
          success: false,
          message: "Missing slabworth_history D1 binding.",
        },
        { status: 500 }
      );
    }

    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    const sessionId = url.searchParams.get("sessionId");
    const limit = url.searchParams.get("limit") || 20;

    if (!sessionId) {
      return Response.json(
        {
          success: false,
          message: "Missing session ID.",
        },
        { status: 400 }
      );
    }

    if (id) {
      const analysis = await getAnalysisById({
        db,
        id,
        sessionId,
      });

      if (!analysis) {
        return Response.json(
          {
            success: false,
            message: "Analysis not found.",
          },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        analysis: {
          id: analysis.id,
          createdAt: analysis.createdAt,
          frontImageKey: analysis.frontImageKey,
          backImageKey: analysis.backImageKey,
          frontImageUrl: buildImageUrl(analysis.frontImageKey),
          backImageUrl: buildImageUrl(analysis.backImageKey),
        },
        result: attachImageUrlsToResult(analysis),
      });
    }

    const rows = await listAnalyses({
      db,
      sessionId,
      limit,
    });

    return Response.json({
      success: true,
      analyses: rows.map(mapHistoryRow),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while loading analysis history.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}