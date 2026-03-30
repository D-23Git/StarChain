import { useStore } from '../hooks/useStore'
import './StatsBar.css'

export default function StatsBar() {
  const { businesses, totalReviews } = useStore()

  return (
    <div className="statsbar">
      <div className="sb-inner wrap">
        <div className="sb-item">
          <span className="sb-n">{businesses.length}</span>
          <span className="sb-l">On-Chain Businesses</span>
        </div>
        <div className="sb-item">
          <span className="sb-n">{totalReviews}</span>
          <span className="sb-l">Verified Reviews</span>
        </div>
        <div className="sb-item">
          <span className="sb-n" style={{ color: 'var(--grn2)' }}>0</span>
          <span className="sb-l">Fake Reviews</span>
        </div>
        <div className="sb-item">
          <a
            className="sb-pill"
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noreferrer"
          >
            📋 View Contract on Explorer ↗
          </a>
        </div>
      </div>
    </div>
  )
}
