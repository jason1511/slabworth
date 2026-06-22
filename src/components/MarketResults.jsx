import {
  formatPrice,
  getMarketLinkUrl,
  getMarketSummary,
  getPriceBarWidth,
  getValidPrices,
  hasMarketResults,
} from "../utils/market";

function MarketSummary({ marketResults }) {
  const summary = getMarketSummary(marketResults);

  if (!summary.hasPrices) {
    return (
      <div className="market-summary-card muted">
        <span>Direct price data</span>
        <strong>Not available</strong>
        <p>Use the marketplace search links below to compare listings manually.</p>
      </div>
    );
  }

  return (
    <div className="market-summary-grid">
      <div className="market-summary-card highlight">
        <span>Best market indicator</span>
        <strong>
          {formatPrice(
            summary.bestMarket.numericValue,
            summary.bestMarket.currency
          )}
        </strong>
        <p>
          {summary.bestMarket.marketplace} · {summary.bestMarket.label}
        </p>
      </div>

      <div className="market-summary-card">
        <span>Observed range</span>
        <strong>
          {formatPrice(summary.lowest.numericValue, summary.lowest.currency)} —{" "}
          {formatPrice(summary.highest.numericValue, summary.highest.currency)}
        </strong>
        <p>
          Based on {summary.priceCount} price points from {summary.sourceCount}{" "}
          source{summary.sourceCount === 1 ? "" : "s"}.
        </p>
      </div>
    </div>
  );
}

function MarketPriceRow({ price, maxValue, currency }) {
  return (
    <div className="market-price-row">
      <div className="market-price-row-top">
        <span>{price.label}</span>
        <strong>{formatPrice(price.numericValue, currency)}</strong>
      </div>

      <div className="market-visual-bar">
        <span
          style={{
            width: getPriceBarWidth(price.numericValue, maxValue),
          }}
        ></span>
      </div>
    </div>
  );
}

function MarketSourceCard({ result }) {
  const prices = getValidPrices(result);
  const maxValue = Math.max(...prices.map((price) => price.numericValue), 0);

  if (!prices.length) {
    return null;
  }

  return (
    <div className="market-result-card">
      <div className="market-result-header">
        <div>
          <h3>{result.marketplace}</h3>
          <p>{result.description}</p>
        </div>

        {result.url && (
          <a href={result.url} target="_blank" rel="noreferrer">
            Open source
          </a>
        )}
      </div>

      <div className="market-price-list">
        {prices.map((price) => (
          <MarketPriceRow
            key={`${result.marketplace}-${price.label}`}
            price={price}
            maxValue={maxValue}
            currency={result.currency}
          />
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
    <div className="market-fallback-section">
      <p>
        Direct price data was not available for this match. Use these searches
        to compare raw, graded, and marketplace listings.
      </p>

      <div className="market-link-grid">
        {links.map((link) => (
          <a
            key={`${link.label}-${link.query || link.url}`}
            href={getMarketLinkUrl(link)}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{link.label}</strong>
            {link.description && <span>{link.description}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

function MarketResults({ result }) {
  const marketResults = result?.marketResults || [];
  const links = result?.links || [];

  return (
    <div className="result-card market-results-card">
      <p className="result-label">Market Results</p>
      <h3>Pricing and marketplace research</h3>

      <MarketSummary marketResults={marketResults} />

      {hasMarketResults(marketResults) ? (
        <>
          <div className="market-results-stack">
            {marketResults.map((marketResult) => (
              <MarketSourceCard
                key={marketResult.marketplace}
                result={marketResult}
              />
            ))}
          </div>

          {links.length > 0 && (
            <details className="market-search-details">
              <summary>Open additional marketplace searches</summary>
              <MarketFallbackLinks links={links} />
            </details>
          )}
        </>
      ) : (
        <MarketFallbackLinks links={links} />
      )}

      <div className="market-disclaimer">
        Market prices can vary by condition, language, region, seller, grading
        company, and recent demand. Always compare sold listings before making a
        selling or grading decision.
      </div>
    </div>
  );
}

export default MarketResults;