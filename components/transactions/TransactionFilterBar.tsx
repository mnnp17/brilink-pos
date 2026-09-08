'use client'

import { useRef } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import type { AccountSource, TransactionFilters, DateRangeFilter, ServiceCategory } from '@/lib/types/transaction'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface Props {
  filters: TransactionFilters
  accounts: AccountSource[]
  onFilterChange: <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => void
  onReset: () => void
  resultCount: number
}

const DATE_CHIPS: { label: string; value: DateRangeFilter }[] = [
  { label: 'Hari Ini', value: 'TODAY' },
  { label: 'Kemarin', value: 'YESTERDAY' },
  { label: '7 Hari', value: 'LAST_7_DAYS' },
]

const SERVICE_CHIPS: { label: string; value: ServiceCategory | 'ALL' }[] = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Tarik Tunai', value: 'TARIK_TUNAI' },
  { label: 'Setor Tunai', value: 'SETOR_TUNAI' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'PPOB', value: 'PPOB' },
  { label: 'Pulsa', value: 'PULSA' },
]

export function TransactionFilterBar({ filters, accounts, onFilterChange, onReset, resultCount }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.accountId !== '' ||
    filters.dateRange !== 'TODAY' ||
    filters.serviceCategory !== 'ALL'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Top Row: Search + Account Dropdown ─────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 p-3.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            id="txn-search"
            type="text"
            placeholder="Cari no. struk, no. rekening, nama, atau no. HP…"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => {
                onFilterChange('searchQuery', '')
                searchRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Account Dropdown */}
        <CustomSelect
          label="Rekening / EDC"
          value={filters.accountId}
          onChange={(v) => onFilterChange('accountId', v)}
          icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          minWidth="190px"
          options={[
            { value: '', label: 'Semua Rekening / EDC' },
            ...accounts.map((acc) => ({ value: acc.id, label: acc.accountName })),
          ]}
        />
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="h-px bg-slate-100 mx-3.5" />

      {/* ── Bottom Row: Chip Filters + Result Count ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3.5 py-3">
        {/* Date Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {DATE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              id={`chip-date-${chip.value.toLowerCase()}`}
              onClick={() => onFilterChange('dateRange', chip.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filters.dateRange === chip.value
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Vertical Divider (desktop) */}
        <div className="hidden sm:block w-px h-5 bg-slate-200 mx-1" />

        {/* Service Category Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {SERVICE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              id={`chip-service-${chip.value.toLowerCase()}`}
              onClick={() => onFilterChange('serviceCategory', chip.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                filters.serviceCategory === chip.value
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Spacer + Meta */}
        <div className="flex items-center gap-3 sm:ml-auto shrink-0">
          <span className="text-[12px] text-slate-400 font-medium tabular-nums">
            {resultCount} transaksi
          </span>
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
