export default function UploadForm({ file, setFile, language, setLanguage, onSubmit, loading }) {
  return <form className="upload-card" onSubmit={onSubmit}>
    <div className="section-label"><span className="step">01</span> START WITH YOUR LETTER</div>
    <label className={`dropzone ${file ? 'has-file' : ''}`} htmlFor="letter-file">
      <input id="letter-file" type="file" accept="image/png,image/jpeg,application/pdf" capture="environment" onChange={e => setFile(e.target.files?.[0] || null)} />
      <span className="upload-icon">↥</span>
      <strong>{file ? file.name : 'Tap to upload or take a photo'}</strong>
      <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to explain` : 'PNG, JPG, or PDF · Up to 10 MB'}</span>
      <span className="browse">Choose a file</span>
    </label>
    <div className="form-bottom">
      <label className="language-label" htmlFor="language">EXPLAIN IN
        <select id="language" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="en">English</option><option value="te">తెలుగు</option><option value="hi">हिन्दी</option>
        </select>
      </label>
      <button className="primary-button" type="submit" disabled={!file || loading}>{loading ? <><span className="spinner"/> Reading…</> : <>Explain this letter <span aria-hidden="true">→</span></>}</button>
    </div>
  </form>
}
