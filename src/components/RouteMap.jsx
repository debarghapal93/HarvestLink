export default function RouteMap() {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200"
      style={{ background:'linear-gradient(160deg,#f8fafc 0%,#f0f9f4 40%,#eff6ff 100%)' }}>
      <div className="p-3">
        <svg viewBox="0 0 380 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
          {/* Terrain blobs */}
          <ellipse cx="80"  cy="60"  rx="60" ry="38" fill="#E6F4EF" opacity="0.5"/>
          <ellipse cx="280" cy="150" rx="70" ry="45" fill="#EFF6FF" opacity="0.5"/>
          <ellipse cx="190" cy="110" rx="90" ry="55" fill="#F0FDF4" opacity="0.3"/>
          {/* Grid dots */}
          {[30,80,130,180,230,280,330].map(x =>
            [30,80,130,180].map(y =>
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="#64748b" opacity="0.15"/>
            )
          )}
          {/* Road background */}
          <path d="M60 55 Q120 90 185 150 Q230 180 310 165" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round"/>
          <path d="M100 170 Q150 145 185 150" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>
          <path d="M75 120 Q130 120 185 150"  stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>
          {/* Animated route lines — use CSS class for dash animation */}
          <path id="route-main" className="route-dash"      d="M60 55 Q120 90 185 150 Q240 170 310 165" stroke="#0D7A51" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="8 4"/>
          <path className="route-dash route-dash-2" d="M100 170 Q140 158 185 150"          stroke="#0D7A51" strokeWidth="3"   strokeLinecap="round" strokeDasharray="6 4"/>
          <path className="route-dash route-dash-3" d="M75 120 Q128 132 185 150"             stroke="#0D7A51" strokeWidth="3"   strokeLinecap="round" strokeDasharray="6 4"/>
          {/* Truck dot on route (simple animated circle) */}
          <circle cx="60" cy="55" r="6" fill="#F97316" className="truck-pulse">
            <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
              <mpath href="#route-main"/>
            </animateMotion>
          </circle>
          {/* Farm A pin */}
          <g className="map-pin" transform="translate(60,55)">
            <circle r="14" fill="white" filter="url(#ps)"/><circle r="10" fill="#E6F4EF"/><circle r="6" fill="#0D7A51"/>
            <text y="24"  textAnchor="middle" fontSize="7"  fontFamily="Inter,sans-serif" fontWeight="700" fill="#374151">Farm A</text>
            <text y="-19" textAnchor="middle" fontSize="13">🧑‍🌾</text>
          </g>
          {/* Farm B pin */}
          <g className="map-pin" transform="translate(100,170)">
            <circle r="14" fill="white" filter="url(#ps)"/><circle r="10" fill="#E6F4EF"/><circle r="6" fill="#0D7A51"/>
            <text y="24"  textAnchor="middle" fontSize="7"  fontFamily="Inter,sans-serif" fontWeight="700" fill="#374151">Farm B</text>
            <text y="-19" textAnchor="middle" fontSize="13">🧑‍🌾</text>
          </g>
          {/* Farm C pin */}
          <g className="map-pin" transform="translate(75,120)">
            <circle r="14" fill="white" filter="url(#ps)"/><circle r="10" fill="#E6F4EF"/><circle r="6" fill="#0D7A51"/>
            <text y="24"  textAnchor="middle" fontSize="7"  fontFamily="Inter,sans-serif" fontWeight="700" fill="#374151">Farm C</text>
            <text y="-19" textAnchor="middle" fontSize="13">🧑‍🌾</text>
          </g>
          {/* Hub pin */}
          <g className="map-pin" transform="translate(185,150)">
            <circle r="14" fill="white" filter="url(#ps)"/><circle r="10" fill="#FEF3C7"/><circle r="6" fill="#D97706"/>
            <text y="24"  textAnchor="middle" fontSize="7"  fontFamily="Inter,sans-serif" fontWeight="700" fill="#374151">Hub</text>
            <text y="-19" textAnchor="middle" fontSize="13">🏭</text>
          </g>
          {/* Destination pin */}
          <g className="map-pin" transform="translate(310,165)">
            <circle r="16" fill="white" filter="url(#ps)"/><circle r="12" fill="#EFF6FF"/><circle r="7" fill="#2563EB"/>
            <text y="26"  textAnchor="middle" fontSize="7"  fontFamily="Inter,sans-serif" fontWeight="700" fill="#1e40af">Mumbai</text>
            <text y="-21" textAnchor="middle" fontSize="15">🏙️</text>
          </g>
          <defs>
            <filter id="ps" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)"/>
            </filter>
          </defs>
        </svg>
      </div>
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-2 flex flex-col gap-1.5"
        style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        {[
          { color:'#0D7A51', label:'Supply Farm' },
          { color:'#F97316', label:'Live Truck'  },
          { color:'#2563EB', label:'Urban Hub'   },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-gray-500">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
