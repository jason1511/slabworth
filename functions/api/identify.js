import OpenAI from "openai";
import {
  applyBestMatchToResult,
  searchAllCardDatabases,
} from "../utils/card-search.js";
import { cleanupAfterSave } from "../utils/cleanup.js";
import { createAnalysisId, saveAnalysis } from "../utils/history-store.js";
import { createImageKey, saveImageToR2 } from "../utils/r2-images.js";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function getImageDataUrl(file, base64) {
  return `data:${file.type};base64,${base64}`;
}

function cleanJsonText(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function fileToBase64(file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function validateImageFile(file, label) {
  if (!file) {
    return `${label} image is required.`;
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return `${label} image must be a JPEG, PNG, WEBP, or GIF image.`;
  }

  return "";
}

async function saveUploadedImages({ bucket, analysisId, frontImage, backImage }) {
  const frontImageKey = createImageKey({
    analysisId,
    side: "front",
    file: frontImage,
  });

  await saveImageToR2({
    bucket,
    key: frontImageKey,
    file: frontImage,
  });

  let backImageKey = "";

  if (backImage) {
    backImageKey = createImageKey({
      analysisId,
      side: "back",
      file: backImage,
    });

    await saveImageToR2({
      bucket,
      key: backImageKey,
      file: backImage,
    });
  }

  return {
    frontImageKey,
    backImageKey,
  };
}

async function buildImageInputs({ frontImage, backImage }) {
  const frontBase64 = await fileToBase64(frontImage);
  const frontImageUrl = getImageDataUrl(frontImage, frontBase64);

  const imageInputs = [
    {
      type: "input_image",
      image_url: frontImageUrl,
      detail: "high",
    },
  ];

  if (backImage) {
    const backBase64 = await fileToBase64(backImage);
    const backImageUrl = getImageDataUrl(backImage, backBase64);

    imageInputs.push({
      type: "input_image",
      image_url: backImageUrl,
      detail: "high",
    });
  }

  return imageInputs;
}

function buildPrompt() {
  return `
You are helping build a Pokémon card identification and grade-estimation web tool.

Analyze the uploaded Pokémon card image or images.

Return JSON only. Do not include markdown.

Use this exact shape:
{
  "detectedCard": {
    "name": "",
    "set": "",
    "number": "",
    "language": "",
    "confidence": 0
  },
  "grade": {
    "score": 0,
    "label": "",
    "confidence": "",
    "breakdown": {
      "centering": 0,
      "corners": 0,
      "edges": 0,
      "surface": 0,
      "back": 0
    },
    "notes": []
  },
  "photoQuality": {
    "rating": "",
    "issues": [],
    "recommendations": []
  },
  "links": []
}

Rules:
- Identify the card from visible information.
- Focus on Pokémon cards.
- If the exact card is uncertain, give the best visible guess and reduce confidence.
- Extract the card number exactly as printed if visible, including slash formatting like "089/086", "025/165", "SV12", or promo-style numbers.
- Extract set symbols, set codes, and language clues if visible.
- grade.score must be a number from 1 to 10, or 0 if unable to estimate.
- grade.label must be one of:
  "Gem Mint Candidate",
  "Mint Candidate",
  "Near Mint Candidate",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
  "Unable to Estimate"
- Use this guide:
  10 = Gem Mint Candidate, nearly perfect visible condition
  9 = Mint Candidate, very clean with tiny visible issues
  8 = Near Mint Candidate, clean but with noticeable minor issues
  6-7 = Lightly Played, visible edge/corner/surface wear
  4-5 = Moderately Played, clear wear but still presentable
  2-3 = Heavily Played, major wear, whitening, bends, scratches, or dents
  1 = Damaged, severe crease, tear, water damage, heavy surface damage, or major structural issue
- grade.breakdown must include numeric scores from 1 to 10, or 0 if unable to estimate.
- grade.breakdown.centering = visible front centering quality.
- grade.breakdown.corners = visible corner sharpness and corner wear.
- grade.breakdown.edges = visible edge whitening, chipping, or wear.
- grade.breakdown.surface = visible scratches, dents, print lines, stains, glare-limited surface quality.
- grade.breakdown.back = back-side condition if back image is provided, otherwise 0.
- The overall grade.score should be a conservative estimate based on the weakest visible areas, not simply the average.
- If the image quality is too poor to estimate, use score 0 and label "Unable to Estimate".
- photoQuality.rating must be one of:
  "Good",
  "Acceptable",
  "Poor",
  "Unable to Judge"
- photoQuality.issues should list visible photo problems such as blur, glare, cropped card edges, low resolution, bad lighting, tilt, sleeve reflection, or missing back image.
- photoQuality.recommendations should give practical advice for taking a better photo, such as using flat lighting, removing sleeve glare, placing the card on a dark surface, or uploading the back image.
- If the photo is clear enough, still mention strengths such as "Front image is clear enough for visible inspection."
- This is not an official PSA, CGC, or Beckett grade.
- For grade notes, mention visible centering, corners, edges, surface, back condition, and photo quality where possible.
- If only the front image is provided, mention that back-side grading is limited.
- links should contain 4 objects:
  { "label": "Search raw card", "query": "..." }
  { "label": "Search PSA 8", "query": "..." }
  { "label": "Search PSA 9", "query": "..." }
  { "label": "Search PSA 10", "query": "..." }
- Use the detected card name and number in the link queries.
- Rarity is not the same as grade. Rarity comes from the card database if available. Grade is only the physical condition estimate.
  `.trim();
}

async function analyzeCardWithOpenAI({ apiKey, imageInputs }) {
  const client = new OpenAI({
    apiKey,
  });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(),
          },
          ...imageInputs,
        ],
      },
    ],
  });

  return JSON.parse(cleanJsonText(response.output_text));
}

function addHistoryMetadata({
  result,
  analysisId,
  sessionId,
  frontImageKey,
  backImageKey,
}) {
  return {
    ...result,
    analysis: {
      id: analysisId,
      sessionId,
      frontImageKey,
      backImageKey,
      frontImageUrl: `/api/image/${encodeURIComponent(frontImageKey)}`,
      backImageUrl: backImageKey
        ? `/api/image/${encodeURIComponent(backImageKey)}`
        : "",
    },
  };
}

export async function onRequestPost(context) {
  try {
    const openaiApiKey = context.env.OPENAI_API_KEY;
    const db = context.env.slabworth_history;
    const bucket = context.env.slabworth_card_images;

    if (!openaiApiKey) {
      return Response.json(
        {
          success: false,
          message: "Missing OPENAI_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    if (!db) {
      return Response.json(
        {
          success: false,
          message: "Missing slabworth_history D1 binding.",
        },
        { status: 500 }
      );
    }

    if (!bucket) {
      return Response.json(
        {
          success: false,
          message: "Missing slabworth_card_images R2 binding.",
        },
        { status: 500 }
      );
    }

    const formData = await context.request.formData();

    const frontImage = formData.get("frontImage");
    const backImage = formData.get("backImage");
    const sessionId = formData.get("sessionId") || "";

    if (!sessionId) {
      return Response.json(
        {
          success: false,
          message: "Missing session ID.",
        },
        { status: 400 }
      );
    }

    const frontError = validateImageFile(frontImage, "Front");

    if (frontError) {
      return Response.json(
        {
          success: false,
          message: frontError,
        },
        { status: 400 }
      );
    }

    if (backImage) {
      const backError = validateImageFile(backImage, "Back");

      if (backError) {
        return Response.json(
          {
            success: false,
            message: backError,
          },
          { status: 400 }
        );
      }
    }

    const analysisId = createAnalysisId();

    const { frontImageKey, backImageKey } = await saveUploadedImages({
      bucket,
      analysisId,
      frontImage,
      backImage,
    });

    const imageInputs = await buildImageInputs({
      frontImage,
      backImage,
    });

    const parsed = await analyzeCardWithOpenAI({
      apiKey: openaiApiKey,
      imageInputs,
    });

    const possibleMatches = await searchAllCardDatabases(parsed.detectedCard);
    parsed.possibleMatches = possibleMatches;

    const finalResult = applyBestMatchToResult(parsed);

    const resultWithHistory = addHistoryMetadata({
      result: finalResult,
      analysisId,
      sessionId,
      frontImageKey,
      backImageKey,
    });

    await saveAnalysis({
      db,
      analysisId,
      sessionId,
      result: resultWithHistory,
      frontImageKey,
      backImageKey,
    });

    await cleanupAfterSave({
      db,
      bucket,
      sessionId,
      keepPerSession: 20,
      expireAfterDays: 30,
    });

    return Response.json({
      success: true,
      analysisId,
      result: resultWithHistory,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while identifying the card.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function onRequestGet() {
  return Response.json({
    success: true,
    message: "SlabWorth identify API is running.",
  });
}