'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LogOut, Lock } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useOpenShift } from './hooks/useOpenShift';
import { ShiftMetadataHeader } from './components/ShiftMetadataHeader';
import { PreviousShiftBanner } from './components/PreviousShiftBanner';
import { StartingCashForm } from './components/StartingCashForm';
import { DenominationModal } from './components/DenominationModal';
import { getPreviousShiftInfo, openShift } from '@/lib/actions/shift.actions';
import type { PreviousShiftInfo } from '@/types/shift';

export function OpenShiftModal() {
  const { profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [previousShift, setPreviousShift] = useState<PreviousShiftInfo | null>(null);
  const [loadingPrevious, setLoadingPrevious] = useState<boolean>(true);
  const [isDenomModalOpen, setIsDenomModalOpen] = useState<boolean>(false);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

  useEffect(() => {
    async function fetchPrevious() {
      try {
        const result = await getPreviousShiftInfo();
        if (result.success && result.data) {
          setPreviousShift(result.data);
        }
      } catch (err) {
        console.error('Gagal mengambil data shift sebelumnya:', err);
      } finally {
        setLoadingPrevious(false);
      }
    }
    fetchPrevious();
  }, []);

  const {
    startingCash,
    setStartingCash,
    denominations,
    notes,
    setNotes,
    isAutoFilled,
    setIsAutoFilled,
    inputHighlight,
    handleCopyPrevious,
    handleApplyDenominations,
  } = useOpenShift(previousShift);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startingCash < 0) {
      toast.error('Nominal kas awal tidak boleh kurang dari Rp 0!');
      return;
    }

    setLoadingSubmit(true);
    try {
      const result = await openShift(startingCash);
      if (!result.success) {
        toast.error('Gagal membuka shift baru', { description: result.error });
        return;
      }


      toast.success('Shift berhasil dibuka!', { description: 'Selamat bertugas!' });
      
      // Invalidate active shift queries
      queryClient.invalidateQueries({ queryKey: ['shift'] });
    } catch (err) {
      toast.error('Terjadi kesalahan saat membuka shift.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex justify-center p-4">
      {/* Modal Box */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 flex flex-col overflow-hidden animate-fade-in my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#FF6600]" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Pembukaan Kasir</h2>
              <p className="text-[11px] text-slate-400">Verifikasi saldo awal laci kerja</p>
            </div>
          </div>

          {/* Escape Hatch Logout Button */}
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-[11px] font-bold rounded-xl border border-rose-200/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar / Logout
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Metadata Header */}
          <ShiftMetadataHeader
            cashierName={profile?.full_name || 'Kasir Default'}
            cashierRole={profile?.role || 'KASIR'}
          />

          {/* Previous Shift Banner */}
          {loadingPrevious ? (
            <div className="h-16 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl animate-pulse">
              <span className="text-xs text-slate-400 font-medium">Memuat info sisa kas kemarin...</span>
            </div>
          ) : (
            <PreviousShiftBanner
              info={previousShift}
              isAutoFilled={isAutoFilled}
              onCopy={handleCopyPrevious}
            />
          )}

          {/* Main Starting Cash Form */}
          <StartingCashForm
            startingCash={startingCash}
            setStartingCash={setStartingCash}
            notes={notes}
            setNotes={setNotes}
            isAutoFilled={isAutoFilled}
            setIsAutoFilled={setIsAutoFilled}
            inputHighlight={inputHighlight}
            onTriggerDenomination={() => setIsDenomModalOpen(true)}
            onSubmit={handleSubmit}
            loading={loadingSubmit}
          />
        </div>

      </div>

      {/* Nested Calculator Modal */}
      <DenominationModal
        isOpen={isDenomModalOpen}
        onClose={() => setIsDenomModalOpen(false)}
        onApply={handleApplyDenominations}
        initialBreakdown={denominations}
      />
    </div>
  );
}
