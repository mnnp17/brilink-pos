'use client';

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { FeatureFlag } from '../types/developer';

interface FeatureFlagToggleProps {
  flag: FeatureFlag;
  onToggle: (flag: FeatureFlag) => Promise<void>;
}

export function FeatureFlagToggle({ flag, onToggle }: FeatureFlagToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onToggle(flag);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 font-sans">
      <div className="space-y-0.5">
        <h4 className="text-[12.5px] font-bold text-slate-800 flex items-center gap-2">
          {flag.name}
          <span className="font-mono text-[9.5px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            {flag.key}
          </span>
        </h4>
        <p className="text-[10px] text-slate-400 leading-normal max-w-md font-medium">
          {flag.description}
        </p>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex items-center gap-1.5 transition-all text-[11px] font-black uppercase ${
          flag.isEnabled 
            ? 'text-emerald-600 hover:text-emerald-700' 
            : 'text-slate-400 hover:text-slate-500'
        } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer active:scale-95'}`}
      >
        {flag.isEnabled ? (
          <ToggleRight className="w-9 h-9" />
        ) : (
          <ToggleLeft className="w-9 h-9" />
        )}
      </button>
    </div>
  );
}
