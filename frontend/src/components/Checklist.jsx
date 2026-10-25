import { useState } from 'react'

export default function Checklist({ actions }) {
  const [checked, setChecked] = useState({})
  return <ul className="checklist">{actions.map((item, i) => <li key={`${item}-${i}`} className={checked[i] ? 'done' : ''}>
    <label><input type="checkbox" checked={!!checked[i]} onChange={e => setChecked({ ...checked, [i]: e.target.checked })}/><span className="custom-check"/><span>{item}</span></label>
  </li>)}</ul>
}
