import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './hooks/useWallet'
import { StoreProvider } from './hooks/useStore'
import Navbar from './components/Navbar'
import StatsBar from './components/StatsBar'
import LandingPage from './pages/LandingPage'
import BrowsePage from './pages/BrowsePage'
import RegisterPage from './pages/RegisterPage'
import BusinessDetailPage from './pages/BusinessDetailPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <StoreProvider>
      <WalletProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />

          <Routes>
            <Route path="/"           element={<LandingPage />} />
            <Route path="/browse"     element={<><StatsBar /><BrowsePage /></>} />
            <Route path="/register"   element={<><StatsBar /><RegisterPage /></>} />
            <Route path="/business/:id" element={<><StatsBar /><BusinessDetailPage /></>} />
            <Route path="/profile"    element={<><StatsBar /><ProfilePage /></>} />
            <Route path="/leaderboard" element={<><StatsBar /><LeaderboardPage /></>} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#13132a',
                color: '#f1f0ff',
                border: '1px solid rgba(120,80,255,0.28)',
                fontFamily: "'Outfit', sans-serif",
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </HashRouter>
      </WalletProvider>
    </StoreProvider>
  )
}
