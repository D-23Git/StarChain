// StarChain Soroban Blockchain Utility — V10 (Back to CA43 ID + Embedding)
// ✅ SOLUTION: Uses "Metadata Embedding" because CA43 contract expects 3 args (register) and 4 args (submit).
// ✅ SIGNATURE: register_business(3 args), submit_review(4 args).

const ID_VERIFIED_56 = 'CA43LPCXAPJQZYGKAKYKMIBL7WBOXWFY22ZCVTGTDRULIUHGHWXBXU6N';

export const CONTRACT_ID   = ID_VERIFIED_56; 
export const NETWORK_PASS  = 'Test SDF Network ; September 2015';
export const RPC_URL       = 'https://soroban-testnet.stellar.org';
export const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet';

// ── Robust SDK Resolver ──────────────────────────────────────────────────────
async function getSDK() {
  const mod = await import('@stellar/stellar-sdk');
  const sdk = mod.default || mod;
  const SorobanRpc = sdk.SorobanRpc || sdk.rpc || mod.SorobanRpc || mod.rpc;
  return { ...sdk, SorobanRpc };
}

// ── Freighter Integration ──────────────────────────────────────────────────
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

export async function freighterConnected() {
  try {
    const res = await isConnected();
    return !!res;
  } catch { return false }
}

export async function getFreighterPublicKey() {
  try {
    const res = await getPublicKey();
    return res || null;
  } catch { return null }
}

export async function signWithFreighter(xdr) {
  try {
    if (!(await freighterConnected())) throw new Error('Freighter extension not found');
    return signTransaction(xdr, { network: 'TESTNET' });
  } catch(e) {
    throw new Error('Signing failed: ' + e.message);
  }
}


// ── Soroban execution helpers ─────────────────────────────────────────────────
export async function buildAndSubmitTx(sourceAddress, operation) {
  const sdk = await getSDK()
  const { SorobanRpc, TransactionBuilder } = sdk
  const server  = new SorobanRpc.Server(RPC_URL)
  
  // SUPPORT FOR DEMO WALLETS (Simulation only)
  const isDemo = ['GB Sharma', 'GC Wellness', 'GD TechZone'].some(label => {
    return DEMO_WALLETS.find(d => d.addr === sourceAddress);
  });
  
  if (isDemo) {
    console.warn("⚠️ Demo Wallet detected: Simulating success...");
    return { status: 'SUCCESS', hash: 'demo_' + Date.now() };
  }

  const account = await server.getAccount(sourceAddress)
  const tx = new TransactionBuilder(account, {
    fee: '10000', networkPassphrase: NETWORK_PASS,
  }).addOperation(operation).setTimeout(60).build()

  const prepared = await server.prepareTransaction(tx)
  const xdr      = prepared.toXDR()
  const signed   = await signWithFreighter(xdr)
  const signedTx = sdk.TransactionBuilder.fromXDR(signed, NETWORK_PASS)
  const result   = await server.sendTransaction(signedTx)
  
  if (result.status === 'ERROR') throw new Error('Transaction submission failed')

  let r = await server.getTransaction(result.hash)
  let retry = 0
  while (r.status === 'NOT_FOUND' && retry < 20) {
    await new Promise(res => setTimeout(res, 500))
    r = await server.getTransaction(result.hash)
    retry++
  }
  if (r.status === 'SUCCESS') return r
  throw new Error('TX Verification failed: ' + r.status)
}


export async function simulateCall(operation, retries = 3) {
  const { SorobanRpc, TransactionBuilder, Account } = await getSDK()
  const server = new SorobanRpc.Server(RPC_URL)
  // A mathematically valid AND FUNDED dummy Stellar Public Key on Testnet
  const dummy  = new Account('GAVTPPKV6UI47MYPKNHKLJ6ANZU4QIXWVYQ5PBMFVKMB62DS3LQQ5WAE', '0')
  const tx = new TransactionBuilder(dummy, {
    fee: '100', networkPassphrase: NETWORK_PASS,
  }).addOperation(operation).setTimeout(30).build()
  
  let lastErr = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await server.simulateTransaction(tx);
      if (res.error) throw new Error(res.error);
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw lastErr;
}

// ── Contract functions ───────────────
export async function registerBusiness(owner, name, category, metadata = "{}") {
  const { Contract, nativeToScVal } = await getSDK()
  // Reverting to 3 params to match CA43 contract on-chain
  const packedCategory = `${category} |META| ${metadata}`;
  const op = new Contract(CONTRACT_ID).call(
    'register_business',
    nativeToScVal(owner,          { type: 'address' }),
    nativeToScVal(name,           { type: 'string'  }),
    nativeToScVal(packedCategory, { type: 'string'  }),
  )
  return buildAndSubmitTx(owner, op)
}

export async function submitReview(reviewer, businessId, rating, comment, metadata = "{}") {
  const { Contract, nativeToScVal } = await getSDK()
  // Reverting to 4 params to match CA43 contract on-chain
  const packedComment = `${comment} |META| ${metadata}`;
  const op = new Contract(CONTRACT_ID).call(
    'submit_review',
    nativeToScVal(reviewer,      { type: 'address' }),
    nativeToScVal(businessId,    { type: 'u64'     }),
    nativeToScVal(rating,        { type: 'u32'     }),
    nativeToScVal(packedComment, { type: 'string'  }),
  )
  return buildAndSubmitTx(reviewer, op)
}

export async function getBusiness(businessId) {
  const { Contract, nativeToScVal, scValToNative } = await getSDK()
  const op  = new Contract(CONTRACT_ID).call('get_business', nativeToScVal(businessId, { type: 'u64' }))
  const res = await simulateCall(op)
  return scValToNative(res.result.retval)
}

export async function getRating(businessId) {
  const { Contract, nativeToScVal, scValToNative } = await getSDK()
  try {
    const op  = new Contract(CONTRACT_ID).call('get_rating', nativeToScVal(businessId, { type: 'u64' }))
    const res = await simulateCall(op)
    if (!res || !res.result) return 0;
    const val = scValToNative(res.result.retval)
    return Number(val) / 100
  } catch { return 0 }
}

export async function getReviews(businessId) {
  const { Contract, nativeToScVal, scValToNative } = await getSDK()
  try {
    // Attempt plural call first (backward compatibility)
    try {
      const opP  = new Contract(CONTRACT_ID).call('get_reviews', nativeToScVal(businessId, { type: 'u64' }))
      const resP = await simulateCall(opP)
      if (resP.result) {
        const list = scValToNative(resP.result.retval) || []
        return list.map((r, i) => {
          let meta = {};
          let finalComment = r.comment;
          if (r.comment.includes('|META|')) {
            const parts = r.comment.split('|META|');
            finalComment = parts[0].trim();
            try { meta = JSON.parse(parts[1].trim()) } catch(_) {}
          }
          return { id: `chain-${businessId}-${i}`, reviewer: r.reviewer.toString(), rating: Number(r.rating), comment: finalComment, ts: Number(r.timestamp), ...meta };
        });
      }
    } catch(_) {}

    // Fallback to list_review_ids if plural call fails
    const opIds  = new Contract(CONTRACT_ID).call('list_review_ids', nativeToScVal(businessId, { type: 'u64' }))
    const resIds = await simulateCall(opIds)
    const ids    = scValToNative(resIds.result.retval) || []
    
    const detailedRevs = []
    for (const rid of ids) {
      try {
        const opR  = new Contract(CONTRACT_ID).call('get_review', nativeToScVal(rid, { type: 'u64' }))
        const resR = await simulateCall(opR)
        const r    = scValToNative(resR.result.retval)
        
        let meta = {};
        let finalComment = r.comment;
        if (r.comment.includes('|META|')) {
          const parts = r.comment.split('|META|');
          finalComment = parts[0].trim();
          try { meta = JSON.parse(parts[1].trim()) } catch(_) {}
        }

        detailedRevs.push({
          id: `chain-${businessId}-${rid}`,
          reviewer: r.reviewer.toString(),
          rating: Number(r.rating),
          comment: finalComment,
          ts: Number(r.timestamp),
          ...meta
        })
      } catch(e) {}
    }
    return detailedRevs
  } catch(e) { 
    return [] 
  }
}


export async function getBusinessCount() {
  const { Contract, scValToNative } = await getSDK()
  try {
    const op  = new Contract(CONTRACT_ID).call('business_count')
    const res = await simulateCall(op)
    return Number(scValToNative(res.result.retval))
  } catch { return 0 }
}

export async function loadAllBusinesses() {
  try {
    const count = await getBusinessCount()
    if (count === 0) return []
    
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) => i + 1).map(async (id) => {
        try {
          const b = await getBusiness(id)
          if (!b) return null;
          
          const r = await getRating(id)
          const revs = await getReviews(id)
          
          let meta = {}
          let finalCategory = b.category || "Other";
          
          if (b.category && b.category.includes('|META|')) {
            const parts = b.category.split('|META|');
            finalCategory = parts[0].trim();
            try { meta = JSON.parse(parts[1].trim()) } catch(_) {}
          }

          return {
            id: Number(id),
            name: b.name || "Unnamed Store",
            cat: finalCategory,
            avgRating: r || 0,
            review_count: Number(b.review_count || 0),
            total_rating: Number(b.total_rating || 0),
            count: Number(b.review_count || 0),
            total: Number(b.total_rating || 0),
            owner: b.owner ? b.owner.toString() : "Unknown Owner",
            ts: Number(b.registered_at || 0),
            revs: revs || [],
            ...meta
          }
        } catch (e) {
          console.error(`Failed to load business ${id}:`, e);
          return null;
        }
      })
    )

    return results.filter(b => b !== null)
  } catch (err) {
    console.error("loadAllBusinesses failed:", err);
    return [];
  }
}


// ── Display helpers ───────────────────────────────────────────────────────────
export const short   = a => a ? `${a.slice(0,5)}...${a.slice(-4)}` : ''
export const fmtDate = ts => new Date(Number(ts)*1000).toLocaleDateString('en-IN',
  { day:'numeric', month:'short', year:'numeric' })
export const expLink = (type, id) => `${EXPLORER_BASE}/${type}/${id}`

export const DEMO_WALLETS = [
  { label:'Alpha', addr:'GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ', icon:'🧑' },
  { label:'Beta',  addr:'GBVKI23OQZCANDUZ4DQTCJQ3LTBDCVNQ2VDMWQF6HFWQFZR4S3UJKM', icon:'👩' },
  { label:'Gamma', addr:'GDMXNQBJMS3FYI4PFSYCCB4XODQMNMTKPQ5HIKLJRDFGWF57DSS3ZEJ', icon:'🧔' },
  { label:'Delta', addr:'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGZDD1R2O0BHBEPWJFL5XW', icon:'👩💻' },
]

export const DEMO_BUSINESSES = [
  {
    id: 1, name: "Sharma's Dosa Corner", cat: 'Restaurant',
    total: 210, count: 43, avgRating: 4.6,
    owner: 'GM13ABCDEFHIJKLMNOP',
    ownerName: 'Dr. Sharma',
    address: 'Wakad, Pune',
    phone: '+91 98765 43210', email: 'sharma.dosa@gmail.com',
    established: '2014',
    image: '/assets/businesses/sharma.png',
    ts: 1710000000,
    about: 'Authentic South Indian flavors served with love and tradition.',
    menu: [
      { name: 'Masala Dosa', price: 80, desc: 'Crispy dosa with potato filling', emoji: '🥞' },
      { name: 'Idli Sambar', price: 60, desc: 'Soft idlis with tangy sambar', emoji: '⚪' },
      { name: 'Vada Pav', price: 20, desc: 'Mumbai style spicy burger', emoji: '🍔' },
      { name: 'Filter Coffee', price: 30, desc: 'Traditional South Indian coffee', emoji: '☕' }
    ],
    revs: [],
  },
  {
    id: 2, name: 'Medicare Clinic', cat: 'Healthcare',
    total: 39, count: 8, avgRating: 4.9,
    owner: 'GA1ABCDEFHIJKLMNOPQ',
    ownerName: 'Priya Mehta',
    address: 'Aundh Link Road, Pune',
    image: '/assets/businesses/medicare.png',
    ts: 1710100000,
    about: 'Your trusted healthcare partner in Pune.',
    menu: [
      { name: 'General Consultation', price: 500, desc: 'Basic checkup and prescription', emoji: '🩺' },
      { name: 'Blood Test Profile', price: 1200, desc: 'Complete hemogram and lipid', emoji: '🩸' },
      { name: 'ECG Screening', price: 800, desc: 'Heart activity monitoring', emoji: '❤️' },
      { name: 'Vaccination', price: 600, desc: 'Standard adult immunizations', emoji: '💉' }
    ],
    revs: [],
  },
  {
    id: 3, name: 'Skyline Grand Palace', cat: 'Hotel',
    total: 122, count: 25, avgRating: 4.9,
    owner: 'GQ17ABCXYZ123456789',
    ownerName: 'Arjun Kapoor',
    address: 'Yerwada, Pune',
    image: '/assets/businesses/grandpalace.png',
    ts: 1710200000,
    about: 'A luxurious hotel with infinity pool and skyline views.',
    menu: [
      { name: 'Deluxe Room', price: 5500, desc: 'Mountain view, King bed', emoji: '🛏️' },
      { name: 'Penthouse Suite', price: 15000, desc: 'Top floor exclusive with jacuzzi', emoji: '✨' },
      { name: 'Executive Room', price: 7500, desc: 'High-speed internet setup', emoji: '🏢' },
      { name: 'Spa Day Pass', price: 3000, desc: 'Full access to wellness center', emoji: '💆' }
    ],
    revs: [],
  },
  {
    id: 4, name: 'Urban Wardrobe', cat: 'Clothing',
    total: 105, count: 22, avgRating: 4.8,
    owner: 'GDMXNQBJMS3FYI4PFSY',
    ownerName: 'Anita Desai',
    address: 'Koregaon Park, Pune',
    image: '/assets/businesses/techzone.png',
    ts: 1710400000,
    about: 'Modern ethnic and western wear collection.',
    menu: [
      { name: 'Designer Kurti', price: 1200, desc: 'Cotton rich fabric with embroidery', emoji: '👗' },
      { name: 'Denim Jacket', price: 1800, desc: 'Vintage wash imported denim', emoji: '🧥' },
      { name: 'Silk Saree', price: 4500, desc: 'Authentic pure silk material', emoji: '🥻' },
      { name: 'Formal Trousers', price: 1500, desc: 'Slim fit stretchable pants', emoji: '👖' }
    ],
    revs: [],
  },
  {
    id: 5, name: 'Digital Edge Academy', cat: 'Education',
    total: 245, count: 52, avgRating: 4.9,
    owner: 'GCEZWKCA5VLDNRLN3RP',
    ownerName: 'Vikram Singh',
    address: 'FC Road, Pune',
    image: '/assets/businesses/edulearn.png',
    ts: 1710500000,
    about: 'Premier institute for modern digital skills and coding.',
    menu: [
      { name: 'Fullstack Bootcamp', price: 8000, desc: '12 week intensive MERN course', emoji: '💻' },
      { name: 'UI/UX Masterclass', price: 6500, desc: 'Figma to Code design logic', emoji: '🎨' },
      { name: 'Data Science intro', price: 4000, desc: 'Python and basic ML concepts', emoji: '📊' },
      { name: 'Blockchain 101', price: 9000, desc: 'Learn Soroban and Rust concepts', emoji: '🔗' }
    ],
    revs: [],
  },
  {
    id: 6, name: 'Cloud Hub Solutions', cat: 'Tech',
    total: 420, count: 86, avgRating: 4.8,
    owner: 'GCX1RESTAURANTXYZ123',
    ownerName: 'Chef Aditi',
    address: 'Baner High Street, Pune',
    image: '/assets/businesses/cloudhub.png',
    ts: 1710600000,
    about: 'Cutting edge cloud solutions and infrastructure services.',
    menu: [
      { name: 'Cloud Migration', price: 8500, desc: 'Seamless transition to AWS/Azure', emoji: '☁️' },
      { name: 'DevOps Setup', price: 4500, desc: 'CI/CD pipeline automation', emoji: '🤖' },
      { name: 'Security Audit', price: 12000, desc: 'Full infrastructure vulnerability scan', emoji: '🛡️' }
    ],
    revs: [],
  },
  {
    id: 7, name: 'Tech Hub Store', cat: 'Electronics',
    total: 130, count: 28, avgRating: 4.6,
    owner: 'GBD4TECHSTOREABC890',
    ownerName: 'Rohan Gupta',
    address: 'Phoenix Mall, Viman Nagar, Pune',
    image: '/assets/businesses/techzone.png',
    ts: 1710700000,
    about: 'Your one-stop shop for modern smart devices and gadgets.',
    menu: [
      { name: 'Screen Repair', price: 2500, desc: 'OLED drop-in replacement guarantee', emoji: '📱' },
      { name: 'Smart Watch OS Update', price: 300, desc: 'Firmware diagnostic and flash', emoji: '⌚' },
      { name: 'Laptop Battery Swap', price: 3500, desc: 'Genuine OEM battery installation', emoji: '🔋' },
      { name: 'Data Recovery', price: 1500, desc: 'Hard drive and storage recovery', emoji: '💾' }
    ],
    revs: [],
  },
  {
    id: 8, name: 'Apex Wealth Partners', cat: 'Finance',
    total: 65, count: 13, avgRating: 5.0,
    owner: 'GD7WEALTHFINANCE88L',
    ownerName: 'Manoj Tiwari',
    address: 'Kalyani Nagar, Pune',
    image: '/assets/businesses/sharma.png',
    ts: 1710800000,
    about: 'Verified financial consulting and tax strategy advisory.',
    menu: [
      { name: 'Tax Assessment', price: 5000, desc: 'End of year corporate filing', emoji: '📊' },
      { name: 'Portfolio Review', price: 2000, desc: '1 hour strategy session', emoji: '📈' },
      { name: 'Crypto Audit', price: 3000, desc: 'On-chain portfolio verification', emoji: '🔗' },
      { name: 'Retirement Plan', price: 2500, desc: 'Long-term risk-adjusted path', emoji: '👴' }
    ],
    revs: [],
  }
];
