import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { useStore } from '../hooks/useStore'
import WalletModal from '../components/WalletModal'
import './LandingPage.css'

const FEATURES = [
  { icon:'🛡️', title:'Zero Fake Reviews',       desc:'Only real Stellar wallet holders can submit reviews. No bots, no fake accounts — ever.' },
  { icon:'⛓️', title:'Permanently On-Chain',    desc:'Stored forever on Soroban smart contract. Nobody can edit or delete a review.' },
  { icon:'🔍', title:'Fully Transparent',        desc:'Every review verifiable on Stellar Explorer. Full transparency, zero trust required.' },
  { icon:'⚡', title:'5-Second Settlement',      desc:'Soroban contracts settle in seconds — faster and cheaper than any Web2 database.' },
]

const STEPS = [
  { n:'01', t:'Business Registers On-Chain',  d:'Owner connects Freighter wallet and registers on Soroban — permanent, tamper-proof proof of existence.' },
  { n:'02', t:'Customer Submits Review',       d:'Customer connects wallet, picks stars, writes comment. One review per wallet — enforced at contract level.' },
  { n:'03', t:'Stored Forever on Stellar',    d:'Review lives on Stellar blockchain permanently. No admin can delete. No company can edit. Ever.' },
  { n:'04', t:'Anyone Can Verify',             d:'Open any review on Stellar Explorer. Full wallet address transparency — the future of consumer trust.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { businesses, totalReviews } = useStore()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="landing">
      {/* ── IMMERSIVE HERO ── */}
      <section className="lp-hero">
        <div className="mesh-bg" />
        <div className="mesh-glow" />
        
        <div className="wrap flex-col center">
          <div className="lp-badge-premium">
            <span className="dot-pulse" />
            SOROBAN MAINNET READY · TRUST PROTOCOL v1.0
          </div>

          <h1 className="lp-h1-premium">
            The Gold Standard of<br />
            <span className="text-glow">Verified Digital Trust</span>
          </h1>

          <p className="lp-sub-premium">
            StarChain eliminates the <strong>$150B fake review industry</strong> by moving 
            reputation to the Stellar blockchain. Every review is a cryptographically 
            signed proof of experience.
          </p>

          <div className="lp-btns-premium">
            <button className="btn-primary-lg" onClick={() => navigate('/browse')}>
              Explore Marketplace 
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button className="btn-glass-lg" onClick={() => navigate('/register')}>
              List Your Business
            </button>
          </div>

          <div className="lp-trust-bar">
             <div className="ts-item"><span>{businesses.length}</span> Verified Merchants</div>
             <div className="ts-sep" />
             <div className="ts-item"><span>{totalReviews}</span> Signed Reviews</div>
             <div className="ts-sep" />
             <div className="ts-item"><span>0%</span> Fake Entries</div>
          </div>
        </div>
      </section>

      {/* ── INDUSTRY SHOWCASE ── */}
      <section className="lp-industries">
        <div className="wrap">
          <div className="eyebrow-accent">Industries We Protect</div>
          <h2 className="sec-title-lg">Built for Every High-Trust Business</h2>
          <div className="ind-grid">
            {[
              { t:'Dining & Food', d:'Prevent fake negative reviews from competitors. Only verified diners can rate your taste.', i:'🍴' },
              { t:'Healthcare',   d:'Patient trust is sacred. Verified reviews ensure medical clinics maintain real reputations.', i:'🏥' },
              { t:'Tech & SaaS',  d:'Stop bot-driven hype. Real developer feedback for real software services.', i:'💻' },
              { t:'Luxury Hotels',d:'Ensure your premium service is reflected in authentic, wallet-verified guest feedback.', i:'🏨' },
            ].map(ind => (
              <div key={ind.t} className="ind-card">
                <div className="ind-ico">{ind.i}</div>
                <h3>{ind.t}</h3>
                <p>{ind.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-feats-modern">
        <div className="wrap">
          <h2 className="sec-title-center">Why Leading Brands Choose StarChain</h2>
          <div className="feat-grid-modern">
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card-modern">
                <div className="feat-ic-glow">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="lp-final-cta">
        <div className="cta-glass">
          <h2>Ready to secure your reputation?</h2>
          <p>Join the future of blockchain-verified feedback today on Stellar.</p>
          <div className="lp-cta-btns">
            <button className="btn-primary-lg" onClick={() => navigate('/register')}>Get Started Now →</button>
          </div>
        </div>
      </section>

      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
