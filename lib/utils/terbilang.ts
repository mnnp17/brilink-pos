/**
 * Utility to convert numeric values to Indonesian word numbers (Terbilang)
 * Example: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */

const ANGKA = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function penyebut(nilai: number): string {
  nilai = Math.floor(Math.abs(nilai));
  if (nilai < 12) {
    return ' ' + ANGKA[nilai];
  } else if (nilai < 20) {
    return penyebut(nilai - 10) + ' Sebelas';
  } else if (nilai < 100) {
    return penyebut(Math.floor(nilai / 10)) + ' Puluh' + penyebut(nilai % 10);
  } else if (nilai < 200) {
    return ' Seratus' + penyebut(nilai - 100);
  } else if (nilai < 1000) {
    return penyebut(Math.floor(nilai / 100)) + ' Ratus' + penyebut(nilai % 100);
  } else if (nilai < 2000) {
    return ' Seribu' + penyebut(nilai - 1000);
  } else if (nilai < 1000000) {
    return penyebut(Math.floor(nilai / 1000)) + ' Ribu' + penyebut(nilai % 1000);
  } else if (nilai < 1000000000) {
    return penyebut(Math.floor(nilai / 1000000)) + ' Juta' + penyebut(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    return penyebut(Math.floor(nilai / 1000000000)) + ' Milyar' + penyebut(nilai % 1000000000);
  } else if (nilai < 1000000000000000) {
    return penyebut(Math.floor(nilai / 1000000000000)) + ' Triliun' + penyebut(nilai % 1000000000000);
  }
  return '';
}

export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal <= 0) return '';
  const hasil = penyebut(nominal).trim();
  if (!hasil) return '';
  return hasil.replace(/\s+/g, ' ') + ' Rupiah';
}

export function formatRupiah(nominal: number): string {
  if (isNaN(nominal)) return 'Rp 0';
  return 'Rp ' + nominal.toLocaleString('id-ID');
}
