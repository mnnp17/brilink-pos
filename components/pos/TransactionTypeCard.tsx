'use client'

import type { TransactionType } from '@/lib/types'

interface TransactionConfig {
  type: TransactionType
  label: string
  description: string
  icon: React.ReactNode
  gradient: string
  borderColor: string
}

const TRANSACTION_TYPES: TransactionConfig[] = [
  {
    type: 'setor_tunai',
    label: 'Setor Tunai',
    description: 'Nasabah setor uang tunai',
    gradient: 'from-emerald-600/20 to-green-600/10',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    type: 'tarik_tunai',
    label: 'Tarik Tunai',
    description: 'Nasabah ambil uang tunai',
    gradient: 'from-red-600/20 to-rose-600/10',
    borderColor: 'border-red-500/30 hover:border-red-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4m8 8l-8-8 8-8" />
      </svg>
    ),
  },
  {
    type: 'ppob',
    label: 'PPOB / Tagihan',
    description: 'Bayar listrik, PDAM, dll',
    gradient: 'from-blue-600/20 to-indigo-600/10',
    borderColor: 'border-blue-500/30 hover:border-blue-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: 'pulsa',
    label: 'Pulsa / Data',
    description: 'Isi pulsa & paket data',
    gradient: 'from-purple-600/20 to-violet-600/10',
    borderColor: 'border-purple-500/30 hover:border-purple-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'transfer_internal',
    label: 'Transfer Antar Rekening',
    description: 'Pindah saldo antar rekening',
    gradient: 'from-amber-600/20 to-yellow-600/10',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    type: 'cash_drop',
    label: 'Cash Drop',
    description: 'Setoran fisik ke rekening',
    gradient: 'from-teal-600/20 to-cyan-600/10',
    borderColor: 'border-teal-500/30 hover:border-teal-500/60',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
]

interface TransactionTypeCardProps {
  selected: TransactionType | null
  onSelect: (type: TransactionType) => void
}

export function TransactionTypeCard({ selected, onSelect }: TransactionTypeCardProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Jenis Transaksi</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TRANSACTION_TYPES.map((t) => (
          <button
            key={t.type}
            id={`txn-type-${t.type}`}
            onClick={() => onSelect(t.type)}
            className={`relative p-4 rounded-2xl border bg-gradient-to-br ${t.gradient} ${t.borderColor} transition-all duration-200 text-left group ${
              selected === t.type
                ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500 scale-[0.98]'
                : 'hover:scale-[1.02]'
            }`}
          >
            <div className={`mb-3 ${
              selected === t.type ? 'text-white' : 'text-slate-300 group-hover:text-white'
            } transition-colors`}>
              {t.icon}
            </div>
            <p className={`text-sm font-semibold leading-tight ${
              selected === t.type ? 'text-white' : 'text-slate-200'
            }`}>
              {t.label}
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-tight">{t.description}</p>
            {selected === t.type && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
