import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './ReviewCelebration.css'

const EMOJIS = ['⭐', '🎉', '✨', '🌟', '🎊', '💫', '🔗', '🏆']
const COLORS = ['#a78bfa', '#f59e0b', '#10b981', '#60a5fa', '#f472b6', '#34d399', '#fbbf24']

function randomBetween(a, b) { return a + Math.random() * (b - a) }

export default function ReviewCelebration({ onDone, rating, businessName }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = Array.from({ length: 80 }, () => ({
      x: randomBetween(0, canvas.width),
      y: randomBetween(-100, -10),
      vx: randomBetween(-2, 2),
      vy: randomBetween(2, 6),
      size: randomBetween(10, 22),
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: randomBetween(0, Math.PI * 2),
      rotV: randomBetween(-0.08, 0.08),
      alpha: 1,
    }))

    let raf
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rot += p.rotV
        if (p.y > canvas.height * 0.7) p.alpha -= 0.012
        p.alpha = Math.max(p.alpha, 0)
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.font = `${p.size}px serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.emoji, 0, 0)
        ctx.restore()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    const timer = setTimeout(onDone, 3800)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [onDone])

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  return createPortal(
    <div className="cel-overlay" onClick={onDone}>
      <canvas ref={canvasRef} className="cel-canvas" />
      <div className="cel-card" onClick={e => e.stopPropagation()}>
        <div className="cel-glow" />
        <div className="cel-icon">⭐</div>
        <h2 className="cel-title">Review Submitted!</h2>
        <div className="cel-stars">{stars}</div>
        <p className="cel-biz">{businessName}</p>
        <div className="cel-chain-badge">
          <span className="cel-chain-dot" />
          Permanently stored on Stellar Blockchain
        </div>
        <p className="cel-sub">Your review is now on-chain — immutable, transparent, and tamper-proof.</p>
        <button className="cel-btn" onClick={onDone}>Continue →</button>
      </div>
    </div>,
    document.body
  )
}
