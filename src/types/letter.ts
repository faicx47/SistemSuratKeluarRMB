export type LetterCategoryCode =
  | 'UND'
  | 'PHBI'
  | 'PMH'
  | 'PJM'
  | 'ST'
  | 'ED'
  | 'PBM'
  | 'SK'
  | 'IM'
  | 'KST';

export interface LetterCategory {
  code: LetterCategoryCode;
  label: string;
  description: string;
}

export const LETTER_CATEGORIES: LetterCategory[] = [
  { code: 'UND', label: 'Undangan Resmi', description: 'Rapat pengurus, silaturahmi, kajian akbar, musyawarah' },
  { code: 'PHBI', label: 'Kegiatan PHBI', description: 'Peringatan Isra Miraj, Maulid Nabi, Idul Fitri/Adha, Muharram' },
  { code: 'PMH', label: 'Permohonan Dana & Bantuan', description: 'Sponsor kegiatan, permohonan donasi, bantuan logistik' },
  { code: 'PJM', label: 'Peminjaman Sarana & Aula', description: 'Peminjaman aula serbaguna masjid, sound system, proyektor' },
  { code: 'ST', label: 'Surat Tugas Panitia', description: 'Penugasan kepanitiaan, delegasi kegiatan eksternal' },
  { code: 'ED', label: 'Surat Edaran', description: 'Pemberitahuan kepada seluruh anggota atau jamaah pemuda' },
  { code: 'PBM', label: 'Pemberitahuan Kegiatan', description: 'Pemberitahuan kegiatan ke Pengurus Yayasan, RT/RW Mekarjaya' },
  { code: 'SK', label: 'Surat Keputusan', description: 'Pengesahan struktur panitia, pelantikan divisi' },
  { code: 'IM', label: 'Internal Memo', description: 'Nota dinas, instruksi internal, koordinasi pengurus & divisi REMASBARA' },
  { code: 'KST', label: 'Kustom / Umum', description: 'Klasifikasi surat keluar khusus lainnya' },
];

export interface OrganizationProfile {
  name: string;
  subName: string;
  mosqueName: string;
  address: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  instagram: string;
  codeIdentifier: string; // "RMB"
  logoUrl?: string; // Optional custom logo image URL or base64 data URL
  defaultStampUrl?: string; // Optional custom uploaded stamp for Remasbara
  defaultKemasjidanStampUrl?: string; // Optional custom uploaded stamp for Kemasjidan
  defaultYayasanStampUrl?: string; // Optional custom uploaded stamp for Yayasan
}

export interface Signatory {
  role: string;
  name: string;
  idNumber?: string;
  signatureDataUrl?: string;
  includeSignature: boolean;
}

export interface StampConfig {
  enabled: boolean;
  color: 'emerald' | 'blue' | 'purple' | 'red';
  opacity: number;
  customStampUrl?: string; // Data URL / base64 image for uploaded custom stamp sample
}

export interface LetterDocument {
  id: string;
  letterNumber: string;
  isCustomNumber: boolean;
  sequenceNumber: number;
  categoryCode: LetterCategoryCode;
  romanMonth: string;
  year: number;
  
  city: string;
  dateMasehi: string; // e.g. "2026-10-08"
  dateFormattedMasehi: string; // e.g. "8 Oktober 2026"
  dateHijri: string; // e.g. "26 Rabiul Akhir 1448 H"
  
  attachment: string; // e.g. "-" or "1 Berkas Proposal"
  subject: string; // Hal / Perihal
  
  recipientName: string; // e.g. "Bapak Ketua RW 07 Mekarjaya"
  recipientInstitution: string; // e.g. "di - Tempat" atau alamat
  
  openingGreeting: string; // e.g. "Assalamu'alaikum Warahmatullahi Wabarakatuh"
  openingParagraph: string;
  
  eventDetails?: {
    enabled: boolean;
    dayDate: string;
    time: string;
    location: string;
    agenda: string;
    dressCode?: string;
  };
  
  contentParagraphs: string[];
  closingParagraph: string;
  closingGreeting: string;
  
  signatories: {
    firstSignatory: Signatory; // Ketua Umum Remasbara
    secondSignatory: Signatory; // Sekretaris Umum Remasbara
    kemasjidanSignatory?: Signatory & { enabled: boolean }; // 1. Ketua Bidang Kemasjidan Nursyamsu Hidayat
    yayasanSignatory?: Signatory & { enabled: boolean }; // 2. Ketua Yayasan Masjid Baiturrahman H. Arifin Lambaga
    advisorSignatory?: Signatory & { enabled: boolean }; // kompatibilitas
  };
  
  stamp: StampConfig; // Stempel Resmi Remasbara (sebelah kiri Ketua Umum)
  kemasjidanStamp?: StampConfig; // Stempel Resmi Bidang Kemasjidan (sebelah kiri Ketua Bidang Kemasjidan)
  yayasanStamp?: StampConfig; // Stempel Resmi Yayasan (sebelah kiri Ketua Yayasan)
  
  verification: {
    enabled: boolean;
    verificationCode: string;
    verifiedAt: string;
  };
  
  copies: string[]; // Tembusan (e.g. ["Ketua Yayasan Masjid Baiturrahman", "Arsip"])
  status: 'draft' | 'disetujui' | 'terkirim' | 'diarsipkan';
  
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface SavedSignature {
  id: string;
  title: string;
  role: string;
  name: string;
  idNumber: string;
  dataUrl: string;
  updatedAt: string;
}

export interface SavedStamp {
  id: string;
  category: 'remasbara' | 'kemasjidan' | 'yayasan' | 'custom';
  title: string;
  organization: string;
  color: 'emerald' | 'blue' | 'purple' | 'red';
  opacity: number;
  imageUrl?: string;
  updatedAt: string;
}
