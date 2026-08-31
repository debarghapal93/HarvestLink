import { createContext, useContext, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════
   INITIAL SEED DATA — mock backend state
═══════════════════════════════════════════════════ */
const INITIAL_LISTINGS = [
  { id: 1, crop: 'Tomato', qty: 200, price: 25, status: 'assigned', farmerId: 'F001', timestamp: '2026-08-31T08:00:00.000Z' },
  { id: 2, crop: 'Onion',  qty: 120, price: 18, status: 'pending',  farmerId: 'F001', timestamp: '2026-08-31T09:00:00.000Z' },
];

const INITIAL_DEMAND = [
  {
    id: 1, crop: 'Tomato', buyerLabel: '3 local grocers combined',
    requestedQty: 450, matchedQty: 260, targetPrice: 28,
    status: 'matching', location: 'Nashik Hub, 12km away',
    time: '6:00 PM', isPriority: true,
  },
  {
    id: 2, crop: 'Onion', buyerLabel: 'FPO Batch #12 — Sangamner',
    requestedQty: 800, matchedQty: 704, targetPrice: 21,
    status: 'ready', location: 'Sangamner, 28km away',
    time: 'Tomorrow 9 AM', isPriority: false,
  },
  {
    id: 3, crop: 'Potato', buyerLabel: '2 hotel chains · Pune',
    requestedQty: 300, matchedQty: 70, targetPrice: 16,
    status: 'open', location: 'Pune Central Hub, 45km',
    time: 'Open 48h', isPriority: false,
  },
];

/* ═══════════════════════════════════════════════════
   CONTEXT DEFINITION
═══════════════════════════════════════════════════ */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeRole,      setActiveRole]  = useState('farmer');
  const [produceListings, setListings]    = useState(INITIAL_LISTINGS);
  const [buyerDemand,     setBuyerDemand] = useState(INITIAL_DEMAND);
  const [aiPrice,         setAiPrice]     = useState(25);
  const [toasts,          setToasts]      = useState([]);

  /* ── Toast system ── */
  const addToast = useCallback((msg, type = 'default') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }, []);

  /* ── Add a produce listing + auto-update demand matches ── */
  const addListing = useCallback(({ crop, qty, price }) => {
    // 1. Push new listing
    const newItem = {
      id: Date.now(),
      crop, qty, price,
      status: 'listed',
      farmerId: 'F001',
      timestamp: new Date().toISOString(),
    };
    setListings(prev => [newItem, ...prev]);

    // 2. Reactively increment matched qty for the matching demand entry
    setBuyerDemand(prev => prev.map(demand => {
      if (demand.crop.toLowerCase() !== crop.toLowerCase()) return demand;
      const newMatched = Math.min(demand.matchedQty + qty, demand.requestedQty);
      return {
        ...demand,
        matchedQty: newMatched,
        status: newMatched >= demand.requestedQty ? 'ready' : demand.status,
      };
    }));

    // 3. Match notification toast
    addToast(`${qty}kg ${crop} listed. Matched with local demand pool.`, 'match');
  }, [addToast]);

  /* ── Join a demand pool (Buyer pane) ── */
  const joinDemand = useCallback((demandId) => {
    setBuyerDemand(prev => prev.map(d => {
      if (d.id !== demandId) return d;
      const newMatched = Math.min(d.matchedQty + 50, d.requestedQty);
      return { ...d, matchedQty: newMatched, status: newMatched >= d.requestedQty ? 'ready' : d.status };
    }));
    addToast('🏪 Joined pool! 50kg allocated to this batch.', 'success');
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      // State
      activeRole, setActiveRole,
      produceListings,
      buyerDemand,
      aiPrice, setAiPrice,
      toasts,
      // Actions
      addToast,
      addListing,
      joinDemand,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>');
  return ctx;
}
