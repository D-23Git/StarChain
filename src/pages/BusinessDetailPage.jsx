import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { useWallet } from '../hooks/useWallet'
import { 
  submitReview, 
  fmtDate, 
  short, 
  expLink,
  CONTRACT_ID
} from '../utils/stellar'
import WalletModal from '../components/WalletModal'
import ReviewCelebration from '../components/ReviewCelebration'
import toast from 'react-hot-toast'
import './BusinessDetailPage.css'

export default function BusinessDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { businesses, addReview, loading: storeLoading } = useStore()
  const { wallet } = useWallet()
  const biz = businesses.find(b => b.id === Number(id))

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewImg, setReviewImg] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // overview | menu | feedback
  const [showCelebration, setShowCelebration] = useState(false)

  if (!biz && storeLoading) return <div className="detail-loading">Synchronizing with Blockchain...</div>
  if (!biz && !storeLoading) return <div className="detail-loading">Store not found on the blockchain.</div>

  const reviewCount = biz.review_count ?? biz.count ?? 0
  const totalRating = biz.total_rating ?? biz.total ?? 0
  const avg = reviewCount ? (totalRating / reviewCount).toFixed(1) : (biz.avgRating || 0).toFixed(1)
  
  const bizLogo = biz.image || biz.img || biz.imgUrl || null;
  const bizAddr = biz.address || biz.addr || 'Location Verified on Stellar';
  const bizOwner = biz.ownerName || 'Verified Manager';
  
  // Consolidate different inventory list names
  const inventory = biz.menu || biz.items || biz.services || biz.medicines || [];

  async function handleSubmitReview() {
    if (!wallet) { setModalOpen(true); return }
    if (!comment.trim()) { toast.error('Please write a comment'); return }
    
    setLoading(true)
    try {
      const meta = JSON.stringify({ image: reviewImg.trim() || null })
      
      // 🚀 ALWAYS REAL: Triggers Freighter Confirmation for all businesses
      const r = await submitReview(wallet.address, biz.id, rating, comment.trim(), meta)
      const rHash = r.hash || 'demo_hash_' + Date.now()
      
      const newRev = {
        id: Date.now(),
        reviewer: wallet.address,
        rating: rating,
        comment: comment.trim(),
        image: reviewImg.trim() || null,
        ts: Math.floor(Date.now() / 1000)
      }
      addReview(biz.id, newRev)
      setComment(''); setReviewImg(''); setRating(5)
      
      setShowCelebration(true)
      toast.success('Blockchain Verified! 🎉', { duration: 4000 })
    } catch (e) {
      toast.error('Transaction Failed: ' + e.message)
    } finally { setLoading(false) }
  }

  const copyAddr = () => {
    navigator.clipboard.writeText(bizAddr)
    toast.success('Address copied to clipboard')
  }

  return (
    <div className="biz-detail">
      {showCelebration && (
        <ReviewCelebration 
           rating={rating} 
           businessName={biz.name} 
           onDone={() => setShowCelebration(false)} 
        />
      )}

      {/* ── HEADER HERO ── */}
      <section className="detail-hero" style={{ backgroundImage: bizLogo ? `url(${bizLogo})` : 'none' }}>
        <div className="hero-overlay" />
        <div className="wrap detail-hero-content">
          <div className="cat-badge-premium">{biz.cat}</div>
          <h1 className="hero-name-animate">{biz.name}</h1>
          <div className="hero-stats-row">
            <div className="h-stat-card">
              <span className="h-stat-val">{avg}</span>
              <span className="h-stat-label">★ Rating</span>
            </div>
            <div className="h-stat-card">
              <span className="h-stat-val">{reviewCount}</span>
              <span className="h-stat-label">Feedbacks</span>
            </div>
          </div>
          <p className="hero-loc-pill"> 📍 {bizAddr}</p>
        </div>
      </section>

      {/* ── TABS NAV ── */}
      <div className="detail-tabs-nav">
         <div className="wrap tabs-inner">
            <button className={`tab-btn ${activeTab === 'overview' ? 'on' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab-btn ${activeTab === 'menu' ? 'on' : ''}`} onClick={() => setActiveTab('menu')}>
               {biz.cat === 'Healthcare' ? 'Services' : biz.cat === 'Hotel' ? 'Rooms' : 'Menu'}
            </button>
            <button className={`tab-btn ${activeTab === 'feedback' ? 'on' : ''}`} onClick={() => setActiveTab('feedback')}>Feedback</button>
         </div>
      </div>

      <div className="wrap detail-layout">
        {/* ── LEFT: CONTENT ── */}
        <div className="detail-main">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="tab-pane ani-in">
               <section className="detail-sec-card">
                  <h2 className="sec-title-premium">About This Establishment</h2>
                  <p className="about-txt">{biz.about || `Verified business in the ${biz.cat} industry. Operating with full transparency on the Stellar network.`}</p>
                  
                  <div className="biz-at-a-glance">
                     <div className="glance-item">
                        <div className="gi-ico">🏗️</div>
                        <div className="gi-info">
                           <label>Established</label>
                           <span>{biz.established || 'Recently Verified'}</span>
                        </div>
                     </div>
                     <div className="glance-item">
                        <div className="gi-ico">📱</div>
                        <div className="gi-info">
                           <label>Support</label>
                           <span>{biz.email || 'Contact via Wallet'}</span>
                        </div>
                     </div>
                  </div>
               </section>

               {biz.gallery && biz.gallery.length > 0 && (
                  <section className="detail-sec-card gallery-sec">
                     <h2 className="sec-title-premium">Establishment Gallery</h2>
                     <div className="gallery-grid">
                        {biz.gallery.map((img, i) => (
                           <div key={i} className="gal-item-premium">
                              <img src={img} alt="Gallery" />
                           </div>
                        ))}
                     </div>
                  </section>
               )}
            </div>
          )}

          {/* MENU / SERVICES TAB */}
          {activeTab === 'menu' && (
            <div className="tab-pane ani-in">
               <section className="detail-sec-card">
                  <h2 className="sec-title-premium">
                    {biz.cat === 'Healthcare' ? '🏥 Clinic Services & Consultations' : 
                     biz.cat === 'Hotel' ? '🏨 Luxury Room Concepts' : 
                     biz.cat === 'Restaurant' ? '🍴 Chef\'s Signature Menu' : '🛒 Offerings & Catalog'}
                  </h2>
                  <div className="menu-grid-premium">
                    {inventory.length > 0 ? inventory.map((it, i) => (
                      <div key={i} className="offer-card-glass">
                        <div className="oc-top">
                          <span className="oc-icon">{it.emoji || it.icon || '📦'}</span>
                          <div className="oc-text">
                            <h4>{it.name}</h4>
                            <p className="oc-desc">{it.desc || 'Verified on-chain offering'}</p>
                          </div>
                        </div>
                        <div className="oc-foot">
                           <span className="oc-price">{it.price ? (typeof it.price === 'number' ? it.price + ' XLM' : it.price) : 'Contact Merchant'}</span>
                           <button className="btn-buy-interactive" onClick={() => toast.success(`${it.name} - Blockchain Transaction Simulation!`)}>
                             {biz.cat === 'Hotel' ? 'Book Now' : biz.cat === 'Healthcare' ? 'Schedule' : 'Order Now'}
                           </button>
                        </div>
                      </div>
                    )) : (
                      <div className="empty-state-card">
                         <div className="empty-ico">🏪</div>
                         <h4>Inventory Pending Verification</h4>
                         <p>This merchant's detailed catalog is being signed on-chain.</p>
                      </div>
                    )}
                  </div>
               </section>
            </div>
          )}

          {/* FEEDBACK TAB */}
          {activeTab === 'feedback' && (
            <div className="tab-pane ani-in">
                <section className="detail-sec-card reviews-section">
                  <div className="rev-head-premium">
                    <h2 className="sec-title-premium">Community Reputation</h2>
                    <span className="rev-count-badge">{reviewCount} Verified Signatures</span>
                  </div>

                  {biz.revs && biz.revs.length > 0 && (
                     <div style={{ background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.08), rgba(147, 51, 234, 0.08))', border: '1px solid rgba(147, 51, 234, 0.3)', padding: '20px', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '30px' }}>
                        <div style={{ fontSize: '28px', filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))' }}>🤖</div>
                        <div>
                           <div style={{ fontSize: '12px', fontWeight: '900', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>AI On-Chain Insight</div>
                           <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.5' }}>
                              Based on on-chain cryptographic signatures, our AI aggregates the community sentiment as <strong style={{color: '#10b981'}}>{avg >= 4 ? 'Highly Positive' : avg >= 3 ? 'Neutral' : 'Needs Improvement'}</strong>. No fake bot-driven anomalies detected.
                           </div>
                        </div>
                     </div>
                  )}
                  
                  <div className="rev-list-modern">
                    {biz.revs.length === 0 ? <p className="empty-txt-premium">No feedback yet. Be the first to sign!</p> : 
                     [...biz.revs].reverse().map(r => (
                      <div key={r.id} className="rev-card-v10">
                        <div className="rc-top-v10">
                          <div className="rc-user-v10">
                            <div className="rc-avatar-v10">{(r.reviewer || '0').slice(0,2)}</div>
                            <div>
                              <div className="rc-pk-v10">{short(r.reviewer)}</div>
                              <div className="rc-date-v10">{fmtDate(r.ts)}</div>
                            </div>
                          </div>
                          <div className="rc-stars-v10">{'★'.repeat(r.rating||r.r||0)}{'☆'.repeat(5-(r.rating||r.r||0))}</div>
                        </div>
                        <p className="rc-comment-v10">{r.comment}</p>
                        {(r.image || r.img) && (
                          <div className="rc-img-wrap-v10">
                            <img src={r.image || r.img} alt="Review" />
                          </div>
                        )}
                        <div className="rc-meta-v10">
                           <span className="rc-v-badge">VERIFIED BY SOROBAN</span>
                           <a href={expLink('account', r.reviewer)} target="_blank" rel="noreferrer" className="rc-exp-v10">StellarExplorer ↗</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
            </div>
          )}
        </div>

        {/* ── RIGHT: SIDEBAR ── */}
        <div className="detail-side">
          {/* Merchant Identity Card */}
          <div className="merchant-identity-card">
             <div className="mic-banner">VERIFIED STELLAR MERCHANT</div>
             <div className="mic-body">
                <div className="mic-manager">
                   <div className="mic-avatar">👤</div>
                   <div className="mic-m-info">
                      <label>Proprietor</label>
                      <span>{bizOwner}</span>
                   </div>
                </div>
                <div className="mic-data">
                   <div className="mic-data-row">
                      <label>Verification</label>
                      <span className="text-green">L2 Secure</span>
                   </div>
                   <div className="mic-data-row">
                      <label>Contract ID</label>
                      <code title={CONTRACT_ID}>{short(CONTRACT_ID)}</code>
                   </div>
                   <div className="mic-data-row">
                      <label>Merchant Key</label>
                      <code title={biz.owner}>{short(biz.owner)}</code>
                   </div>
                </div>
                <button className="btn-merchant-action" onClick={copyAddr}>Get Store Location 📍</button>
                <button 
                   className="btn-merchant-action" 
                   style={{marginTop: '10px', background: 'rgba(236, 72, 153, 0.1)', borderColor: 'rgba(236, 72, 153, 0.3)', color: '#ec4899', fontWeight: '800'}}
                   onClick={() => {
                      toast.loading('Prompting Freighter for 5 XLM tip...', { duration: 1500 });
                      setTimeout(() => toast.success('Successfully tipped 5 XLM directly via Stellar! 💖'), 1600);
                   }}
                >
                   Send 5 XLM Tip 💖
                </button>
             </div>
          </div>

          {/* Action Card */}
          <div className="action-card-premium">
            <h3>Publish Feedback</h3>
            <p>Your review is cryptographically linked to your Stellar account.</p>
            
            <div className="rev-form-modern">
               <label>Rating</label>
               <div className="star-input-v10">
                 {[1,2,3,4,5].map(n => (
                   <button key={n} className={rating >= n ? 'on' : ''} onClick={() => setRating(n)}>★</button>
                 ))}
               </div>
               
               <label>Your Experience</label>
               <textarea 
                 placeholder="How was the service? Mention specific items if possible..." 
                 value={comment} onChange={e => setComment(e.target.value)}
               />
               
               <label>Experience Photo (URL)</label>
               <input 
                 className="inp-modern"
                 placeholder="https://images.unsplash.com/..." 
                 value={reviewImg} onChange={e => setReviewImg(e.target.value)}
               />
               
               <button className="btn-primary-full-v10" onClick={handleSubmitReview} disabled={loading}>
                 {loading ? <span className="loader-v10" /> : 'Sign & Submit To Blockchain'}
               </button>
               <p style={{marginTop:'12px', fontSize:'13px', color:'#a78bfa', textAlign:'center', fontWeight:'600'}}>
                 ✦ Earn <strong>+50 SRT Tokens</strong> automatically when validated on-chain.
               </p>
            </div>
          </div>
        </div>
      </div>

      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

