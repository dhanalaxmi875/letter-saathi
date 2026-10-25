import Checklist from './Checklist'
import AudioPlayer from './AudioPlayer'
import ChatBox from './ChatBox'

function ListSection({ title, items, icon }) {
  if (!items?.length) return null
  return <section className="detail-section"><h3><span>{icon}</span>{title}</h3><ul>{items.map((x, i) => <li key={`${x}-${i}`}>{x}</li>)}</ul></section>
}

export default function ResultView({ data, language, onReset, onLanguageChange }) {
  const deadlineFound = data.deadline?.status === 'found' && data.deadline?.value
  return <div className="results" aria-live="polite">
    <div className="results-top"><div className="section-label"><span className="step">02</span> YOUR LETTER, MADE CLEAR</div><button className="text-button" onClick={onReset}>← New letter</button></div>
    <article className="summary-card"><div className="summary-copy"><span className="eyebrow">{data.document_type || 'Official letter'}</span><h2>{data.purpose || 'Here is what this letter says.'}</h2></div><div className={`deadline ${deadlineFound ? 'deadline-found' : ''}`}><span className="deadline-icon">◷</span><span><small>DEADLINE</small><strong>{deadlineFound ? data.deadline.value : 'No clear deadline'}</strong></span></div></article>
    <section className="explanation-card"><div className="explanation-heading"><div><span className="eyebrow">THE SHORT VERSION</span><h2>What this means for you</h2></div><AudioPlayer text={data.simple_explanation || ''} language={language}/></div><p className="explanation-text">{data.simple_explanation || 'The letter could not be explained clearly. Please check with the issuing office.'}</p></section>
    {data.required_actions?.length > 0 && <section className="list-card"><h2><span className="section-icon">✓</span> What you need to do</h2><Checklist actions={data.required_actions}/></section>}
    <div className="details-grid"><ListSection title="Documents to gather" items={data.required_documents} icon="▤"/><ListSection title="Amounts mentioned" items={data.amounts} icon="₹"/><ListSection title="Important details" items={data.important_facts} icon="✳"/><ListSection title="What could happen" items={data.consequences} icon="!"/></div>
    {((data.warnings?.length || 0) > 0 || (data.uncertainties?.length || 0) > 0) && <section className="warning-card"><h2><span>!</span> Please check these carefully</h2>{data.warnings?.length > 0 && <ul>{data.warnings.map((w, i) => <li key={`w-${i}`}>{w}</li>)}</ul>}{data.uncertainties?.length > 0 && <><p className="uncertain-label">Information that may be unclear</p><ul>{data.uncertainties.map((u, i) => <li key={`u-${i}`}>{u}</li>)}</ul></>}</section>}
    <ChatBox analysis={data} language={language} onLanguageChange={onLanguageChange}/>
    <div className="verify-note"><span>◎</span> Please verify with the issuing office before acting.</div>
  </div>
}
