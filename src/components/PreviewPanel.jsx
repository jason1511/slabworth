function PreviewPanel({ frontImage, backImage }) {
  return (
    <div className="preview-panel">
      <h2>Preview</h2>

      <div className="preview-grid">
        <div className="preview-card">
          <h3>Front</h3>
          {frontImage ? (
            <img src={frontImage} alt="Front of uploaded card" />
          ) : (
            <p>No front image uploaded yet.</p>
          )}
        </div>

        <div className="preview-card">
          <h3>Back</h3>
          {backImage ? (
            <img src={backImage} alt="Back of uploaded card" />
          ) : (
            <p>No back image uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewPanel;