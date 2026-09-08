'use client'

import { useState } from 'react'
import { closeShift } from '@/lib/actions/shift.actions'
import { parseRupiah, formatRupiah } from '@/lib/utils/format'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface ShiftCloseModalProps {
  shiftId: string
  expectedCash: number
  onSuccess: () => void
  onCancel: () => void
}

export function ShiftCloseModal({ shiftId, expectedCash, onSuccess, onCancel }: ShiftCloseModalProps) {
  const [closingCashRaw, setClosingCashRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const closingCash = parseRupiah(closingCashRaw)
  const discrepancy = closingCashRaw !== '' ? closingCash - expectedCash : null

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!closingCashRaw) {
      toast.error('Masukkan saldo kas fisik akhir')
      return
    }

    setLoading(true)
    try {
      const result = await closeShift(shiftId, closingCash)
      if (!result.success) {
        toast.error('Gagal Tutup Shift', { description: result.error })
        return
      }

      toast.success('Shift Berhasil Ditutup!', {
        description: discrepancy && discrepancy !== 0
          ? `Selisih kas: ${formatRupiah(discrepancy)}`
          : 'Kas sesuai 100%',
      })
      queryClient.invalidateQueries({ queryKey: ['shift'] })
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/60 max-w-md w-full animate-fade-in shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Closing / Tutup Shift</h2>
            <p className="text-slate-400 text-xs mt-0.5">Rekonsiliasi kas fisik di laci</p>
          </div>
        </div>

        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Kas yang Diharapkan Sistem</span>
              <span className="text-white font-bold rupiah">{formatRupiah(expectedCash)}</span>
            </div>
            <p className="text-slate-500 text-xs">(Kas awal + Cash In - Cash Out)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Kas Fisik Riil di Laci (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={closingCashRaw}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '')
                setClosingCashRaw(raw ? Number(raw).toLocaleString('id-ID') : '')
              }}
              placeholder="Hitung dan input total uang laci..."
              required
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-lg font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          {discrepancy !== null && (
            <div className={`p-4 rounded-xl border text-sm ${
              discrepancy === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : discrepancy > 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              <div className="flex justify-between font-semibold">
                <span>Selisih Kas:</span>
                <span className="rupiah">
                  {discrepancy > 0 ? `+${formatRupiah(discrepancy)} (Surplus)` :
                   discrepancy < 0 ? `${formatRupiah(discrepancy)} (Defisit)` :
                   'Sesuai 100%'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
            >
              {loading ? 'Memproses...' : 'Tutup Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
