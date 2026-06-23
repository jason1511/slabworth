function MatchCard({ match, isSelected, onSelectMatch, altText }) {
  return (
    <button
      type="button"
      className={`match-card ${isSelected ? "selected-match" : ""}`}
      onClick={() => onSelectMatch(match)}
    >
      {match.image && <img src={match.image} alt={altText} />}

      <span className="match-name">{match.name}</span>
      <span className="match-meta">
        {match.set} · {match.number}
      </span>

      {match.rarity && <span className="match-rarity">{match.rarity}</span>}

      <span className={`match-strength ${match.matchStrength || "weak"}`}>
        {match.matchStrength || "weak"} match · {match.matchScore || 0}%
      </span>

      {match.source && <span className="match-source">{match.source}</span>}

      <span className="match-action">
        {isSelected ? "Selected" : "Use this match"}
      </span>
    </button>
  );
}

function PossibleMatches({ result, onSelectMatch }) {
  if (!result.possibleMatches?.length) {
    return <p>No possible database matches found.</p>;
  }

  return (
    <>
      <p>
        If the detected card is wrong, select the closest database match below.
      </p>

      <div className="matches-grid">
        {result.possibleMatches.map((match) => {
          const isSelected =
            match.id && match.id === result.detectedCard?.databaseId;

          return (
            <MatchCard
              key={match.id}
              match={match}
              isSelected={isSelected}
              onSelectMatch={onSelectMatch}
              altText={match.name || "Possible match"}
            />
          );
        })}
      </div>
    </>
  );
}

export { MatchCard };
export default PossibleMatches;