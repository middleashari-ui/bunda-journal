export type BookThemeId = 
  | 'kinfolk-sage' 
  | 'warm-terracotta' 
  | 'blush-rose' 
  | 'monochrome-noir' 
  | 'botanical-forest';

export interface BookThemeConfig {
  id: BookThemeId;
  name: string;
  subtitle: string;
  primaryColor: string; // Accent color for headers, badges, highlights
  secondaryColor: string; // Supporting color for accents and washi tape
  pageBg: string; // Background paper tone
  headerBg: string; // Header banner tone for sections
  washiBg: string; // Washi tape RGBA
  borderColor: string;
  textColor: string;
  mutedText: string;
  swatchHex: string;
}

export const BOOK_THEMES: Record<BookThemeId, BookThemeConfig> = {
  'kinfolk-sage': {
    id: 'kinfolk-sage',
    name: 'Kinfolk Sage & Linen',
    subtitle: 'Nuansa hijau olive alami dan terakota hangat khas Scandi',
    primaryColor: '#556B2F',
    secondaryColor: '#A85A44',
    pageBg: '#FAF9F7',
    headerBg: '#F5EEEE',
    washiBg: 'rgba(168, 90, 68, 0.35)',
    borderColor: '#D6D3D1',
    textColor: '#1C1917',
    mutedText: '#6B6259',
    swatchHex: '#556B2F',
  },
  'warm-terracotta': {
    id: 'warm-terracotta',
    name: 'Warm Terracotta & Sand',
    subtitle: 'Sentuhan tembikar bumi dan pasir gurun mediterania yang menenangkan',
    primaryColor: '#A34E36',
    secondaryColor: '#8A5A24',
    pageBg: '#FAF6F0',
    headerBg: '#F7EBE6',
    washiBg: 'rgba(163, 78, 54, 0.35)',
    borderColor: '#D9C8BE',
    textColor: '#29221F',
    mutedText: '#6F5A4E',
    swatchHex: '#A34E36',
  },
  'blush-rose': {
    id: 'blush-rose',
    name: 'Nordic Blush Rose',
    subtitle: 'Palet merah muda lembut, dusty mauve, dan kelembutan cinta ibu',
    primaryColor: '#93485E',
    secondaryColor: '#A05A4C',
    pageBg: '#FCF9F9',
    headerBg: '#F8ECF0',
    washiBg: 'rgba(147, 72, 94, 0.32)',
    borderColor: '#E2D4D8',
    textColor: '#2B1E22',
    mutedText: '#6F5C61',
    swatchHex: '#93485E',
  },
  'monochrome-noir': {
    id: 'monochrome-noir',
    name: 'Classic Editorial Noir',
    subtitle: 'Tipografi hitam putih minimalis ala majalah seni rupa abadi',
    primaryColor: '#262626',
    secondaryColor: '#525252',
    pageBg: '#FAFAFA',
    headerBg: '#F2F2F2',
    washiBg: 'rgba(82, 82, 82, 0.25)',
    borderColor: '#D4D4D4',
    textColor: '#171717',
    mutedText: '#5F5F5F',
    swatchHex: '#262626',
  },
  'botanical-forest': {
    id: 'botanical-forest',
    name: 'Botanical Forest & Olive',
    subtitle: 'Hijaunya daun eukaliptus segar dan dedaunan hutan damai',
    primaryColor: '#365345',
    secondaryColor: '#46604F',
    pageBg: '#F7F8F5',
    headerBg: '#EBF0EC',
    washiBg: 'rgba(54, 83, 69, 0.35)',
    borderColor: '#CCD6CF',
    textColor: '#19241E',
    mutedText: '#566B5F',
    swatchHex: '#365345',
  },
};

export interface ChapterNav {
  id: string;
  title: string;
  pageStart: number;
  pageEnd: number;
  totalPage: number;
  description: string;
}

export const BOOK_CHAPTERS: ChapterNav[] = [
  {
    id: 'pengantar',
    title: 'Halaman Judul & Pengantar',
    pageStart: 1,
    pageEnd: 2,
    totalPage: 2,
    description: 'Halaman Judul Eksklusif & Kata Pembuka Cinta Bunda'
  },
  {
    id: 'bab-1',
    title: 'Bab 1: Awal Mula Kisah',
    pageStart: 3,
    pageEnd: 6,
    totalPage: 4,
    description: 'Test Pack Garis Dua, Reaksi Ayah, USG Kantung Janin & Gejala Awal'
  },
  {
    id: 'pembatas-t1',
    title: 'Pembatas Trimester 1',
    pageStart: 7,
    pageEnd: 8,
    totalPage: 2,
    description: 'Quote Pembatas & Rangkuman Bulan 1 - 3'
  },
  {
    id: 'bab-2-t1',
    title: 'Bab 2: Jurnal Mingguan W5 - W13',
    pageStart: 9,
    pageEnd: 26,
    totalPage: 18,
    description: 'Minggu ke-5 s.d. 13 (2 Halaman per minggu: Tracker + Foto USG)'
  },
  {
    id: 'pembatas-t2',
    title: 'Pembatas Trimester 2',
    pageStart: 27,
    pageEnd: 28,
    totalPage: 2,
    description: 'Quote Pembatas & Golden Trimester'
  },
  {
    id: 'bab-2-t2',
    title: 'Bab 2: Jurnal Mingguan W14 - W27',
    pageStart: 29,
    pageEnd: 56,
    totalPage: 28,
    description: 'Minggu ke-14 s.d. 27 (Gerakan pertama & USG morfologi)'
  },
  {
    id: 'pembatas-t3',
    title: 'Pembatas Trimester 3',
    pageStart: 57,
    pageEnd: 58,
    totalPage: 2,
    description: 'Quote Pembatas & Menghitung Hari Lahir'
  },
  {
    id: 'bab-2-t3',
    title: 'Bab 2: Jurnal Mingguan W28 - W40',
    pageStart: 59,
    pageEnd: 84,
    totalPage: 26,
    description: 'Minggu ke-28 s.d. 40 (Detak akhir menjelang persalinan)'
  },
  {
    id: 'bab-3',
    title: 'Bab 3: Persiapan Menyambut',
    pageStart: 85,
    pageEnd: 90,
    totalPage: 6,
    description: 'Ide Nama, Belanja Perlengkapan Bayi, & Tas Bersalin RS'
  },
  {
    id: 'bab-4',
    title: 'Bab 4: Kelahiran',
    pageStart: 91,
    pageEnd: 96,
    totalPage: 6,
    description: 'Cerita Persalinan, Biodata Lahir, Cap Tangan/Kaki, Gelang RS'
  },
  {
    id: 'bab-5',
    title: 'Bab 5: Surat Kapsul Waktu',
    pageStart: 97,
    pageEnd: 100,
    totalPage: 4,
    description: 'Surat Rahasia Cinta dari Bunda & Ayah untuk Masa Depan Anak'
  }
];
