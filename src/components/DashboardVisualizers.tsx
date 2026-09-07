import { useState } from 'react';
import {
  MapPin,
  TrendingUp
} from 'lucide-react';

// ====================================================================
// 1. PERSENTASE PERIZINAN AKTIF (CIRCLE GAUGE / RADIAL PROGRESS)
// ====================================================================
interface PersentaseAktifCircleProps {
  percentage: number;
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

export const PersentaseAktifCircle = ({
  percentage,
  total,
  active,
  expiringSoon,
  expired
}: PersentaseAktifCircleProps) => {
  const radius = 64;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  let ratingColor = 'text-emerald-700';
  let ratingLabel = 'Tingkat Kepatuhan Baik';
  let ratingBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';

  if (percentage < 70) {
    ratingColor = 'text-rose-600';
    ratingLabel = 'Perlu Peninjauan Khusus';
    ratingBg = 'bg-rose-50 text-rose-800 border-rose-200';
  } else if (percentage < 85) {
    ratingColor = 'text-amber-600';
    ratingLabel = 'Tingkat Kepatuhan Cukup';
    ratingBg = 'bg-amber-50 text-amber-800 border-amber-200';
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Kepatuhan & Keberlakuan
          </span>
          <h3 className="text-sm font-bold text-slate-900 m-0">Persentase Izin Aktif</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${ratingBg}`}>
          {ratingLabel}
        </span>
      </div>

      {/* SVG Circular Gauge */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-100"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Active percentage progress */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-emerald-500 transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Centered Percentage Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-black ${ratingColor} tracking-tight`}>
              {percentage}%
            </span>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
              Izin Aktif
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">
              {active} dari {total} izin
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Badges */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
        <div className="bg-emerald-50/80 rounded-xl p-2 border border-emerald-100">
          <span className="text-[11px] font-bold text-emerald-800 block">Aktif</span>
          <span className="text-sm font-black text-emerald-900">{active}</span>
        </div>
        <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-800 block">&le; 180 Hari</span>
          <span className="text-sm font-black text-amber-900">{expiringSoon}</span>
        </div>
        <div className="bg-rose-50/80 rounded-xl p-2 border border-rose-100">
          <span className="text-[11px] font-bold text-rose-800 block">Berakhir</span>
          <span className="text-sm font-black text-rose-900">{expired}</span>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 2. STATUS IZIN (DONUT / PIE CHART)
// ====================================================================
interface StatusPieChartProps {
  active: number;
  expiringSoon: number;
  expired: number;
  total: number;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({
  active,
  expiringSoon,
  expired,
  total
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 55;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const data = [
    { label: 'Aktif (> 180 hari)', count: active, color: '#10b981', textColor: 'text-emerald-700', bg: 'bg-emerald-500' },
    { label: 'Akan Berakhir (≤ 180 hari)', count: expiringSoon, color: '#f59e0b', textColor: 'text-amber-700', bg: 'bg-amber-500' },
    { label: 'Berakhir / Kedaluwarsa', count: expired, color: '#ef4444', textColor: 'text-rose-700', bg: 'bg-rose-500' }
  ];

  let accumulatedOffset = 0;
  const slices = data.map((item, idx) => {
    const ratio = total > 0 ? item.count / total : 0;
    const dashLength = ratio * circumference;
    const currentOffset = accumulatedOffset;
    accumulatedOffset += dashLength;

    return {
      ...item,
      ratio,
      percentage: Math.round(ratio * 1000) / 10,
      dasharray: `${dashLength} ${circumference}`,
      dashoffset: -currentOffset,
      idx
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
      {/* Top */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-900 m-0">Status Keberlakuan Izin</h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {total} Total
          </span>
        </div>
        <p className="text-[11px] text-slate-500 m-0 mb-3">Distribusi status izin pertambangan</p>
      </div>

      {/* Center */}
      <div className="w-full flex-1 flex items-center justify-center my-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {slices.map((slice) => {
                if (slice.count === 0) return null;
                const isHovered = hoveredIdx === slice.idx;

                return (
                  <circle
                    key={slice.label}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={slice.dasharray}
                    strokeDashoffset={slice.dashoffset}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Centered label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {hoveredIdx !== null ? (
                <>
                  <span className="text-lg font-black text-slate-900">{slices[hoveredIdx].count}</span>
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    {slices[hoveredIdx].percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-black text-slate-900">{total}</span>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Izin</span>
                </>
              )}
            </div>
          </div>

          {/* Legend List */}
          <div className="space-y-2 flex-1 w-full text-xs">
            {slices.map((slice) => (
              <div
                key={slice.label}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  hoveredIdx === slice.idx ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${slice.bg}`}></span>
                  <span className="text-slate-700 text-xs font-medium mr-2">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 font-bold">{slice.count}</span>
                  <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  );
};

// ====================================================================
// 3. KOMPOSISI JENIS IZIN (PIE / DONUT CHART)
// ====================================================================
interface JenisIzinPieChartProps {
  totalIupMblb: number;
  totalIpr: number;
  totalIujp: number;
  total: number;
  granularBreakdown: { code: string; count: number }[];
}

export const JenisIzinPieChart: React.FC<JenisIzinPieChartProps> = ({
  totalIupMblb,
  totalIpr,
  totalIujp,
  total,
  granularBreakdown
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 55;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const data = [
    { label: 'IUP MBLB & SIPB', count: totalIupMblb, color: '#059669', bg: 'bg-emerald-600', sub: 'Non-Logam & Batuan' },
    { label: 'IPR', count: totalIpr, color: '#d97706', bg: 'bg-amber-600', sub: 'Pertambangan Rakyat' },
    { label: 'IUJP', count: totalIujp, color: '#0284c7', bg: 'bg-sky-600', sub: 'Jasa Pertambangan' }
  ];

  let accumulatedOffset = 0;
  const slices = data.map((item, idx) => {
    const ratio = total > 0 ? item.count / total : 0;
    const dashLength = ratio * circumference;
    const currentOffset = accumulatedOffset;
    accumulatedOffset += dashLength;

    return {
      ...item,
      ratio,
      percentage: Math.round(ratio * 1000) / 10,
      dasharray: `${dashLength} ${circumference}`,
      dashoffset: -currentOffset,
      idx
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-900 m-0">Komposisi Jenis Izin</h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
            3 Kategori
          </span>
        </div>
        <p className="text-[11px] text-slate-500 m-0 mb-3">Porsi izin IUP, IPR, dan IUJP</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {slices.map((slice) => {
                if (slice.count === 0) return null;
                const isHovered = hoveredIdx === slice.idx;

                return (
                  <circle
                    key={slice.label}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={slice.dasharray}
                    strokeDashoffset={slice.dashoffset}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(slice.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Centered label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {hoveredIdx !== null ? (
                <>
                  <span className="text-lg font-black text-slate-900">{slices[hoveredIdx].count}</span>
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    {slices[hoveredIdx].percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl font-black text-slate-900">{total}</span>
                  <span className="text-[11px] font-bold uppercase text-slate-400">Total Izin</span>
                </>
              )}
            </div>
          </div>

          {/* Legend List */}
          <div className="space-y-2 flex-1 w-full text-xs">
            {slices.map((slice) => (
              <div
                key={slice.label}
                onMouseEnter={() => setHoveredIdx(slice.idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                  hoveredIdx === slice.idx ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${slice.bg}`}></span>
                  <div>
                    <span className="text-slate-800 text-xs font-semibold block">{slice.label}</span>
                    <span className="text-[11px] text-slate-400 block">{slice.sub}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 font-bold">{slice.count}</span>
                  <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-type badges */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 justify-center">
        {granularBreakdown.map((item) => (
          <span
            key={item.code}
            className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium"
          >
            {item.code}: <strong className="text-slate-900">{item.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// 4. JUMLAH IZIN PER KABUPATEN (VERTICAL BAR CHART)
// ====================================================================
interface KabupatenVerticalBarChartProps {
  data: { name: string; count: number; area: number }[];
  onSelectRegency?: (regency: string) => void;
}

export const KabupatenVerticalBarChart: React.FC<KabupatenVerticalBarChartProps> = ({
  data,
  onSelectRegency
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const maxBarHeight = 120; // px

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-0.5">
            <MapPin className="w-4 h-4" />
            <span>Distribusi Geografis</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 m-0">
            Jumlah Izin Per Kabupaten / Kota (Maluku Utara)
          </h3>
          <p className="text-[11px] text-slate-500 m-0 mt-0.5">
            Sebaran perizinan aktif di 9 wilayah administratif
          </p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          9 Kabupaten / Kota
        </span>
      </div>

      {/* Horizontal scroll container for responsive screens */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[680px]">
          {/* Bar Plot Area with solid baseline */}
          <div className="relative">
            {/* Background reference grid lines */}
            <div className="absolute inset-x-0 top-3 bottom-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div className="border-b border-dashed border-slate-200 w-full"></div>
              <div></div>
            </div>

            {/* Vertical Columns resting directly on border-b-2 */}
            <div className="grid grid-cols-9 gap-3 items-end h-44 border-b-2 border-slate-200 px-2 relative z-10">
              {data.map((item, idx) => {
                const barHeight = Math.max(Math.round((item.count / maxCount) * maxBarHeight), 6);
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectRegency && onSelectRegency(item.name)}
                    className="flex flex-col items-center justify-end h-full group cursor-pointer"
                    title={`${item.name}: ${item.count} izin (${item.area.toLocaleString('id-ID')} HA)`}
                  >
                    {/* Count Badge on top of the bar */}
                    <span
                      className={`text-[11px] font-mono transition-transform duration-200 mb-1.5 ${
                        isHovered
                          ? 'scale-110 font-black text-emerald-700'
                          : 'font-bold text-slate-800'
                      }`}
                    >
                      {item.count}
                    </span>

                    {/* Vertical Bar resting directly on bottom line */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isHovered
                            ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-md'
                            : 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X Axis Labels Grid placed cleanly BELOW the baseline */}
            <div className="grid grid-cols-9 gap-3 px-2 pt-3">
              {data.map((item, idx) => {
                const isHovered = hoveredIdx === idx;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSelectRegency && onSelectRegency(item.name)}
                    className="text-center cursor-pointer group"
                  >
                    <span
                      className={`text-[11px] sm:text-[11px] font-semibold block leading-tight line-clamp-2 min-h-[28px] transition-colors ${
                        isHovered ? 'text-emerald-700 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.area > 0 && (
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5 whitespace-nowrap">
                        {Math.round(item.area).toLocaleString('id-ID')} HA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Helpful legend / tip */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <span>💡 Klik nama kabupaten atau grafik batang untuk memfilter data pada tabel</span>
        <span>Wilayah: 9 Kabupaten / Kota</span>
      </div>
    </div>
  );
};

// ====================================================================
// 5. TREN PENERBITAN IZIN PER TAHUN (LINE & DOT CHART)
// ====================================================================
export interface TrenTahunChartProps {
  data: { year: number; count: number }[];
  selectedYear?: number | string | null;
  onSelectYear?: (year: number) => void;
}

export const TrenTahunChart: React.FC<TrenTahunChartProps> = ({
  data,
  selectedYear,
  onSelectYear
}) => {
  const sorted = [...data].sort((a, b) => a.year - b.year);
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);
  const totalIssued = sorted.reduce((acc, curr) => acc + curr.count, 0);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // SVG Chart Geometry
  const viewBoxWidth = 540;
  const viewBoxHeight = 210;
  const paddingLeft = 44;
  const paddingRight = 32;
  const paddingTop = 38;
  const paddingBottom = 34;
  const usableWidth = viewBoxWidth - paddingLeft - paddingRight;
  const usableHeight = viewBoxHeight - paddingTop - paddingBottom;
  const baselineY = viewBoxHeight - paddingBottom;

  // Calculate points
  const points = sorted.map((item, idx) => {
    const x =
      sorted.length === 1
        ? paddingLeft + usableWidth / 2
        : paddingLeft + (idx / (sorted.length - 1)) * usableWidth;
    const y = baselineY - (item.count / maxCount) * usableHeight;
    return {
      ...item,
      x,
      y,
      isPeak: item.count === maxCount && item.count > 0,
      isHovered: hoveredYear === item.year,
      isSelected: selectedYear !== null && selectedYear !== undefined && String(selectedYear) === String(item.year)
    };
  });

  // Smooth line path generator with Fritsch-Carlson tangent clamping
  const createSmoothPath = (pts: typeof points) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) {
      return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    }

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      let dy1 = (p2.y - p0.y) * 0.18;
      let dy2 = (p3.y - p1.y) * 0.18;

      // Prevent overshooting at local extrema
      if ((p1.y - p0.y) * (p2.y - p1.y) <= 0) dy1 = 0;
      if ((p2.y - p1.y) * (p3.y - p2.y) <= 0) dy2 = 0;

      const cp1x = p1.x + (p2.x - p0.x) * 0.18;
      const cp1y = Math.max(paddingTop, Math.min(baselineY, p1.y + dy1));
      const cp2x = p2.x - (p3.x - p1.x) * 0.18;
      const cp2y = Math.max(paddingTop, Math.min(baselineY, p2.y - dy2));

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : '';

  const hoveredItem = points.find((p) => p.year === hoveredYear);
  const peakYearItem = points.find((p) => p.isPeak);

  // Y-axis tick values
  const midCount = Math.round(maxCount / 2);
  const midY = paddingTop + usableHeight / 2;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Historis Penerbitan</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {totalIssued} SK Terbit
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 m-0">Tren Penerbitan Izin Per Tahun</h3>
        <p className="text-[11px] text-slate-500 m-0 mb-3">Grafik garis & titik sebaran volume izin diterbitkan per tahun kalender</p>
      </div>

      {sorted.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-400 text-xs italic">
          Tidak ada data tren penerbitan per tahun
        </div>
      ) : (
        <div className="pt-2">
          {/* SVG Line and Dot Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="w-full h-48 sm:h-52 overflow-visible select-none"
            >
              <defs>
                {/* Area Gradient */}
                <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="85%" stopColor="#10b981" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                {/* Line Gradient */}
                <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={viewBoxWidth - paddingRight}
                y2={paddingTop}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={midY}
                x2={viewBoxWidth - paddingRight}
                y2={midY}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingLeft}
                y1={baselineY}
                x2={viewBoxWidth - paddingRight}
                y2={baselineY}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Y-Axis Value Labels */}
              <text
                x={paddingLeft - 8}
                y={paddingTop + 3}
                textAnchor="end"
                className="text-[10px] font-mono font-bold fill-slate-400"
              >
                {maxCount}
              </text>
              <text
                x={paddingLeft - 8}
                y={midY + 3}
                textAnchor="end"
                className="text-[10px] font-mono font-medium fill-slate-300"
              >
                {midCount}
              </text>
              <text
                x={paddingLeft - 8}
                y={baselineY + 3}
                textAnchor="end"
                className="text-[10px] font-mono font-medium fill-slate-400"
              >
                0
              </text>

              {/* Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#trendAreaGrad)"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Connected Line Path */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#trendLineGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 pointer-events-none"
                />
              )}

              {/* Hover Indicator Crosshair Line */}
              {hoveredItem && (
                <line
                  x1={hoveredItem.x}
                  y1={paddingTop}
                  x2={hoveredItem.x}
                  y2={baselineY}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="transition-all duration-150 pointer-events-none"
                />
              )}

              {/* Dots and Labels */}
              {points.map((pt) => {
                const isHovered = pt.isHovered;
                const isPeak = pt.isPeak;
                const isSelected = pt.isSelected;

                return (
                  <g key={pt.year} className="group cursor-pointer">
                    {/* Pulsing / Glow Halo on Hover or Selected */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="#10b981"
                        fillOpacity="0.2"
                        className="animate-pulse pointer-events-none"
                      />
                    )}

                    {/* Peak Ambient Halo */}
                    {isPeak && !isHovered && !isSelected && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="10"
                        fill="#f59e0b"
                        fillOpacity="0.2"
                        className="pointer-events-none"
                      />
                    )}

                    {/* The Point / Dot Marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered || isSelected ? 6.5 : isPeak ? 5.5 : 4.5}
                      fill={isHovered || isSelected ? '#047857' : isPeak ? '#f59e0b' : '#ffffff'}
                      stroke={isHovered || isSelected ? '#ffffff' : isPeak ? '#ffffff' : '#059669'}
                      strokeWidth={isHovered || isSelected ? 2.5 : isPeak ? 2 : 2.5}
                      className="transition-all duration-200 pointer-events-none shadow-sm"
                    />

                    {/* Count Label directly above Dot */}
                    <text
                      x={pt.x}
                      y={pt.y - (isPeak ? 7 : 8)}
                      textAnchor="middle"
                      className={`text-xs font-mono transition-transform duration-200 pointer-events-none ${
                        isHovered || isSelected
                          ? 'fill-emerald-700 font-black text-sm'
                          : isPeak
                          ? 'fill-amber-600 font-black'
                          : 'fill-slate-700 font-bold'
                      }`}
                    >
                      {pt.count}
                    </text>

                    {/* "PUNCAK" Badge above Peak Dot */}
                    {isPeak && (
                      <g
                        transform={`translate(${pt.x}, ${pt.y - 23})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x="-27"
                          y="-12"
                          width="54"
                          height="14"
                          rx="3.5"
                          fill="#f59e0b"
                          className="shadow-xs"
                        />
                        <text
                          x="0"
                          y="-5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#0f172a"
                          className="text-[9px] font-black uppercase tracking-wider"
                        >
                          Puncak
                        </text>
                      </g>
                    )}

                    {/* "DIPILIH" Badge if Selected and not Peak */}
                    {isSelected && !isPeak && (
                      <g
                        transform={`translate(${pt.x}, ${pt.y - 23})`}
                        className="pointer-events-none select-none"
                      >
                        <rect
                          x="-18"
                          y="-7"
                          width="36"
                          height="14"
                          rx="3.5"
                          fill="#059669"
                          className="shadow-xs"
                        />
                        <text
                          x="0"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          className="text-[9px] font-black uppercase tracking-wider"
                        >
                          Dipilih
                        </text>
                      </g>
                    )}

                    {/* X-Axis Year Label */}
                    <text
                      x={pt.x}
                      y={baselineY + 18}
                      textAnchor="middle"
                      className={`text-xs font-mono transition-colors pointer-events-none ${
                        isHovered || isSelected
                          ? 'fill-emerald-700 font-black'
                          : 'fill-slate-600 font-bold'
                      }`}
                    >
                      {pt.year}
                    </text>

                    {/* Invisible Generous Interactive Hitbox */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="22"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredYear(pt.year)}
                      onMouseLeave={() => setHoveredYear(null)}
                      onClick={() => onSelectYear && onSelectYear(pt.year)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Info Banner / Dynamic Legend */}
          {hoveredItem ? (
            <div className="mt-3 bg-emerald-50/90 border border-emerald-200 rounded-xl px-4 py-2 flex items-center justify-between transition-all shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-bold text-slate-900">
                  Tahun {hoveredItem.year}
                </span>
                {hoveredItem.isPeak && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-tight">
                    Puncak Historis
                  </span>
                )}
                {hoveredItem.isSelected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-700 text-white uppercase tracking-tight">
                    Filter Aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono font-black text-emerald-800">
                  {hoveredItem.count} SK Terbit
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  ({totalIssued > 0 ? ((hoveredItem.count / totalIssued) * 100).toFixed(1) : 0}% dari total)
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-600 bg-white inline-block"></span>
                  <span className="text-slate-600 font-medium">Titik Tahun</span>
                </span>
                {peakYearItem && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    <span className="text-slate-600 font-medium">
                      Puncak ({peakYearItem.year}: {peakYearItem.count} SK)
                    </span>
                  </span>
                )}
              </div>
              <span>Arahkan kursor atau klik titik untuk memfilter tahun</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ====================================================================
// 6. KOMODITAS TAMBANG TERBANYAK (HORIZONTAL BAR CHART)
// ====================================================================
interface KomoditasHorizontalBarChartProps {
  data: { name: string; count: number }[];
  totalLicenses: number;
}

export const KomoditasHorizontalBarChart: React.FC<KomoditasHorizontalBarChartProps> = ({
  data,
  totalLicenses
}) => {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-slate-900 m-0">Komoditas Tambang Terbanyak</h3>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
          Top 10 Komoditas
        </span>
      </div>
      <p className="text-[11px] text-slate-500 m-0 mb-4">
        Peringkat jenis bahan galian dan batuan yang paling banyak memiliki izin
      </p>

      <div className="space-y-2.5">
        {data.slice(0, 10).map((item, idx) => {
          const pct = Math.round((item.count / maxCount) * 100);
          const shareOfTotal = totalLicenses > 0 ? Math.round((item.count / totalLicenses) * 1000) / 10 : 0;

          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2 max-w-[70%]">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 font-mono">
                    {item.count} Izin
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
                    ({shareOfTotal}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 group-hover:from-emerald-600 group-hover:to-teal-600"
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
