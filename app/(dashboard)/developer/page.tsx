'use client';

import React from 'react';
import { HealthMetricsGrid } from './components/HealthMetricsGrid';
import { Cpu, Server, Activity, Database, ShieldAlert, Cpu as Chip } from 'lucide-react';

export default function DeveloperOverviewPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Dashboard Teknis</h1>
          <p className="text-[11px] text-slate-400 font-medium">Monitoring status infrastruktur, latensi server, penggunaan memori, dan ringkasan performa sistem</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Cluster Node: Operational
          </span>
        </div>
      </div>

      {/* Real-time Health Metrics */}
      <HealthMetricsGrid />

      {/* Database Node Status & Server Spec info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Replication Status */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-800">Database Replication Node</h3>
                <p className="text-[10px] text-slate-400 font-medium">Turso Managed Cloud Database (Distributed)</p>
              </div>
            </div>
          </div>
          <div className="p-5 divide-y divide-slate-100 text-[12px]">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Primary Cluster Location</span>
              <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">sin (Singapore)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Replica Nodes Status</span>
              <span className="font-semibold text-emerald-600">Active & Synced (1 replica)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Connections Active</span>
              <span className="font-black text-slate-700 tabular-nums">12 Nodes</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Database Size</span>
              <span className="font-black text-slate-700 tabular-nums">4.24 MB</span>
            </div>
          </div>
        </div>

        {/* Server Specification */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <Server className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-slate-800">Server Specifications</h3>
                <p className="text-[10px] text-slate-400 font-medium">Vercel Serverless Platform (Edge Runtime)</p>
              </div>
            </div>
          </div>
          <div className="p-5 divide-y divide-slate-100 text-[12px]">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Runtime Platform</span>
              <span className="font-mono text-slate-700">Next.js Node.js Edge</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Framework Engine</span>
              <span className="font-semibold text-slate-700">Next.js 16.3.0 (Turbopack)</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Node.js Engine</span>
              <span className="font-mono text-slate-700">v20.14.0 LTS</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-400 font-bold">Server Memory Limit</span>
              <span className="font-black text-slate-700">512 MB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
