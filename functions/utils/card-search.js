function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function normalizeCardNumber(number) {
  if (!number) return "";

  return String(number)
    .split("/")
    [0]
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function getFullCardNumber(number) {
  return String(number || "").trim();
}

function includesNormalized(source, target) {
  const cleanSource = normalizeText(source);
  const cleanTarget = normalizeText(target);

  if (!cleanSource || !cleanTarget) return false;

  return (
    cleanSource === cleanTarget ||
    cleanSource.includes(cleanTarget) ||
    cleanTarget.includes(cleanSource)
  );
}

function mapPokemonTcgCard(item) {
  return {
    source: "pokemon-tcg-api",
    id: `ptcg-${item.id}`,
    externalId: item.id,
    name: item.name || "",
    set: item.set?.name || "",
    series: item.set?.series || "",
    number: item.number || "",
    rarity: item.rarity || "",
    image: item.images?.small || "",
    tcgplayerUrl: item.tcgplayer?.url || "",
    cardmarketUrl: item.cardmarket?.url || "",
    matchScore: 0,
    matchStrength: "weak",
    matchReasons: [],
  };
}

function mapTcgdexCard(item, language) {
  const image = item.image ? `${item.image}/low.png` : "";

  return {
    source: `tcgdex-${language}`,
    id: `tcgdex-${language}-${item.id}`,
    externalId: item.id,
    name: item.name || "",
    set: item.set?.name || "",
    series: item.set?.serie?.name || "",
    number: item.localId || item.number || "",
    rarity: item.rarity || "",
    image,
    tcgplayerUrl: "",
    cardmarketUrl: "",
    matchScore: 0,
    matchStrength: "weak",
    matchReasons: [],
  };
}

function scoreMatch(card, detectedCard) {
  let score = 0;
  const reasons = [];

  const detectedName = detectedCard?.name || "";
  const detectedNumber = normalizeCardNumber(detectedCard?.number);
  const detectedFullNumber = getFullCardNumber(detectedCard?.number);
  const detectedSet = detectedCard?.set || "";

  const cardName = card.name || "";
  const cardNumber = normalizeCardNumber(card.number);
  const cardFullNumber = getFullCardNumber(card.number);
  const cardSet = card.set || "";

  if (detectedName && cardName && includesNormalized(cardName, detectedName)) {
    score += 45;
    reasons.push("Name matched");
  }

  if (detectedNumber && cardNumber && detectedNumber === cardNumber) {
    score += 40;
    reasons.push("Card number matched");
  } else if (
    detectedFullNumber &&
    cardFullNumber &&
    normalizeText(detectedFullNumber) === normalizeText(cardFullNumber)
  ) {
    score += 45;
    reasons.push("Full card number matched");
  }

  if (detectedSet && cardSet && includesNormalized(cardSet, detectedSet)) {
    score += 20;
    reasons.push("Set name looked compatible");
  }

  if (card.image) {
    score += 5;
    reasons.push("Database image available");
  }

  let matchStrength = "weak";

  if (score >= 85) {
    matchStrength = "strong";
  } else if (score >= 55) {
    matchStrength = "medium";
  }

  return {
    ...card,
    matchScore: Math.min(score, 100),
    matchStrength,
    matchReasons: reasons,
  };
}

function dedupeMatches(matches) {
  const seen = new Map();

  for (const match of matches) {
    const key = `${normalizeText(match.name)}|${normalizeText(match.set)}|${normalizeText(
      match.number
    )}`;

    const existing = seen.get(key);

    if (!existing || match.matchScore > existing.matchScore) {
      seen.set(key, match);
    }
  }

  return Array.from(seen.values());
}

function sortMatches(matches) {
  return [...matches].sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }

    if (a.source.startsWith("pokemon-tcg-api")) return -1;
    if (b.source.startsWith("pokemon-tcg-api")) return 1;

    return 0;
  });
}

function buildPokemonTcgQueries(card) {
  const queries = [];
  const name = card?.name?.trim();
  const number = normalizeCardNumber(card?.number);

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

async function searchPokemonTcg(card) {
  const queries = buildPokemonTcgQueries(card);
  const allMatches = [];

  for (const query of queries) {
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
      query
    )}&pageSize=8`;

    try {
      const response = await fetch(url);

      if (!response.ok) continue;

      const data = await response.json();
      const cards = Array.isArray(data.data) ? data.data : [];

      allMatches.push(...cards.map(mapPokemonTcgCard));
    } catch {
      // Keep the full search resilient if one source fails.
    }
  }

  return allMatches;
}

function buildTcgdexUrls(card) {
  const name = card?.name?.trim();
  const number = normalizeCardNumber(card?.number);

  const languages = ["en", "ja"];
  const urls = [];

  for (const language of languages) {
    const baseUrl = `https://api.tcgdex.net/v2/${language}/cards`;

    if (name && number) {
      urls.push({
        language,
        url: `${baseUrl}?name=${encodeURIComponent(
          name
        )}&localId=${encodeURIComponent(number)}&pagination:itemsPerPage=8`,
      });
    }

    if (number) {
      urls.push({
        language,
        url: `${baseUrl}?localId=${encodeURIComponent(
          number
        )}&pagination:itemsPerPage=8`,
      });
    }

    if (name) {
      urls.push({
        language,
        url: `${baseUrl}?name=${encodeURIComponent(
          name
        )}&pagination:itemsPerPage=8`,
      });
    }
  }

  return urls;
}

async function searchTcgdex(card) {
  const urls = buildTcgdexUrls(card);
  const allMatches = [];

  for (const item of urls) {
    try {
      const response = await fetch(item.url);

      if (!response.ok) continue;

      const data = await response.json();
      const cards = Array.isArray(data) ? data : [];

      allMatches.push(...cards.map((card) => mapTcgdexCard(card, item.language)));
    } catch {
      // Keep the full search resilient if one source fails.
    }
  }

  return allMatches;
}

function buildMarketLinks(card) {
  const cardName = card?.name || "Pokemon card";
  const cardNumber = card?.number || "";
  const queryBase = `${cardName} ${cardNumber}`.trim();

  const links = [
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

  if (card?.tcgplayerUrl) {
    links.push({
      label: "TCGplayer",
      type: "direct",
      url: card.tcgplayerUrl,
    });
  }

  if (card?.cardmarketUrl) {
    links.push({
      label: "Cardmarket",
      type: "direct",
      url: card.cardmarketUrl,
    });
  }

  return links;
}

export async function searchAllCardDatabases(card) {
  const [pokemonTcgMatches, tcgdexMatches] = await Promise.all([
    searchPokemonTcg(card),
    searchTcgdex(card),
  ]);

  const scoredMatches = [...pokemonTcgMatches, ...tcgdexMatches].map((match) =>
    scoreMatch(match, card)
  );

  return sortMatches(dedupeMatches(scoredMatches)).slice(0, 10);
}

export function applyBestMatchToResult(parsed) {
  const possibleMatches = parsed.possibleMatches || [];
  const bestMatch = possibleMatches[0];

  parsed.matchStatus = {
    status: "needs_confirmation",
    message:
      "No strong database match was found. Please confirm manually or choose a possible match.",
  };

  if (!bestMatch) {
    parsed.links = buildMarketLinks(parsed.detectedCard);
    return parsed;
  }

  if (bestMatch.matchStrength === "strong") {
    parsed.detectedCard.name = bestMatch.name;
    parsed.detectedCard.set = bestMatch.set;
    parsed.detectedCard.number = bestMatch.number;
    parsed.detectedCard.rarity = bestMatch.rarity;
    parsed.detectedCard.databaseId = bestMatch.id;
    parsed.detectedCard.databaseImage = bestMatch.image;
    parsed.detectedCard.tcgplayerUrl = bestMatch.tcgplayerUrl;
    parsed.detectedCard.cardmarketUrl = bestMatch.cardmarketUrl;

    parsed.matchStatus = {
      status: "confirmed",
      message: "Strong database match found.",
    };

    parsed.links = buildMarketLinks(bestMatch);
    return parsed;
  }

  parsed.matchStatus = {
    status: "needs_confirmation",
    message:
      "Only medium or weak matches were found. The detected card has not been auto-confirmed.",
  };

  parsed.links = buildMarketLinks(parsed.detectedCard);

  return parsed;
}

export { buildMarketLinks };