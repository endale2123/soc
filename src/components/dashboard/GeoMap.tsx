import React, { useState } from 'react';
import { GeoAttackSource } from '../../types/soc';
import { Globe, AlertCircle, ShieldAlert } from 'lucide-react';

interface GeoMapProps {
  sources: GeoAttackSource[];
}

export const GeoMap: React.FC<GeoMapProps> = ({ sources }) => {
  const [hoveredCountry, setHoveredCountry] = useState<GeoAttackSource | null>(null);

  // Simple equirectangular projection math for SVG canvas (width: 800, height: 400)
  // X = ((lng + 180) / 360) * 800
  // Y = ((90 - lat) / 180) * 400
  const getCoordinates = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  return (
    <div className="bg-white border border-sky-200/80 rounded-2xl p-5 flex flex-col h-full shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#0077c8]" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Attack Sources & Geographic Origin Overview
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
          Source IP Geolocation Telemetry
        </span>
      </div>

      {/* Geolocation Attribution Disclaimer */}
      <div className="flex items-start gap-2 p-3 mb-4 bg-sky-50/70 border border-sky-200/70 rounded-xl text-xs text-slate-700">
        <AlertCircle className="w-4 h-4 text-[#0077c8] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-slate-600">
          <strong className="text-slate-900 font-semibold">Attribution Notice:</strong> Geolocation coordinates represent observed network routing hops, proxies, and source IP autonomous system registrations. Physical geographic estimation does not constitute verified legal or nation-state attribution.
        </p>
      </div>

      {/* SVG Map Visualization */}
      <div className="relative w-full aspect-2/1 bg-[#edf4fc] rounded-xl border border-sky-200 overflow-hidden flex items-center justify-center">
        {/* World map stylized continents vector background */}
        <svg viewBox="0 0 800 400" className="w-full h-full select-none">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#edf4fc" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Subtle grid lines */}
          <rect width="800" height="400" fill="url(#mapGlow)" />
          <line x1="0" y1="200" x2="800" y2="200" stroke="#bae6fd" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="400" y1="0" x2="400" y2="400" stroke="#bae6fd" strokeWidth="0.75" strokeDasharray="4 4" />

          {/* Simplified continental outlines */}
          <g fill="#cbdcf7" stroke="#93c5fd" strokeWidth="1" opacity="0.85">
            {/* North America */}
            <path d="M 120 70 Q 200 60 250 110 T 170 210 Q 140 180 120 130 Z" />
            {/* South America */}
            <path d="M 230 220 Q 290 240 280 320 T 220 370 Q 200 300 230 220 Z" />
            {/* Europe */}
            <path d="M 390 80 Q 460 70 470 120 T 400 160 Q 370 120 390 80 Z" />
            {/* Africa */}
            <path d="M 390 170 Q 480 170 490 260 T 430 350 Q 370 270 390 170 Z" />
            {/* Asia */}
            <path d="M 480 70 Q 650 60 700 150 T 560 220 Q 470 150 480 70 Z" />
            {/* Australia */}
            <path d="M 640 270 Q 720 270 710 330 T 630 340 Z" />
          </g>

          {/* Target Center Point (Ministry Data Center, Addis Ababa: ~ 9.03 N, 38.74 E) */}
          {(() => {
            const hq = getCoordinates(9.03, 38.74);
            return (
              <g key="hq-target">
                <circle cx={hq.x} cy={hq.y} r="14" fill="#0077c8" opacity="0.3" className="animate-ping" />
                <circle cx={hq.x} cy={hq.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                <text x={hq.x + 8} y={hq.y - 6} fill="#0b3b60" fontSize="10" fontWeight="bold">
                  MoR SOC (HQ - Addis Ababa)
                </text>
              </g>
            );
          })()}

          {/* Dynamic Geographic Origin Nodes */}
          {sources.map((src) => {
            const coords = getCoordinates(src.lat, src.lng);
            const radius = Math.min(18, Math.max(6, Math.sqrt(src.eventCount) * 0.04));
            const isHovered = hoveredCountry?.countryCode === src.countryCode;

            return (
              <g
                key={src.countryCode}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredCountry(src)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Arc line connecting origin to Ministry Data Center in Addis Ababa */}
                {(() => {
                  const hq = getCoordinates(9.03, 38.74);
                  const midX = (coords.x + hq.x) / 2;
                  const midY = Math.min(coords.y, hq.y) - 40;
                  return (
                    <path
                      d={`M ${coords.x} ${coords.y} Q ${midX} ${midY} ${hq.x} ${hq.y}`}
                      fill="none"
                      stroke={src.alertCount > 0 ? '#ef4444' : '#0077c8'}
                      strokeWidth={isHovered ? 2.5 : 1}
                      strokeDasharray="4 3"
                      opacity={isHovered ? 0.9 : 0.4}
                    />
                  );
                })()}

                {/* Pulsing outer node */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={radius + (isHovered ? 6 : 2)}
                  fill={src.alertCount > 0 ? '#ef4444' : '#0077c8'}
                  opacity={isHovered ? 0.5 : 0.25}
                  className={src.alertCount > 0 ? 'animate-pulse' : ''}
                />
                {/* Core node */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={radius}
                  fill={src.alertCount > 0 ? '#dc2626' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                {/* Country code label */}
                <text
                  x={coords.x}
                  y={coords.y + 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={radius > 10 ? '9' : '7'}
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {src.countryCode}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspection overlay */}
        {hoveredCountry && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur border border-sky-200 rounded-xl p-3 shadow-lg max-w-xs text-xs pointer-events-none animate-in fade-in duration-100">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-slate-900 text-sm">
                {hoveredCountry.country} ({hoveredCountry.countryCode})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-[#0077c8] font-bold">
                {hoveredCountry.eventCount.toLocaleString()} events
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Primary Vector: <strong className="text-slate-800">{hoveredCountry.topAttackVector}</strong>
            </p>
            <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-100 font-mono text-[11px]">
              <span className="text-red-600 font-bold">
                Alerts: {hoveredCountry.alertCount}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-sky-700 font-medium">
                Target: {hoveredCountry.topTargetAsset}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Attack Origins Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-sky-100 text-slate-500 font-semibold bg-sky-50/50">
              <th className="py-2 px-2.5">Origin Country</th>
              <th className="py-2 px-2.5">Primary Vector</th>
              <th className="py-2 px-2.5 text-right">Total Events</th>
              <th className="py-2 px-2.5 text-right">Alerts</th>
              <th className="py-2 px-2.5 text-right">Threat Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100/60 font-mono">
            {sources.map((src) => {
              const critRatio = ((src.alertCount / src.eventCount) * 100).toFixed(1);
              return (
                <tr
                  key={src.countryCode}
                  className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                  onMouseEnter={() => setHoveredCountry(src)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  <td className="py-2 px-2.5 font-sans font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0077c8]" />
                    {src.country}
                    <span className="text-slate-400 font-mono text-[10px]">({src.countryCode})</span>
                  </td>
                  <td className="py-2 px-2.5 font-sans text-slate-600">{src.topAttackVector}</td>
                  <td className="py-2 px-2.5 text-right font-bold text-slate-800">
                    {src.eventCount.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 text-right text-red-600 font-bold">
                    {src.alertCount}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        Number(critRatio) > 20
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : Number(critRatio) > 10
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-sky-50 text-[#0077c8] border border-sky-200'
                      }`}
                    >
                      {critRatio}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
