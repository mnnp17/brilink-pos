import { NextResponse } from 'next/server';
import { AITransactionAuditResponse } from '@/types/owner-transaction';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cashierId, marginStatus, timePreset } = body;

    // Simulate 1.2 second network and AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Dynamic, realistic AI Auditor responses based on filter states
    let summaryPoints = [
      'Volume transaksi didominasi oleh penarikan tunai lewat EDC BRI Utama (55% dari total volume).',
      'Rata-rata margin bersih per transaksi bertahan di angka Rp 3.450, naik 4% dibanding minggu lalu.',
    ];
    let anomaliesFound = false;
    let anomalyDetails: string[] = [];
    let efficiencyTip = 'Hemat Rp 120.000/minggu dengan mengalihkan transaksi transfer bank lain di atas Rp 5 Juta dari EDC Utama ke Rekening Mandiri 02 (selisih COGS Rp 2.500 per transaksi).';

    if (marginStatus === 'ANOMALY') {
      anomaliesFound = true;
      summaryPoints.unshift('Terdeteksi 1 anomali serius: transaksi dengan margin bersih negatif (laba minus).');
      anomalyDetails = [
        'ID txn-005 (Transfer Bank Lain): Margin Rp -1.500 akibat pemberian diskon admin manual oleh kasir Astri tanpa persetujuan Owner.',
      ];
      efficiencyTip = 'Penting: Nonaktifkan fitur edit nominal admin manual pada POS Kasir atau aktifkan PIN Owner approval untuk pemberian diskon.';
    } else if (cashierId === 'Astri') {
      anomaliesFound = true;
      summaryPoints.unshift('Deteksi Audit Kasir: Astri memiliki riwayat selisih kas fisik minus Rp 500.000 pada shift aktif kemarin.');
      anomalyDetails = [
        'Penyesuaian kasir Astri di Pasar Induk mencatat variansi kas fisik. Disarankan melakukan audit rekonsiliasi mutasi bank digital vs laporan shift.',
      ];
      efficiencyTip = 'Lakukan pencocokan berkala setiap 3 jam untuk shift kasir di lokasi ramai seperti Pasar Induk.';
    } else if (timePreset === 'ACTIVE_SHIFT') {
      summaryPoints = [
        'Shift Kasir Aktif berjalan lancar tanpa selisih transaksi berjalan.',
        'Volume transaksi saat ini mencapai Rp 14.500.000 dengan margin berjalan rata-rata Rp 4.200 per transaksi.',
      ];
      efficiencyTip = 'Ingatkan kasir untuk melakukan setor tunai laci (Cash Drop) ke brankas jika kas fisik telah melebihi Rp 15 Juta.';
    }

    const responsePayload: AITransactionAuditResponse = {
      summaryPoints,
      anomaliesFound,
      anomalyDetails: anomaliesFound ? anomalyDetails : undefined,
      efficiencyTip,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal melakukan pemrosesan audit transaksi' },
      { status: 500 }
    );
  }
}
