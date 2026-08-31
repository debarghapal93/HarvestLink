import { useMemo, useCallback } from 'react';
import RouteMap from './RouteMap';
import { useAppContext } from '../context/AppContext';

const FLEET = [
  { id:'TN04-7821', status:'available', label:'En route',  cls:'border-[#0D7A51]/25 bg-[#E6F4EF] text-[#0D7A51]' },
  { id:'MH12-4456', status:'idle',      label:'Available', cls:'border-gray-200 bg-gray-50 text-gray-600'        },
  { id:'GJ05-8823', status:'offline',   label:'Offline',   cls:'border-gray-200 bg-gray-400 text-gray-400'        },
];

const MAX_CAPACITY = 2000;

export default function LogisticsPane() {
  const { produceListings, routeBadge, isSolving, runSolver } = useAppContext();

  // ── Optimized: Memoize Load & Capacity Metrics ──
  const { totalKg, loadPct, isOverCapacity } = useMemo(() => {
    const total = produceListings.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const pct   = Math.round((total / MAX_CAPACITY) * 100);
    return {
      totalKg: total,
      loadPct: pct,
      isOverCapacity: total > MAX_CAPACITY,
    };
  }, [produceListings]);

  // ── Optimized: Memoize Dynamic Route Metrics & Timeline Stops ──
  const { nodeCount, estSavings, estHours, estMins, estDist, stops } = useMemo(() => {
    const count   = produceListings.length;
    const savings = (5.50 + count * 0.5).toFixed(2);
    const hours   = 1 + Math.floor(count / 3);
    const mins    = 15 + (count * 5) % 45;
    const dist    = 68 + count * 12;

    const routeStops = [
      ...produceListings.slice(0, 3).map((l, i) => l.name || `Farm ${String.fromCharCode(65 + i)}`),
      ...(count > 3 ? [`+${count - 3} More`] : []),
      'Hub',
      'Mumbai',
    ];

    return {
      nodeCount: count,
      estSavings: savings,
      estHours: hours,
      estMins: mins,
      estDist: dist,
      stops: routeStops,
    };
  }, [produceListings]);

  // ── Optimized: Stable Callback Handler ──
  const handleRunSolverClick = useCallback(() => {
    if (!isSolving) {
      runSolver();
    }
  }, [isSolving, runSolver]);

  const badgeStyles = {
    idle:      'bg-purple-50 text-purple-600 border-purple-100',
    optimized: 'bg-[#E6F4EF] text-[#0D7A51] border-[#0D7A51]/15',
    solving:   'bg-orange-50 text-orange-600 border-orange-100',
  };
  const badgeLabel = { idle:'Idle', optimized:'Optimized ✓', solving:'Solving…' };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4"
      style={{ boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[0.95rem] font-bold text-gray-900 leading-tight">Dynamic Route Optimization</h2>
            <p className="text-[0.72rem] text-gray-500">AI Engine · VRP Solver</p>
          </div>
        </div>
        <span id="route-badge" className={`text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeStyles[routeBadge] || badgeStyles.idle}`}>
          {badgeLabel[routeBadge] || 'Idle'}
        </span>
      </div>

      {/* Dynamic Map */}
      <RouteMap />

      {/* Dynamic Truck Load Meter */}
      <div className={`border rounded-2xl p-3.5 flex flex-col gap-2 transition-all ${
        isOverCapacity ? 'bg-red-50/70 border-red-200' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-gray-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isOverCapacity ? '#DC2626' : '#0D7A51'} strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Truck Load — #TN04-7821
          </div>
          <span className={`text-[1.2rem] font-extrabold ${isOverCapacity ? 'text-red-600' : 'text-[#0D7A51]'}`}>
            {loadPct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full relative overflow-hidden transition-all duration-700 ${
              isOverCapacity ? 'bg-red-500' : 'bg-gradient-to-r from-[#0F9361] to-[#0D7A51]'
            }`}
            style={{ width: `${Math.min(loadPct, 100)}%` }}
          >
            <div className="shimmer-bar absolute inset-0" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[0.75rem]">
          <span className="font-semibold text-gray-600 font-mono">
            {totalKg.toLocaleString()} / {MAX_CAPACITY.toLocaleString()} kg
          </span>
          <span className={`font-semibold ${isOverCapacity ? 'text-red-600 font-bold' : 'text-[#0D7A51]'}`}>
            {isOverCapacity ? `⚠️ Overcapacity (+${totalKg - MAX_CAPACITY}kg)` : '● Optimal Load'}
          </span>
        </div>
      </div>

      {/* AI Route Summary */}
      <div className="rounded-2xl border p-3.5 flex flex-col gap-3"
        style={{ background:'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderColor:'rgba(124,58,237,0.15)' }}>
        <div className="flex items-center gap-2 text-[0.8rem] font-bold text-purple-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          AI Route Summary
          <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
            Route #{nodeCount}
          </span>
        </div>

        {/* Metrics */}
        <div className="flex items-stretch">
          {[
            { val:`₹${estSavings}`, unit:'/kg', label:'Estimated Savings' },
            { val:`${estHours}h ${estMins}m`, unit:'', label:'Est. Transit Time' },
            { val:`${estDist}km`, unit:'', label:'Total Distance' },
          ].map((m, i) => (
            <div key={m.label} className={`flex-1 flex items-center gap-2 px-2 ${i > 0 ? 'border-l border-purple-100' : ''}`}>
              <div>
                <p className="text-[0.95rem] font-extrabold text-gray-900 leading-none">
                  {m.val}<small className="text-[0.65rem] font-normal text-gray-400">{m.unit}</small>
                </p>
                <p className="text-[0.65rem] text-gray-500 mt-0.5">{m.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Route Stops Timeline */}
        <div className="relative pt-1">
          <div className="flex items-center">
            {stops.map((stop, i, arr) => (
              <div key={`${stop}-${i}`} className="flex items-center flex-1 last:flex-none">
                <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                  i === 0 ? 'bg-[#0D7A51] border-[#0D7A51]' :
                  i === arr.length - 1 ? 'bg-blue-600 border-blue-600' :
                  'bg-white border-[#0D7A51]'}`} />
                {i < arr.length - 1 && <div className="flex-1 h-0.5" style={{ background:'linear-gradient(90deg,#0D7A51,#0F9361)' }} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {stops.map((s, i) => (
              <span key={`${s}-${i}`} className="text-[0.6rem] font-semibold text-gray-500 whitespace-nowrap">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* VRP Solver CTA Button */}
      <button
        id="solver-btn"
        onClick={handleRunSolverClick}
        disabled={isSolving}
        className="w-full rounded-2xl py-3.5 text-[0.9rem] font-bold text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] disabled:opacity-80 disabled:cursor-not-allowed"
        style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow:'0 4px 16px rgba(124,58,237,0.32)' }}
      >
        {isSolving ? (
          <>
            <svg className="solver-ring w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Calculating VRP Route…
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            Run AI Vehicle Routing Solver
          </>
        )}
      </button>

      {/* Fleet status */}
      <div className="flex flex-col gap-1.5">
        {FLEET.map(f => (
          <div key={f.id} className={`flex items-center gap-2 border rounded-xl px-3 py-2 text-[0.75rem] font-medium ${f.cls}`}>
            <span>🚚</span>
            <span className="font-mono font-semibold">{f.id}</span>
            <span className="mx-1 opacity-40">·</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
