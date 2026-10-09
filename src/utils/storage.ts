import { LetterDocument, OrganizationProfile, SavedSignature, SavedStamp } from '../types/letter';
import {
  DEFAULT_ORG_PROFILE,
  formatIndonesianDate,
  generateLetterNumber,
  generateVerificationCode,
  getApproximateHijriDate,
  getRomanMonth,
} from './dateAndNumber';
import { LETTER_TEMPLATES } from './templates';

const STORAGE_KEYS = {
  LETTERS: 'remasbara_letters_v1',
  ORG_PROFILE: 'remasbara_org_profile_v1',
  SIGNATURES: 'remasbara_signatures_v1',
  STAMPS: 'remasbara_stamps_v1',
  COUNTER: 'remasbara_sequence_counter_v1',
};

// Clean SVG default signature curves for immediate visual excellence
export const DEFAULT_CHAIRMAN_SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
    <path d="M 30,65 Q 45,15 70,30 T 95,70 Q 115,20 135,45 T 160,55 Q 185,25 210,65" stroke="#1e293b" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 50,72 Q 110,62 195,68" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round" />
    <path d="M 125,35 L 140,75" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
  </svg>
`);

export const DEFAULT_SECRETARY_SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
    <path d="M 35,45 Q 60,10 75,50 T 110,65 Q 130,15 150,55 T 180,60 Q 200,35 215,50" stroke="#1e293b" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 40,68 C 90,62 160,65 205,62" stroke="#1e293b" stroke-width="1.8" fill="none" stroke-linecap="round" />
  </svg>
`);

export const DEFAULT_KEMASJIDAN_SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
    <path d="M 35,55 C 50,15 80,20 85,65 C 95,25 125,30 140,55 Q 165,15 195,50" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 55,68 L 175,66" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
    <circle cx="185" cy="62" r="2.5" fill="#1e293b" />
  </svg>
`);

export const DEFAULT_YAYASAN_SIGNATURE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
    <path d="M 30,55 Q 50,15 75,40 T 110,65 Q 130,20 160,35 T 200,60" stroke="#1e293b" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 45,72 C 100,64 165,65 210,68" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round" />
    <path d="M 140,30 L 155,70" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />
  </svg>
`);

export const DEFAULT_ADVISOR_SIGNATURE = DEFAULT_YAYASAN_SIGNATURE;

export const INITIAL_SAVED_SIGNATURES: SavedSignature[] = [
  {
    id: 'sig-ketua-umum',
    title: 'Tanda Tangan Ketua Remaja',
    role: 'Ketua Umum Remasbara',
    name: 'Muhammad Faizal Addib',
    idNumber: 'NTA: 2024.01.001',
    dataUrl: DEFAULT_CHAIRMAN_SIGNATURE,
    updatedAt: '2026-10-01',
  },
  {
    id: 'sig-sekretaris-umum',
    title: 'Tanda Tangan Sekretaris',
    role: 'Sekretaris Umum Remasbara',
    name: 'Muhammad Akbar Izzati',
    idNumber: 'NTA: 2024.01.018',
    dataUrl: DEFAULT_SECRETARY_SIGNATURE,
    updatedAt: '2026-10-01',
  },
  {
    id: 'sig-kemasjidan',
    title: 'Ketua Bidang Kemasjidan',
    role: 'Ketua Bidang Kemasjidan',
    name: 'Nursyamsu Hidayat',
    idNumber: 'YAS.MBR/KM/01',
    dataUrl: DEFAULT_KEMASJIDAN_SIGNATURE,
    updatedAt: '2026-10-01',
  },
  {
    id: 'sig-ketua-yayasan',
    title: 'Ketua Yayasan',
    role: 'Ketua Yayasan Masjid Baiturrahman',
    name: 'H. Arifin Lambaga',
    idNumber: 'YAS.MBR/01/2022',
    dataUrl: DEFAULT_YAYASAN_SIGNATURE,
    updatedAt: '2026-10-01',
  },
];

export function getInitialSeedLetters(): LetterDocument[] {
  const tpl1 = LETTER_TEMPLATES[0]; // Undangan
  const tpl2 = LETTER_TEMPLATES[1]; // Permohonan Dana
  const tpl3 = LETTER_TEMPLATES[2]; // Peminjaman Aula

  const doc1: LetterDocument = {
    id: 'doc-remasbara-001',
    letterNumber: '001/UND/RMB/X/2026',
    isCustomNumber: false,
    sequenceNumber: 1,
    categoryCode: 'UND',
    romanMonth: 'X',
    year: 2026,
    city: 'Depok',
    dateMasehi: '2026-10-05',
    dateFormattedMasehi: '5 Oktober 2026',
    dateHijri: '23 Rabiul Akhir 1448 H',
    attachment: '-',
    subject: tpl1.subject,
    recipientName: tpl1.recipientName,
    recipientInstitution: tpl1.recipientInstitution,
    openingGreeting: tpl1.openingGreeting,
    openingParagraph: tpl1.openingParagraph,
    eventDetails: tpl1.eventDetails,
    contentParagraphs: tpl1.contentParagraphs,
    closingParagraph: tpl1.closingParagraph,
    closingGreeting: tpl1.closingGreeting,
    signatories: {
      firstSignatory: {
        role: 'Ketua Umum',
        name: 'Muhammad Faizal Addib',
        idNumber: 'NTA: 2024.01.001',
        includeSignature: true,
        signatureDataUrl: DEFAULT_CHAIRMAN_SIGNATURE,
      },
      secondSignatory: {
        role: 'Sekretaris Umum',
        name: 'Muhammad Akbar Izzati',
        idNumber: 'NTA: 2024.01.018',
        includeSignature: true,
        signatureDataUrl: DEFAULT_SECRETARY_SIGNATURE,
      },
      kemasjidanSignatory: {
        enabled: true,
        role: 'Ketua Bidang Kemasjidan',
        name: 'Nursyamsu Hidayat',
        idNumber: 'YAS.MBR/KM/01',
        includeSignature: true,
        signatureDataUrl: DEFAULT_KEMASJIDAN_SIGNATURE,
      },
      yayasanSignatory: {
        enabled: true,
        role: 'Ketua Yayasan Masjid Baiturrahman',
        name: 'H. Arifin Lambaga',
        idNumber: 'YAS.MBR/01/2022',
        includeSignature: true,
        signatureDataUrl: DEFAULT_YAYASAN_SIGNATURE,
      },
    },
    stamp: {
      enabled: true,
      color: 'emerald',
      opacity: 0.92,
    },
    verification: {
      enabled: true,
      verificationCode: 'VERIF-RMB-001UND-A82K',
      verifiedAt: '2026-10-05T08:30:00Z',
    },
    copies: tpl1.copies,
    status: 'terkirim',
    createdAt: '2026-10-05T08:30:00Z',
    updatedAt: '2026-10-05T08:30:00Z',
    notes: 'Surat telah dikirim via WA Grup dan cetak fisik ke mading masjid.',
  };

  const doc2: LetterDocument = {
    id: 'doc-remasbara-002',
    letterNumber: '002/PMH/RMB/X/2026',
    isCustomNumber: false,
    sequenceNumber: 2,
    categoryCode: 'PMH',
    romanMonth: 'X',
    year: 2026,
    city: 'Depok',
    dateMasehi: '2026-10-07',
    dateFormattedMasehi: '7 Oktober 2026',
    dateHijri: '25 Rabiul Akhir 1448 H',
    attachment: '1 Berkas Proposal',
    subject: tpl2.subject,
    recipientName: tpl2.recipientName,
    recipientInstitution: tpl2.recipientInstitution,
    openingGreeting: tpl2.openingGreeting,
    openingParagraph: tpl2.openingParagraph,
    eventDetails: tpl2.eventDetails,
    contentParagraphs: tpl2.contentParagraphs,
    closingParagraph: tpl2.closingParagraph,
    closingGreeting: tpl2.closingGreeting,
    signatories: {
      firstSignatory: {
        role: 'Ketua Umum',
        name: 'Muhammad Faizal Addib',
        idNumber: 'NTA: 2024.01.001',
        includeSignature: true,
        signatureDataUrl: DEFAULT_CHAIRMAN_SIGNATURE,
      },
      secondSignatory: {
        role: 'Sekretaris Umum',
        name: 'Muhammad Akbar Izzati',
        idNumber: 'NTA: 2024.01.018',
        includeSignature: true,
        signatureDataUrl: DEFAULT_SECRETARY_SIGNATURE,
      },
      kemasjidanSignatory: {
        enabled: true,
        role: 'Ketua Bidang Kemasjidan',
        name: 'Nursyamsu Hidayat',
        idNumber: 'YAS.MBR/KM/01',
        includeSignature: true,
        signatureDataUrl: DEFAULT_KEMASJIDAN_SIGNATURE,
      },
      yayasanSignatory: {
        enabled: true,
        role: 'Ketua Yayasan Masjid Baiturrahman',
        name: 'H. Arifin Lambaga',
        idNumber: 'YAS.MBR/01/2022',
        includeSignature: true,
        signatureDataUrl: DEFAULT_YAYASAN_SIGNATURE,
      },
    },
    stamp: {
      enabled: true,
      color: 'emerald',
      opacity: 0.92,
    },
    verification: {
      enabled: true,
      verificationCode: 'VERIF-RMB-002PMH-X79M',
      verifiedAt: '2026-10-07T10:15:00Z',
    },
    copies: tpl2.copies,
    status: 'disetujui',
    createdAt: '2026-10-07T10:15:00Z',
    updatedAt: '2026-10-07T10:15:00Z',
    notes: 'Proposal diserahkan ke 5 donatur jamaah Baiturrahman Sukmajaya.',
  };

  const doc3: LetterDocument = {
    id: 'doc-remasbara-003',
    letterNumber: '003/PJM/RMB/X/2026',
    isCustomNumber: false,
    sequenceNumber: 3,
    categoryCode: 'PJM',
    romanMonth: 'X',
    year: 2026,
    city: 'Depok',
    dateMasehi: '2026-10-08',
    dateFormattedMasehi: '8 Oktober 2026',
    dateHijri: '26 Rabiul Akhir 1448 H',
    attachment: tpl3.attachment,
    subject: tpl3.subject,
    recipientName: tpl3.recipientName,
    recipientInstitution: tpl3.recipientInstitution,
    openingGreeting: tpl3.openingGreeting,
    openingParagraph: tpl3.openingParagraph,
    eventDetails: tpl3.eventDetails,
    contentParagraphs: tpl3.contentParagraphs,
    closingParagraph: tpl3.closingParagraph,
    closingGreeting: tpl3.closingGreeting,
    signatories: {
      firstSignatory: {
        role: 'Ketua Umum',
        name: 'Muhammad Faizal Addib',
        idNumber: 'NTA: 2024.01.001',
        includeSignature: true,
        signatureDataUrl: DEFAULT_CHAIRMAN_SIGNATURE,
      },
      secondSignatory: {
        role: 'Sekretaris Umum',
        name: 'Muhammad Akbar Izzati',
        idNumber: 'NTA: 2024.01.018',
        includeSignature: false,
      },
      kemasjidanSignatory: {
        enabled: true,
        role: 'Ketua Bidang Kemasjidan',
        name: 'Nursyamsu Hidayat',
        idNumber: 'YAS.MBR/KM/01',
        includeSignature: false,
      },
      yayasanSignatory: {
        enabled: true,
        role: 'Ketua Yayasan Masjid Baiturrahman',
        name: 'H. Arifin Lambaga',
        idNumber: 'YAS.MBR/01/2022',
        includeSignature: false,
      },
    },
    stamp: {
      enabled: false,
      color: 'emerald',
      opacity: 0.9,
    },
    verification: {
      enabled: true,
      verificationCode: 'VERIF-RMB-003PJM-9P21',
      verifiedAt: '2026-10-08T09:00:00Z',
    },
    copies: tpl3.copies,
    status: 'draft',
    createdAt: '2026-10-08T09:00:00Z',
    updatedAt: '2026-10-08T09:00:00Z',
    notes: 'Draft menunggu tanda tangan lengkap sekretaris.',
  };

  return [doc3, doc2, doc1];
}

export const StorageService = {
  getLetters(): LetterDocument[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LETTERS);
      if (!raw) {
        const initial = getInitialSeedLetters();
        localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(initial));
        return initial;
      }
      const parsed: LetterDocument[] = JSON.parse(raw);
      // Migrate legacy data
      let hasMigration = false;
      const migrated = parsed.map((doc) => {
        let updatedDoc = { ...doc };
        if (doc.letterNumber && doc.letterNumber.includes('REMASBARA-MBR')) {
          hasMigration = true;
          updatedDoc.letterNumber = doc.letterNumber.replace('REMASBARA-MBR', 'RMB');
        }
        if (updatedDoc.signatories?.firstSignatory?.name?.includes('Fadlan')) {
          hasMigration = true;
          updatedDoc.signatories = {
            ...updatedDoc.signatories,
            firstSignatory: {
              ...updatedDoc.signatories.firstSignatory,
              name: 'Muhammad Faizal Addib',
            },
          };
        }
        if (updatedDoc.signatories?.secondSignatory?.name?.includes('Nurul')) {
          hasMigration = true;
          updatedDoc.signatories = {
            ...updatedDoc.signatories,
            secondSignatory: {
              ...updatedDoc.signatories.secondSignatory,
              name: 'Muhammad Akbar Izzati',
            },
          };
        }
        if (!updatedDoc.kemasjidanStamp) {
          hasMigration = true;
          updatedDoc.kemasjidanStamp = {
            enabled: true,
            color: 'emerald',
            opacity: 0.92,
          };
        }
        if (!updatedDoc.yayasanStamp) {
          hasMigration = true;
          updatedDoc.yayasanStamp = {
            enabled: true,
            color: 'emerald',
            opacity: 0.92,
          };
        }
        return updatedDoc;
      });
      if (hasMigration) {
        localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(migrated));
      }
      return migrated;
    } catch (e) {
      console.error('Failed reading letters from storage:', e);
      return getInitialSeedLetters();
    }
  },

  saveLetter(letter: LetterDocument): void {
    const letters = this.getLetters();
    const index = letters.findIndex((l) => l.id === letter.id);
    if (index >= 0) {
      letters[index] = { ...letter, updatedAt: new Date().toISOString() };
    } else {
      letters.unshift({ ...letter, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  },

  deleteLetter(id: string): void {
    const letters = this.getLetters().filter((l) => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LETTERS, JSON.stringify(letters));
  },

  getNextSequenceNumber(): number {
    const letters = this.getLetters();
    const currentYear = new Date().getFullYear();
    let maxSeq = 0;
    letters.forEach((l) => {
      if (l.year === currentYear && l.sequenceNumber && !isNaN(l.sequenceNumber)) {
        if (l.sequenceNumber > maxSeq) {
          maxSeq = l.sequenceNumber;
        }
      }
    });
    return maxSeq + 1;
  },

  isLetterNumberTaken(letterNumber: string, excludeId?: string): boolean {
    const letters = this.getLetters();
    return letters.some(
      (l) => l.letterNumber.trim().toLowerCase() === letterNumber.trim().toLowerCase() && l.id !== excludeId
    );
  },

  getOrgProfile(): OrganizationProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORG_PROFILE);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.ORG_PROFILE, JSON.stringify(DEFAULT_ORG_PROFILE));
        return DEFAULT_ORG_PROFILE;
      }
      const parsed: OrganizationProfile = JSON.parse(raw);
      let changed = false;
      if (parsed.codeIdentifier === 'REMASBARA-MBR') {
        parsed.codeIdentifier = 'RMB';
        changed = true;
      }
      if (parsed.phone === '0812-9844-3201' || !parsed.phone) {
        parsed.phone = '0896-4333-1415';
        changed = true;
      }
      if (parsed.email === 'remasbara.baiturrahman@gmail.com' || !parsed.email) {
        parsed.email = 'remasbaraofficial@gmail.com';
        changed = true;
      }
      if (parsed.name === 'REMASBARA') {
        parsed.name = 'REMAJA MASJID BAITURRAHMAN';
        changed = true;
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.ORG_PROFILE, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_ORG_PROFILE;
    }
  },

  saveOrgProfile(profile: OrganizationProfile): void {
    localStorage.setItem(STORAGE_KEYS.ORG_PROFILE, JSON.stringify(profile));
  },

  getSignatures(): SavedSignature[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(INITIAL_SAVED_SIGNATURES));
        return INITIAL_SAVED_SIGNATURES;
      }
      const parsed: SavedSignature[] = JSON.parse(raw);
      // Migrate legacy names and ensure Kemasjidan and Yayasan exist
      let changed = false;
      parsed.forEach((s) => {
        if (s.id === 'sig-ketua-umum' && (s.name.includes('Fadlan') || !s.name)) {
          s.name = 'Muhammad Faizal Addib';
          s.title = 'Tanda Tangan Ketua Remaja';
          changed = true;
        }
        if (s.id === 'sig-sekretaris-umum' && (s.name.includes('Nurul') || !s.name)) {
          s.name = 'Muhammad Akbar Izzati';
          s.title = 'Tanda Tangan Sekretaris';
          changed = true;
        }
      });
      const hasKemasjidan = parsed.some((s) => s.id === 'sig-kemasjidan' || s.name.includes('Nursyamsu'));
      const hasYayasan = parsed.some((s) => s.id === 'sig-ketua-yayasan' || s.name.includes('Arifin'));
      if (!hasKemasjidan || !hasYayasan) {
        localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(INITIAL_SAVED_SIGNATURES));
        return INITIAL_SAVED_SIGNATURES;
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return INITIAL_SAVED_SIGNATURES;
    }
  },

  saveSignature(sig: SavedSignature): void {
    const sigs = this.getSignatures();
    const index = sigs.findIndex((s) => s.id === sig.id);
    if (index >= 0) {
      sigs[index] = sig;
    } else {
      sigs.push(sig);
    }
    localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(sigs));
  },

  deleteSignature(id: string): void {
    const sigs = this.getSignatures().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify(sigs));
  },

  getStamps(): SavedStamp[] {
    const data = localStorage.getItem(STORAGE_KEYS.STAMPS);
    if (!data) {
      const org = this.getOrgProfile();
      const initialStamps: SavedStamp[] = [
        {
          id: 'stamp-remasbara',
          category: 'remasbara',
          title: 'Stempel Resmi REMASBARA',
          organization: 'Remaja Masjid Baiturrahman',
          color: 'red',
          opacity: 0.92,
          imageUrl: org.defaultStampUrl,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'stamp-kemasjidan',
          category: 'kemasjidan',
          title: 'Stempel Bidang Kemasjidan',
          organization: 'Bidang Kemasjidan Masjid Baiturrahman',
          color: 'emerald',
          opacity: 0.92,
          imageUrl: org.defaultKemasjidanStampUrl,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'stamp-yayasan',
          category: 'yayasan',
          title: 'Stempel Resmi Yayasan',
          organization: 'Yayasan Masjid Baiturrahman',
          color: 'emerald',
          opacity: 0.92,
          imageUrl: org.defaultYayasanStampUrl,
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(initialStamps));
      return initialStamps;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveStamp(stamp: SavedStamp): void {
    const stamps = this.getStamps();
    const index = stamps.findIndex((s) => s.id === stamp.id);
    if (index >= 0) {
      stamps[index] = stamp;
    } else {
      stamps.push(stamp);
    }
    localStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(stamps));
  },

  deleteStamp(id: string): void {
    const stamps = this.getStamps().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STAMPS, JSON.stringify(stamps));
  },

  createNewBlankLetter(templateId?: string): LetterDocument {
    const org = this.getOrgProfile();
    const now = new Date();
    const nextSeq = this.getNextSequenceNumber();
    const romanMonth = getRomanMonth(now);
    const year = now.getFullYear();
    const dateFormatted = formatIndonesianDate(now);
    const dateHijri = getApproximateHijriDate(now);

    let template = LETTER_TEMPLATES.find((t) => t.id === templateId) || LETTER_TEMPLATES[0];

    const categoryCode = template.categoryCode;
    const letterNumber = generateLetterNumber(nextSeq, categoryCode, romanMonth, year, org.codeIdentifier || 'RMB');
    const verificationCode = generateVerificationCode(letterNumber);

    const sigs = this.getSignatures();
    const chairmanSig = sigs.find((s) => s.id === 'sig-ketua-umum') || sigs[0];
    const secretarySig = sigs.find((s) => s.id === 'sig-sekretaris-umum') || sigs[1];
    const kemasjidanSig = sigs.find((s) => s.id === 'sig-kemasjidan' || s.name.includes('Nursyamsu')) || INITIAL_SAVED_SIGNATURES[2];
    const yayasanSig = sigs.find((s) => s.id === 'sig-ketua-yayasan' || s.name.includes('Arifin')) || INITIAL_SAVED_SIGNATURES[3];

    return {
      id: 'doc-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      letterNumber,
      isCustomNumber: false,
      sequenceNumber: nextSeq,
      categoryCode,
      romanMonth,
      year,
      city: 'Depok',
      dateMasehi: now.toISOString().slice(0, 10),
      dateFormattedMasehi: dateFormatted,
      dateHijri,
      attachment: template.attachment,
      subject: template.subject,
      recipientName: template.recipientName,
      recipientInstitution: template.recipientInstitution,
      openingGreeting: template.openingGreeting,
      openingParagraph: template.openingParagraph,
      eventDetails: template.eventDetails ? { ...template.eventDetails } : undefined,
      contentParagraphs: [...template.contentParagraphs],
      closingParagraph: template.closingParagraph,
      closingGreeting: template.closingGreeting,
      signatories: {
        firstSignatory: {
          role: chairmanSig ? chairmanSig.role : 'Ketua Umum',
          name: chairmanSig ? chairmanSig.name : 'Muhammad Faizal Addib',
          idNumber: chairmanSig ? chairmanSig.idNumber : 'NTA: 2024.01.001',
          includeSignature: true,
          signatureDataUrl: chairmanSig ? chairmanSig.dataUrl : DEFAULT_CHAIRMAN_SIGNATURE,
        },
        secondSignatory: {
          role: secretarySig ? secretarySig.role : 'Sekretaris Umum',
          name: secretarySig ? secretarySig.name : 'Muhammad Akbar Izzati',
          idNumber: secretarySig ? secretarySig.idNumber : 'NTA: 2024.01.018',
          includeSignature: true,
          signatureDataUrl: secretarySig ? secretarySig.dataUrl : DEFAULT_SECRETARY_SIGNATURE,
        },
        kemasjidanSignatory: {
          enabled: false,
          role: kemasjidanSig ? kemasjidanSig.role : 'Ketua Bidang Kemasjidan',
          name: kemasjidanSig ? kemasjidanSig.name : 'Nursyamsu Hidayat',
          idNumber: kemasjidanSig ? kemasjidanSig.idNumber : 'YAS.MBR/KM/01',
          includeSignature: true,
          signatureDataUrl: kemasjidanSig ? kemasjidanSig.dataUrl : DEFAULT_KEMASJIDAN_SIGNATURE,
        },
        yayasanSignatory: {
          enabled: false,
          role: yayasanSig ? yayasanSig.role : 'Ketua Yayasan Masjid Baiturrahman',
          name: yayasanSig ? yayasanSig.name : 'H. Arifin Lambaga',
          idNumber: yayasanSig ? yayasanSig.idNumber : 'YAS.MBR/01/2022',
          includeSignature: true,
          signatureDataUrl: yayasanSig ? yayasanSig.dataUrl : DEFAULT_YAYASAN_SIGNATURE,
        },
      },
      stamp: {
        enabled: true,
        color: 'red',
        opacity: 0.92,
        customStampUrl: org.defaultStampUrl,
      },
      kemasjidanStamp: {
        enabled: true,
        color: 'emerald',
        opacity: 0.92,
        customStampUrl: org.defaultKemasjidanStampUrl,
      },
      yayasanStamp: {
        enabled: true,
        color: 'emerald',
        opacity: 0.92,
        customStampUrl: org.defaultYayasanStampUrl,
      },
      verification: {
        enabled: true,
        verificationCode,
        verifiedAt: new Date().toISOString(),
      },
      copies: [...template.copies],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};
