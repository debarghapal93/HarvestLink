import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import DemandCard from './DemandCard';

const RADII = ['Within 25km', 'Within 50km', 'Within 100km', 'All Districts'];

// Map context buyerDemand shape → DemandCard expected shape
const CROP_META = {
  Tomato: { emoji: '🍅', buyerIcon: '👥' },
  Onion:  { emoji: '🧅', buyerIcon: '🏢' },
  Potato: { emoji: '🥔', buyerIcon: '🏨' },
  Wheat:  { emoji: '🌾', buyerIcon: '🏪' },
  Chilli: { emoji: '🌶', buyerIcon: '🏬' },
};
const toCardData = (d) => {
  const meta = CROP_META[d.crop] || { emoji: '🌿', buyerIcon: '👤' };
  return {
    id:         d.id,
    emoji:      meta.emoji,
    title:      d.crop,
    qty:        `${d.requestedQty} kg`,
    subtitle:   d.buyerLabel,
    buyerIcon:  meta.buyerIcon,
    price:      `₹${d.targetPrice}`,
    location:   d.location,
    time:       d.time,
    filled:     d.matchedQty,
    total:      d.requestedQty,
    status:     d.status,
    isPriority: d.isPriority,
  };
};

export default function BuyerPane() {
  // ── Global state ──
  const { buyerDemand, joinDemand, addToast } = useAppContext();

  // ── Local UI state ──
  const [search,    setSearch]    = useState('');
  const [radiusIdx, setRadiusIdx] = useState(1);

  // Compute aggregated stats dynamically from context
  const totalDemand  = buyerDemand.reduce((s, d) => s + d.requestedQty, 0);
  const totalMatched = buyerDemand.reduce((s, d) => s + d.matchedQty, 0);
  const avgPrice     = (buyerDemand.reduce((s, d) => s + d.targetPrice, 0) / buyerDemand.length).toFixed(1);

  const filtered = buyerDemand
    .map(toCardData)
    .filter(d =>
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subtitle.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4"
      style={{ boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div>
            <h2 className="text-[0.95rem] font-bold text-gray-900 leading-tight">Aggregated Demand Pool</h2>
            <p className="text-[0.72rem] text-gray-500">
              Live orders · <span className="text-[#0D7A51] font-semibold">{totalMatched}kg matched of {totalDemand}kg</span>
            </p>
          </div>
        </div>
        <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Matching</span>
      </div>

      {/* Search + Radius */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="search"
            id="demand-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by crop, location, buyer…"
            className="w-full bg-gray-50 border-[1.5px] border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-[0.83rem] text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <button
          id="radius-btn"
          onClick={() => { const next = (radiusIdx + 1) % RADII.length; setRadiusIdx(next); addToast(`🔍 Showing: ${RADII[next]}`, 'info'); }}
          className="flex items-center gap-1.5 px-3 py-2.5 text-[0.78rem] font-semibold text-gray-700 bg-white border-[1.5px] border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-all whitespace-nowrap"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></svg>
          {RADII[radiusIdx]}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      {/* Agg Stats — reactive to context */}
      <div className="flex rounded-xl border border-blue-100 overflow-hidden" style={{ background:'linear-gradient(135deg,#eff6ff,#f0f9ff)' }}>
        {[
          { val:`${totalDemand}kg`, label:'Total Demand Today' },
          { val:`₹${avgPrice}`,    label:'Avg Pool Price/kg'  },
          { val:'~4h',             label:'Avg Fulfillment'    },
        ].map((s, i) => (
          <div key={s.label} className={`flex-1 flex flex-col items-center py-2.5 px-2 ${i < 2 ? 'border-r border-blue-100' : ''}`}>
            <span className="text-[1.05rem] font-extrabold text-blue-600 transition-all duration-500">{s.val}</span>
            <span className="text-[0.65rem] text-gray-500 text-center mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Demand Cards — reactive to buyerDemand from context */}
      <div className="flex flex-col gap-3">
        {filtered.length ? filtered.map(d => (
          <DemandCard key={d.id} data={d} onJoin={joinDemand} addToast={addToast} />
        )) : (
          <p className="text-center text-gray-400 text-sm py-6">No matching demand found</p>
        )}
      </div>

      {/* Pool CTA */}
      <button
        id="pool-btn"
        onClick={() => addToast('🔗 Opening full Aggregation Pool marketplace…', 'info')}
        className="w-full rounded-2xl py-3.5 text-[0.9rem] font-bold text-blue-600 flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] bg-white border-2 border-blue-100 hover:bg-blue-50 hover:border-blue-300"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>
        Join Aggregation Pool
      </button>

    </div>
  );
}
