/* ═══════════════════════════════════════════════════
   Toast — basic dark pill + rich 'match' notification
═══════════════════════════════════════════════════ */
export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[900] flex flex-col gap-2.5 items-end pointer-events-none">
      {toasts.map(t =>
        t.type === 'match'
          ? <MatchToast key={t.id} toast={t} />
          : <BasicToast key={t.id} toast={t} />
      )}
    </div>
  );
}

/* ── Rich "Match Found" notification ──────────────── */
function MatchToast({ toast }) {
  return (
    <div className="toast-in pointer-events-auto flex items-start gap-3 bg-white rounded-2xl p-4 max-w-[340px] relative overflow-hidden"
      style={{
        boxShadow: '0 16px 40px rgba(13,122,81,0.18), 0 4px 12px rgba(0,0,0,0.06)',
        border:     '1px solid #E5E7EB',
        borderLeft: '4px solid #0D7A51',
      }}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background:'#E6F4EF' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7A51" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-bold text-gray-900">Match Found! 🎯</p>
        <p className="text-[0.78rem] text-gray-500 mt-0.5 leading-snug">{toast.msg}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0D7A51] animate-ticker-blink" />
          <span className="text-[0.7rem] font-semibold text-[#0D7A51]">38 active buyers notified</span>
        </div>
      </div>

      {/* Subtle top-right brand accent */}
      <div className="absolute top-0 right-0 w-10 h-10 rounded-bl-3xl opacity-5"
        style={{ background:'#0D7A51' }} />
    </div>
  );
}

/* ── Basic dark pill (info / success / error) ──────── */
function BasicToast({ toast }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', default: '🔔' };
  return (
    <div className="toast-in pointer-events-auto bg-gray-900 text-white px-5 py-3 rounded-2xl text-[0.85rem] font-medium flex items-center gap-2 max-w-sm"
      style={{ boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
      <span>{icons[toast.type] || icons.default}</span>
      {toast.msg}
    </div>
  );
}
