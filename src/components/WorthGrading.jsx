import { getWorthGradingRecommendation } from "../utils/grading";

function WorthGrading({ result }) {
  const recommendation = getWorthGradingRecommendation(result);

  return (
    <div className="result-card">
      <p className="result-label">Worth Grading?</p>

      <div className={`recommendation-box ${recommendation.tone}`}>
        <h3>{recommendation.status}</h3>
        <p>{recommendation.reason}</p>
      </div>
    </div>
  );
}

export default WorthGrading;