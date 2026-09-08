'use client';

import React, { useState } from 'react';
import { GeminiTelemetryCard } from '../components/GeminiTelemetryCard';
import { ApiInspectorDrawer } from '../components/ApiInspectorDrawer';
import { Search, Eye, Filter } from 'lucide-react';
import { GroupedSelect } from '@/components/ui/GroupedSelect';
import { DropdownGroup } from '@/types/ui';
import type { ApiTelemetryLog } from '../types/developer';

const INITIAL_API_LOGS: ApiTelemetryLog[] = [];


export default function ApiTelemetryPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<ApiTelemetryLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const telemetryGroups: DropdownGroup[] = [
    {
      groupLabel: 'SEMUA TRAFFIC',
      options: [
        { value: 'ALL', label: 'Tampilkan Semua Traffic' }
      ]
    },
    {
      groupLabel: 'INTERNAL BACKEND',
      options: [
        { value: '/api/v1/shifts', label: 'Endpoint POS & Shift' },
        { value: '/api/v1/rebalance', label: 'Endpoint Rebalance' },
      ]
    },
    {
      groupLabel: 'AI EXTERNAL SERVICE',
      options: [
        { value: 'generateContent', label: 'Google Gemini AI' }
      ]
    }
  ];

  const filteredLogs = INITIAL_API_LOGS.filter((log) => {
    let matchesFilter = true;
    if (activeFilter !== 'ALL') {
      matchesFilter = log.endpoint.includes(activeFilter);
    }
    const matchesSearch = log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) || log.id.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pemantauan API & Integrasi</h1>
        <p className="text-[11px] text-slate-400 font-medium">Inspeksi lalu lintas API internal serta telemetry penggunaan token Google Gemini AI</p>
      </div>

      {/* Gemini Usage Stats */}
      <GeminiTelemetryCard />

      {/* API Traffic logs table container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filter Controls Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white">
          <div>
            <h3 className="text-[13px] font-bold text-slate-800 leading-tight">API Request Audit Traffic</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Detail request payload dan response body untuk keperluan debugging</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Segmented Control Replaced with GroupedSelect */}
            <div className="w-56">
              <GroupedSelect
                id="telemetry-filter"
                groups={telemetryGroups}
                value={activeFilter}
                onChange={setActiveFilter}
                placeholder="Pilih filter..."
              />
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari endpoint / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-[11.5px] border border-slate-200 rounded-xl w-48 outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Endpoint / Resource</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Duration</th>
                <th className="px-5 py-3 text-right">Tokens</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black border ${
                      log.category === 'GEMINI_AI' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {log.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-800 break-all">{log.endpoint}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[9px] ${
                      log.method === 'POST' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {log.method}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`font-black text-[12px] ${log.statusCode >= 400 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums">{log.durationMs} ms</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums">{log.tokenCount ?? '-'}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDrawerOpen(true);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg font-bold border border-slate-200 hover:border-indigo-200 transition-all flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-bold bg-white">
                    Tidak ditemukan data log lalu lintas API yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Slide Over Drawer */}
      <ApiInspectorDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
}
