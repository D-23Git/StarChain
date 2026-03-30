import { useState, useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import BusinessCard from '../components/BusinessCard'
import './BrowsePage.css'

const CAT_MAP = [
  { n: 'All', i: '📁' },
  { n: 'Restaurant', i: '🍴' },
  { n: 'Electronics', i: '📱' },
  { n: 'Clothing', i: '👗' },
  { n: 'Education', i: '🎓' },
  { n: 'Healthcare', i: '🏥' },
  { n: 'Finance', i: '💰' },
  { n: 'Hotel', i: '🏨' },
  { n: 'Technology', i: '💻' },
]

export default function BrowsePage() {
  const { businesses } = useStore()
  const [search, setSearch] = useState('')
  const [cat, setCat]       = useState('All')
  const [sort, setSort]     = useState('top')
  const [minRating, setMinRating] = useState(0)

  const filtered = useMemo(() => {
    let list = businesses.filter(b => {
      const matchCat = cat === 'All' || b.cat === cat
      const rc = b.review_count ?? b.count ?? 0
      const tr = b.total_rating ?? b.total ?? 0
      const avg = rc ? tr / rc : (b.avgRating || 0)
      const matchRating = avg >= minRating
      const matchSearch = !search || 
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.cat.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchRating && matchSearch
    })
    
    const getAvg = b => { const rc = b.review_count ?? b.count ?? 0; const tr = b.total_rating ?? b.total ?? 0; return rc ? tr/rc : (b.avgRating||0) }
    if (sort === 'top')    list.sort((a,b) => getAvg(b) - getAvg(a))
    if (sort === 'newest') list.sort((a,b) => b.ts - a.ts)
    if (sort === 'most')   list.sort((a,b) => (b.review_count??b.count??0) - (a.review_count??a.count??0))
    return list
  }, [businesses, cat, search, minRating, sort])

  return (
    <div className="browse-page">
      {/* ── HERO BANNER ── */}
      <section className="hero-banner">
        <div className="wrap">
          <div className="hc-card">
            <div className="hc-content">
              <h1>Modern Dental Care</h1>
              <p>Professional dental clinic with stellar reputation and care.</p>
              <div className="hc-tags">
                <span className="hc-cat">Healthcare</span>
                <span className="hc-rating">⭐ 4.9</span>
              </div>
            </div>
            <div className="hc-image-side">
              <div className="hc-image-inner" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80")' }}></div>
            </div>
          </div>
          <div className="hc-dots">
            <div className="dot"></div>
            <div className="dot on"></div>
            <div className="dot"></div>
          </div>
        </div>
      </section>

      {/* ── SEARCH & FILTERS SECTION ── */}
      <section className="filter-sec">
        <div className="wrap">
          {/* SEARCH PILL */}
          <div className="search-pill">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              placeholder="Search 17+ verified businesses in Pune & Mumbai..." 
              value={search} onChange={e => setSearch(e.target.value)} 
            />
          </div>

          {/* CAT PILLS */}
          <div className="cat-pills-wrap">
            {CAT_MAP.map(c => (
              <button key={c.n} className={`cat-pill ${cat === c.n ? 'on' : ''}`} onClick={() => setCat(c.n)}>
                <span className="cp-icon">{c.n === 'All' ? '📁' : c.i}</span>
                <span className="cp-label">{c.n === 'All' ? 'Discover All' : c.n}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── GRID SECTION ── */}
      <section className="biz-sec">
        <div className="wrap">
          <div className="biz-grid-head">
            <div className="biz-grid-head-left">
               <div className="biz-count-lbl">VERIFIED MERCHANTS</div>
               <div className="biz-count-val">{filtered.length} listings</div>
            </div>
            <div className="fb-controls">
               <select className="inp-select-dark" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="top">⭐ Top Trusted</option>
                  <option value="most">🔥 Most Trending</option>
                  <option value="newest">🕒 Just Registered</option>
               </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state-browse">
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
              <h2>No businesses match your search</h2>
              <p>Try searching for a different category or store name.</p>
              <button className="btn-outline" onClick={() => { setSearch(''); setCat('All'); }}>Clear Filters</button>
            </div>
          ) : (
            <div className="biz-grid">
              {filtered.map(b => (
                <BusinessCard key={b.id} biz={b} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
