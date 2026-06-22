import { getBreakdownItems } from "../utils/grading";

function GradeBreakdown({ grade }) {
  return (
    <div className="result-card">
      <p className="result-label">Condition Grade Estimate</p>

      <div className="grade-score-row">
        <span className="grade-score">{grade?.score > 0 ? grade.score : "?"}</span>
        <span className="grade-out-of">/ 10</span>
      </div>

      <h3>{grade?.label || "Unable to Estimate"}</h3>
      <p>Confidence: {grade?.confidence || "Unknown"}</p>

      <div className="breakdown-grid">
        {getBreakdownItems(grade).map((item) => (
          <div className="breakdown-item" key={item.label}>
            <div className="breakdown-header">
              <span>{item.label}</span>
              <strong>{item.value > 0 ? `${item.value}/10` : "N/A"}</strong>
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

      {grade?.notes?.length > 0 && (
        <ul className="notes-list">
          {grade.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GradeBreakdown;