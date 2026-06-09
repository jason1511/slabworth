function normalizeCardNumber(number) {
  if (!number) return "";

  return String(number).split("/")[0].trim();
}

function buildPokemonTcgQueries({ name, number }) {
  const queries = [];
  const cleanName = name?.trim();
  const cleanNumber = normalizeCardNumber(number);

  if (cleanName && cleanNumber) {
    queries.push(`name:"${cleanName}" number:"${cleanNumber}"`);
  }

  if (cleanNumber) {
    queries.push(`number:"${cleanNumber}"`);
  }

  if (cleanName) {
    queries.push(`name:"${cleanName}"`);
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

async function searchPokemonTcg({ name, number }) {
  const queries = buildPokemonTcgQueries({ name, number });
  const allMatches = [];

  for (const query of queries) {
    const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(
      query
    )}&pageSize=8`;

    const response = await fetch(url);

    if (!response.ok) continue;

    const data = await response.json();
    const mappedCards = data.data.map(mapPokemonTcgCard);

    allMatches.push(...mappedCards);
  }

  const uniqueMatches = Array.from(
    new Map(allMatches.map((card) => [card.id, card])).values()
  );

  return uniqueMatches.slice(0, 8);
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const name = body.name?.trim() || "";
    const number = body.number?.trim() || "";

    if (!name && !number) {
      return Response.json(
        {
          success: false,
          message: "Please enter a card name or card number.",
        },
        { status: 400 }
      );
    }

    const matches = await searchPokemonTcg({ name, number });

    return Response.json({
      success: true,
      matches,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Something went wrong while searching the card database.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function onRequestGet() {
  return Response.json({
    success: true,
    message: "SlabWorth manual card search API is running.",
  });
}