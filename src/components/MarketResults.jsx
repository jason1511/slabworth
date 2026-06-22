import {
  formatPrice,
  getMarketLinkUrl,
  hasMarketResults,
} from "../utils/market";

function MarketPriceTable({ result }) {
  return (
    <div className="market-result-card">
      <div className="market-result-header">
        <div>
          <h3>{result.marketplace}</h3>
          <p>{result.description}</p>
        </div>

        {result.url && (
          <a href={result.url} target="_blank" rel="noreferrer">
            Open
          </a>
        )}
      </div>

      <div className="market-price-grid">
        {result.prices.map((price) => (
          <div className="market-price-item" key={price.label}>
            <span>{price.label}</span>
            <strong>{formatPrice(price.value, result.currency)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketFallbackLinks({ links }) {
  if (!links?.length) {
    return <p>No marketplace data or search links available for this card.</p>;
  }

  return (
    <>
      <p>
        No direct market price result was available, so use these marketplace
        searches to compare raw and graded listings.
      </p>

      <div className="link-grid">
        {links.map((link) => (
          <a
            key={`${link.label}-${link.query || link.url}`}
            href={getMarketLinkUrl(link)}
            target="_blank"
            rel="noreferrer"
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}

function MarketResults({ result }) {
  const marketResults = result?.marketResults || [];
  const links = result?.links || [];

  return (
    <div className="result-card">
      <p className="result-label">Market Results</p>
      <h3>Current market data</h3>

      {hasMarketResults(marketResults) ? (
        <div className="market-results-stack">
          {marketResults.map((marketResult) => (
            <MarketPriceTable
              key={marketResult.marketplace}
              result={marketResult}
            />
          ))}
        </div>
      ) : (
        <MarketFallbackLinks links={links} />
      )}
    </div>
  );
}

export default MarketResults;