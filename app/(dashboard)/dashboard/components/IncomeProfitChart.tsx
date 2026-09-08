'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DailyFinancialChartData } from '@/types/financial';
import { formatRupiah } from '@/lib/utils/format';

interface IncomeProfitChartProps {
  data: DailyFinancialChartData[];
}

export function IncomeProfitChart({ data }: IncomeProfitChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[260px] w-full items-center justify-center text-slate-400 text-[12px] font-bold bg-white rounded-2xl border border-slate-200 shadow-xs">
        Belum ada data grafik keuangan operasional.
      </div>
    );
  }

  // SVG parameters
  const svgWidth = 700;
  const svgHeight = 260;
  const paddingLeft = 70;
  const paddingRight = 70;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // 1. Calculate limits for Left Y-Axis (Gross Volume)
  const grossValues = data.map((d) => d.grossVolume);
  const maxGross = Math.max(...grossValues, 0);

  // Dynamic ceiling for Left Y Axis (Gross Volume)
  let leftMax = maxGross > 0 ? Math.ceil(maxGross * 1.25) : 1000000;
  if (leftMax < 1000) leftMax = 1000;
  const leftMin = 0;
  const leftRange = (leftMax - leftMin) || 1;

  // 2. Calculate limits for Right Y-Axis (Expenses & Net Profit)
  const smallValues = data.flatMap((d) => [d.totalExpenses, d.netProfitReal]);
  const maxSmall = Math.max(...smallValues, 0);
  const minSmall = Math.min(...smallValues, 0);

  let rightMax = maxSmall > 0 ? Math.ceil(maxSmall * 1.25) : 100000;
  if (rightMax < 1000) rightMax = 1000;
  const rightMin = minSmall < 0 ? Math.floor(minSmall * 1.1) : 0;
  const rightRange = (rightMax - rightMin) || 1;

  // Calculate points
  const points = data.map((d, i) => {
    const x = data.length === 1 
      ? paddingLeft + chartWidth / 2 
      : paddingLeft + i * (chartWidth / (data.length - 1));
    
    // Scale Gross Volume (Left Y-Axis)
    const yGross = (paddingTop + chartHeight) - ((d.grossVolume - leftMin) / leftRange) * chartHeight;
    
    // Scale Expenses (Right Y-Axis)
    const yExpenses = (paddingTop + chartHeight) - ((d.totalExpenses - rightMin) / rightRange) * chartHeight;
    
    // Scale Net Profit (Right Y-Axis)
    const yProfit = (paddingTop + chartHeight) - ((d.netProfitReal - rightMin) / rightRange) * chartHeight;

    return { x, yGross, yExpenses, yProfit, raw: d };
  });

  // Helper to generate bezier curves
  const getBezierPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y} L ${coords[0].x + 0.1} ${coords[0].y}`;
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert mouseX to SVG coordinate space
    const svgX = (mouseX / rect.width) * svgWidth;
    
    // Find closest data point index
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((pt, i) => {
      const diff = Math.abs(pt.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setHoveredIdx(closestIdx);

    // Calculate tooltip position (keep it within bounds)
    const toolWidth = 220;
    let toolX = points[closestIdx].x;
    if (toolX + toolWidth > svgWidth - 10) {
      toolX = toolX - toolWidth - 15;
    } else {
      toolX = toolX + 15;
    }
    
    setTooltipPos({
      x: toolX,
      y: Math.max(30, Math.min(mouseY - 80, svgHeight - 160)),
    });
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  // Generate grid values
  const gridLinesCount = 5;
  const gridLines = Array.from({ length: gridLinesCount }).map((_, i) => {
    const ratio = i / (gridLinesCount - 1);
    const y = paddingTop + ratio * chartHeight;
    const leftVal = leftMax - ratio * leftRange;
    const rightVal = rightMax - ratio * rightRange;
    return { y, leftVal, rightVal };
  });

  return (
    <div ref={containerRef} className="relative w-full h-80 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
      {/* Chart Headers & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2 shrink-0">
        <div>
          <h3 className="font-bold text-[14px] text-slate-800">Tren Performa Finansial</h3>
          <p className="text-[10px] text-slate-400">Analisis volume transaksi vs pengeluaran & laba bersih riil</p>
        </div>
        
        {/* Legends */}
        <div className="flex flex-wrap items-center gap-3.5 text-[10.5px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-blue-500 rounded-full" />
            <span>Omset Gross</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-orange-500 rounded-full" />
            <span>Total Beban</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-slate-800 font-extrabold">Laba Bersih Riil</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas wrapper */}
      <div className="relative flex-1 mt-4 select-none min-h-0">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grids and Axes labels */}
          {gridLines.map((line, i) => (
            <g key={i}>
              {/* Grid Line */}
              <line
                x1={paddingLeft}
                y1={line.y}
                x2={svgWidth - paddingRight}
                y2={line.y}
                stroke="#F1F5F9"
                strokeWidth="1.5"
                strokeDasharray={i === gridLinesCount - 1 ? '0' : '4 4'}
              />
              
              {/* Left Y Axis Labels (Gross Vol in Millions/Thousands) */}
              <text
                x={paddingLeft - 10}
                y={line.y + 4}
                textAnchor="end"
                fill="#94A3B8"
                className="text-[9.5px] font-extrabold font-mono"
              >
                {line.leftVal >= 1000000 
                  ? `${(line.leftVal / 1000000).toFixed(1)}M` 
                  : line.leftVal >= 1000 
                    ? `${(line.leftVal / 1000).toFixed(0)}k` 
                    : Math.round(line.leftVal)
                }
              </text>

              {/* Right Y Axis Labels (Expenses / Net Profit in K/M) */}
              <text
                x={svgWidth - paddingRight + 10}
                y={line.y + 4}
                textAnchor="start"
                fill="#94A3B8"
                className="text-[9.5px] font-extrabold font-mono"
              >
                {line.rightVal >= 1000000 
                  ? `${(line.rightVal / 1000000).toFixed(1)}M` 
                  : line.rightVal >= 1000 
                    ? `${(line.rightVal / 1000).toFixed(0)}k` 
                    : line.rightVal
                }
              </text>
            </g>
          ))}

          {/* X Axis Date Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={svgHeight - 10}
              textAnchor="middle"
              fill={hoveredIdx === i ? '#334155' : '#94A3B8'}
              className={`text-[9.5px] font-bold transition-colors ${hoveredIdx === i ? 'font-black' : ''}`}
            >
              {pt.raw.dayLabel}
            </text>
          ))}

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* ── Area Fill: Omset Gross ── */}
          {points.length > 0 && (
            <path
              d={`${getBezierPath(points.map(p => ({ x: p.x, y: p.yGross })))} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`}
              fill="url(#grossGradient)"
            />
          )}

          {/* ── Line 2: Total Beban (Orange) ── */}
          <path
            d={getBezierPath(points.map(p => ({ x: p.x, y: p.yExpenses })))}
            fill="none"
            stroke="#F97316"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Line 3: Laba Bersih Riil (Green) ── */}
          <path
            d={getBezierPath(points.map(p => ({ x: p.x, y: p.yProfit })))}
            fill="none"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Line 1: Omset Gross (Blue - Drawn on top for max visibility) ── */}
          <path
            d={getBezierPath(points.map(p => ({ x: p.x, y: p.yGross })))}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover guideline */}
          {hoveredIdx !== null && (
            <line
              x1={points[hoveredIdx].x}
              y1={paddingTop}
              x2={points[hoveredIdx].x}
              y2={paddingTop + chartHeight}
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="pointer-events-none"
            />
          )}

          {/* Data Points Markers */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="pointer-events-none">
                {/* Expenses Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.yExpenses}
                  r={isHovered ? 5 : 3.5}
                  fill="#F97316"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* Net Profit Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.yProfit}
                  r={isHovered ? 6 : 4}
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Gross Volume Dot (Blue - Top) */}
                <circle
                  cx={pt.x}
                  cy={pt.yGross}
                  r={isHovered ? 7 : 5}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}
        </svg>

        {/* ── Custom Floating Glassmorphic Tooltip ── */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <div
            className="absolute z-10 w-[230px] bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl border border-white/10 pointer-events-none transition-all duration-100 flex flex-col gap-2"
            style={{
              left: `${(tooltipPos.x / svgWidth) * 100}%`,
              top: `${(tooltipPos.y / svgHeight) * 100}%`,
            }}
          >
            <div className="border-b border-white/15 pb-1.5">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Laporan Tanggal</span>
              <span className="font-extrabold text-[12px] text-white">
                {points[hoveredIdx].raw.date}
              </span>
            </div>
            
            <div className="space-y-1.5 text-[11px] font-semibold">
              <div className="flex justify-between items-center text-blue-300">
                <span>Omset Gross:</span>
                <span className="font-bold">{formatRupiah(points[hoveredIdx].raw.grossVolume)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-200">
                <span>Admin Pelanggan:</span>
                <span className="font-bold">+{formatRupiah(points[hoveredIdx].raw.breakdown.customerAdmin)}</span>
              </div>
              <div className="flex justify-between items-center text-orange-300 pl-2">
                <span className="text-slate-400 font-medium">↳ Biaya Bank (COGS):</span>
                <span>-{formatRupiah(points[hoveredIdx].raw.breakdown.cogsBank)}</span>
              </div>
              <div className="flex justify-between items-center text-orange-300 pl-2">
                <span className="text-slate-400 font-medium">↳ OPEX Toko:</span>
                <span>-{formatRupiah(points[hoveredIdx].raw.breakdown.opexAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-orange-400 border-t border-white/10 pt-1.5">
                <span>Total Beban:</span>
                <span className="font-bold">{formatRupiah(points[hoveredIdx].raw.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 border-t border-white/15 pt-1.5 text-[11.5px] font-bold">
                <span>Laba Bersih Riil:</span>
                <span className="font-black text-[12.5px]">{formatRupiah(points[hoveredIdx].raw.netProfitReal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
