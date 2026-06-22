function HistoryPanel({
  historyItems,
  isLoadingHistory,
  historyMessage,
  onLoadHistoryItem,
  onRefreshHistory,
}) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <div>
          <p className="eyebrow">Saved Analyses</p>
          <h2>History</h2>
        </div>

        <button
          type="button"
          className="secondary-button history-refresh-button"
          onClick={onRefreshHistory}
          disabled={isLoadingHistory}
        >
          {isLoadingHistory ? "Loading..." : "Refresh"}
        </button>
      </div>

      {historyMessage && <p className="manual-search-message">{historyMessage}</p>}

      {historyItems.length === 0 ? (
        <p>No saved analyses yet.</p>
      ) : (
        <div className="history-list">
          {historyItems.map((item) => (
            <button
              type="button"
              className="history-item"
              key={item.id}
              onClick={() => onLoadHistoryItem(item.id)}
            >
              {item.frontImageUrl && (
                <img src={item.frontImageUrl} alt={item.cardName} />
              )}

              <span>
                <strong>{item.cardName}</strong>
                <small>
                  {item.cardSet || "Unknown set"} ·{" "}
                  {item.cardNumber || "Unknown number"}
                </small>
                <small>
                  Grade:{" "}
                  {item.gradeScore > 0
                    ? `${item.gradeScore}/10`
                    : "Not available"}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;