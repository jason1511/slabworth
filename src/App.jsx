import { useEffect, useState } from "react";
import HistoryPanel from "./components/HistoryPanel";
import PreviewPanel from "./components/PreviewPanel";
import ResultPanel from "./components/ResultPanel";
import UploadPanel from "./components/UploadPanel";
import { createMarketLinks } from "./utils/market";
import { getSessionId } from "./utils/session";
import "./App.css";

function App() {
  const [sessionId] = useState(() => getSessionId());

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

  const [historyItems, setHistoryItems] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");

  async function loadHistory() {
    setIsLoadingHistory(true);
    setHistoryMessage("");

    try {
      const response = await fetch(
        `/api/history?limit=12&sessionId=${encodeURIComponent(sessionId)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setHistoryMessage(data.message || "Failed to load history.");
        return;
      }

      setHistoryItems(data.analyses || []);
    } catch (error) {
      console.error(error);
      setHistoryMessage("Could not connect to the history API.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function loadHistoryItem(id) {
    setIsLoading(true);
    setErrorMessage("");
    setManualMatches([]);
    setManualSearchMessage("");

    try {
      const response = await fetch(
        `/api/history?id=${encodeURIComponent(id)}&sessionId=${encodeURIComponent(
          sessionId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to load saved analysis.");
        return;
      }

      setResult(data.result);
      setFrontImage(data.result?.analysis?.frontImageUrl || null);
      setBackImage(data.result?.analysis?.backImageUrl || null);
      setFrontFile(null);
      setBackFile(null);
      setShowPossibleMatches(false);
      setShowManualSearch(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not connect to the history API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

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
    formData.append("sessionId", sessionId);

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
      setShowPossibleMatches(true);
      setShowManualSearch(false);
      await loadHistory();
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
        marketResults: match.marketResults || [],
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
        <div className="left-column">
          <UploadPanel
            frontFile={frontFile}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onImageUpload={handleImageUpload}
            onIdentifyCard={handleIdentifyCard}
          />

          <PreviewPanel frontImage={frontImage} backImage={backImage} />

          <HistoryPanel
            historyItems={historyItems}
            isLoadingHistory={isLoadingHistory}
            historyMessage={historyMessage}
            onLoadHistoryItem={loadHistoryItem}
            onRefreshHistory={loadHistory}
          />
        </div>

        <ResultPanel
          result={result}
          frontImage={frontImage}
          isLoading={isLoading}
          manualName={manualName}
          manualNumber={manualNumber}
          manualMatches={manualMatches}
          manualSearchMessage={manualSearchMessage}
          isSearchingManual={isSearchingManual}
          showPossibleMatches={showPossibleMatches}
          showManualSearch={showManualSearch}
          onTogglePossibleMatches={() =>
            setShowPossibleMatches((current) => !current)
          }
          onToggleManualSearch={() =>
            setShowManualSearch((current) => !current)
          }
          onManualNameChange={setManualName}
          onManualNumberChange={setManualNumber}
          onManualSearch={handleManualSearch}
          onSelectMatch={handleSelectMatch}
        />
      </section>
    </main>
  );
}

export default App;