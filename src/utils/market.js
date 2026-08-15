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
      description: "Check collector pricing manually.",
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
    .filter(
      (price) =>
        price.value !== null &&
        price.value !== undefined &&
        price.value !== ""
    )
    .map((price) => ({
      ...price,
      numericValue: Number(price.value),
    }))
    .filter((price) => Number.isFinite(price.numericValue));
}

export function getValidTrendIndicators(marketResult) {
  if (!marketResult?.priceHistory?.length) {
    return [];
  }

  return marketResult.priceHistory
    .filter(
      (point) =>
        point.value !== null &&
        point.value !== undefined &&
        point.value !== ""
    )
    .map((point) => ({
      ...point,
      numericValue: Number(point.value),
    }))
    .filter((point) => Number.isFinite(point.numericValue));
}

export function getMarketResultsWithTrendIndicators(marketResults) {
  return (marketResults || []).filter(
    (marketResult) => getValidTrendIndicators(marketResult).length >= 2
  );
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
      priceCount: 0,
      currencyGroups: [],
    };
  }

  const pricesByCurrency = allPrices.reduce((groups, price) => {
    const currency = price.currency || "USD";
    const currencyPrices = groups.get(currency) || [];

    currencyPrices.push(price);
    groups.set(currency, currencyPrices);

    return groups;
  }, new Map());

  const currencyGroups = Array.from(pricesByCurrency, ([currency, prices]) => {
    const sortedPrices = [...prices].sort(
      (a, b) => a.numericValue - b.numericValue
    );
    const lowest = sortedPrices[0];
    const highest = sortedPrices[sortedPrices.length - 1];
    const bestMarket =
      prices.find((price) => price.label.toLowerCase().includes("market")) ||
      prices.find((price) => price.label.toLowerCase().includes("trend")) ||
      lowest;

    return {
      currency,
      sourceCount: new Set(prices.map((price) => price.marketplace)).size,
      priceCount: prices.length,
      lowest,
      highest,
      bestMarket,
    };
  }).sort((a, b) => a.currency.localeCompare(b.currency));

  return {
    hasPrices: true,
    priceCount: allPrices.length,
    currencyGroups,
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
