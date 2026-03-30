import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import WalletModal from './WalletModal'
import { short } from '../utils/stellar'
import './Navbar.css'

export default function Navbar() {
  const { wallet, disconnect } = useWallet()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const active = path => location.pathname === path ? 'active' : ''

  return (
    <>
      <nav className="navbar">
        <div className="nb-inner wrap">
          {/* Logo */}
          <Link to="/" className="nb-logo">
            <div className="nb-logo-icon">⭐</div>
            <div className="nb-logo-text">
              StarChain<em>Reviews</em>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="nb-links">
            <Link to="/browse" className={`nb-link ${active('/browse')}`}>Browse</Link>
            <Link to="/register" className={`nb-link ${active('/register')}`}>+ Register Business</Link>
            <Link to="/leaderboard" className={`nb-link ${active('/leaderboard')}`}>Leaderboard 🏆</Link>
            <a 
              className="nb-link nb-explorer-btn" 
              href="https://stellar.expert/explorer/testnet/contract/CA43LPCXAPJQZYGKAKYKMIBL7WBOXWFY22ZCVTGTDRULIUHGHWXBXU6N" 
              target="_blank" 
              rel="noreferrer"
            >
              View Contract 🛰️
            </a>
            <Link to="/profile" className={`nb-link ${active('/profile')}`}>
              My Dashboard
            </Link>
          </div>

          {/* Wallet */}
          <div className="nb-wallet">
            {wallet ? (
              <div className="wallet-chip">
                <div className="w-dot" />
                <span className="w-name">{wallet.label}</span>
                <span className="w-addr">{short(wallet.address)}</span>
                <button className="btn-switch" onClick={() => setModalOpen(true)} title="Switch">⇄</button>
                <button className="btn-disc" onClick={disconnect} title="Disconnect">✕</button>
              </div>
            ) : (
              <button className="btn-connect" onClick={() => setModalOpen(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  <line x1="12" y1="12" x2="12" y2="16"/>
                  <line x1="10" y1="14" x2="14" y2="14"/>
                </svg>
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile burger */}
          <button className="nb-burger" onClick={() => setMenuOpen(v => !v)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="nb-mobile">
            <Link to="/browse"   className={`nb-link ${active('/browse')}`}   onClick={() => setMenuOpen(false)}>Browse</Link>
            <Link to="/register" className={`nb-link ${active('/register')}`} onClick={() => setMenuOpen(false)}>+ Register Business</Link>
            <Link to="/leaderboard" className={`nb-link ${active('/leaderboard')}`} onClick={() => setMenuOpen(false)}>Leaderboard 🏆</Link>
            <a 
              className="nb-link" 
              href="https://stellar.expert/explorer/testnet/contract/CA43LPCXAPJQZYGKAKYKMIBL7WBOXWFY22ZCVTGTDRULIUHGHWXBXU6N" 
              target="_blank" 
              rel="noreferrer" 
              onClick={() => setMenuOpen(false)}
            >
              View Contract 🛰️
            </a>
            <Link to="/profile" className={`nb-link ${active('/profile')}`} onClick={() => setMenuOpen(false)}>My Dashboard</Link>
            {!wallet && (
              <button className="btn-connect" style={{width:'100%',justifyContent:'center'}} onClick={() => { setModalOpen(true); setMenuOpen(false) }}>
                ⚡ Connect Wallet
              </button>
            )}
          </div>
        )}
      </nav>

      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
