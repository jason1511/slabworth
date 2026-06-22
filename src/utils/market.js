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
    },
    {
      label: "PriceCharting",
      marketplace: "pricecharting",
      query: queryBase,
    },
    {
      label: "TCGplayer Search",
      marketplace: "tcgplayer",
      query: queryBase,
    },
    {
      label: "Cardmarket Search",
      marketplace: "cardmarket",
      query: queryBase,
    },
    {
      label: "eBay PSA 8",
      marketplace: "ebay",
      query: `${queryBase} PSA 8`,
    },
    {
      label: "eBay PSA 9",
      marketplace: "ebay",
      query: `${queryBase} PSA 9`,
    },
    {
      label: "eBay PSA 10",
      marketplace: "ebay",
      query: `${queryBase} PSA 10`,
    },
  ];

  if (card?.tcgplayerUrl) {
    links.unshift({
      label: "TCGplayer Page",
      type: "direct",
      url: card.tcgplayerUrl,
    });
  }

  if (card?.cardmarketUrl) {
    links.unshift({
      label: "Cardmarket Page",
      type: "direct",
      url: card.cardmarketUrl,
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