import OpenAI from "openai";
import {
  applyBestMatchToResult,
  searchAllCardDatabases,
} from "../utils/card-search.js";

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

export async function onRequestPost(context) {
  try {
    const openaiApiKey = context.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return Response.json(
        {
          success: false,
          message: "Missing OPENAI_API_KEY environment variable.",
        },
        { status: 500 }
      );
    }

    const formData = await context.request.formData();

    const frontImage = formData.get("frontImage");
    const backImage = formData.get("backImage");

    if (!frontImage) {
      return Response.json(
        {
          success: false,
          message: "Front image is required.",
        },
        { status: 400 }
      );
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!supportedTypes.includes(frontImage.type)) {
      return Response.json(
        {
          success: false,
          message: "Please upload a JPEG, PNG, WEBP, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (backImage && !supportedTypes.includes(backImage.type)) {
      return Response.json(
        {
          success: false,
          message: "Back image must be a JPEG, PNG, WEBP, or GIF image.",
        },
        { status: 400 }
      );
    }

    const frontBase64 = await fileToBase64(frontImage);
    const frontImageUrl = getImageDataUrl(frontImage, frontBase64);

    let backImageUrl = null;

    if (backImage) {
      const backBase64 = await fileToBase64(backImage);
      backImageUrl = getImageDataUrl(backImage, backBase64);
    }

    const imageInputs = [
      {
        type: "input_image",
        image_url: frontImageUrl,
        detail: "high",
      },
    ];

    if (backImageUrl) {
      imageInputs.push({
        type: "input_image",
        image_url: backImageUrl,
        detail: "high",
      });
    }

    const client = new OpenAI({
      apiKey: openaiApiKey,
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
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
              `.trim(),
            },
            ...imageInputs,
          ],
        },
      ],
    });

    const parsed = JSON.parse(cleanJsonText(response.output_text));

    const possibleMatches = await searchAllCardDatabases(parsed.detectedCard);
    parsed.possibleMatches = possibleMatches;

    const finalResult = applyBestMatchToResult(parsed);

    return Response.json({
      success: true,
      result: finalResult,
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