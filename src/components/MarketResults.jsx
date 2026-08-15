import {
  formatPrice,
  getMarketLinkUrl,
  getMarketResultsWithTrendIndicators,
  getMarketSummary,
  getPriceBarWidth,
  getValidTrendIndicators,
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
      {summary.currencyGroups.map((group) => (
        <div
          className="market-summary-card highlight"
          key={`${group.currency}-indicator`}
        >
          <span>{group.currency} market indicator</span>
          <strong>
            {formatPrice(group.bestMarket.numericValue, group.currency)}
          </strong>
          <p>
            {group.bestMarket.marketplace} · {group.bestMarket.label}
          </p>
        </div>
      ))}

      {summary.currencyGroups.map((group) => (
        <div className="market-summary-card" key={`${group.currency}-range`}>
          <span>{group.currency} observed range</span>
          <strong>
            {formatPrice(group.lowest.numericValue, group.currency)} —{" "}
            {formatPrice(group.highest.numericValue, group.currency)}
          </strong>
          <p>
            Based on {group.priceCount} price points from {group.sourceCount}{" "}
            source{group.sourceCount === 1 ? "" : "s"}. Currencies are never
            combined.
          </p>
        </div>
      ))}
    </div>
  );
}

function TrendIndicatorChart({ marketResult }) {
  const indicators = getValidTrendIndicators(marketResult);

  if (indicators.length < 2) {
    return null;
  }

  const width = 420;
  const height = 160;
  const padding = 22;

  const values = indicators.map((point) => point.numericValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = indicators.map((point, index) => {
    const x =
      padding +
      (index / Math.max(indicators.length - 1, 1)) * (width - padding * 2);

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
          <span>Aggregate market indicators</span>
          <strong>{marketResult.marketplace}</strong>
        </div>

        <small>{marketResult.currency}</small>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${marketResult.marketplace} aggregate market indicator comparison`}
      >
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
        These points compare rolling averages and the source's current trend
        indicator. They are not dated sales or a chronological price history.
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
  const trendIndicators = getValidTrendIndicators(result);
  const hasTrendIndicators = trendIndicators.length >= 2;

  if (!prices.length && !hasTrendIndicators) {
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

      {hasTrendIndicators ? (
        <TrendIndicatorChart marketResult={result} />
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
  const trendMarketResults = getMarketResultsWithTrendIndicators(marketResults);

  return (
    <div className="result-card market-results-card">
      <p className="result-label">Market Results</p>
      <h3>Pricing and marketplace research</h3>

      <MarketSummary marketResults={marketResults} />

      {trendMarketResults.length > 0 && (
        <div className="market-chart-note">
          {trendMarketResults.length} source
          {trendMarketResults.length === 1 ? "" : "s"} include aggregate trend
          indicators. These are comparisons of rolling averages, not dated
          sales history. Sources without them use current-price bars.
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
        Indicator charts are shown only when a public API provides multiple
        rolling averages or trend values. SlabWorth does not currently display
        chronological sold-price history. Sources with current prices only use
        visual price bars.
      </div>
    </div>
  );
}

export default MarketResults;
