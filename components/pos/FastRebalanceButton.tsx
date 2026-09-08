'use client';

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface FastRebalanceButtonProps {
  onClick: () => void;
}

export function FastRebalanceButton({ onClick }: FastRebalanceButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Pindah Saldo Internal"
      className="flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 sm:px-3 py-1.5 text-[12px] font-bold text-slate-700 transition-colors active:scale-95 cursor-pointer"
    >
      <ArrowRightLeft className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      <span className="hidden sm:inline">Pindah Saldo</span>
      <span className="inline sm:hidden">Pindah</span>
    </button>
  );
}
