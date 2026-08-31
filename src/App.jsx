import { useState } from 'react';
import { useAppContext } from './context/AppContext';
import TopNav from './components/TopNav';
import StatusBar from './components/StatusBar';
import FarmerPane from './components/FarmerPane';
import BuyerPane from './components/BuyerPane';
import LogisticsPane from './components/LogisticsPane';
import VoiceOverlay from './components/modals/VoiceOverlay';
import PriceModal from './components/modals/PriceModal';
import SolverOverlay from './components/modals/SolverOverlay';
import Toast from './components/Toast';

export default function App() {
  const { activeRole, toasts, addToast, aiPrice, setAiPrice } = useAppContext();

  // ── Overlay / modal local state (not shared cross-pane) ──
  const [isVoiceOpen,     setVoiceOpen]     = useState(false);
  const [isPriceOpen,     setPriceOpen]     = useState(false);
  const [isSolverRunning, setSolverRunning] = useState(false);
  const [loadPct,         setLoadPct]       = useState(72);
  const [loadKg,          setLoadKg]        = useState('1,450');
  const [routeBadge,      setRouteBadge]    = useState('idle');
  // Farmer voice-recognized state to feed into FarmerPane
  const [voiceCrop, setVoiceCrop] = useState(null);
  const [voiceQty,  setVoiceQty]  = useState(null);

  const handleSolverComplete = () => {
    setSolverRunning(false);
    setLoadPct(78);
    setLoadKg('1,560');
    setRouteBadge('optimized');
    addToast('🚀 VRP Solver complete! Route #4 optimized — saving ₹6.50/kg', 'success');
  };

  // ── Pane focus: active pane is full-opacity; others are dimmed ──
  const paneStyle = (role) => ({
    transition: 'opacity 0.35s ease, transform 0.35s ease',
    opacity:    activeRole === role ? 1 : 0.55,
    transform:  activeRole === role ? 'scale(1)' : 'scale(0.995)',
  });

  return (
    <div className="min-h-screen bg-[#F0F4F2] font-sans">
      <TopNav />
      <StatusBar isSolverRunning={isSolverRunning} routeBadge={routeBadge} />

      <main className="max-w-[1600px] mx-auto px-6 py-5">
        <div className="grid gap-5 items-start" style={{ gridTemplateColumns: '30fr 35fr 35fr' }}>

          {/* LEFT — Farmer */}
          <div style={paneStyle('farmer')}>
            <FarmerPane
              voiceCrop={voiceCrop}
              voiceQty={voiceQty}
              clearVoice={() => { setVoiceCrop(null); setVoiceQty(null); }}
              onVoice={() => setVoiceOpen(true)}
              onEdit={() => setPriceOpen(true)}
            />
          </div>

          {/* MID — Buyer */}
          <div style={paneStyle('buyer')}>
            <BuyerPane />
          </div>

          {/* RIGHT — Logistics */}
          <div style={paneStyle('logistics')}>
            <LogisticsPane
              loadPct={loadPct}
              loadKg={loadKg}
              routeBadge={routeBadge}
              onRunSolver={() => setSolverRunning(true)}
            />
          </div>

        </div>
      </main>

      {/* ── Overlays ── */}
      {isVoiceOpen && (
        <VoiceOverlay
          onClose={() => setVoiceOpen(false)}
          onRecognized={(c, q) => {
            setVoiceCrop(c);
            setVoiceQty(q);
            setVoiceOpen(false);
            addToast('🎙️ Recognized: "50 kg Tomato" — fields filled!', 'success');
          }}
        />
      )}

      {isPriceOpen && (
        <PriceModal
          price={aiPrice}
          onConfirm={(p) => {
            setAiPrice(p);
            setPriceOpen(false);
            addToast(`✅ AI Price updated to ₹${p}/kg`, 'success');
          }}
          onClose={() => setPriceOpen(false)}
        />
      )}

      {isSolverRunning && (
        <SolverOverlay onComplete={handleSolverComplete} />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
