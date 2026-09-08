'use client';

import React, { useState, useEffect } from 'react';
import { User, Monitor, Clock, Calendar } from 'lucide-react';

interface ShiftMetadataHeaderProps {
  cashierName: string;
  cashierRole: string;
}

export function ShiftMetadataHeader({ cashierName, cashierRole }: ShiftMetadataHeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3 shadow-xs">
      <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Metadata Sesi & Terminal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cashier Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kasir Aktif</p>
            <p className="text-[14px] font-bold text-slate-800 truncate">{cashierName}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 rounded uppercase">
              {cashierRole}
            </span>
          </div>
        </div>

        {/* Terminal Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 shrink-0">
            <Monitor className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terminal ID</p>
            <p className="text-[14px] font-bold text-slate-800">POS-TERMINAL-01</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-slate-200 text-slate-700 rounded uppercase">
              Online
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100/80 pt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400" />
          {formattedDate}
        </span>
        <span className="flex items-center gap-1.5 font-mono font-bold text-slate-700">
          <Clock className="w-4 h-4 text-slate-400 animate-pulse" />
          {time}
        </span>
      </div>
    </div>
  );
}
