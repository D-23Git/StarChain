import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useWallet } from '../hooks/useWallet'
import { DEMO_WALLETS, short } from '../utils/stellar'
import './WalletModal.css'

export default function WalletModal({ open, onClose }) {
  const { connect } = useWallet()

  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function handleFreighter() {
    onClose()
    await connect('freighter')
  }

  async function handleDemo(d) {
    onClose()
    await connect('demo', { addr: d.addr, label: d.label })
  }

  const modal = (
    <div className="wm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="wm-modal">
        <div className="wm-head">
          <div>
            <h2 className="wm-title">Connect Wallet</h2>
            <p className="wm-sub">Connect your Stellar wallet to StarChain Reviews</p>
          </div>
          <button className="wm-close" onClick={onClose}>✕</button>
        </div>

        <div className="wm-body">
          <div className="wm-section-label">Stellar Extension Wallets</div>

          <button className="wm-row" onClick={handleFreighter}>
            <div className="wm-row-icon" style={{ background: '#0e0e1f' }}>
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#12122a"/>
                <path d="M20 8L32 20L20 32L8 20Z" fill="#6d28d9" opacity=".85"/>
                <path d="M20 13L27 20L20 27L13 20Z" fill="#a78bfa"/>
                <circle cx="20" cy="20" r="3" fill="#fff" opacity=".9"/>
              </svg>
            </div>
            <div className="wm-row-info">
              <h4>Freighter</h4>
              <p>Official Stellar browser extension</p>
            </div>
            <span className="wm-badge live">LIVE</span>
          </button>

          <button className="wm-row" onClick={() => { onClose(); window.open('https://xbull.app', '_blank') }}>
            <div className="wm-row-icon" style={{ background: '#0a0a14' }}>
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#0a0a14"/>
                <text x="20" y="28" textAnchor="middle" fontSize="20" fontWeight="900" fill="#d4a832" fontFamily="Georgia,serif">X</text>
              </svg>
            </div>
            <div className="wm-row-info">
              <h4>xBull Wallet</h4>
              <p>Multi-platform Stellar wallet</p>
            </div>
            <span className="wm-badge ext">EXT</span>
          </button>

          <button className="wm-row" onClick={() => { onClose(); window.open('https://albedo.link', '_blank') }}>
            <div className="wm-row-icon" style={{ background: '#0c1319' }}>
              <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#0c1319"/>
                <circle cx="20" cy="20" r="9" fill="none" stroke="#f59e0b" strokeWidth="2.5"/>
                <circle cx="20" cy="20" r="3.5" fill="#f59e0b"/>
              </svg>
            </div>
            <div className="wm-row-info">
              <h4>Albedo</h4>
              <p>Web-based Stellar key manager</p>
            </div>
            <span className="wm-badge ext">WEB</span>
          </button>

          <div className="wm-section-label" style={{ marginTop: 16 }}>
            Demo Wallets <span style={{ fontWeight: 400, color: 'var(--t3)', textTransform:'none', letterSpacing:0 }}>(no install needed)</span>
          </div>

          <div className="wm-demo-grid">
            {DEMO_WALLETS.map(d => (
              <button key={d.addr} className="wm-demo-btn" onClick={() => handleDemo(d)}>
                <span className="wm-demo-icon">{d.icon}</span>
                <span className="wm-demo-name">{d.label}</span>
                <span className="wm-demo-addr">{d.addr.slice(0,6)}...{d.addr.slice(-4)}</span>
              </button>
            ))}
          </div>

          <div className="wm-tip">
            💡 <strong>Freighter installed?</strong> Make sure it's set to <strong>Testnet</strong> in
            extension settings. Use Demo wallets above to test all features instantly.
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
