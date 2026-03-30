import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { 
  loadAllBusinesses,
  DEMO_BUSINESSES,
  CONTRACT_ID,
  short,
  fmtDate,
  expLink
} from '../utils/stellar'

const StoreCtx = createContext(null)

const getInitialBusinesses = () => {
  try {
    const cached = localStorage.getItem('sc_cache_businesses');
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return [...DEMO_BUSINESSES];
}

export function StoreProvider({ children }) {
  const [businesses, setBusinesses] = useState(getInitialBusinesses)
  const [loading, setLoading] = useState(true)

  const loadChainData = useCallback(async () => {
    setLoading(true)
    try {
      const chainBiz = await loadAllBusinesses()
      
      // Load Locally Saved Reviews & Patches
      const savedRevs   = JSON.parse(localStorage.getItem('sc_local_revs')   || '{}')
      const localEdits  = JSON.parse(localStorage.getItem('sc_local_edits')  || '{}')
      const localHidden = JSON.parse(localStorage.getItem('sc_local_hidden') || '[]')
      
      // ⛓️ STRATEGY: Start with Demo, then OVERWRITE with Chain
      let merged = [...DEMO_BUSINESSES]
      
      chainBiz.forEach(cb => {
        // Apply local patches to chain data if they exist
        let patchedCb = { ...cb };
        if (localEdits[cb.id]) {
          patchedCb = { ...patchedCb, ...localEdits[cb.id] };
        }

        const idx = merged.findIndex(mb => mb.id === cb.id)
        const localRevs = savedRevs[cb.id] || []
        const allRevs   = [...(patchedCb.revs || []), ...localRevs]

        if (idx !== -1) {
          // If ID matches a demo, the Chain version (patched) is the truth
          merged[idx] = { 
            ...merged[idx], 
            ...patchedCb, 
            revs: allRevs.filter((v, i, a) => a.findIndex(t => (t.id === v.id || (t.comment === v.comment && t.reviewer === v.reviewer))) === i) 
          }
        } else {
          // New business not in demo set
          patchedCb.revs = allRevs
          merged.push(patchedCb)
        }
      })
      
      // Final filter: remove hidden items
      merged = merged.filter(b => !localHidden.includes(b.id));

      // Cache for instant loads on next refresh
      localStorage.setItem('sc_cache_businesses', JSON.stringify(merged));
      
      setBusinesses(merged)
    } catch (e) {
      console.error("Store: Failed to load chain data", e)
      setBusinesses([...DEMO_BUSINESSES])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadChainData()
  }, [loadChainData])

  const addBusiness = useCallback((biz) => {
    setBusinesses(prev => {
      const next = [...prev, biz];
      localStorage.setItem('sc_cache_businesses', JSON.stringify(next));
      return next;
    });
  }, [])

  const addReview = useCallback((bizId, review) => {
    // Save to LocalStorage for Persistence
    const saved = JSON.parse(localStorage.getItem('sc_local_revs') || '{}')
    if (!saved[bizId]) saved[bizId] = []
    saved[bizId].push(review)
    localStorage.setItem('sc_local_revs', JSON.stringify(saved))

    // Update State
    setBusinesses(prev => {
      const next = prev.map(b => {
        if (b.id !== bizId) return b
        const newTotal = (b.total_rating || b.total || 0) + review.rating
        const newCount = (b.review_count || b.count || 0) + 1
        return {
          ...b,
          revs: [...(b.revs || []), review],
          review_count: newCount,
          total_rating: newTotal,
          count: newCount,
          total: newTotal,
          avgRating: newTotal / newCount,
        }
      });
      localStorage.setItem('sc_cache_businesses', JSON.stringify(next));
      return next;
    })
  }, [])


  const updateBusinessLocally = useCallback((bizId, updates) => {
    const edits = JSON.parse(localStorage.getItem('sc_local_edits') || '{}')
    edits[bizId] = { ...(edits[bizId] || {}), ...updates }
    localStorage.setItem('sc_local_edits', JSON.stringify(edits))
    setBusinesses(prev => {
      const next = prev.map(b => b.id === bizId ? { ...b, ...updates } : b);
      localStorage.setItem('sc_cache_businesses', JSON.stringify(next));
      return next;
    })
  }, [])

  const deleteBusinessLocally = useCallback((bizId) => {
    const hidden = JSON.parse(localStorage.getItem('sc_local_hidden') || '[]')
    if (!hidden.includes(bizId)) hidden.push(bizId)
    localStorage.setItem('sc_local_hidden', JSON.stringify(hidden))
    
    setBusinesses(prev => {
      const next = prev.filter(b => b.id !== bizId);
      localStorage.setItem('sc_cache_businesses', JSON.stringify(next));
      return next;
    })
  }, [])

  const totalReviews = (businesses || []).reduce((a, b) => a + (Number(b?.review_count || b?.count || 0)), 0)

  return (
    <StoreCtx.Provider value={{ 
      businesses, loading, addBusiness, addReview, 
      updateBusinessLocally, deleteBusinessLocally,
      totalReviews, reload: loadChainData 
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

export function useStore() {
  return useContext(StoreCtx)
}
