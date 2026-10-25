import { useState } from 'react'
import { readAloud } from '../services/api'

export default function AudioPlayer({ text, language, onError }) {
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  async function listen() {
    setLoading(true); setError('')
    try { setAudioUrl(await readAloud(text, language)) } catch (e) { if (e.message === 'Audio reading is unavailable.') { setUnavailable(true); onError?.(); } else setError(e.message) } finally { setLoading(false) }
  }
  if (unavailable) return null
  return <div className="audio-control">{audioUrl ? <audio controls autoPlay src={audioUrl} /> : <button className="listen-button" onClick={listen} disabled={loading}>◖ {loading ? 'Preparing audio…' : 'Listen'}</button>}{error && <span className="audio-error">{error}</span>}</div>
}
