'use server';

import { getSupabaseClient, getCurrentUserContext } from '@/lib/supabase/action-auth';

export interface AIChatResult {
  success: boolean;
  reply: string;
  isMockFallback?: boolean;
  error?: string;
}

export async function askAIBusinessCopilotAction(userQuery: string): Promise<AIChatResult> {
  try {
    const supabase = await getSupabaseClient();
    const { outletId } = await getCurrentUserContext();

    // 1. Fetch Real-time Accounts / Liquidity
    let accountsData: any[] = [];
    if (outletId) {
      const { data: accs } = await supabase
        .from('accounts')
        .select('*')
        .eq('outlet_id', outletId)
        .eq('is_deleted', false);
      accountsData = accs || [];
    }

    const totalCash = accountsData
      .filter((a) => a.type === 'CASH_DRAWER')
      .reduce((sum, a) => sum + Number(a.balance || 0), 0);

    const totalDigital = accountsData
      .filter((a) => a.type !== 'CASH_DRAWER')
      .reduce((sum, a) => sum + Number(a.balance || 0), 0);

    const lowBalanceAccounts = accountsData
      .filter((a) => Number(a.balance || 0) < Number(a.min_threshold || 3000000))
      .map((a) => `${a.name} (Rp ${Number(a.balance || 0).toLocaleString('id-ID')})`);

    // 2. Fetch Today's Real Transactions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let todayTxs: any[] = [];
    if (outletId) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('outlet_id', outletId)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());
      todayTxs = txs || [];
    }

    const grossVolumeToday = todayTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalAdminFees = todayTxs.reduce((sum, t) => sum + Number(t.admin_fee || 0), 0);
    const totalBankFees = todayTxs.reduce((sum, t) => sum + Number(t.bank_fee || 0), 0);
    const netProfitToday = todayTxs.reduce((sum, t) => {
      const profit = t.net_profit !== undefined ? Number(t.net_profit) : Number(t.admin_fee || 0) - Number(t.bank_fee || 0);
      return sum + profit;
    }, 0);

    // 3. Fetch Shift & Anomalies Status
    let activeShifts: any[] = [];
    if (outletId) {
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*, users:user_id(name)')
        .eq('outlet_id', outletId)
        .eq('status', 'OPEN');
      activeShifts = shifts || [];
    }

    const accountsSummaryStr = accountsData
      .map((a) => `- ${a.name} (${a.type}): Rp ${Number(a.balance || 0).toLocaleString('id-ID')}`)
      .join('\n');

    // 4. Construct Business Context Prompt
    const systemContextPrompt = `
Anda adalah "AI Business Co-Pilot" cerdas untuk outlet Agen BRILink Gemilang POS.
Tugas Anda adalah memberikan jawaban ringkas, solutif, tepat, dan profesional berbasis data bisnis real-time outlet.

[DATA STATISTIK REAL-TIME OUTLET]
- Total Kas Fisik di Laci: Rp ${totalCash.toLocaleString('id-ID')}
- Total Likuiditas Digital (Bank/EDC): Rp ${totalDigital.toLocaleString('id-ID')}
- Volume Transaksi Hari Ini: Rp ${grossVolumeToday.toLocaleString('id-ID')} (${todayTxs.length} transaksi)
- Laba Bersih Hari Ini: Rp ${netProfitToday.toLocaleString('id-ID')}
- Total Biaya Admin Pelanggan: Rp ${totalAdminFees.toLocaleString('id-ID')}
- Total Biaya Bank (COGS): Rp ${totalBankFees.toLocaleString('id-ID')}
- Rekening Bersaldo Rendah (< Ambang Batas): ${lowBalanceAccounts.length > 0 ? lowBalanceAccounts.join(', ') : 'Tidak ada'}
- Shift Kasir Aktif: ${activeShifts.length > 0 ? activeShifts.map((s) => `${s.users?.name || 'Kasir'} (Shift ID: ${s.id.slice(0, 8)})`).join(', ') : 'Tidak ada shift aktif'}

[RINCIAN AKUN REKENING & EDC]
${accountsSummaryStr || 'Belum ada data rekening'}

[PERTANYAAN USER]
"${userQuery}"

Aturan Format Jawaban:
1. Gunakan Bahasa Indonesia yang sopan, ramah, solutif, dan profesional.
2. Manfaatkan angka data statistik di atas untuk memperkuat analisis Anda.
3. Susun jawaban secara rapi, terstruktur, dan nyaman dibaca (gunakan judul bagian yang jelas, poin bernomor/bullet yang ringkas, dan sorot angka penting dengan cetak tebal).
4. Berikan rekomendasi langkah praktis yang dapat langsung dieksekusi owner/kasir.
`;

    // 5. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      // Smart Fallback Response with live data if API key is not configured yet
      let fallbackText = `ℹ️ *[Mode Akses Data Live]* Gemini API Key belum dikonfigurasi di file \`.env.local\`. Berikut rangkuman analisis otomatis berdasarkan data real-time database toko Anda:\n\n`;

      const queryLower = userQuery.toLowerCase();
      if (queryLower.includes('laba') || queryLower.includes('untung') || queryLower.includes('profit')) {
        fallbackText += `📊 **Ringkasan Profitabilitas Hari Ini:**\n- **Laba Bersih:** Rp ${netProfitToday.toLocaleString('id-ID')}\n- **Pendapatan Biaya Admin:** Rp ${totalAdminFees.toLocaleString('id-ID')}\n- **Beban Bank (COGS):** Rp ${totalBankFees.toLocaleString('id-ID')}\n- **Total Transaksi:** ${todayTxs.length} transaksi\n\n*Saran:* Terus tingkatkan volume transaksi pada jenis layanan dengan marjin tinggi!`;
      } else if (queryLower.includes('kas') || queryLower.includes('saldo') || queryLower.includes('rebalance')) {
        fallbackText += `💰 **Analisis Likuiditas & Perputaran Kas:**\n- **Kas Fisik Laci:** Rp ${totalCash.toLocaleString('id-ID')}\n- **Likuiditas Bank/EDC:** Rp ${totalDigital.toLocaleString('id-ID')}\n- **Rekening Berisiko Rendah:** ${lowBalanceAccounts.length > 0 ? lowBalanceAccounts.join(', ') : 'Semua rekening dalam kondisi aman'}\n\n*Saran Rebalance:* Pastikan saldo EDC Bank selalu berada di atas Rp 3.000.000 untuk mencegah gagal transaksi penarikan.`;
      } else if (queryLower.includes('shift') || queryLower.includes('kasir')) {
        fallbackText += `👷 **Status Shift Operasional:**\n- **Shift Aktif:** ${activeShifts.length} kasir bertugas saat ini.\n- **Volume Transaksi Hari Ini:** Rp ${grossVolumeToday.toLocaleString('id-ID')}\n\nSemua catatan mutasi berjalan lancar.`;
      } else {
        fallbackText += `📈 **Ringkasan Kesehatan Toko Hari Ini:**\n- **Volume Omset Gross:** Rp ${grossVolumeToday.toLocaleString('id-ID')}\n- **Laba Bersih:** Rp ${netProfitToday.toLocaleString('id-ID')}\n- **Kas Fisik:** Rp ${totalCash.toLocaleString('id-ID')}\n- **Likuiditas Digital:** Rp ${totalDigital.toLocaleString('id-ID')}\n\nAnda dapat menambahkan \`GEMINI_API_KEY\` di \`.env.local\` untuk mengaktifkan penuh kecerdasan buatan Google Gemini.`;
      }

      return {
        success: true,
        reply: fallbackText,
        isMockFallback: true,
      };
    }

    // Try candidate models sequentially until one succeeds
    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest'
    ];

    let lastErrorMessage = '';
    for (const modelName of candidateModels) {
      try {
        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemContextPrompt }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return {
              success: true,
              reply,
              isMockFallback: false,
            };
          }
        } else {
          const errJson = await res.json().catch(() => ({}));
          lastErrorMessage = errJson.error?.message || `HTTP ${res.status}`;
        }
      } catch (err: any) {
        lastErrorMessage = err.message || 'Connection error';
      }
    }

    throw new Error(lastErrorMessage || 'Model Gemini API tidak ditemukan atau gagal diproses.');
  } catch (error: any) {
    console.error('Error in askAIBusinessCopilotAction:', error);
    return {
      success: false,
      reply: `Terjadi kendala saat menghubungi AI Engine: ${error.message || 'Kesalahan koneksi'}`,
      error: error.message,
    };
  }
}
