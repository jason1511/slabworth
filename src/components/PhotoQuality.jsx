import { getPhotoQualityTone } from "../utils/grading";

function PhotoQuality({ photoQuality }) {
  return (
    <div className="result-card">
      <p className="result-label">Photo Quality</p>

      <div
        className={`photo-quality-box ${getPhotoQualityTone(
          photoQuality?.rating
        )}`}
      >
        <h3>{photoQuality?.rating || "Unable to Judge"}</h3>

        {photoQuality?.issues?.length > 0 && (
          <>
            <p className="quality-subtitle">Detected issues</p>
            <ul className="quality-list">
              {photoQuality.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </>
        )}

        {photoQuality?.recommendations?.length > 0 && (
          <>
            <p className="quality-subtitle">Recommended improvements</p>
            <ul className="quality-list">
              {photoQuality.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default PhotoQuality;