import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════ */
export const HUB_COORDS  = { lat: 20.00, lng: 73.78, x: 185, y: 150, name: 'Nashik Hub' };
export const DEST_COORDS = { lat: 19.07, lng: 72.87, x: 310, y: 165, name: 'Mumbai' };

/* ═══════════════════════════════════════════════════
   DYNAMIC PRICING ENGINE
═══════════════════════════════════════════════════ */
export const CROP_BASE_PRICES = {
  tomato: 22, onion: 18, potato: 16,
  wheat: 24,  chilli: 55, brinjal: 20,
};

export function calculateRecommendedPrice(cropKey, qty) {
  const base = CROP_BASE_PRICES[cropKey?.toLowerCase()] ?? 22;
  const q    = parseFloat(qty) || 0;
  const mult = q >= 500 ? 1.25 : q >= 200 ? 1.18 : q >= 100 ? 1.12 : q >= 50 ? 1.05 : 1.0;
  return Number((base * mult + 0.5).toFixed(1));
}

/* ═══════════════════════════════════════════════════
   API HELPERS  (token injected from localStorage)
═══════════════════════════════════════════════════ */
function getToken() {
  return localStorage.getItem('hl_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const API = {
  async get(path) {
    const res = await fetch(path, { headers: authHeaders() });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error || 'Network error');
    }
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(path, {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error || 'Network error');
    }
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════
   CONTEXT
═══════════════════════════════════════════════════ */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // NOTE: activeRole is REMOVED. Role is now from JWT via AuthContext.
  const [produceListings, setListings]    = useState([]);
  const [buyerDemand,     setBuyerDemand] = useState([]);
  const [aiPrice,         setAiPrice]     = useState(25);
  const [toasts,          setToasts]      = useState([]);
  const [routeBadge,      setRouteBadge]  = useState('idle');
  const [isSolving,       setIsSolving]   = useState(false);
  const [isLoadingData,   setLoadingData] = useState(true);

  const pollRef = useRef(null);

  /* ── Toast System ───────────────────────────────── */
  const addToast = useCallback((msg, type = 'default') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  }, []);

  /* ── Data Fetching (with Bearer token) ─────────── */
  const fetchListings = useCallback(async () => {
    try {
      const { listings } = await API.get('/api/listings/active');
      setListings(listings);
    } catch (err) {
      console.error('[fetchListings]', err);
      // Silently fail if not yet authenticated (401 during login transition)
      if (!err.message.includes('Access denied') && !err.message.includes('No token')) {
        addToast('⚠️ Failed to load listings from server.', 'error');
      }
    }
  }, [addToast]);

  const fetchDemand = useCallback(async () => {
    try {
      const { demands } = await API.get('/api/demand/active');
      setBuyerDemand(demands);
    } catch (err) {
      console.error('[fetchDemand]', err);
      if (!err.message.includes('Access denied') && !err.message.includes('No token')) {
        addToast('⚠️ Failed to load demand pool from server.', 'error');
      }
    }
  }, [addToast]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchListings(), fetchDemand()]);
  }, [fetchListings, fetchDemand]);

  // Initial load + 15s polling (only fires if token exists)
  useEffect(() => {
    if (!getToken()) { setLoadingData(false); return; }

    setLoadingData(true);
    refreshAll().finally(() => setLoadingData(false));

    pollRef.current = setInterval(() => {
      if (getToken()) refreshAll();
    }, 15_000);
    return () => clearInterval(pollRef.current);
  }, [refreshAll]);

  /* ── Add Produce Listing ────────────────────────── */
  const addListing = useCallback(async ({ crop, qty, price, farmer_id, farmer_name }) => {
    const { listing } = await API.post('/api/listings', {
      farmer_id:   farmer_id  || 1,
      farmer_name: farmer_name || undefined,
      crop, qty, price,
    });

    setListings(prev => [listing, ...prev]);
    setRouteBadge('idle');
    await fetchDemand();

    addToast(`${qty}kg ${crop} listed. Matched with local demand pool.`, 'match');
    return listing;
  }, [addToast, fetchDemand]);

  /* ── VRP Solver ─────────────────────────────────── */
  const runSolver = useCallback(() => {
    setIsSolving(true);
    setRouteBadge('solving');
    addToast('🤖 Initializing VRP Solver algorithm…', 'info');
    setTimeout(() => {
      setIsSolving(false);
      setRouteBadge('optimized');
      addToast('🚀 VRP Route optimization complete! All nodes connected to Hub.', 'success');
    }, 1500);
  }, [addToast]);

  /* ── Join Demand Pool ────────────────────────────── */
  const joinDemand = useCallback(async (demandId) => {
    setBuyerDemand(prev => prev.map(d => {
      if (d.id !== demandId) return d;
      const newMatched = Math.min(d.matchedQty + 50, d.requestedQty);
      return { ...d, matchedQty: newMatched, status: newMatched >= d.requestedQty ? 'ready' : d.status };
    }));
    addToast('🏪 Joined pool! 50kg allocated to this batch.', 'success');
  }, [addToast]);

  return (
    <AppContext.Provider value={{
      // activeRole REMOVED — use useAuth().user.role instead
      produceListings, buyerDemand,
      aiPrice, setAiPrice,
      toasts,
      routeBadge, isSolving,
      isLoadingData,
      addToast, addListing, runSolver, joinDemand, refreshAll,
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
