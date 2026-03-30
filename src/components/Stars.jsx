import { useState } from 'react'
import './Stars.css'

const LABELS = ['', 'Terrible 😤', 'Poor 😕', 'Average 😐', 'Good 😊', 'Excellent 🤩']

export function StarDisplay({ rating = 0, size = 15 }) {
  const rounded = Math.round(rating)
  return (
    <div className="star-disp">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`sd-star${i <= rounded ? ' on' : ''}`} style={{ fontSize: size }}>★</span>
      ))}
      <span className="sd-val">{rating > 0 ? Number(rating).toFixed(1) : '—'}</span>
    </div>
  )
}

export function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="star-inp-wrap">
      <div className="star-inp-row">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            type="button"
            className={`si-btn${i <= active ? ' on' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
          >★</button>
        ))}
      </div>
      <div className="si-label">{LABELS[active] || 'Click to rate'}</div>
    </div>
  )
}
