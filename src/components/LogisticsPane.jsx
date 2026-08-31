import RouteMap from './RouteMap';
import { useAppContext } from '../context/AppContext';

const FLEET = [
  { id:'TN04-7821', status:'available', label:'En route',  cls:'border-[#0D7A51]/25 bg-[#E6F4EF] text-[#0D7A51]' },
  { id:'MH12-4456', status:'idle',      label:'Available', cls:'border-gray-200 bg-gray-50 text-gray-600'        },
  { id:'GJ05-8823', status:'offline',   label:'Offline',   cls:'border-gray-200 bg-gray-50 text-gray-400'        },
];

export default function LogisticsPane({ loadPct, loadKg, routeBadge, onRunSolver }) {
  const { addToast } = useAppContext();
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

      {/* Map */}
      <RouteMap />

      {/* Truck Load Meter */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-gray-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D7A51" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Truck Load — #TN04-7821
          </div>
          <span className="text-[1.2rem] font-extrabold text-[#0D7A51]">{loadPct}%</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
          <div className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
            style={{ width:`${loadPct}%`, background:'linear-gradient(90deg,#0F9361,#0D7A51)' }}>
            <div className="shimmer-bar absolute inset-0" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[0.75rem] font-semibold text-gray-500 font-mono">{loadKg} / 2,000 kg</span>
          <span className="text-[0.7rem] font-semibold text-[#0D7A51]">● Optimal Load</span>
        </div>
      </div>

      {/* AI Route Summary */}
      <div className="rounded-2xl border p-3.5 flex flex-col gap-3"
        style={{ background:'linear-gradient(135deg,#faf5ff,#f5f3ff)', borderColor:'rgba(124,58,237,0.15)' }}>
        <div className="flex items-center gap-2 text-[0.8rem] font-bold text-purple-600">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          AI Route Summary
          <span className="ml-auto text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">Route #4</span>
        </div>
        {/* Metrics */}
        <div className="flex items-stretch">
          {[
            { val:'₹6.50', unit:'/kg', label:'Estimated Savings' },
            { val:'1h 20m', unit:'',   label:'Est. Transit Time'  },
            { val:'82km',  unit:'',    label:'Total Distance'     },
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
        {/* Route stops */}
        <div className="relative">
          <div className="flex items-center">
            {['Farm A','Farm B','Farm C','Mumbai Hub'].map((stop, i, arr) => (
              <div key={stop} className="flex items-center flex-1 last:flex-none">
                <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                  i === 0 ? 'bg-[#0D7A51] border-[#0D7A51]' :
                  i === arr.length - 1 ? 'bg-blue-600 border-blue-600' :
                  'bg-white border-[#0D7A51]'}`} />
                {i < arr.length - 1 && <div className="flex-1 h-0.5" style={{ background:'linear-gradient(90deg,#0D7A51,#0F9361)' }} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {['Farm A','Farm B','Farm C','Mumbai Hub'].map(s => (
              <span key={s} className="text-[0.6rem] font-semibold text-gray-500 whitespace-nowrap">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* VRP Solver CTA */}
      <button
        id="solver-btn"
        onClick={onRunSolver}
        className="w-full rounded-2xl py-3.5 text-[0.9rem] font-bold text-white flex items-center justify-center gap-2.5 transition-all active:scale-[0.97]"
        style={{ background:'linear-gradient(135deg,#7C3AED,#6D28D9)', boxShadow:'0 4px 16px rgba(124,58,237,0.32)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        Run AI Vehicle Routing Solver
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
