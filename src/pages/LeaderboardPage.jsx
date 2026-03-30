import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { short } from '../utils/stellar'
import './LeaderboardPage.css'

export default function LeaderboardPage() {
  const { businesses } = useStore()

  // Calculate Leaderboard Data from all reviews safely
  const leaderboard = useMemo(() => {
    const users = {}
    
    // Safety check just in case businesses array is initially empty
    if (!businesses || businesses.length === 0) return []

    businesses.forEach(biz => {
      if (!biz.revs) return;
      biz.revs.forEach(r => {
        if (!r.reviewer) return;
        if (!users[r.reviewer]) {
          users[r.reviewer] = {
            address: r.reviewer,
            reviewCount: 0,
            totalRatingGiven: 0,
            firstTs: r.ts || Date.now() / 1000
          }
        }
        users[r.reviewer].reviewCount += 1
        users[r.reviewer].totalRatingGiven += (r.rating || r.r || 5)
        if (r.ts && r.ts < users[r.reviewer].firstTs) {
          users[r.reviewer].firstTs = r.ts
        }
      })
    })

    const lbArray = Object.values(users).map(u => {
      // Logic for trust level calculation based on number of reviews
      const trustLevel = Math.min(Math.floor(u.reviewCount / 2) + 1, 99)
      const avgGiven = (u.totalRatingGiven / u.reviewCount).toFixed(1)
      
      // Calculate a "Trust Score" generic metric for display
      const trustScore = u.reviewCount * 125 + (Number(avgGiven) * 10)

      return { ...u, trustLevel, avgGiven, trustScore }
    })

    // Sort by Trust Score descending
    return lbArray.sort((a, b) => b.trustScore - a.trustScore)
  }, [businesses])

  return (
    <div className="leaderboard-page pb-120">
      <section className="lb-hero">
        <div className="wrap text-center">
          <span className="lp-badge-premium mx-auto" style={{maxWidth: 'fit-content'}}>NETWORK VALIDATORS</span>
          <h1 className="lp-h1-premium" style={{fontSize: '48px'}}>Global Trust Leaderboard</h1>
          <p className="lp-sub-premium mx-auto">
            These are the top wallet addresses actively securing the StarChain protocol by signing verified, on-chain commercial feedback.
          </p>
        </div>
      </section>

      <section className="lb-main wrap">
        {leaderboard.length === 0 ? (
           <div className="lb-empty">
             <h2>Awaiting Network Sync...</h2>
             <p>No verified feedback has been indexed from the contract yet.</p>
           </div>
        ) : (
           <div className="lb-table-glass">
             <div className="lb-tr lb-th">
                <div className="lb-td text-center" style={{width: 60}}>Rank</div>
                <div className="lb-td">Stellar Address (Reviewer)</div>
                <div className="lb-td text-center">Trust Level</div>
                <div className="lb-td text-center">Reviews Signed</div>
                <div className="lb-td text-right">Trust Score</div>
             </div>
             
             {leaderboard.map((user, idx) => (
                <div key={user.address} className={`lb-tr ${idx < 3 ? 'lb-top-3' : ''}`}>
                  <div className="lb-td text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>
                  <div className="lb-td lb-address-col">
                     <span className="lb-avatar">{(user.address || 'G').charAt(0)}</span>
                     <div>
                       <strong>{short(user.address)}</strong>
                       {idx === 0 && <span className="lb-tag-glow text-green">Apex Validator</span>}
                     </div>
                  </div>
                  <div className="lb-td text-center">
                    <span className="lb-level-pill">Lvl {user.trustLevel}</span>
                  </div>
                  <div className="lb-td text-center font-bold">
                    {user.reviewCount} <span className="text-gray" style={{fontSize: 12}}>Verified</span>
                  </div>
                  <div className="lb-td text-right lb-score font-bold">
                    {user.trustScore.toLocaleString()}
                  </div>
                </div>
             ))}
           </div>
        )}
      </section>
    </div>
  )
}
