import { useState } from "react";
import "./App.css";

function createEbaySearchUrl(query) {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
}

function getMarketLinkUrl(link) {
  if (link.type === "direct" && link.url) {
    return link.url;
  }

  return createEbaySearchUrl(link.query || link.label || "Pokemon card");
}

function createMarketLinks(card) {
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

function getBreakdownItems(grade) {
  const breakdown = grade?.breakdown || {};

  return [
    {
      label: "Centering",
      value: breakdown.centering,
      description: "Front border alignment",
    },
    {
      label: "Corners",
      value: breakdown.corners,
      description: "Corner sharpness and whitening",
    },
    {
      label: "Edges",
      value: breakdown.edges,
      description: "Edge wear or chipping",
    },
    {
      label: "Surface",
      value: breakdown.surface,
      description: "Scratches, dents, stains, or glare",
    },
    {
      label: "Back",
      value: breakdown.back,
      description: "Back-side condition",
    },
  ];
}

function getPhotoQualityTone(rating) {
  const normalizedRating = rating?.toLowerCase() || "";

  if (normalizedRating === "good") {
    return "positive";
  }

  if (normalizedRating === "acceptable") {
    return "neutral";
  }

  return "warning";
}

function getMatchStatusTone(status) {
  if (status === "confirmed") {
    return "positive";
  }

  return "neutral";
}

function getWorthGradingRecommendation(result) {
  const score = result?.grade?.score || 0;
  const rarity = result?.detectedCard?.rarity || "";
  const hasDatabaseMatch = Boolean(result?.detectedCard?.databaseId);

  const premiumRarityWords = [
    "Ultra Rare",
    "Secret Rare",
    "Illustration Rare",
    "Special Illustration Rare",
    "Hyper Rare",
    "Promo",
    "Rare",
  ];

  const isPremiumRarity = premiumRarityWords.some((word) =>
    rarity.toLowerCase().includes(word.toLowerCase())
  );

  if (!score || score === 0) {
    return {
      status: "Unable to Decide",
      tone: "neutral",
      reason:
        "The image quality or visible condition is not clear enough to make a grading recommendation.",
    };
  }

  if (!hasDatabaseMatch) {
    return {
      status: "Check Manually",
      tone: "neutral",
      reason:
        "The card was not confidently matched to a database entry, so pricing and rarity should be checked manually first.",
    };
  }

  if (score >= 9 && isPremiumRarity) {
    return {
      status: "Likely Worth Checking",
      tone: "positive",
      reason:
        "The card appears very clean and has a stronger rarity category. Compare raw value against PSA 9 and PSA 10 sold prices before grading.",
    };
  }

  if (score >= 9) {
    return {
      status: "Maybe Worth Checking",
      tone: "neutral",
      reason:
        "The condition looks strong, but the rarity may not justify grading cost. Check PSA 9 and PSA 10 sold prices first.",
    };
  }

  if (score === 8 && isPremiumRarity) {
    return {
      status: "Maybe",
      tone: "neutral",
      reason:
        "The card appears around grade 8 condition. It may be worth grading only if this card has strong graded sale prices.",
    };
  }

  if (score === 8) {
    return {
      status: "Probably Not",
      tone: "warning",
      reason:
        "The card looks decent, but grade 8 results often need a valuable card to justify grading costs.",
    };
  }

  return {
    status: "Not Recommended",
    tone: "warning",
    reason:
      "The visible condition appears below grade 8, so grading may not be cost-effective unless the card is unusually valuable.",
  };
}

function App() {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [manualName, setManualName] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [manualMatches, setManualMatches] = useState([]);
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [manualSearchMessage, setManualSearchMessage] = useState("");
const [showPossibleMatches, setShowPossibleMatches] = useState(true);
const [showManualSearch, setShowManualSearch] = useState(false);
  function handleImageUpload(event, imageType) {
    const file = event.target.files[0];

    if (!file) return;

    setErrorMessage("");
    setManualMatches([]);
    setManualSearchMessage("");

    const imageUrl = URL.createObjectURL(file);

    if (imageType === "front") {
      setFrontImage(imageUrl);
      setFrontFile(file);
      setResult(null);
    }

    if (imageType === "back") {
      setBackImage(imageUrl);
      setBackFile(file);
      setResult(null);
    }
  }

  async function handleIdentifyCard() {
    if (!frontFile) {
      setErrorMessage("Please upload the front image first.");
      return;
    }

    const formData = new FormData();
    formData.append("frontImage", frontFile);

    if (backFile) {
      formData.append("backImage", backFile);
    }

    setIsLoading(true);
    setErrorMessage("");
    setResult(null);
    setManualMatches([]);
    setManualSearchMessage("");

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("API response:", data);

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to identify card.");
        return;
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not connect to the identify API.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectMatch(match) {
    setResult((currentResult) => {
      if (!currentResult) return currentResult;

      return {
        ...currentResult,
        detectedCard: {
          ...currentResult.detectedCard,
          name: match.name,
          set: match.set,
          number: match.number,
          rarity: match.rarity,
          databaseId: match.id,
          databaseImage: match.image,
          tcgplayerUrl: match.tcgplayerUrl,
          cardmarketUrl: match.cardmarketUrl,
        },
        matchStatus: {
          status: "confirmed",
          message: "Database match selected by user.",
        },
        links: createMarketLinks(match),
      };
    });
  }

  async function handleManualSearch() {
    if (!manualName.trim() && !manualNumber.trim()) {
      setManualSearchMessage("Enter a card name or card number first.");
      return;
    }

    setIsSearchingManual(true);
    setManualSearchMessage("");
    setManualMatches([]);

    try {
      const response = await fetch("/api/search-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: manualName,
          number: manualNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setManualSearchMessage(data.message || "Manual search failed.");
        return;
      }

      setManualMatches(data.matches || []);

      if (!data.matches || data.matches.length === 0) {
        setManualSearchMessage("No matching cards found.");
      }
    } catch (error) {
      console.error(error);
      setManualSearchMessage("Could not connect to the manual search API.");
    } finally {
      setIsSearchingManual(false);
    }
  }

  return (
    <main className="app">
      <section className="intro-section">
        <p className="eyebrow">AI Pokémon Card Tool</p>
        <h1>SlabWorth</h1>
        <p className="intro-text">
          Upload a Pokémon card photo to identify the card, estimate its
          condition grade, and research where to buy or sell it.
        </p>
      </section>

      <section className="tool-layout">
        <div className="upload-panel">
          <h2>Upload Card Photos</h2>
          <p>
            Start with the front photo. Add the back photo too for better
            condition checking.
          </p>

          <div className="upload-grid">
            <label className="upload-box">
              <span>Front Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event, "front")}
              />
            </label>

            <label className="upload-box">
              <span>Back Image Optional</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event, "back")}
              />
            </label>
          </div>

          <button
            className="primary-button"
            onClick={handleIdentifyCard}
            disabled={!frontFile || isLoading}
          >
            {isLoading ? "Analyzing Card..." : "Identify Card"}
          </button>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>

        <div className="preview-panel">
          <h2>Preview</h2>

          <div className="preview-grid">
            <div className="preview-card">
              <h3>Front</h3>
              {frontImage ? (
                <img src={frontImage} alt="Front of uploaded card" />
              ) : (
                <p>No front image uploaded yet.</p>
              )}
            </div>

            <div className="preview-card">
              <h3>Back</h3>
              {backImage ? (
                <img src={backImage} alt="Back of uploaded card" />
              ) : (
                <p>No back image uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="result-panel">
          <h2>Result</h2>

          {isLoading ? (
            <div className="result-card loading-card">
              <p className="result-label">Analyzing</p>
              <h3>Checking your card...</h3>
              <p>
                Reading the card image, estimating condition, and searching for
                matching Pokémon card data.
              </p>

              <div className="loading-bar">
                <span></span>
              </div>
            </div>
          ) : !result ? (
            <div className="result-card">
              <p className="result-label">Detected Card</p>
              <h3>Waiting for upload</h3>
              <p>
                Upload a front image to identify the Pokémon card and estimate
                its visible condition grade.
              </p>
            </div>
          ) : (
            <div className="result-stack">
              <div className="result-card detected-card-layout">
                <div className="database-image-frame">
                  {result.detectedCard?.databaseImage ? (
                    <img
                      className="database-card-image"
                      src={result.detectedCard.databaseImage}
                      alt={result.detectedCard.name || "Detected card"}
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

              {result.matchStatus && (
                <div className="result-card">
                  <p className="result-label">Database Match Status</p>

                  <div
                    className={`recommendation-box ${getMatchStatusTone(
                      result.matchStatus.status
                    )}`}
                  >
                    <h3>
                      {result.matchStatus.status === "confirmed"
                        ? "Confirmed Match"
                        : "Needs Confirmation"}
                    </h3>
                    <p>{result.matchStatus.message}</p>
                  </div>
                </div>
              )}

              {result.possibleMatches?.length > 0 && (
  <div className="result-card collapsible-card">
    <button
      type="button"
      className="section-toggle"
      onClick={() => setShowPossibleMatches((current) => !current)}
    >
      <span>
        <span className="result-label">Possible Matches</span>
        <strong>{result.possibleMatches.length} database matches found</strong>
      </span>

      <span className="toggle-icon">
        {showPossibleMatches ? "−" : "+"}
      </span>
    </button>

    {showPossibleMatches && (
      <>
        <p>
          If the detected card is wrong, select the closest database match
          below.
        </p>

        <div className="matches-grid">
          {result.possibleMatches.map((match) => {
            const isSelected =
              match.id && match.id === result.detectedCard?.databaseId;

            return (
              <button
                key={match.id}
                type="button"
                className={`match-card ${
                  isSelected ? "selected-match" : ""
                }`}
                onClick={() => handleSelectMatch(match)}
              >
                {match.image && (
                  <img
                    src={match.image}
                    alt={match.name || "Possible match"}
                  />
                )}

                <span className="match-name">{match.name}</span>
                <span className="match-meta">
                  {match.set} · {match.number}
                </span>

                {match.rarity && (
                  <span className="match-rarity">{match.rarity}</span>
                )}

                <span
                  className={`match-strength ${
                    match.matchStrength || "weak"
                  }`}
                >
                  {match.matchStrength || "weak"} match ·{" "}
                  {match.matchScore || 0}%
                </span>

                {match.source && (
                  <span className="match-source">{match.source}</span>
                )}

                <span className="match-action">
                  {isSelected ? "Selected" : "Use this match"}
                </span>
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>
)}

              <div className="result-card collapsible-card">
  <button
    type="button"
    className="section-toggle"
    onClick={() => setShowManualSearch((current) => !current)}
  >
    <span>
      <span className="result-label">Manual Database Search</span>
      <strong>Search another card</strong>
    </span>

    <span className="toggle-icon">{showManualSearch ? "−" : "+"}</span>
  </button>

  {showManualSearch && (
    <>
      <p>
        If the detected card is wrong, search by card name, card number, or
        both.
      </p>

      <div className="manual-search-grid">
        <input
          type="text"
          value={manualName}
          placeholder="Card name, e.g. Pikachu"
          onChange={(event) => setManualName(event.target.value)}
        />

        <input
          type="text"
          value={manualNumber}
          placeholder="Card number, e.g. 025/165"
          onChange={(event) => setManualNumber(event.target.value)}
        />

        <button
          type="button"
          className="secondary-button"
          onClick={handleManualSearch}
          disabled={isSearchingManual}
        >
          {isSearchingManual ? "Searching..." : "Search Database"}
        </button>
      </div>

      {manualSearchMessage && (
        <p className="manual-search-message">{manualSearchMessage}</p>
      )}

      {manualMatches.length > 0 && (
        <div className="matches-grid manual-matches-grid">
          {manualMatches.map((match) => {
            const isSelected =
              match.id && match.id === result.detectedCard?.databaseId;

            return (
              <button
                key={match.id}
                type="button"
                className={`match-card ${
                  isSelected ? "selected-match" : ""
                }`}
                onClick={() => handleSelectMatch(match)}
              >
                {match.image && (
                  <img src={match.image} alt={match.name || "Manual match"} />
                )}

                <span className="match-name">{match.name}</span>
                <span className="match-meta">
                  {match.set} · {match.number}
                </span>

                {match.rarity && (
                  <span className="match-rarity">{match.rarity}</span>
                )}

                <span
                  className={`match-strength ${
                    match.matchStrength || "weak"
                  }`}
                >
                  {match.matchStrength || "weak"} match ·{" "}
                  {match.matchScore || 0}%
                </span>

                {match.source && (
                  <span className="match-source">{match.source}</span>
                )}

                <span className="match-action">
                  {isSelected ? "Selected" : "Use this match"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  )}
</div>

              <div className="result-card">
                <p className="result-label">Condition Grade Estimate</p>

                <div className="grade-score-row">
                  <span className="grade-score">
                    {result.grade?.score > 0 ? result.grade.score : "?"}
                  </span>
                  <span className="grade-out-of">/ 10</span>
                </div>

                <h3>{result.grade?.label || "Unable to Estimate"}</h3>
                <p>Confidence: {result.grade?.confidence || "Unknown"}</p>

                <div className="breakdown-grid">
                  {getBreakdownItems(result.grade).map((item) => (
                    <div className="breakdown-item" key={item.label}>
                      <div className="breakdown-header">
                        <span>{item.label}</span>
                        <strong>
                          {item.value > 0 ? `${item.value}/10` : "N/A"}
                        </strong>
                      </div>

                      <div className="breakdown-bar">
                        <span
                          style={{
                            width: `${item.value > 0 ? item.value * 10 : 0}%`,
                          }}
                        ></span>
                      </div>

                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>

                {result.grade?.notes?.length > 0 && (
                  <ul className="notes-list">
                    {result.grade.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="result-card">
                <p className="result-label">Photo Quality</p>

                <div
                  className={`photo-quality-box ${getPhotoQualityTone(
                    result.photoQuality?.rating
                  )}`}
                >
                  <h3>{result.photoQuality?.rating || "Unable to Judge"}</h3>

                  {result.photoQuality?.issues?.length > 0 && (
                    <>
                      <p className="quality-subtitle">Detected issues</p>
                      <ul className="quality-list">
                        {result.photoQuality.issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {result.photoQuality?.recommendations?.length > 0 && (
                    <>
                      <p className="quality-subtitle">
                        Recommended improvements
                      </p>
                      <ul className="quality-list">
                        {result.photoQuality.recommendations.map(
                          (recommendation) => (
                            <li key={recommendation}>{recommendation}</li>
                          )
                        )}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="result-card">
                <p className="result-label">Worth Grading?</p>

                {(() => {
                  const recommendation = getWorthGradingRecommendation(result);

                  return (
                    <div
                      className={`recommendation-box ${recommendation.tone}`}
                    >
                      <h3>{recommendation.status}</h3>
                      <p>{recommendation.reason}</p>
                    </div>
                  );
                })()}
              </div>

              <div className="result-card">
                <p className="result-label">Market Research</p>
                <h3>Search buy/sell prices</h3>

                {result.links?.length > 0 ? (
                  <div className="link-grid">
                    {result.links.map((link) => (
                      <a
                        key={link.label}
                        href={getMarketLinkUrl(link)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p>No market research links available for this card.</p>
                )}
              </div>

              <div className="disclaimer-box">
                This is an AI-assisted estimate only, not an official PSA, CGC,
                or Beckett grade.
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;