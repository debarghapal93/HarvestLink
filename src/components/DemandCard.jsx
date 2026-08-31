import { memo, useCallback } from 'react';

const statusStyles = {
  matching: 'bg-yellow-50 text-yellow-700 animate-badge-pulse',
  ready:    'bg-green-100 text-green-700',
  open:     'bg-[#E6F4EF] text-[#0D7A51]',
};

const DemandCard = memo(function DemandCard({ data, onJoin, addToast }) {
  const { id, emoji, title, qty, subtitle, buyerIcon, price, location, time, filled, total, status, isPriority } = data;

  const statusLabel = status === 'matching' ? 'Matching in Progress' : status === 'ready' ? 'Ready for Pickup' : 'Open';
  const fillPct = Math.round((filled / total) * 100);

  const handleJoinClick = useCallback(() => {
    onJoin(id);
  }, [onJoin, id]);

  return (
    <div className={`border-[1.5px] rounded-2xl p-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-px ${
      isPriority ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white' : 'border-gray-200 bg-white hover:border-blue-200'
    }`}>

      {/* Top row */}
      <div className="flex items-start gap-2.5">
        <span className="text-[1.6rem] leading-none">{emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[0.88rem] font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            {title}
            <span className="text-[0.75rem] font-semibold px-2 py-px rounded-full bg-blue-50 text-blue-600">{qty}</span>
            {isPriority && <span className="text-[0.65rem] font-bold px-2 py-px rounded-full bg-orange-50 text-orange-600">HOT</span>}
          </h3>
          <p className="text-[0.72rem] text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span>{buyerIcon}</span>{subtitle}
          </p>
        </div>
        <span className="text-[1.1rem] font-extrabold text-gray-900 shrink-0">
          {price}<small className="text-[0.65rem] font-normal text-gray-400">/kg</small>
        </span>
      </div>

      {/* Detail row */}
      <div className="flex gap-3 text-[0.72rem] text-gray-500 mt-2.5 flex-wrap">
        <span>📍 {location}</span>
        <span>⏱ Needed by <strong className="text-gray-700">{time}</strong></span>
      </div>

      {/* Progress */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700" style={{ width: `${fillPct}%` }} />
        </div>
        <span className="text-[0.68rem] font-semibold text-gray-500 whitespace-nowrap">{filled}/{total} kg matched</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
        <span className={`text-[0.65rem] font-bold px-2 py-1 rounded-full ${statusStyles[status] || statusStyles.open}`}>{statusLabel}</span>
        <button
          id={`join-dc-${id}`}
          onClick={handleJoinClick}
          className={`rounded-xl px-3.5 py-1.5 text-[0.78rem] font-bold transition-all active:scale-95 ${
            status === 'ready'
              ? 'bg-white text-blue-600 border-[1.5px] border-blue-100 hover:bg-blue-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {status === 'ready' ? 'View Details →' : 'Join Pool →'}
        </button>
      </div>
    </div>
  );
});

export default DemandCard;
