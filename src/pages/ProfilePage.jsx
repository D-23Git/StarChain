import { useStore } from '../hooks/useStore'
import { useWallet } from '../hooks/useWallet'
import WalletModal from '../components/WalletModal'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { short, registerBusiness, DEMO_BUSINESSES } from '../utils/stellar'
import toast from 'react-hot-toast'
import './ProfilePage.css'

export default function ProfilePage() {
  const { wallet } = useWallet()
  const { businesses, loading, reload, updateBusinessLocally, deleteBusinessLocally } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Edit State
  const [editingBiz, setEditingBiz] = useState(null)
  const [editName, setEditName] = useState('')
  const [editCat, setEditCat] = useState('')

  if (!wallet) {
    return (
      <div className="profile-page flex-col center">
        <div className="profile-empty">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your Freighter wallet to view your personalized dashboard and track your on-chain reputation.</p>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>Connect Freighter</button>
        </div>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    )
  }

  // Calculate user stats
  // We check owner address (must match wallet.address)
  // Ensure businesses is an array and filter safely with case-insensitivity
  const myBusinesses = (businesses || []).filter(b => b && b.owner?.toLowerCase() === wallet?.address?.toLowerCase())
  
  // Find all reviews written by this user
  const myReviews = (businesses || []).flatMap(b => {
    if (!b || !b.revs) return [];
    return b.revs.filter(r => r && r.reviewer?.toLowerCase() === wallet?.address?.toLowerCase()).map(r => ({
      ...r,
      businessName: b.name || "Unknown Business",
      businessId: b.id
    }))
  }).sort((a,b) => (b.ts || 0) - (a.ts || 0))

  async function handleBootstrap() {
    if (!wallet) return;
    setIsSyncing(true);
    const tid = toast.loading("Syncing 8 Demo establishments to Blockchain...");
    
    try {
      for (const demo of DEMO_BUSINESSES) {
        toast.loading(`Registering ${demo.name}...`, { id: tid });
        const metadata = JSON.stringify({
          address: demo.address,
          img: demo.image,
          about: demo.about,
          ownerName: demo.ownerName,
          menu: demo.menu
        });
        await registerBusiness(wallet.address, demo.name, demo.cat, metadata);
      }
      toast.success("All 8 Establishments successfully synced! 🎉", { id: tid });
      await reload(); // Refresh global state
    } catch (e) {
      toast.error("Sync partial failure: " + e.message, { id: tid });
    } finally {
      setIsSyncing(false);
    }
  }

  function handleEdit(b) {
    setEditingBiz(b)
    setEditName(b.name)
    setEditCat(b.cat)
  }

  function saveEdit() {
    if (!editName.trim()) return toast.error("Name cannot be empty")
    updateBusinessLocally(editingBiz.id, { name: editName, cat: editCat })
    setEditingBiz(null)
    toast.success("Business updated locally!")
  }

  function handleDelete(id) {
    if (window.confirm("Are you sure? This will hide the business from Browse and Dashboard.")) {
      deleteBusinessLocally(id)
      toast.success("Business hidden successfully")
    }
  }

  return (
    <div className="profile-page pb-120">
      <div className="profile-hero">
        <div className="wrap flex-row-between">
          <div className="ph-content">
            <div className="ph-avatar">👤</div>
            <div className="ph-text">
              <span className="ph-badge">VERIFIED WALLET</span>
              <h1>My Dashboard</h1>
              <code>{wallet.address}</code>
            </div>
          </div>
          <div className="ph-actions">
             <button 
                className="btn-outline" 
                onClick={async () => {
                  const tid = toast.loading("Refreshing blockchain data...");
                  await reload();
                  toast.success("Data refreshed!", { id: tid });
                }}
                disabled={loading}
             >
                🔄 {loading ? "Syncing..." : "Refresh Chain"}
             </button>
             <button 
                className="btn-sync-premium" 
                onClick={handleBootstrap} 
                disabled={isSyncing}
                title="Sync hardcoded demo stores to your own wallet on Stellar Testnet"
             >
                {isSyncing ? "⌛ Syncing..." : "⛓️ Sync Demo to Chain"}
             </button>
          </div>
        </div>
      </div>

      <div className="wrap profile-grid">
        {/* STATS */}
        <div className="pg-stats">
           <div className="pg-stat-card">
              <h3>{myBusinesses.length}</h3>
              <p>Registered Businesses</p>
           </div>
           <div className="pg-stat-card">
              <h3>{myReviews.length}</h3>
              <p>Verified Reviews Signed</p>
           </div>
           <div className="pg-stat-card" style={{borderColor: 'rgba(147, 51, 234, 0.4)', background: 'rgba(147, 51, 234, 0.05)'}}>
              <h3 className="text-glow" style={{textShadow: '0 0 20px rgba(147, 51, 234, 0.8)'}}>{myReviews.length * 50} <span style={{fontSize:'16px'}}>SRT</span></h3>
              <p style={{color: '#d8b4fe'}}>Unclaimed Rewards</p>
           </div>
        </div>

        {/* LISTS */}
        <div className="pg-lists">
          <div className="pg-col">
            <h2 className="pg-h2">My Establishments</h2>
            {myBusinesses.length === 0 ? (
              <div className="pg-empty">No businesses registered yet.</div>
            ) : (
              <div className="pg-vcard-grid">
                {myBusinesses.map(b => (
                  <div key={b.id} className="pg-vcard">
                    <div className="pg-vc-top">
                      <div className="pg-vc-icon">🏢</div>
                      <div className="pg-vc-info">
                         <h4>{b.name}</h4>
                         <span>{b.cat}</span>
                      </div>
                    </div>
                    <div className="pg-vc-mid">
                       <span className="pbs-chip">⭐ {Number(b.avgRating||0).toFixed(1)}</span>
                       <span className="pbs-chip">📝 {b.review_count||0} Reviews</span>
                    </div>
                    <div className="pg-vc-actions">
                       <Link to={`/business/${b.id}`} className="btn-primary-sm" style={{flex: 1, padding:'10px', fontSize:'13px', textAlign:'center'}}>View →</Link>
                       <button className="ti-btn edit" onClick={() => handleEdit(b)} title="Edit Details">✏️</button>
                       <button className="ti-btn delete" onClick={() => handleDelete(b.id)} title="Delete Store">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/register" className="btn-primary" style={{marginTop: '20px', display: 'inline-block'}}>+ Register New</Link>
          </div>
          
          <div className="pg-col">
            <h2 className="pg-h2">Recent Feedback Signed</h2>
            {myReviews.length === 0 ? (
              <div className="pg-empty">No reviews published yet.</div>
            ) : (
              <div className="pg-vcard-grid">
                {myReviews.map(r => (
                  <div key={r.id} className="pg-vcard">
                    <div className="pg-vc-top">
                      <div className="pg-vc-icon">📝</div>
                      <div className="pg-vc-info">
                         <h4>{r.businessName}</h4>
                         <span className="pbs-chip" style={{display:'inline-block', marginTop:'5px'}}>⭐ {r.rating}</span>
                      </div>
                    </div>
                    <div className="pg-vc-mid">
                      <p className="pbb-cmt">"{short(r.comment)}"</p>
                    </div>
                    <div className="pg-vc-actions">
                       <Link to={`/business/${r.businessId}`} className="btn-outline-sm" style={{width:'100%', padding:'10px', fontSize:'13px', textAlign:'center'}}>View Blockchain Verification ↗</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/browse" className="btn-outline" style={{marginTop: '20px', display: 'inline-block'}}>Explore Marketplace</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
