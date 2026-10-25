import { useEffect, useState } from 'react'
import UploadForm from './components/UploadForm'
import ResultView from './components/ResultView'
import { analyzeLetter, checkHealth } from './services/api'

export default function App() {
  const [file, setFile] = useState(null)
  const [language, setLanguage] = useState('en')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceReady, setServiceReady] = useState(true)
  useEffect(() => { checkHealth().then(() => setServiceReady(true)).catch(() => setServiceReady(false)) }, [])
  async function submit(e) {
    e.preventDefault()
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await analyzeLetter(file, language)) } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  function reset() { setFile(null); setResult(null); setError(''); document.querySelector('#letter-file')?.value && (document.querySelector('#letter-file').value = '') }
  function handleLanguageChange(newLang) { setLanguage(newLang) }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="LetterSaathi home"><span className="brand-mark">L<span>+</span></span><span>letter<span className="brand-accent">saathi</span></span></a><span className="top-tag"><span className="live-dot"/> A friend for the fine print</span></header>
    <main id="top"><section className="hero"><div className="hero-copy"><div className="pill"><span>✳</span> OFFICIAL LETTERS, MADE SIMPLE</div><h1>Big words.<br/><em>Clear next steps.</em></h1><p>Upload a letter from a bank, government office, or anywhere else. We’ll explain what it means and what to do next.</p><div className="trust-row"><span><b>01</b> Upload a letter</span><i/><span><b>02</b> Get the simple version</span><i/><span><b>03</b> Know what to do</span></div></div><div className="hero-art" aria-hidden="true"><div className="sun-orb"/><div className="paper paper-back"/><div className="paper paper-front"><div className="paper-seal">✓</div><div className="paper-lines"><i/><i/><i/><i/><i/></div><div className="paper-note"><span>YOUR NEXT STEP</span><b>All clear.</b></div></div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span><span className="art-caption">From confusing to clear <span>↗</span></span></div></section>
      {!serviceReady && <div className="service-notice">We’re having trouble reaching the service. You can still try uploading again.</div>}
      {!result && <UploadForm file={file} setFile={setFile} language={language} setLanguage={setLanguage} onSubmit={submit} loading={loading}/>}
      {loading && <div className="loading-card"><div className="loading-orb"><span/></div><div><strong>Reading your letter…</strong><p>Finding the important details and putting them in plain language.</p></div></div>}
      {error && <div className="error-card" role="alert"><span className="error-icon">!</span><div><strong>We couldn’t explain this letter yet.</strong><p>{error}</p></div><button className="retry-button" onClick={() => file && submit({ preventDefault() {} })}>Try again ↗</button></div>}
      {result && <ResultView data={result} language={language} onReset={reset} onLanguageChange={handleLanguageChange}/>}
      <div className="privacy-note"><span>▣</span> Your letter is only used to create this explanation.</div>
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark">L<span>+</span></span><span>letter<span className="brand-accent">saathi</span></span></a><p>AI-generated explanation. Please verify with the issuing office before acting.</p><span className="footer-heart">Made to make things clearer&nbsp; ♥</span></footer>
  </div>
}
