'use client';

import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Clock, Activity, AlertTriangle } from 'lucide-react';
import type { SystemHealth } from '../types/developer';

export function HealthMetricsGrid() {
  const [metrics, setMetrics] = useState<SystemHealth>({
    databaseLatencyMs: 24,
    memoryUsageMb: 142,
    uptimeSeconds: 86400,
    activeShiftsCount: 2,
    isMaintenanceMode: false,
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMetrics = () => {
      // Simulate real-time metrics fluctuation
      const storedStaff = localStorage.getItem('pos-staff-users');
      let activeShifts = 1;
      try {
        const staff = JSON.parse(storedStaff || '[]');
        activeShifts = staff.filter((s: any) => s.status === 'ON_DUTY').length;
      } catch (e) {}

      // Occasionally simulate high latency spike to test alert systems
      const randomSpike = Math.random() > 0.95;
      const dbLatency = randomSpike
        ? Math.floor(Math.random() * 150) + 180
        : Math.floor(Math.random() * 20) + 15;

      setMetrics({
        databaseLatencyMs: dbLatency,
        memoryUsageMb: Math.floor(Math.random() * 15) + 135,
        uptimeSeconds: Math.floor((Date.now() - new Date('2026-08-19').getTime()) / 1000),
        activeShiftsCount: activeShifts,
        isMaintenanceMode: false,
      });
      setLastUpdated(new Date());
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLatencyStatus = (ms: number) => {
    if (ms > 200) return { label: 'Tinggi', color: 'text-rose-600 border-rose-200 bg-rose-50' };
    if (ms > 100) return { label: 'Peringatan', color: 'text-amber-600 border-amber-200 bg-amber-50' };
    return { label: 'Normal', color: 'text-emerald-600 border-emerald-200 bg-emerald-50' };
  };

  const latencyStatus = getLatencyStatus(metrics.databaseLatencyMs);

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${days}h ${hours}m ${mins}m ${secs}s`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* DB Latency Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Turso Latency</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 tabular-nums">
              {metrics.databaseLatencyMs}
            </span>
            <span className="text-[11px] font-bold text-slate-400">ms</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md text-[10px] font-black border uppercase ${latencyStatus.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${metrics.databaseLatencyMs > 200 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
            {latencyStatus.label}
          </span>
        </div>
        {metrics.databaseLatencyMs > 200 && (
          <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-rose-500" />
        )}
      </div>

      {/* Memory Usage Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Memory Allocation</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 tabular-nums">
              {metrics.memoryUsageMb}
            </span>
            <span className="text-[11px] font-bold text-slate-400">MB</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md text-[10px] font-black border uppercase bg-slate-50 border-slate-200 text-slate-500">
            Heap Limit: 512MB
          </span>
        </div>
      </div>

      {/* Server Uptime Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Uptime</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[12.5px] font-extrabold text-slate-800 tabular-nums leading-none">
            {formatUptime(metrics.uptimeSeconds)}
          </p>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-3 rounded-md text-[10px] font-black border uppercase bg-emerald-50 border-emerald-200 text-emerald-600">
            Status: Stable
          </span>
        </div>
      </div>

      {/* Active Shifts Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Shifts</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 tabular-nums">
              {metrics.activeShiftsCount}
            </span>
            <span className="text-[11px] font-bold text-slate-400">Shift</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md text-[10px] font-black border uppercase bg-slate-50 border-slate-200 text-slate-500">
            Last Updated: {lastUpdated.toLocaleTimeString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
