import { getMatchStatusTone } from "../utils/grading";
import DetectedCard from "./DetectedCard";
import PossibleMatches from "./PossibleMatches";
import ManualSearch from "./ManualSearch";
import GradeBreakdown from "./GradeBreakdown";
import PhotoQuality from "./PhotoQuality";
import WorthGrading from "./WorthGrading";
import MarketResults from "./MarketResults";

function ResultPanel({
  result,
  frontImage,
  isLoading,
  manualName,
  manualNumber,
  manualMatches,
  manualSearchMessage,
  isSearchingManual,
  showPossibleMatches,
  showManualSearch,
  onTogglePossibleMatches,
  onToggleManualSearch,
  onManualNameChange,
  onManualNumberChange,
  onManualSearch,
  onSelectMatch,
}) {
  return (
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
            Upload a front image to identify the Pokémon card and estimate its
            visible condition grade.
          </p>
        </div>
      ) : (
        <div className="result-stack">
          <DetectedCard result={result} frontImage={frontImage} />

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

          <PossibleMatches
            result={result}
            showPossibleMatches={showPossibleMatches}
            onToggle={onTogglePossibleMatches}
            onSelectMatch={onSelectMatch}
          />

          <ManualSearch
            result={result}
            manualName={manualName}
            manualNumber={manualNumber}
            manualMatches={manualMatches}
            manualSearchMessage={manualSearchMessage}
            isSearchingManual={isSearchingManual}
            showManualSearch={showManualSearch}
            onToggle={onToggleManualSearch}
            onManualNameChange={onManualNameChange}
            onManualNumberChange={onManualNumberChange}
            onManualSearch={onManualSearch}
            onSelectMatch={onSelectMatch}
          />

          <GradeBreakdown grade={result.grade} />
          <PhotoQuality photoQuality={result.photoQuality} />
          <WorthGrading result={result} />
          <MarketResults result={result} />

          <div className="disclaimer-box">
            This is an AI-assisted estimate only, not an official PSA, CGC, or
            Beckett grade.
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultPanel;