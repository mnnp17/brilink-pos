'use client'

import { useState } from 'react'
import { openShift } from '@/lib/actions/shift.actions'
import { parseRupiah } from '@/lib/utils/format'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface ShiftOpenModalProps {
  onSuccess: () => void
}

export function ShiftOpenModal({ onSuccess }: ShiftOpenModalProps) {
  const [openingCashRaw, setOpeningCashRaw] = useState('1.500.000')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()
    const cash = parseRupiah(openingCashRaw)
    
    setLoading(true)
    try {
      const result = await openShift(cash)
      if (!result.success) {
        toast.error('Gagal Buka Shift', { description: result.error })
        return
      }

      toast.success('Shift Berhasil Dibuka!', { description: 'Selamat bekerja!' })
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-slate-700/60 max-w-md w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Buka Shift Kasir</h2>
          <p className="text-slate-400 text-xs mt-0.5">Hitung kas fisik modal di laci kasir</p>
        </div>
      </div>

      <form onSubmit={handleOpenShift} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Uang Kas Awal Laci (Rp)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={openingCashRaw}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setOpeningCashRaw(raw ? Number(raw).toLocaleString('id-ID') : '')
            }}
            placeholder="0"
            required
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-lg font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <p className="text-slate-500 text-xs mt-1">Hitung dan masukkan total fisik uang tunai modal laci.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? 'Memproses...' : 'Buka Shift Sekarang'}
        </button>
      </form>
    </div>
  )
}
