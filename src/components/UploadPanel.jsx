function UploadPanel({
  frontFile,
  isLoading,
  errorMessage,
  onImageUpload,
  onIdentifyCard,
}) {
  return (
    <div className="upload-panel">
      <h2>Upload Card Photos</h2>
      <p>
        Start with the front photo. Add the back photo too for better condition
        checking.
      </p>

      <div className="upload-grid">
        <label className="upload-box">
          <span>Front Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onImageUpload(event, "front")}
          />
        </label>

        <label className="upload-box">
          <span>Back Image Optional</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => onImageUpload(event, "back")}
          />
        </label>
      </div>

      <button
        className="primary-button"
        onClick={onIdentifyCard}
        disabled={!frontFile || isLoading}
      >
        {isLoading ? "Analyzing Card..." : "Identify Card"}
      </button>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
}

export default UploadPanel;