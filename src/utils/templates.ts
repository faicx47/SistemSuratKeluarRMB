import { LetterCategoryCode } from '../types/letter';

export interface LetterTemplate {
  id: string;
  name: string;
  description: string;
  categoryCode: LetterCategoryCode;
  subject: string;
  attachment: string;
  recipientName: string;
  recipientInstitution: string;
  openingGreeting: string;
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
  copies: string[];
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'undangan-rapat',
    name: 'Undangan Rapat Kerja & Koordinasi',
    description: 'Undangan musyawarah kerja internal pengurus dan panitia Remasbara',
    categoryCode: 'UND',
    subject: 'Undangan Rapat Koordinasi Akbar Pengurus Remasbara',
    attachment: '-',
    recipientName: 'Seluruh Jajaran Pengurus & Anggota Remasbara',
    recipientInstitution: 'di Tempat',
    openingGreeting: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh',
    openingParagraph: 'Puji syukur senantiasa kita panjatkan ke hadirat Allah Subhanahu wa Ta\'ala atas limpahan rahmat, taufik, serta hidayah-Nya. Shalawat beriring salam semoga senantiasa tercurahkan kepada junjungan kita Nabi Muhammad Shallallahu \'Alaihi Wasallam.',
    eventDetails: {
      enabled: true,
      dayDate: 'Ahad, 18 Oktober 2026',
      time: '19.30 WIB (Ba\'da Isya) s.d Selesai',
      location: 'Aula Serbaguna Masjid Baiturrahman Mekarjaya Lt. 2',
      agenda: 'Evaluasi Program Kerja Triwulan & Pembentukan Panitia PHBI',
      dressCode: 'Baju Koko / Gamis / Pakaian Muslim Rapi',
    },
    contentParagraphs: [
      'Sehubungan dengan agenda evaluasi program kerja triwulan serta persiapan rangkaian kegiatan Peringatan Hari Besar Islam (PHBI), maka kami selaku Pengurus Remasbara mengundang rekan-rekan pengurus untuk hadir dalam musyawarah bersama.',
      'Mengingat sangat pentingnya musyawarah ini demi kemaslahatan organisasi dan kemakmuran Masjid Baiturrahman, kami sangat mengharapkan kehadiran rekan-rekan tepat pada waktu yang telah ditentukan.'
    ],
    closingParagraph: 'Demikian surat undangan ini kami sampaikan. Atas perhatian, kehadiran, dan kerja samanya, kami ucapkan jazakumullahu khairan katsiran.',
    closingGreeting: 'Wassalamu\'alaikum Warahmatullahi Wabarakatuh',
    copies: [
      'Ketua Yayasan Masjid Baiturrahman Mekarjaya (sebagai laporan)',
      'Pembina Remasbara',
      'Arsip Dokumen Sekretariat Remasbara'
    ]
  },
  {
    id: 'permohonan-dana',
    name: 'Permohonan Bantuan Dana / Sponsor',
    description: 'Pengajuan sponsorship atau donasi kegiatan dakwah dan kepemudaan',
    categoryCode: 'PMH',
    subject: 'Permohonan Bantuan Dana & Partisipasi Kegiatan Tabligh Akbar',
    attachment: '1 (satu) Berkas Proposal Kegiatan',
    recipientName: 'Bapak/Ibu Pimpinan Perusahaan / Donatur Dermawan',
    recipientInstitution: 'di Kota Depok',
    openingGreeting: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh',
    openingParagraph: 'Segala puji bagi Allah Subhanahu wa Ta\'ala, Dzat yang Maha Pemurah lagi Maha Penyayang. Shalawat serta salam semoga tercurah kepada Nabi Muhammad Shallallahu \'Alaihi Wasallam, para keluarga, sahabat, dan umatnya hingga akhir zaman.',
    eventDetails: {
      enabled: false,
      dayDate: '',
      time: '',
      location: '',
      agenda: '',
    },
    contentParagraphs: [
      'Dalam rangka menyemarakkan syiar Islam dan menumbuhkan karakter generasi muda yang berakhlakul karimah di lingkungan Sukmajaya, Remasbara (Remaja Masjid Baiturrahman) berencana menyelenggarakan kegiatan "Semarak Tabligh Akbar & Santunan Anak Yatim Baiturrahman 2026".',
      'Untuk kelancaran dan kesuksesan kegiatan mulia tersebut, kami sangat mengharapkan partisipasi dan dukungan materiil maupun moril dari Bapak/Ibu sekalian. Bersama surat ini, kami lampirkan rincian rencana anggaran biaya (RAB) dan susunan agenda kegiatan sebagai bahan pertimbangan.',
      'Bantuan donasi dapat disalurkan langsung melalui rekening resmi kepanitiaan Bank Syariah Indonesia (BSI) No. Rekening: 7123-4567-89 a.n. Remasbara Baiturrahman.'
    ],
    closingParagraph: 'Demikian permohonan ini kami sampaikan. Semoga infak dan sedekah yang Bapak/Ibu berikan menjadi amal jariyah yang berlipat ganda di sisi Allah Ta\'ala. Atas perhatian dan bantuannya, kami haturkan terima kasih.',
    closingGreeting: 'Wassalamu\'alaikum Warahmatullahi Wabarakatuh',
    copies: [
      'Ketua Yayasan Masjid Baiturrahman Mekarjaya',
      'Bendahara Remasbara',
      'Arsip'
    ]
  },
  {
    id: 'peminjaman-sarana',
    name: 'Permohonan Peminjaman Aula / Sarana',
    description: 'Peminjaman aula serbaguna, sound system, atau proyektor masjid ke Yayasan',
    categoryCode: 'PJM',
    subject: 'Permohonan Peminjaman Aula dan Sarana Multimedia Masjid',
    attachment: '1 (satu) Lembar Rincian Perlengkapan',
    recipientName: 'Ketua Yayasan Masjid Baiturrahman',
    recipientInstitution: 'di Mekarjaya, Sukmajaya, Depok',
    openingGreeting: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh',
    openingParagraph: 'Teriring salam dan do\'a kami sampaikan, semoga Bapak beserta segenap jajaran pengurus Yayasan Masjid Baiturrahman senantiasa dalam lindungan dan rahmat Allah Subhanahu wa Ta\'ala dalam menjalankan amanah keumatan.',
    eventDetails: {
      enabled: true,
      dayDate: 'Sabtu - Ahad, 24 - 25 Oktober 2026',
      time: '08.00 WIB s.d Selesai',
      location: 'Aula Serbaguna dan Ruang Audio Lantai 1 Masjid Baiturrahman',
      agenda: 'Pelatihan Desain Grafis & Public Speaking Remaja Masjid',
      dressCode: 'Bebas Rapi & Sopan',
    },
    contentParagraphs: [
      'Sehubungan dengan akan diselenggarakannya kegiatan "Pelatihan Kreatif Digital & Public Speaking Remaja Masjid", kami bermaksud memohon izin peminjaman fasilitas Aula Serbaguna beserta perangkat sound system dan proyektor milik Masjid Baiturrahman.',
      'Kami berkomitmen penuh untuk menjaga ketertiban, kebersihan, serta merawat sarana prasarana yang dipinjam dengan sebaik-baiknya hingga kegiatan selesai.'
    ],
    closingParagraph: 'Demikian surat permohonan izin ini kami ajukan. Atas perhatian, bimbingan, dan izin yang diberikan oleh Bapak Ketua Yayasan, kami ucapkan terima kasih yang sebesar-besarnya.',
    closingGreeting: 'Wassalamu\'alaikum Warahmatullahi Wabarakatuh',
    copies: [
      'Seksi Perlengkapan Yayasan Masjid Baiturrahman',
      'Koordinator Kebersihan Masjid',
      'Arsip Remasbara'
    ]
  },
  {
    id: 'surat-tugas',
    name: 'Surat Tugas Panitia Kegiatan',
    description: 'Penugasan resmi anggota pengurus untuk kepanitiaan atau perwakilan delegasi',
    categoryCode: 'ST',
    subject: 'Surat Tugas Panitia Pelaksana Peringatan Hari Besar Islam (PHBI)',
    attachment: '1 (satu) Berkas Susunan Personalia',
    recipientName: 'Nama-nama Terlampir (Anggota Remasbara)',
    recipientInstitution: 'di Tempat',
    openingGreeting: 'Bismillahir Rahmanir Rahim\nAssalamu\'alaikum Warahmatullahi Wabarakatuh',
    openingParagraph: 'Berdasarkan hasil musyawarah pengurus Remasbara tertanggal 1 Oktober 2026 tentang persiapan Peringatan Maulid Nabi Muhammad SAW di lingkungan Masjid Baiturrahman Mekarjaya, maka dengan ini Pengurus Remasbara menugaskan:',
    eventDetails: {
      enabled: false,
      dayDate: '',
      time: '',
      location: '',
      agenda: '',
    },
    contentParagraphs: [
      'Nama-nama pengurus yang tercantum dalam lampiran surat ini untuk mengemban amanah sebagai Panitia Pelaksana PHBI Masjid Baiturrahman Tahun 1448 H / 2026 M.',
      'Tugas dan tanggung jawab ini meliputi perencanaan, koordinasi teknis, penggalangan dana, serta pelaksanaan kegiatan hingga pelaporan pertanggungjawaban kepada Pengurus Harian dan Pembina Yayasan.',
      'Surat tugas ini berlaku sejak tanggal ditetapkan sampai dengan berakhirnya seluruh rangkaian kegiatan dan selesainya LPJ panitia.'
    ],
    closingParagraph: 'Demikian surat tugas ini diberikan agar dapat dilaksanakan dengan penuh dedikasi, amanah, dan keikhlasan mengharap ridha Allah Subhanahu wa Ta\'ala.',
    closingGreeting: 'Wassalamu\'alaikum Warahmatullahi Wabarakatuh',
    copies: [
      'Ketua Yayasan Masjid Baiturrahman',
      'Yang Bersangkutan',
      'Arsip'
    ]
  },
  {
    id: 'pemberitahuan-lingkungan',
    name: 'Pemberitahuan Kegiatan ke RT / RW',
    description: 'Surat pemberitahuan kegiatan dakwah dan pemuda ke aparatur lingkungan Mekarjaya',
    categoryCode: 'PBM',
    subject: 'Pemberitahuan Kegiatan Semarak Kepemudaan Baiturrahman',
    attachment: '1 (satu) Berkas Rundown Acara',
    recipientName: 'Ketua RW 07 dan Seluruh Ketua RT se-Mekarjaya',
    recipientInstitution: 'di Tempat',
    openingGreeting: 'Assalamu\'alaikum Warahmatullahi Wabarakatuh',
    openingParagraph: 'Salam silaturahmi kami sampaikan, semoga Bapak senantiasa dalam keadaan sehat wal\'afiat serta sukses dalam memimpin warga dan lingkungan masyarakat Mekarjaya Sukmajaya.',
    eventDetails: {
      enabled: true,
      dayDate: 'Ahad, 1 November 2026',
      time: '06.00 WIB s.d 12.00 WIB',
      location: 'Halaman Utama Masjid Baiturrahman & Sepanjang Jl. Tole Iskandar KM 3',
      agenda: 'Jalan Santai Islami, Donor Darah, dan Bazar UMKM Jamaah',
    },
    contentParagraphs: [
      'Melalui surat ini, kami memberitahukan bahwa Remasbara (Remaja Masjid Baiturrahman) akan menyelenggarakan kegiatan syiar pemuda dan silaturahmi warga dengan tema "Baiturrahman Bersatu: Sehat Jasmani & Rohani".',
      'Demi kelancaran dan ketertiban kegiatan tersebut, kami memohon do\'a restu serta izin penyelenggaraan di lingkungan wilayah Bapak. Kami juga mengundang seluruh warga untuk turut meramaikan kegiatan ini.'
    ],
    closingParagraph: 'Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, perkenan, dan kerja sama yang baik dari Bapak Ketua RW dan Ketua RT, kami haturkan terima kasih.',
    closingGreeting: 'Wassalamu\'alaikum Warahmatullahi Wabarakatuh',
    copies: [
      'Ketua Yayasan Masjid Baiturrahman',
      'Bhabinkamtibmas Kelurahan Mekarjaya',
      'Babinsa Kelurahan Mekarjaya',
      'Arsip Remasbara'
    ]
  }
];
