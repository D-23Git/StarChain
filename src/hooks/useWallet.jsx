import { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { isConnected, getNetwork, getPublicKey, setAllowed, isAllowed } from '@stellar/freighter-api'

const WalletCtx = createContext(null)

export function WalletProvider({ children }) {
  const [wallet, setWalletState] = useState(null)

  const connect = useCallback(async (type, opts = {}) => {
    try {
      if (type === 'freighter') {
        toast.loading('Connecting to Freighter...', { id: 'frt' })

        const hasFreighter = await isConnected()
        if (!hasFreighter) {
          toast.error('Freighter not found — install from freighter.app', { id: 'frt' })
          setTimeout(() => window.open('https://freighter.app', '_blank'), 800)
          return false
        }

        // Check network — don't block if it fails
        try {
          const netResult = await getNetwork()
          const net = (typeof netResult === 'string' ? netResult : netResult?.network || '').toLowerCase()
          if (net && !net.includes('test')) {
            toast.error('Switch Freighter to Testnet first!', { id: 'frt' })
            return false
          }
        } catch (_) {}

        let address = null
        try {
          if (!(await isAllowed())) {
             await setAllowed()
          }
          const accessResult = await getPublicKey()
          address = typeof accessResult === 'string' ? accessResult : accessResult?.publicKey
        } catch (e) {
          console.error("Authentication error:", e)
        }

        if (!address) {
          toast.error('Could not get address — approve the connection in Freighter popup', { id: 'frt' })
          return false
        }

        setWalletState({ address, type: 'freighter', label: 'Freighter' })
        toast.success(`Connected: ${address.slice(0,6)}...${address.slice(-4)}`, { id: 'frt' })
        return true
      }

      if (type === 'demo') {
        const { addr, label } = opts
        setWalletState({ address: addr, type: 'demo', label })
        toast.success(`Demo (${label}) connected`)
        return true
      }

      return false
    } catch (e) {
      console.error('Wallet connect error:', e)
      toast.error(e.message || 'Connection failed', { id: 'frt' })
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    setWalletState(null)
    toast('Wallet disconnected')
  }, [])

  return (
    <WalletCtx.Provider value={{ wallet, connect, disconnect }}>
      {children}
    </WalletCtx.Provider>
  )
}

export function useWallet() {
  return useContext(WalletCtx)
}
