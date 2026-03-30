import { useNavigate } from 'react-router-dom'
import './BusinessCard.css'

export default function BusinessCard({ biz }) {
  const navigate = useNavigate()
  const count = biz.review_count ?? biz.count ?? 0
  const total = biz.total_rating ?? biz.total ?? 0
  const avg = count ? total / count : (biz.avgRating || 0)
  const owner = biz.owner || 'Verified';
  const shortOwner = owner.length > 10 ? `${owner.slice(0,4)}......${owner.slice(-3)}` : owner;

  return (
    <div
      className="biz-card"
      onClick={() => navigate(`/business/${biz.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/business/${biz.id}`)}
    >
      <div className="bc-media">
        {(biz.image || biz.img || biz.imgUrl) ? (
          <img src={biz.image || biz.img || biz.imgUrl} alt={biz.name} className="bc-bg" />
        ) : (
          <div className="bc-placeholder"></div>
        )}
        <div className="bc-cat-badge">{biz.cat.toUpperCase()}</div>
        <div className="bc-check-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
        </div>
      </div>

      <div className="bc-footer">
         <div className="bc-title-row">
           <h3 className="bc-title">{biz.name}</h3>
           <div className="bc-open-badge">OPEN</div>
         </div>
         <div className="bc-rating-pill">⭐ {avg.toFixed(1)}</div>
         {(biz.address || biz.addr) && <div className="bc-address"><span>📍</span> {biz.address || biz.addr}</div>}
         
         {biz.menu && biz.menu.length > 0 && (
           <div className="bc-featured-item">
             <span className="bc-feat-tag">✨</span> {biz.menu[0].name}
           </div>
         )}
         
         <div className="bc-stats-grid">
           <div className="bc-stat-box">
             <span className="bc-stat-num">{count}</span>
             <span className="bc-stat-lbl">REVS</span>
           </div>
           <div className="bc-stat-box">
             <span className="bc-stat-num">{shortOwner}</span>
             <span className="bc-stat-lbl">OWNER</span>
           </div>
           <div className="bc-stat-box">
             <span className="bc-stat-num text-green">L2</span>
             <span className="bc-stat-lbl">SECURED</span>
           </div>
         </div>
         
         <button className="bc-view-btn">View Smart Profile →</button>
      </div>
    </div>
  )
}
