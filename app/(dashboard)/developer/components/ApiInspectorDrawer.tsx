'use client';

import React from 'react';
import { X, Copy, Terminal, Server } from 'lucide-react';
import { toast } from 'sonner';
import type { ApiTelemetryLog } from '../types/developer';

interface ApiInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: ApiTelemetryLog | null;
}

export function ApiInspectorDrawer({ isOpen, onClose, log }: ApiInspectorDrawerProps) {
  if (!isOpen || !log) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} payload copied to clipboard!`);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'POST': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PUT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase text-slate-800 leading-tight">API Telemetry Inspector</h3>
              <p className="text-[10px] text-slate-400 font-mono">{log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Metadata Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Endpoint</span>
              <p className="font-mono text-slate-800 break-all">{log.endpoint}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Method</span>
              <span className={`px-2 py-0.5 rounded-md font-extrabold border text-[10px] uppercase ${getMethodBadge(log.method)}`}>
                {log.method}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Status Code</span>
              <span className={`font-black text-[12px] leading-tight ${log.statusCode >= 400 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {log.statusCode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Duration</span>
              <p className="font-extrabold text-slate-800 tabular-nums">{log.durationMs} ms</p>
            </div>
          </div>

          {/* Request Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Request Body / Prompts</span>
              <button
                onClick={() => handleCopy(JSON.stringify(log.requestPayload, null, 2), 'Request')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto border border-slate-800">
              <pre className="text-[11.5px] font-mono text-emerald-400 leading-normal">
                {JSON.stringify(log.requestPayload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Response Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Response Payload / Output</span>
              <button
                onClick={() => handleCopy(JSON.stringify(log.responsePayload, null, 2), 'Response')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto border border-slate-800">
              <pre className="text-[11.5px] font-mono text-cyan-400 leading-normal">
                {JSON.stringify(log.responsePayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
