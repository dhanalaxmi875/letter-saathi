export async function checkHealth() {
  const response = await fetch('/api/health')
  if (!response.ok) throw new Error('The service is unavailable. Please try again.')
  return response.json()
}

export async function analyzeLetter(file, language) {
  const body = new FormData()
  body.append('file', file)
  body.append('language', language)
  const response = await fetch('/api/analyze', { method: 'POST', body })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || 'We could not analyze this letter. Please try again.')
  return payload
}

export async function readAloud(text, language) {
  const response = await fetch('/api/tts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language }),
  })
  if (!response.ok) throw new Error(response.status === 503 ? 'Audio reading is unavailable.' : 'Could not play the audio.')
  return URL.createObjectURL(await response.blob())
}

export async function askQuestion(analysis, history, question, language) {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis, history, question, language }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail || 'Could not answer the question. Please try again.')
  return payload
}
