import OpenAI from "openai";

function getImageDataUrl(file, base64) {
  return `data:${file.type};base64,${base64}`;
}

function cleanJsonText(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalizeCardNumber(number) {
  if (!number) return "";

  return String(number).split("/")[0].trim();
}

function buildPokemonTcgQueries(card) {
  const queries = [];
  const name = card.name?.trim();
  const number = normalizeCardNumber(card.number);

  if (name && number) {
    queries.push(`name:"${name}" number:"${number}"`);
  }

  if (number) {
    queries.push(`number:"${number}"`);
  }

  if (name) {
    queries.push(`name:"${name}"`);
  }

  return queries;
}
function mapPokemonTcgCard(item) {
  return {
    source: "pokemon-tcg-api",
    id: item.id,
    name: item.name,
    set: item.set?.name || "",
    series: item.set?.series || "",
    number: item.number || "",
    rarity: item.rarity || "",
    image: item.images?.small || "",
    tcgplayerUrl: item.tcgplayer?.url || "",
    cardmarketUrl: item.cardmarket?.url || "",
  };
}

async function searchPokemonTcg(card) {
  const queries = buildPokemonTcgQueries(card);
  const allMatches = [];

  for (const query of queries) {
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
      query
    )}&pageSize=5`;

    const response = await fetch(url);

    if (!response.ok) continue;

    const data = await response.json();
    const mappedCards = data.data.map(mapPokemonTcgCard);

    allMatches.push(...mappedCards);
  }

  const uniqueMatches = Array.from(
    new Map(allMatches.map((card) => [card.id, card])).values()
  );

  return uniqueMatches.slice(0, 5);
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

    const client = new OpenAI({
      apiKey: openaiApiKey,
    });

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
    "notes": []
  },
  "links": []
}

Rules:
- Identify the card from visible information.
- Focus on Pokémon cards.
- If the exact card is uncertain, give the best visible guess and reduce confidence.
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
- If the image quality is too poor to estimate, use score 0 and label "Unable to Estimate".
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

    const text = response.output_text;
    const parsed = JSON.parse(cleanJsonText(text));

    const possibleMatches = await searchPokemonTcg(parsed.detectedCard);

    if (possibleMatches.length > 0) {
      const bestMatch = possibleMatches[0];

      parsed.detectedCard.name = bestMatch.name;
      parsed.detectedCard.set = bestMatch.set;
      parsed.detectedCard.number = bestMatch.number;
      parsed.detectedCard.rarity = bestMatch.rarity;
      parsed.detectedCard.databaseId = bestMatch.id;
      parsed.detectedCard.databaseImage = bestMatch.image;
      parsed.detectedCard.tcgplayerUrl = bestMatch.tcgplayerUrl;
      parsed.detectedCard.cardmarketUrl = bestMatch.cardmarketUrl;
    }
    if (parsed.detectedCard) {
  const cardName = parsed.detectedCard.name || "Pokemon card";
  const cardNumber = parsed.detectedCard.number || "";
  const queryBase = `${cardName} ${cardNumber}`.trim();

  parsed.links = [
    {
      label: "eBay Raw",
      type: "search",
      query: `${queryBase} raw`,
    },
    {
      label: "eBay PSA 8",
      type: "search",
      query: `${queryBase} PSA 8`,
    },
    {
      label: "eBay PSA 9",
      type: "search",
      query: `${queryBase} PSA 9`,
    },
    {
      label: "eBay PSA 10",
      type: "search",
      query: `${queryBase} PSA 10`,
    },
  ];

  if (parsed.detectedCard.tcgplayerUrl) {
    parsed.links.push({
      label: "TCGplayer",
      type: "direct",
      url: parsed.detectedCard.tcgplayerUrl,
    });
  }

  if (parsed.detectedCard.cardmarketUrl) {
    parsed.links.push({
      label: "Cardmarket",
      type: "direct",
      url: parsed.detectedCard.cardmarketUrl,
    });
  }
}

    parsed.possibleMatches = possibleMatches;

    return Response.json({
      success: true,
      result: parsed,
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