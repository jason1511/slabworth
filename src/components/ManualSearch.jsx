import { MatchCard } from "./PossibleMatches";

function ManualSearch({
  result,
  manualName,
  manualNumber,
  manualMatches,
  manualSearchMessage,
  isSearchingManual,
  showManualSearch,
  onToggle,
  onManualNameChange,
  onManualNumberChange,
  onManualSearch,
  onSelectMatch,
}) {
  return (
    <div className="result-card collapsible-card">
      <button type="button" className="section-toggle" onClick={onToggle}>
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
              onChange={(event) => onManualNameChange(event.target.value)}
            />

            <input
              type="text"
              value={manualNumber}
              placeholder="Card number, e.g. 025/165"
              onChange={(event) => onManualNumberChange(event.target.value)}
            />

            <button
              type="button"
              className="secondary-button"
              onClick={onManualSearch}
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
                  <MatchCard
                    key={match.id}
                    match={match}
                    isSelected={isSelected}
                    onSelectMatch={onSelectMatch}
                    altText={match.name || "Manual match"}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManualSearch;