import { useState, useEffect, useRef } from 'react'
import { askQuestion } from '../services/api'
import AudioPlayer from './AudioPlayer'

const SUGGESTED_QUESTIONS = {
  en: [
    "What should I do first?",
    "What documents do I need?",
    "What happens if I miss the deadline?"
  ],
  te: [
    "ముందు ఏం చేయాలి?",
    "నాకు ఏ పత్రాలు కావాలి?",
    "గడువు తప్పిపోతే ఏమవుతుంది?"
  ],
  hi: [
    "मुझे सबसे पहले क्या करना चाहिए?",
    "मुझे कौन से दस्तावेज़ चाहिए?",
    "अगर मैं समय सीमा चूक जाऊं तो क्या होगा?"
  ]
}

export default function ChatBox({ analysis, language, onLanguageChange }) {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState(true)
  const [speechAvailable, setSpeechAvailable] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    setHistory([])
    setInput('')
  }, [analysis, language])

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
      }
      recognitionRef.current.onerror = () => {
        recognitionRef.current?.abort()
      }
      setSpeechAvailable(true)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN'
    }
  }, [language])

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setLoading(true)
    const newHistory = [...history, { role: 'user', text: question }]
    setHistory(newHistory)
    try {
      const response = await askQuestion(analysis, newHistory, question, language)
      setHistory([...newHistory, { role: 'assistant', text: response.answer, grounded: response.grounded }])
    } catch (err) {
      setHistory([...newHistory, { role: 'assistant', text: err.message || 'Sorry, something went wrong.', grounded: true }])
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestedClick(question) {
    setInput(question)
  }

  function startVoiceInput() {
    if (recognitionRef.current) {
      recognitionRef.current.start()
    }
  }

  function handleTtsError() {
    setTtsAvailable(false)
  }

  return <section className="chat-section">
    <div className="chat-header"><h3><span>💬</span> Ask about this letter</h3></div>
    <div className="chat-messages">
      {history.length === 0 && <div className="suggested-questions">
        {SUGGESTED_QUESTIONS[language]?.map((q, i) => (
          <button key={i} className="question-chip" onClick={() => handleSuggestedClick(q)}>{q}</button>
        ))}
      </div>}
      {history.map((msg, i) => (
        <div key={i} className={`chat-message ${msg.role}`}>
          {msg.role === 'user' ? <div className="message-bubble user">{msg.text}</div> : (
            <div className="message-bubble assistant">
              <p>{msg.text}</p>
              {!msg.grounded && <div className="grounded-warning">The letter doesn't say this. Please check with the issuing office.</div>}
              {ttsAvailable && <AudioPlayer text={msg.text} language={language} onError={handleTtsError}/>}
            </div>
          )}
        </div>
      ))}
      {loading && <div className="chat-message assistant"><div className="message-bubble assistant typing"><span>.</span><span>.</span><span>.</span></div></div>}
      <div ref={messagesEndRef}/>
    </div>
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question about this letter..."
        disabled={loading}
        maxLength={500}
      />
      {speechAvailable && <button type="button" className="voice-button" onClick={startVoiceInput} disabled={loading} aria-label="Voice input">🎤</button>}
      <button type="submit" className="send-button" disabled={loading || !input.trim()}>Send</button>
    </form>
  </section>
}
