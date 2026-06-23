import { useState } from "react";
import { getMatchStatusTone } from "../utils/grading";
import DetectedCard from "./DetectedCard";
import PossibleMatches from "./PossibleMatches";
import ManualSearch from "./ManualSearch";
import GradeBreakdown from "./GradeBreakdown";
import PhotoQuality from "./PhotoQuality";
import WorthGrading from "./WorthGrading";
import MarketResults from "./MarketResults";

function ResultSection({
  label,
  title,
  defaultOpen = true,
  className = "",
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`result-section ${className}`}>
      <button
        type="button"
        className="result-section-toggle"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>
          <span className="result-label">{label}</span>
          <strong>{title}</strong>
        </span>

        <span className="toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && <div className="result-section-body">{children}</div>}
    </section>
  );
}

function MatchStatus({ result }) {
  if (!result.matchStatus) {
    return null;
  }

  return (
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
  );
}

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
          <ResultSection
            label="Detected Card"
            title={result.detectedCard?.name || "Unknown card"}
            className="section-wide"
            defaultOpen
          >
            <DetectedCard result={result} frontImage={frontImage} />
          </ResultSection>

          <ResultSection
            label="Database Match"
            title={
              result.matchStatus?.status === "confirmed"
                ? "Confirmed match"
                : "Needs confirmation"
            }
            defaultOpen
          >
            <MatchStatus result={result} />
          </ResultSection>

          <ResultSection
            label="Condition Grade"
            title={
              result.grade?.score > 0
                ? `${result.grade.score}/10 · ${result.grade.label}`
                : "Unable to estimate"
            }
            defaultOpen
          >
            <GradeBreakdown grade={result.grade} />
          </ResultSection>

          <ResultSection
            label="Photo Quality"
            title={result.photoQuality?.rating || "Unable to judge"}
            defaultOpen={false}
          >
            <PhotoQuality photoQuality={result.photoQuality} />
          </ResultSection>

          <ResultSection
            label="Worth Grading?"
            title="Recommendation"
            defaultOpen
          >
            <WorthGrading result={result} />
          </ResultSection>

          <ResultSection
            label="Possible Matches"
            title={`${result.possibleMatches?.length || 0} database matches`}
            className="section-wide"
            defaultOpen={false}
          >
            <PossibleMatches
              result={result}
              showPossibleMatches={showPossibleMatches}
              onToggle={onTogglePossibleMatches}
              onSelectMatch={onSelectMatch}
            />
          </ResultSection>

          <ResultSection
            label="Market Results"
            title="Pricing and marketplace research"
            className="section-wide"
            defaultOpen
          >
            <MarketResults result={result} />
          </ResultSection>

          <ResultSection
            label="Manual Search"
            title="Search another card"
            className="section-wide"
            defaultOpen={false}
          >
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
          </ResultSection>

          <div className="disclaimer-box section-wide">
            This is an AI-assisted estimate only, not an official PSA, CGC, or
            Beckett grade.
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultPanel;