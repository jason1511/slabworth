import { buildMarketLinks } from "../utils/card-search.js";
import {
  getAnalysisById,
  listAnalyses,
  updateAnalysisMatch,
} from "../utils/history-store.js";

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

function cleanString(value, maxLength = 200) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function cleanPricePoints(points, limit = 30) {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .slice(0, limit)
    .map((point) => ({
      label: cleanString(point?.label, 100),
      value: cleanNumber(point?.value),
    }))
    .filter((point) => point.label && point.value !== null);
}

function cleanMarketResults(marketResults) {
  if (!Array.isArray(marketResults)) {
    return [];
  }

  return marketResults.slice(0, 10).map((marketResult) => ({
    marketplace: cleanString(marketResult?.marketplace, 100),
    currency: cleanString(marketResult?.currency, 10) || "USD",
    description: cleanString(marketResult?.description, 500),
    url: cleanString(marketResult?.url, 2000),
    prices: cleanPricePoints(marketResult?.prices),
    priceHistory: cleanPricePoints(marketResult?.priceHistory),
  }));
}

function cleanSelectedMatch(match) {
  return {
    id: cleanString(match?.id, 200),
    name: cleanString(match?.name, 200),
    set: cleanString(match?.set, 200),
    number: cleanString(match?.number, 100),
    rarity: cleanString(match?.rarity, 100),
    image: cleanString(match?.image, 2000),
    source: cleanString(match?.source, 100),
    tcgplayerUrl: cleanString(match?.tcgplayerUrl, 2000),
    cardmarketUrl: cleanString(match?.cardmarketUrl, 2000),
    marketResults: cleanMarketResults(match?.marketResults),
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

export async function onRequestPatch(context) {
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

    const body = await context.request.json();
    const id = cleanString(body?.id, 100);
    const sessionId = cleanString(body?.sessionId, 200);
    const selectedMatch = cleanSelectedMatch(body?.match);

    if (!id || !sessionId || !selectedMatch.id || !selectedMatch.name) {
      return Response.json(
        {
          success: false,
          message: "Analysis ID, session ID, and selected match are required.",
        },
        { status: 400 }
      );
    }

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

    const updatedResult = {
      ...analysis.result,
      detectedCard: {
        ...(analysis.result?.detectedCard || {}),
        name: selectedMatch.name,
        set: selectedMatch.set,
        number: selectedMatch.number,
        rarity: selectedMatch.rarity,
        databaseId: selectedMatch.id,
        databaseImage: selectedMatch.image,
        tcgplayerUrl: selectedMatch.tcgplayerUrl,
        cardmarketUrl: selectedMatch.cardmarketUrl,
      },
      matchStatus: {
        status: "confirmed",
        message: "Database match selected by user and saved to history.",
      },
      marketResults: selectedMatch.marketResults,
      links: buildMarketLinks(selectedMatch),
    };

    const didUpdate = await updateAnalysisMatch({
      db,
      id,
      sessionId,
      result: updatedResult,
    });

    if (!didUpdate) {
      return Response.json(
        {
          success: false,
          message: "Analysis could not be updated.",
        },
        { status: 409 }
      );
    }

    return Response.json({
      success: true,
      result: attachImageUrlsToResult({
        ...analysis,
        result: updatedResult,
      }),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while saving the selected match.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
