import { useAppContext, HUB_COORDS, DEST_COORDS } from '../context/AppContext';

export default function RouteMap() {
  const { produceListings, routeBadge, isSolving } = useAppContext();

  // Dynamic route connections from each listing node to Hub (185, 150)
  const isOptimized = routeBadge === 'optimized';

  // Primary route for truck animation (first active farm -> Hub -> Destination)
  const mainFarm = produceListings[0] || { x: 60, y: 55 };
  const mainRouteD = `M${mainFarm.x} ${mainFarm.y} Q${(mainFarm.x + HUB_COORDS.x) / 2 + 10} ${(mainFarm.y + HUB_COORDS.y) / 2} ${HUB_COORDS.x} ${HUB_COORDS.y} Q${(HUB_COORDS.x + DEST_COORDS.x) / 2} ${(HUB_COORDS.y + DEST_COORDS.y) / 2 + 15} ${DEST_COORDS.x} ${DEST_COORDS.y}`;

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

          {/* Static Road Background network */}
          <path d="M60 55 Q120 90 185 150 Q240 170 310 165" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round"/>
          <path d="M100 170 Q150 145 185 150" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>
          <path d="M75 120 Q130 120 185 150"  stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round"/>

          {/* Dynamic route lines connecting produceListings -> Hub */}
          {produceListings.map((listing, i) => {
            const pathD = `M${listing.x} ${listing.y} Q${(listing.x + HUB_COORDS.x) / 2} ${(listing.y + HUB_COORDS.y) / 2} ${HUB_COORDS.x} ${HUB_COORDS.y}`;
            return (
              <path
                key={listing.id}
                d={pathD}
                stroke={isOptimized ? '#0D7A51' : isSolving ? '#F97316' : '#cbd5e1'}
                strokeWidth={isOptimized ? '3' : '2'}
                strokeLinecap="round"
                strokeDasharray="6 4"
                className={`transition-all duration-700 ${isOptimized || isSolving ? 'route-dash' : ''}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            );
          })}

          {/* Hub to Destination route segment */}
          <path
            id="route-dest"
            d={`M${HUB_COORDS.x} ${HUB_COORDS.y} Q${(HUB_COORDS.x + DEST_COORDS.x) / 2} ${(HUB_COORDS.y + DEST_COORDS.y) / 2 + 15} ${DEST_COORDS.x} ${DEST_COORDS.y}`}
            stroke={isOptimized ? '#0D7A51' : '#cbd5e1'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 4"
            className={isOptimized ? 'route-dash' : ''}
          />

          {/* Hidden main route path for SVG animateMotion */}
          <path id="route-main-anim" d={mainRouteD} fill="none" />

          {/* Animated Truck Icon on main route */}
          {(isOptimized || isSolving) && (
            <circle r="6" fill="#F97316" className="truck-pulse">
              <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
                <mpath href="#route-main-anim"/>
              </animateMotion>
            </circle>
          )}

          {/* Dynamic Farmer Node Pins */}
          {produceListings.map((listing, i) => (
            <g key={listing.id} className="map-pin transition-all duration-500" transform={`translate(${listing.x},${listing.y})`}>
              <circle r="13" fill="white" filter="url(#ps)"/>
              <circle r="9" fill={isOptimized ? '#E6F4EF' : '#f1f5f9'}/>
              <circle r="5" fill={isOptimized ? '#0D7A51' : '#64748b'}/>
              <text y="22" textAnchor="middle" fontSize="6.5" fontFamily="Inter,sans-serif" fontWeight="700" fill="#374151">
                {listing.name || `Farm ${String.fromCharCode(65 + i)}`}
              </text>
              <text y="-17" textAnchor="middle" fontSize="11">🧑‍🌾</text>
            </g>
          ))}

          {/* Central Hub pin */}
          <g className="map-pin" transform={`translate(${HUB_COORDS.x},${HUB_COORDS.y})`}>
            <circle r="15" fill="white" filter="url(#ps)"/>
            <circle r="11" fill="#FEF3C7"/>
            <circle r="6.5" fill="#D97706"/>
            <text y="24" textAnchor="middle" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="800" fill="#1f2937">Hub</text>
            <text y="-19" textAnchor="middle" fontSize="13">🏭</text>
          </g>

          {/* Destination pin (Mumbai) */}
          <g className="map-pin" transform={`translate(${DEST_COORDS.x},${DEST_COORDS.y})`}>
            <circle r="16" fill="white" filter="url(#ps)"/>
            <circle r="12" fill="#EFF6FF"/>
            <circle r="7" fill="#2563EB"/>
            <text y="26" textAnchor="middle" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="800" fill="#1e40af">Mumbai</text>
            <text y="-21" textAnchor="middle" fontSize="14">🏙️</text>
          </g>

          <defs>
            <filter id="ps" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.15)"/>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Dynamic Map Legend & Coords indicator */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl p-2 flex flex-col gap-1 text-[0.65rem]"
        style={{ boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between gap-3 font-mono font-semibold text-gray-500 border-b border-gray-100 pb-1 mb-0.5">
          <span>📍 {HUB_COORDS.name}</span>
          <span className="text-[#0D7A51] font-bold">{produceListings.length} Nodes</span>
        </div>
        {[
          { color: isOptimized ? '#0D7A51' : '#64748b', label: `Farms (${produceListings.length})` },
          { color: '#D97706', label: 'Central Hub' },
          { color: '#2563EB', label: 'Urban Market' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 font-semibold text-gray-600">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
