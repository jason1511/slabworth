import {
  formatPrice,
  getMarketLinkUrl,
  getMarketResultsWithHistory,
  getMarketSummary,
  getPriceBarWidth,
  getValidPriceHistory,
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

function PriceHistoryChart({ marketResult }) {
  const history = getValidPriceHistory(marketResult);

  if (history.length < 2) {
    return null;
  }

  const width = 420;
  const height = 160;
  const padding = 22;

  const values = history.map((point) => point.numericValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = history.map((point, index) => {
    const x =
      padding +
      (index / Math.max(history.length - 1, 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((point.numericValue - minValue) / range) * (height - padding * 2);

    return {
      ...point,
      x,
      y,
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="price-history-chart">
      <div className="price-history-header">
        <div>
          <span>Price trend</span>
          <strong>{marketResult.marketplace}</strong>
        </div>

        <small>{marketResult.currency}</small>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
        />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />

        <polyline points={polylinePoints} />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" />
            <title>
              {point.label}:{" "}
              {formatPrice(point.numericValue, marketResult.currency)}
            </title>
          </g>
        ))}
      </svg>

      <div className="price-history-labels">
        {points.map((point) => (
          <span key={point.label}>
            <strong>{point.label}</strong>
            {formatPrice(point.numericValue, marketResult.currency)}
          </span>
        ))}
      </div>

      <p>
        This source provides trend/history points, so the line chart is shown
        instead of current-price bars.
      </p>
    </div>
  );
}

function CurrentPriceBars({ marketResult }) {
  const prices = getValidPrices(marketResult);
  const maxValue = Math.max(...prices.map((price) => price.numericValue), 0);

  if (!prices.length) {
    return null;
  }

  return (
    <div className="market-price-bars">
      {prices.map((price) => (
        <div
          className="market-price-row"
          key={`${marketResult.marketplace}-${price.label}`}
        >
          <div className="market-price-row-top">
            <span>{price.label}</span>
            <strong>
              {formatPrice(price.numericValue, marketResult.currency)}
            </strong>
          </div>

          <div className="market-visual-bar">
            <span
              style={{
                width: getPriceBarWidth(price.numericValue, maxValue),
              }}
            ></span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketSourceCard({ result }) {
  const prices = getValidPrices(result);
  const history = getValidPriceHistory(result);
  const hasHistory = history.length >= 2;

  if (!prices.length && !hasHistory) {
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

      {hasHistory ? (
        <PriceHistoryChart marketResult={result} />
      ) : (
        <CurrentPriceBars marketResult={result} />
      )}
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
  const historicalMarketResults = getMarketResultsWithHistory(marketResults);

  return (
    <div className="result-card market-results-card">
      <p className="result-label">Market Results</p>
      <h3>Pricing and marketplace research</h3>

      <MarketSummary marketResults={marketResults} />

      {historicalMarketResults.length > 0 && (
        <div className="market-chart-note">
          {historicalMarketResults.length} source
          {historicalMarketResults.length === 1 ? "" : "s"} include trend or
          price-history points. Sources without history use current-price bars.
        </div>
      )}

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
        Line charts are shown only when a public API provides history or trend
        points. If a source only provides current prices, SlabWorth shows visual
        price bars instead.
      </div>
    </div>
  );
}

export default MarketResults;