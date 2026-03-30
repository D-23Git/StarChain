import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { useStore } from '../hooks/useStore'
import WalletModal from '../components/WalletModal'
import toast from 'react-hot-toast'
import { 
  registerBusiness, 
  fmtDate,
  short,
  expLink,
  CONTRACT_ID
} from '../utils/stellar'
import './RegisterPage.css'
import BusinessCard from '../components/BusinessCard'

const CATS = ['Restaurant','Electronics','Clothing','Education','Healthcare','Finance','Hotel','Technology','Other']

export default function RegisterPage() {
  const navigate = useNavigate()
  const { wallet } = useWallet()
  const { businesses, addBusiness } = useStore()
  
  // Form State
  const [step, setStep]         = useState(1)
  const [name, setName]         = useState('')
  const [cat, setCat]           = useState('Restaurant')
  const [addr, setAddr]         = useState('')
  const [imgUrl, setImgUrl]     = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [items, setItems]       = useState([{ name: '', price: '', icon: '📦' }])
  
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [newBizId, setNewBizId] = useState(null)
  const [txHash, setTxHash]     = useState(null)
  const [err, setErr]           = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const addItem = () => setItems([...items, { name: '', price: '', icon: '📦' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, k, v) => {
    const n = [...items]; n[i][k] = v; setItems(n)
  }

  // Live Preview Object
  const previewBiz = {
    id: 999, name: name || 'Your Business Name', cat: cat || 'Category',
    addr: addr || '123 Main St, City',
    img: imgUrl || null, imgUrl: imgUrl || null,
    review_count: 0, total_rating: 0, avgRating: 0,
    owner: wallet?.address || 'G...WALLET',
    items: items.filter(it => it.name.trim())
  }

  async function handleSubmit() {
    if (!wallet) { setModalOpen(true); return }
    if (!name.trim()) { setErr('Name is required'); setStep(1); return }
    if (!addr.trim()) { setErr('Address is required'); setStep(3); return }
    
    setErr('')
    setLoading(true)
    try {
      const metaObj = {
        address: addr.trim(),
        image: imgUrl.trim() || null,
        ownerName: ownerName.trim() || 'Anonymous Owner',
        menu: items.filter(it => it.name.trim()).map(it => ({ ...it, emoji: it.icon }))
      }
      const metaStr = JSON.stringify(metaObj)
      
      // CALL CONTRACT: register_business(owner, name, category, metadata)
      const r = await registerBusiness(wallet.address, name.trim(), cat, metaStr)
      const hashVal = r.hash || 'demo_hash_' + Date.now();
      setTxHash(hashVal);
      
      const biz = { 
        ...previewBiz, 
        id: Date.now(), 
        ...metaObj, 
        review_count: 0, 
        total_rating: 0, 
        avgRating: 0,
        ts: Math.floor(Date.now()/1000), 
        revs: [] 
      }
      addBusiness(biz)
      setStep(4) // SHOW NEW CELEBRATION STEP
      if (window.confetti) {
        window.confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, colors: ['#6d28d9', '#a78bfa', '#10b981'] });
      }
      toast.success('Your Business is Live on Stellar! ⛓️', { duration: 6000, icon: '🚀' })
      setNewBizId(biz.id)
      setDone(true)
    } catch (e) {
      setErr(e.message)
      toast.error('Registration Failed: ' + e.message)
    } finally { setLoading(false) }
  }

  if (done) return (
    <div className="reg-page wrap">
      <div className="success-wizard">
        <div className="suc-icon-glow">🚀</div>
        <h2>Registration Complete!</h2>
        <p><strong>{name}</strong> is now a verified merchant on the Stellar network.</p>
        <div className="suc-actions">
           <button className="btn-primary-lg" onClick={() => navigate(`/business/${newBizId}`)}>Manage Profile →</button>
           <button className="btn-glass-lg" onClick={() => window.location.reload()}>Register Another</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="reg-page">
      <div className="wrap reg-container">
        {/* Left: Wizard */}
        <div className="wizard-column">
          <div className="wiz-header">
            <div className="wiz-steps-indicator">
              {[1,2,3].map(n => (
                <div key={n} className={`step-dot ${step >= n ? 'on' : ''} ${step === n ? 'active' : ''}`}>
                  {step > n ? '✓' : n}
                </div>
              ))}
            </div>
            <h1>{step === 1 ? 'Start Your Legacy' : step === 2 ? 'List Your Offerings' : 'Brand Your Identity'}</h1>
            <p>Step {step} of 3: {step === 1 ? 'Basic Identity' : step === 2 ? 'Price List & Items' : 'Visuals & Location'}</p>
          </div>

          <div className="wiz-card">
            {step === 1 && (
              <div className="wiz-step-body ani-in">
                <div className="field">
                  <label>Official Business Name</label>
                  <input className="inp-lg" placeholder="e.g. Blue Tokai Coffee" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Industry Category</label>
                  <div className="cat-grid-select">
                    {CATS.map(c => (
                      <button key={c} className={`cat-opt ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="wiz-step-body ani-in">
                <label className="mb-label">
                  {cat === 'Healthcare' ? 'Clinic Services & Pharmacy' : 
                   cat === 'Hotel' ? 'Room Types & Amenities' : 
                   cat === 'Restaurant' ? 'Menu Card' : 'Pricing & Offerings'}
                </label>
                <div className="mb-list-wizard">
                  {items.map((it, idx) => (
                    <div key={idx} className="mb-row-wiz">
                      <input 
                        className="inp mic-n" 
                        placeholder={cat === 'Healthcare' ? 'Medicine / Consultation' : cat === 'Hotel' ? 'Room / Suite Type' : 'Item / Service'} 
                        value={it.name} onChange={e => updateItem(idx, 'name', e.target.value)} 
                      />
                      <input 
                        className="inp mic-p" 
                        placeholder={cat === 'Healthcare' ? 'Fee (e.g. 50 XLM)' : cat === 'Hotel' ? 'Rate (e.g. 200 XLM)' : 'Price'} 
                        value={it.price} onChange={e => updateItem(idx, 'price', e.target.value)} 
                      />
                      {items.length > 1 && <button className="btn-rm-item" onClick={() => removeItem(idx)}>✕</button>}
                    </div>
                  ))}
                  <button className="btn-add-dashed" onClick={addItem}>
                    {cat === 'Healthcare' ? '+ Add Another Medicine/Service' : cat === 'Hotel' ? '+ Add Room Concept' : '+ Add Offering'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="wiz-step-body ani-in">
                <div className="field">
                  <label>Physical Address / Global HQ</label>
                  <input className="inp-lg" placeholder="Store #10, Cyber City, Gurgaon" value={addr} onChange={e => setAddr(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>Store Image (URL)</label>
                    <input className="inp" placeholder="https://..." value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Owner Name</label>
                    <input className="inp" placeholder="Verified Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                  </div>
                </div>
                {err && <div className="wiz-err">⚠️ {err}</div>}
              </div>
            )}

            {step === 4 && (
              <div className="wiz-step-body ani-in success-screen">
                <div className="success-icon">✨</div>
                <h2 className="success-title">On-Chain Registration Successful!</h2>
                <p className="success-sub">Your business is now part of the global verified network on Stellar.</p>
                <div className="success-data-box">
                  <div className="sd-row"><label>Status</label><span className="text-green">Verified</span></div>
                  <div className="sd-row"><label>Network</label><span>Soroban Testnet</span></div>
                </div>
                <div className="success-actions">
                   <button className="btn-primary-lg" onClick={() => navigate(`/business/${newBizId || 1}`)}>View My Live Profile →</button>
                   <button className="btn-glass" onClick={() => navigate('/browse')}>Back to Marketplace</button>
                </div>
              </div>
            )}

            {step < 4 && (
              <div className="wiz-footer">
                {step > 1 && <button className="btn-glass" onClick={() => setStep(step - 1)}>Back</button>}
                <div style={{ flex: 1 }} />
                {step < 3 ? (
                  <button className="btn-primary-lg" onClick={() => setStep(step + 1)}>Continue →</button>
                ) : (
                  <button className="btn-primary-lg" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Confirming on Stellar...' : 'Register Business On-Chain'}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right: Live Preview */}
        <div className="preview-column">
          <div className="preview-sticky">
             <div className="preview-label">Live On-Chain Preview</div>
             <div className="preview-card-wrap">
                <BusinessCard biz={previewBiz} />
             </div>
             <div className="preview-hint">
                <p>This is exactly how your business will appear to thousands of verified reviewers on the Stellar network.</p>
             </div>
          </div>
        </div>
      </div>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
