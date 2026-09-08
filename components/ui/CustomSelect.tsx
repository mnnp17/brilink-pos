'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

export interface CustomSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  minWidth?: string;
  className?: string;
}

export function CustomSelect({
  label,
  value,
  options,
  onChange,
  icon,
  minWidth = '180px',
  className = '',
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  return (
    <div ref={ref} className={`relative ${className}`} style={{ minWidth }}>
      <label className="absolute -top-2 left-3 z-10 select-none pointer-events-none px-1 text-[10px] font-semibold bg-white text-blue-600">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'w-full flex items-center justify-between gap-2 bg-white border rounded-lg',
          'px-3 pt-3.5 pb-1.5 text-[12.5px] font-semibold text-slate-800',
          'outline-none transition-all duration-200 cursor-pointer text-left',
          open ? 'border-blue-600 ring-2 ring-blue-500/15' : 'border-slate-300 hover:border-slate-400',
        ].join(' ')}
      >
        <span className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={['w-3.5 h-3.5 shrink-0 transition-transform duration-200', open ? 'rotate-180 text-blue-500' : 'text-slate-400'].join(' ')} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="py-1.5 max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={[
                    'w-full flex items-center justify-between gap-3 px-4 py-2.5',
                    'text-left text-[12.5px] font-semibold transition-all duration-100 cursor-pointer',
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
