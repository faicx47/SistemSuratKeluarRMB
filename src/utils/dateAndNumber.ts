import { LetterCategoryCode, OrganizationProfile } from '../types/letter';

export const DEFAULT_ORG_PROFILE: OrganizationProfile = {
  name: 'REMAJA MASJID BAITURRAHMAN',
  subName: 'CIKUMPA MEKARJAYA SUKMAJAYA KOTA DEPOK',
  mosqueName: 'Masjid Baiturrahman Mekarjaya',
  address: 'Jl. Tole Iskandar KM 3, RT 02 / RW 07',
  kelurahan: 'Kelurahan Mekarjaya',
  kecamatan: 'Kecamatan Sukmajaya',
  city: 'Kota Depok',
  province: 'Jawa Barat',
  postalCode: '16411',
  phone: '0896-4333-1415',
  email: 'remasbaraofficial@gmail.com',
  instagram: '',
  codeIdentifier: 'RMB',
};

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir', 'Jumadil Ula', 'Jumadil Akhir',
  'Rajab', 'Sya\'ban', 'Ramadhan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
];

export function getRomanMonth(date: Date = new Date()): string {
  const monthIndex = date.getMonth();
  return ROMAN_MONTHS[monthIndex] || 'I';
}

export function formatIndonesianDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const day = date.getDate();
  const month = INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Approximate Hijri date converter for formal Islamic letter headings
 */
export function getApproximateHijriDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  // Standard civil calendar astronomical estimation
  const jd = Math.floor((date.getTime() / 86400000) + 2440587.5);
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238));
  const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  const hijriMonthName = HIJRI_MONTHS[Math.max(0, Math.min(11, m - 1))] || 'Rabiul Akhir';
  return `${Math.max(1, Math.min(30, d))} ${hijriMonthName} ${y} H`;
}

/**
 * Format auto sequence number e.g. 1 -> "001", 12 -> "012", 123 -> "123"
 */
export function formatSequenceNumber(num: number): string {
  return String(num).padStart(3, '0');
}

/**
 * Builds official outgoing letter number
 * Format: 001/UND/REMASBARA-MBR/X/2026
 */
export function generateLetterNumber(
  sequenceNumber: number,
  categoryCode: LetterCategoryCode,
  romanMonth: string,
  year: number,
  codeIdentifier: string = DEFAULT_ORG_PROFILE.codeIdentifier
): string {
  const formattedSeq = formatSequenceNumber(sequenceNumber);
  return `${formattedSeq}/${categoryCode}/${codeIdentifier}/${romanMonth}/${year}`;
}

/**
 * Parse an existing auto-generated letter number back to parts if matches pattern
 */
export function parseLetterNumber(letterNumber: string): {
  isStandard: boolean;
  seq?: number;
  categoryCode?: string;
  codeIdentifier?: string;
  romanMonth?: string;
  year?: number;
} {
  const parts = letterNumber.split('/');
  if (parts.length === 5) {
    const seq = parseInt(parts[0], 10);
    const categoryCode = parts[1];
    const codeIdentifier = parts[2];
    const romanMonth = parts[3];
    const year = parseInt(parts[4], 10);

    if (!isNaN(seq) && !isNaN(year)) {
      return { isStandard: true, seq, categoryCode, codeIdentifier, romanMonth, year };
    }
  }
  return { isStandard: false };
}

export function generateVerificationCode(letterNumber: string): string {
  const clean = letterNumber.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const time = Date.now().toString(36).substring(4).toUpperCase();
  return `VERIF-RMB-${clean}-${random}${time}`.toUpperCase();
}
