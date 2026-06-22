function DetectedCard({ result, frontImage }) {
  return (
    <div className="result-card detected-card-layout">
      <div className="database-image-frame">
        {result.detectedCard?.databaseImage ? (
          <img
            className="database-card-image"
            src={result.detectedCard.databaseImage}
            alt={result.detectedCard.name || "Detected card"}
          />
        ) : result.analysis?.frontImageUrl ? (
          <img
            className="database-card-image"
            src={result.analysis.frontImageUrl}
            alt="Stored card preview"
          />
        ) : frontImage ? (
          <img
            className="database-card-image"
            src={frontImage}
            alt="Uploaded card preview"
          />
        ) : (
          <div className="database-card-placeholder">
            <span>No card image</span>
          </div>
        )}
      </div>

      <div className="detected-card-content">
        <p className="result-label">Detected Card</p>
        <h3>{result.detectedCard?.name || "Unknown card"}</h3>

        <div className="card-meta-list">
          <p>{result.detectedCard?.set || "Unknown set"}</p>
          <p>{result.detectedCard?.number || "Unknown number"}</p>

          {result.detectedCard?.rarity && (
            <p>
              <strong>Rarity:</strong> {result.detectedCard.rarity}
            </p>
          )}
        </div>

        {result.detectedCard?.confidence !== undefined && (
          <div className="confidence-row">
            <span className="confidence-pill">
              {result.detectedCard.confidence}%
            </span>
            <span className="confidence-text">
              AI identification confidence
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetectedCard;