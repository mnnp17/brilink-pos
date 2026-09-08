import { FinancialReportSummary, AIStrategicAdvice } from '../types/report';
import { formatRupiah } from '@/lib/utils/format';

export function shareToWhatsApp(summary: FinancialReportSummary, aiAdvice: AIStrategicAdvice) {
  const opexFormatted = formatRupiah(summary.totalOpex);
  const grossProfitFormatted = formatRupiah(summary.grossProfit);
  const grossVolumeFormatted = formatRupiah(summary.grossVolume);
  const netProfitRealFormatted = formatRupiah(summary.netProfitReal);
  const targetPct = summary.targetAchievementPct.toFixed(0);

  const message = `*📊 LAPORAN KINERJA AGEN BRILINK - ${summary.periodLabel.toUpperCase()}*
----------------------------------------
• Total Omset      : ${grossVolumeFormatted}
• Gross Profit     : ${grossProfitFormatted}
• Total OPEX       : ${opexFormatted}
• *NET PROFIT RIIL : ${netProfitRealFormatted}* (Target: ${targetPct}%)

🤖 *Catatan AI Co-Pilot:*
${aiAdvice.executiveSummary.map(text => `- ${text}`).join('\n')}
${aiAdvice.strategicRecommendations.map(text => `- ${text}`).join('\n')}`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
