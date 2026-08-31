export default function StatusBar({ isSolverRunning, routeBadge }) {
  const aiLabel = isSolverRunning ? 'Running…' : routeBadge === 'optimized' ? 'Optimized ✓' : 'Idle';
  const aiColor = isSolverRunning ? '#F97316' : routeBadge === 'optimized' ? '#0D7A51' : '#F97316';

  return (
    <div className="bg-white border-b border-gray-200" style={{ height: 38 }}>
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center gap-5">

        <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-[#0D7A51]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#0D7A51] animate-ticker-blink" />
          System Live — All 3 nodes connected
        </div>

        <div className="flex items-center gap-1.5 text-[0.75rem] text-gray-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Last sync: <strong className="text-gray-700">2 min ago</strong>
        </div>

        <div className="flex items-center gap-1.5 text-[0.75rem] text-gray-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <strong className="text-gray-700">247</strong> farmers · <strong className="text-gray-700">38</strong> buyers · <strong className="text-gray-700">12</strong> trucks
        </div>

        <div className="flex items-center gap-1.5 text-[0.75rem]" style={{ color: aiColor }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={aiColor} strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          AI Routing Engine: <strong>{aiLabel}</strong>
        </div>

      </div>
    </div>
  );
}
