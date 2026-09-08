'use client';

import React, { useState } from 'react';

export interface ThermalReceiptData {
  transactionId: string;
  type: string;
  amount: number;
  adminFee: number;
  accountName: string;
  date: string;
  outletName: string;
}

interface ThermalPrinterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData?: ThermalReceiptData;
}

export function ThermalPrinterSheet({
  isOpen,
  onClose,
  receiptData = {
    transactionId: 'TX-20260812-9982',
    type: 'SETOR_TUNAI',
    amount: 1500000,
    adminFee: 5000,
    accountName: 'BRI EDC Master 01',
    date: new Date().toLocaleString('id-ID'),
    outletName: 'Agen BRILink Toko Berkah',
  },
}: ThermalPrinterSheetProps) {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [isConnected, setIsConnected] = useState(true);
  const [printing, setPrinting] = useState(false);

  if (!isOpen) return null;

  const total = receiptData.amount + receiptData.adminFee;

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      setPrinting(false);
      alert('Struk berhasil dicetak!');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#00529C] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🖨️</span> Driver Thermal Printer
            </h2>
            <p className="text-xs text-blue-100">Koneksi Bluetooth / USB & Struk Preview</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold p-1 hover:bg-white/10 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Hardware Connection Bar */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]' : 'bg-red-500'
                }`}
              ></span>
              <span className="font-semibold text-gray-800">
                {isConnected ? 'EPSON TM-T88VI (BT Connected)' : 'Printer Terputus'}
              </span>
            </div>
            <button
              onClick={() => setIsConnected(!isConnected)}
              className="text-blue-600 font-bold hover:underline"
            >
              {isConnected ? 'Putuskan' : 'Hubungkan'}
            </button>
          </div>

          {/* Paper Size Switcher */}
          <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-3">
            <span className="font-semibold text-gray-600">Ukuran Kertas Struk:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  paperWidth === '58mm' ? 'bg-white shadow text-[#00529C]' : 'text-gray-500'
                }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  paperWidth === '80mm' ? 'bg-white shadow text-[#00529C]' : 'text-gray-500'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          {/* Thermal Receipt Preview Paper */}
          <div className="flex justify-center my-2">
            <div
              className={`bg-amber-50/50 border border-gray-300 p-4 font-mono text-[11px] leading-tight text-gray-800 shadow-inner rounded-sm ${
                paperWidth === '58mm' ? 'w-64' : 'w-80'
              }`}
            >
              <div className="text-center space-y-1 mb-3">
                <p className="font-extrabold text-xs uppercase">{receiptData.outletName}</p>
                <p className="text-[10px] text-gray-500">AGEN BRILINK RESMI BANK BRI</p>
                <p className="text-[9px] border-b border-dashed border-gray-400 pb-2 text-gray-500">
                  {receiptData.date}
                </p>
              </div>

              <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>ID Tx:</span>
                  <span className="font-bold">{receiptData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jenis Tx:</span>
                  <span className="font-bold">{receiptData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>EDC/Bank:</span>
                  <span>{receiptData.accountName}</span>
                </div>
              </div>

              <div className="space-y-1 my-2 border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between">
                  <span>Nominal:</span>
                  <span>Rp {receiptData.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin:</span>
                  <span>Rp {receiptData.adminFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xs pt-1">
                  <span>TOTAL:</span>
                  <span>Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center mt-3 space-y-1 text-[9px] text-gray-500">
                <p>--- TERIMA KASIH ---</p>
                <p>Simpan struk ini sebagai bukti transaksi resmi Agen BRILink</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              disabled={!isConnected || printing}
              className="flex-1 bg-[#FF6600] hover:bg-[#E55C00] text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {printing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Mencetak...</span>
                </>
              ) : (
                <>
                  <span>🖨️</span> Cetak Struk Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
