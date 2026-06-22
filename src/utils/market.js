export function createMarketplaceSearchUrl(marketplace, query) {
  const encodedQuery = encodeURIComponent(query || "Pokemon card");

  const urls = {
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}`,
    pricecharting: `https://www.pricecharting.com/search-products?q=${encodedQuery}&type=prices`,
    tcgplayer: `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodedQuery}`,
    cardmarket: `https://www.cardmarket.com/en/Pokemon/Products/Search?searchString=${encodedQuery}`,
  };

  return urls[marketplace] || urls.ebay;
}

export function createMarketLinks(card) {
  const cardName = card?.name || "Pokemon card";
  const cardNumber = card?.number || "";
  const queryBase = `${cardName} ${cardNumber}`.trim();

  const links = [
    {
      label: "eBay",
      marketplace: "ebay",
      query: queryBase,
      description: "Search active listings and sold comparisons.",
    },
    {
      label: "PriceCharting",
      marketplace: "pricecharting",
      query: queryBase,
      description: "Check historical collector pricing.",
    },
    {
      label: "TCGplayer Search",
      marketplace: "tcgplayer",
      query: queryBase,
      description: "Search raw card marketplace listings.",
    },
    {
      label: "Cardmarket Search",
      marketplace: "cardmarket",
      query: queryBase,
      description: "Search European market listings.",
    },
    {
      label: "eBay PSA 8",
      marketplace: "ebay",
      query: `${queryBase} PSA 8`,
      description: "Compare graded PSA 8 listings.",
    },
    {
      label: "eBay PSA 9",
      marketplace: "ebay",
      query: `${queryBase} PSA 9`,
      description: "Compare graded PSA 9 listings.",
    },
    {
      label: "eBay PSA 10",
      marketplace: "ebay",
      query: `${queryBase} PSA 10`,
      description: "Compare graded PSA 10 listings.",
    },
  ];

  if (card?.tcgplayerUrl) {
    links.unshift({
      label: "TCGplayer Page",
      type: "direct",
      url: card.tcgplayerUrl,
      description: "Open the matched TCGplayer product page.",
    });
  }

  if (card?.cardmarketUrl) {
    links.unshift({
      label: "Cardmarket Page",
      type: "direct",
      url: card.cardmarketUrl,
      description: "Open the matched Cardmarket product page.",
    });
  }

  return links;
}

export function getMarketLinkUrl(link) {
  if (link?.type === "direct" && link.url) {
    return link.url;
  }

  return createMarketplaceSearchUrl(link?.marketplace, link?.query);
}

export function hasMarketResults(marketResults) {
  return Array.isArray(marketResults) && marketResults.length > 0;
}

export function getValidPrices(marketResult) {
  if (!marketResult?.prices?.length) {
    return [];
  }

  return marketResult.prices
    .map((price) => ({
      ...price,
      numericValue: Number(price.value),
    }))
    .filter((price) => !Number.isNaN(price.numericValue));
}

export function getAllValidPrices(marketResults) {
  return (marketResults || []).flatMap((marketResult) =>
    getValidPrices(marketResult).map((price) => ({
      ...price,
      marketplace: marketResult.marketplace,
      currency: marketResult.currency,
    }))
  );
}

export function getMarketSummary(marketResults) {
  const allPrices = getAllValidPrices(marketResults);

  if (!allPrices.length) {
    return {
      hasPrices: false,
      sourceCount: marketResults?.length || 0,
      priceCount: 0,
      lowest: null,
      highest: null,
      bestMarket: null,
    };
  }

  const sortedPrices = [...allPrices].sort(
    (a, b) => a.numericValue - b.numericValue
  );

  const lowest = sortedPrices[0];
  const highest = sortedPrices[sortedPrices.length - 1];

  const preferredMarketPrice =
    allPrices.find((price) =>
      price.label.toLowerCase().includes("market")
    ) || lowest;

  return {
    hasPrices: true,
    sourceCount: marketResults.length,
    priceCount: allPrices.length,
    lowest,
    highest,
    bestMarket: preferredMarketPrice,
  };
}

export function formatPrice(value, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numericValue);
}

export function getPriceBarWidth(value, maxValue) {
  const numericValue = Number(value);
  const numericMax = Number(maxValue);

  if (
    Number.isNaN(numericValue) ||
    Number.isNaN(numericMax) ||
    numericMax <= 0
  ) {
    return "0%";
  }

  const percentage = Math.max(8, Math.min((numericValue / numericMax) * 100, 100));

  return `${percentage}%`;
}