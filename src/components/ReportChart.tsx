import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  LineChart as LineChartIcon,
  Target,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { INDICATORS } from '../data/inmConfig';
import { IndicatorSummary } from '../types/inm';

interface ReportChartProps {
  summaries: IndicatorSummary[];
  monthName: string;
  year: number;
}

export const ReportChart: React.FC<ReportChartProps> = ({ summaries, monthName, year }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'withData'>('withData');

  const displayedSummaries = summaries.filter((s) => {
    if (filterMode === 'withData') return s.avgPercent !== null;
    return true;
  });

  const hoveredItem = summaries.find((s) => s.id === hoveredId);

  // SVG Chart dimensions
  const svgWidth = 860;
  const svgHeight = 280;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const yMax = 100;
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(yMax, val));
    return paddingTop + chartHeight - (clamped / yMax) * chartHeight;
  };

  const getX = (index: number) => {
    const total = displayedSummaries.length;
    if (total <= 1) return paddingLeft + chartWidth / 2;
    const step = chartWidth / (total - 1 || 1);
    return paddingLeft + index * step;
  };

  // Build points for line chart
  const points = displayedSummaries
    .map((s, idx) => {
      if (s.avgPercent === null) return null;
      return {
        x: getX(idx),
        y: getY(s.avgPercent),
        targetY: getY(s.targetValue),
        summary: s,
      };
    })
    .filter(Boolean) as {
    x: number;
    y: number;
    targetY: number;
    summary: IndicatorSummary;
  }[];

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const targetPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.targetY}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Visualisasi Capaian Rata-Rata Bulanan ({monthName} {year})
              </h3>
              <p className="text-xs text-slate-500">
                Grafik perbandingan nilai rata-rata hasil inputan terhadap target ambang batas nasional.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Mode */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setFilterMode('withData')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filterMode === 'withData' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Indikator Terisi ({summaries.filter((s) => s.avgPercent !== null).length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Semua 13 Indikator
            </button>
          </div>

          {/* Chart Type Toggle (Bar vs Line) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                chartType === 'bar' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grafik Batang</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                chartType === 'line' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Grafik Garis</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Rendering */}
      <div className="pt-4 overflow-x-auto">
        <div className="min-w-[700px]">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            {/* Grid Lines */}
            {[0, 20, 40, 60, 80, 100].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={level === 0 || level === 100 ? undefined : '3 3'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* BAR CHART VIEW */}
            {chartType === 'bar' && (
              <>
                {displayedSummaries.map((s, idx) => {
                  const hasData = s.avgPercent !== null;
                  const val = s.avgPercent ?? 0;
                  const total = displayedSummaries.length;
                  const slotWidth = chartWidth / total;
                  const barWidth = Math.min(36, slotWidth * 0.65);
                  const xCenter = paddingLeft + idx * slotWidth + slotWidth / 2;
                  const x = xCenter - barWidth / 2;
                  const y = getY(val);
                  const h = chartHeight - (y - paddingTop);
                  const targetY = getY(s.targetValue);
                  const isHovered = hoveredId === s.id;
                  const isMet = s.isMetAverage;

                  return (
                    <g
                      key={s.id}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Bar Background Hover Area */}
                      <rect
                        x={xCenter - slotWidth / 2}
                        y={paddingTop}
                        width={slotWidth}
                        height={chartHeight}
                        fill={isHovered ? '#f8fafc' : 'transparent'}
                      />

                      {/* Main Data Bar */}
                      {hasData && (
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(2, h)}
                          rx={4}
                          fill={isMet === true ? '#059669' : '#e11d48'}
                          opacity={isHovered ? 1 : 0.85}
                          className="transition-all"
                        />
                      )}

                      {/* Target threshold horizontal tick on this bar */}
                      <line
                        x1={x - 4}
                        y1={targetY}
                        x2={x + barWidth + 4}
                        y2={targetY}
                        stroke="#0f172a"
                        strokeWidth={2.5}
                        strokeDasharray="2 2"
                      />

                      {/* Value label on top of bar */}
                      {hasData && (
                        <text
                          x={xCenter}
                          y={y - 6}
                          textAnchor="middle"
                          className="text-[10px] font-bold font-mono"
                          fill={isMet === true ? '#047857' : '#be123c'}
                        >
                          {val.toFixed(1)}%
                        </text>
                      )}

                      {/* X Axis Label (Indicator No) */}
                      <text
                        x={xCenter}
                        y={svgHeight - paddingBottom + 16}
                        textAnchor="middle"
                        className={`text-[11px] font-mono ${
                          isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'
                        }`}
                      >
                        INM-{s.id < 10 ? `0${s.id}` : s.id}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* LINE CHART VIEW */}
            {chartType === 'line' && (
              <>
                {/* Target line */}
                <path
                  d={targetPath}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />

                {/* Actual Average line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points on Line */}
                {points.map((p) => {
                  const isHovered = hoveredId === p.summary.id;
                  const isMet = p.summary.isMetAverage;

                  return (
                    <g
                      key={p.summary.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredId(p.summary.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 7 : 5}
                        fill={isMet === true ? '#059669' : '#e11d48'}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="transition-all"
                      />
                      <text
                        x={p.x}
                        y={p.y - 10}
                        textAnchor="middle"
                        className="text-[10px] font-bold font-mono"
                        fill={isMet === true ? '#047857' : '#be123c'}
                      >
                        {p.summary.avgPercent?.toFixed(1)}%
                      </text>
                      <text
                        x={p.x}
                        y={svgHeight - paddingBottom + 16}
                        textAnchor="middle"
                        className="text-[11px] font-mono fill-slate-600"
                      >
                        INM-{p.summary.id < 10 ? `0${p.summary.id}` : p.summary.id}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Legend & Active Hover Tooltip Box */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block"></span>
            <span>Rata-Rata Memenuhi Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block"></span>
            <span>Rata-Rata Di Bawah Target</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-slate-800 inline-block"></span>
            <span>Ambang Batas Target</span>
          </span>
        </div>

        {/* Hovered Details Callout */}
        {hoveredItem ? (
          <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in shadow-xs">
            <span className="font-bold">INM-{hoveredItem.id}:</span>
            <span className="text-slate-300 truncate max-w-[220px]">{hoveredItem.title}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="font-mono text-emerald-400 font-bold">
              {hoveredItem.avgPercent !== null ? `${hoveredItem.avgPercent.toFixed(2)}%` : '-'}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">(Target: {hoveredItem.targetLabel})</span>
          </div>
        ) : (
          <div className="text-slate-400 text-[11px] italic">
            Arahkan kursor pada batang/titik grafik untuk melihat detail indikator
          </div>
        )}
      </div>
    </div>
  );
};
