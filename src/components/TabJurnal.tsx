import React, { useRef, useState, useEffect } from 'react';
import { HabitState, PhotoMemory, JournalEntry, UserProfile } from '../types';
import { getWeekData } from '../data/pregnancyWeeks';
import { SupplementWaterCard } from './dashboard/SupplementWaterCard';
import { ActivityRingsCard } from './dashboard/ActivityRingsCard';
import { 
  Check, 
  Camera, 
  Save, 
  Trash2, 
  BookOpen, 
  Eye, 
  CheckSquare, 
  Square, 
  Heart, 
  Baby, 
  Clock, 
  MapPin, 
  Sparkles,
  Calendar,
  Layers,
  ShoppingBag,
  FileText,
  Activity,
  Download,
  Footprints,
  Home
} from 'lucide-react';

interface TabJurnalProps {
  week: number;
  setWeek: (week: number) => void;
  journalText: string;
  setJournalText: (text: string) => void;
  journalSaved: boolean;
  setJournalSaved: (saved: boolean) => void;
  habits: HabitState;
  toggleHabit: (key: keyof HabitState) => void;
  selectedMood: number;
  setSelectedMood: (mood: number) => void;
  photos: PhotoMemory[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoMemory[]>>;
  pastEntries: JournalEntry[];
  userProfile?: UserProfile;
  onOpenBookPreview?: () => void;
  onSaveCurrentEntry: () => void;
  onDeleteEntry?: (id: string) => void;
}

type ChapterTab = 'bab2' | 'bab1' | 'bab3' | 'bab4' | 'bab5';

export const TabJurnal: React.FC<TabJurnalProps> = ({
  week,
  setWeek,
  journalText,
  setJournalText,
  journalSaved,
  setJournalSaved,
  habits,
  toggleHabit,
  selectedMood,
  setSelectedMood,
  photos,
  setPhotos,
  pastEntries,
  userProfile,
  onOpenBookPreview,
  onSaveCurrentEntry,
  onDeleteEntry,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeChapter, setActiveChapter] = useState<ChapterTab>('bab2');
  const [selectedImageModal, setSelectedImageModal] = useState<PhotoMemory | null>(null);

  // Week meta info
  const weekData = getWeekData(week);

  // -------------------------------------------------------------
  // BAB 1 STATE (Awal Mula Kisah: Test Pack, USG, Ngidam)
  // -------------------------------------------------------------
  const [bab1Data, setBab1Data] = useState(() => {
    const saved = localStorage.getItem('bunda_bab1');
    return saved ? JSON.parse(saved) : {
      testPackDate: 'Sabtu, 14 September 2024',
      testPackTimePlace: '06:15 Pagi • Kamar Mandi Rumah',
      motherFeelings: 'Tangan bunda gemetar saat melihat garis samar itu berubah menjadi jelas. Air mata haru langsung menetes di atas wastafel...',
      fatherReaction: 'Bunda meletakkan kotak kado kecil berisi test pack di samping cangkir kopi ayah. Saat membukanya, ayah terdiam sejenak lalu memeluk bunda erat sekali...',
      familyReaction: 'Nenek langsung sujud syukur dan menelepon semua keluarga. Doa-doa terbaik mengalir tiada henti untuk kesehatan calon cucu...',
      hospital: userProfile?.hospitalName || 'RSIA Bunda Menteng',
      doctor: userProfile?.doctorName || 'dr. Sarah Sp.OG',
      heartRate: '142 bpm (Normal & Kuat)',
      heartbeatImpression: 'Bunyinya cepat seperti kepakan sayap burung kecil. Air mata bunda menetes haru di ranjang periksa dokter...',
      cravings: '1. Buah mangga muda asam manis potong dingin\n2. Sup kaldu ayam jahe hangat buatan nenek\n3. Es air kelapa muda murni di siang hari',
      avoidedFoods: '• Bau tumisan bawang putih dan minyak panas\n• Kopi hitam pekat\n• Parfum beraroma manis menyengat',
      partnerSupport: 'Ayah yang rela membelikan biskuit jahe jam 11 malam dan memijat punggung bunda setiap subuh...',
      testPackPhoto: null as string | null,
      usgKantungPhoto: null as string | null,
    };
  });

  // -------------------------------------------------------------
  // BAB 2 STATE (Jurnal Mingguan: Senin-Minggu, Fisik, Dokter)
  // -------------------------------------------------------------
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`bunda_daily_w${week}`);
    return saved ? JSON.parse(saved) : {
      Sen: journalText.slice(0, 70) || '',
      Sel: '',
      Rab: '',
      Kam: '',
      Jum: '',
      Sab: '',
      Min: '',
    };
  });

  const [momStats, setMomStats] = useState(() => {
    const saved = localStorage.getItem(`bunda_momstats_w${week}`);
    return saved ? JSON.parse(saved) : {
      weight: '54.5',
      waist: '82',
      bloodPressure: '118/76',
      sleepHourIndex: 1, // 0: 9+, 1: 7-8, 2: 5-6, 3: <5
      doctorNote: `• Janin bertumbuh optimal, panjang ~${weekData.lengthCm}, berat ~${weekData.weightGrams}.\n• Detak jantung terpantau baik ${weekData.heartbeatBpm}.\n• Teruskan suplemen asam folat dan cairan minimal 2 liter.`,
    };
  });

  // -------------------------------------------------------------
  // BAB 3 STATE (Persiapan: Nama, Kamar, Belanja, Tas RS)
  // -------------------------------------------------------------
  const [bab3Data, setBab3Data] = useState(() => {
    const saved = localStorage.getItem('bunda_bab3');
    return saved ? JSON.parse(saved) : {
      candidate1: 'Rayyan Al-Fatih (Pintu surga bagi yang berpuasa & penakluk berbudi luhur)',
      candidate2: 'Kinanti Ayudia (Tembang harapan yang anggun dan berhati lembut)',
      candidate3: 'Malik Ibrahim (Pemimpin bijaksana yang teguh hatinya)',
      candidate4: 'Nayla Salsabila (Anugerah kesuksesan yang mengalir jernih seperti mata air surga)',
      chosenName: 'Kalandra Atharrazka',
      chosenMeaning: '"Penerang yang riang gembira dan senantiasa dilimpahi rezeki bersih."',
      nurseryPhoto: null as string | null,
      nurseryBoxChecked: true,
      nurseryNetChecked: true,
      nurseryLampChecked: true,
      nurseryChairChecked: true,
      nurseryWardrobeChecked: true,
      nurseryThermoChecked: true,
      // Checklist Belanja
      clothesChecked: true,
      bathChecked: true,
      diapersChecked: true,
      feedingChecked: true,
      // Checklist Tas RS
      bagMomChecked: true,
      bagBabyChecked: true,
      bagDadChecked: true,
    };
  });

  // -------------------------------------------------------------
  // BAB 4 STATE (Kelahiran: Persalinan, Biodata Bayi, Cap Kaki)
  // -------------------------------------------------------------
  const [bab4Data, setBab4Data] = useState(() => {
    const saved = localStorage.getItem('bunda_bab4');
    return saved ? JSON.parse(saved) : {
      contractionTime: '02:30 Dini Hari',
      arrivalTime: '05:45 Subuh',
      laborStory: 'Setiap gelombang cinta kontraksi bunda hadapi dengan napas panjang. Ayah membisikkan doa dan memegang tangan bunda tanpa sedetik pun melepaskannya. Seluruh rasa sakit sirna seketika saat dokter berkata, "Kepalanya sudah terlihat, Bunda!"...',
      holdingBabyFeeling: 'Kulit hangatmu diletakkan di dada bunda. Mata manismu berkedip perlahan mencari aroma pelukan ini. Selamat datang di dunia, buah hatiku tersayang...',
      babyName: 'Kalandra Atharrazka',
      birthDate: 'Minggu, 18 Mei 2025',
      birthTime: '09:18 WIB',
      birthWeight: '3.350 gram (3.35 kg)',
      birthLength: '50 cm',
      headCircumference: '34 cm',
      bloodType: 'O (Rhesus Positif)',
      birthPhoto: null as string | null,
      leftFootprintPhoto: null as string | null,
      rightFootprintPhoto: null as string | null,
      wristbandPhoto: null as string | null,
      familyHomePhoto: null as string | null,
    };
  });

  // -------------------------------------------------------------
  // BAB 5 STATE (Surat Kapsul Waktu: Bunda & Ayah)
  // -------------------------------------------------------------
  const [bab5Data, setBab5Data] = useState(() => {
    const saved = localStorage.getItem('bunda_bab5');
    return saved ? JSON.parse(saved) : {
      bundaLetter: 'Anakku sayang,\n\nSaat kamu membaca surat ini, mungkin jemari tanganmu sudah jauh lebih besar dari jemari mungil yang dulu bunda genggam erat di ruang bersalin. Waktu berlalu begitu cepat, nak.\n\nBunda menulis lembaran ini saat kamu baru beberapa hari terlelap di dada bunda. Rasanya baru kemarin bunda merasakan detak jantungmu pertama kali di layar USG yang remang. Ketahuilah, sejak hari pertama tahu kehadiranmu, doa bunda tidak pernah berhenti mengalir untuk setiap helaan napasmu...\n\nJadilah pribadi yang berhati lembut, teguh membela kebenaran, dan selalu bersyukur atas hal-hal sederhana. Di saat dunia luar terasa begitu bising dan melelahkan, ingatlah bahwa pelukan bunda dan rumah ini akan selalu menjadi dermaga teraman tempatmu berlabuh pulang.\n\nTerima kasih telah memilih bunda menjadi ibumu di dunia ini. Kamu adalah kebanggaan terbesar dalam hidup bunda.',
      bundaSignName: userProfile?.name || 'Bunda Jessica',
      ayahLetter: 'Wahai buah hatiku,\n\nSaat kamu membaca surat ini, mungkin pundak ayah sudah tak sekuat dulu lagi untuk menggendongmu di atas bahu mengelilingi taman. Namun ketahuilah, rasa cinta dan perlindungan ayah kepadamu tak akan pernah luntur sedetik pun.\n\nAyah mungkin tidak selalu pandai merangkai kata seindah bundamu. Tapi di setiap tetes peluh kerja keras ayah, ada namamu yang selalu ayah sebut dalam sujud. Ayah ingin kamu tumbuh menjadi insan yang jujur, berani bermimpi besar, dan pantang menyerah...\n\nJangan pernah takut gagal, nak. Gagal adalah tanda bahwa kamu sedang berjuang keras menggapai cita-cita mulia. Ayah akan selalu ada di belakangmu, menjadi dinding kokoh yang menopang langkahmu.\n\nHormatilah ibumu yang telah mengandungmu selama 9 bulan penuh pengorbanan suci. Bahagiakan dia di setiap hembusan usiamu.\n\nDengan rasa bangga yang tak terhingga,\nAyahmu.',
      ayahSignName: 'Ayah Tersayang',
    };
  });

  // Save changes automatically & broadcast to Studio Buku
  useEffect(() => {
    localStorage.setItem('bunda_bab1', JSON.stringify(bab1Data));
    window.dispatchEvent(new Event('bunda_journal_updated'));
  }, [bab1Data]);

  // Dedicated handlers that write strictly to the active week key in localStorage
  const handleUpdateDailyNote = (dayKey: string, val: string) => {
    const trimmed = val.slice(0, 100);
    setDailyNotes(prev => {
      const updated = { ...prev, [dayKey]: trimmed };
      try {
        localStorage.setItem(`bunda_daily_w${week}`, JSON.stringify(updated));
        window.dispatchEvent(new Event('bunda_journal_updated'));
      } catch {}
      return updated;
    });
    if (dayKey === 'Sen') {
      setJournalText(trimmed);
    }
  };

  const handleUpdateMomStats = (key: string, val: any) => {
    setMomStats((prev: any) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem(`bunda_momstats_w${week}`, JSON.stringify(updated));
        window.dispatchEvent(new Event('bunda_journal_updated'));
      } catch {}
      return updated;
    });
  };

  useEffect(() => {
    localStorage.setItem('bunda_bab3', JSON.stringify(bab3Data));
    window.dispatchEvent(new Event('bunda_journal_updated'));
  }, [bab3Data]);

  useEffect(() => {
    localStorage.setItem('bunda_bab4', JSON.stringify(bab4Data));
    window.dispatchEvent(new Event('bunda_journal_updated'));
  }, [bab4Data]);

  useEffect(() => {
    localStorage.setItem('bunda_bab5', JSON.stringify(bab5Data));
    window.dispatchEvent(new Event('bunda_journal_updated'));
  }, [bab5Data]);

  // Load weekly daily notes and stats cleanly when week changes without overwriting
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bunda_daily_w${week}`);
      if (saved) {
        setDailyNotes(JSON.parse(saved));
      } else {
        // If this specific week has no saved notes, show clean empty notes for all days
        const matched = pastEntries.find(e => e.week === week);
        const initialSen = matched?.text ? matched.text.slice(0, 80) : (week === 12 && journalText ? journalText.slice(0, 80) : '');
        setDailyNotes({
          Sen: initialSen,
          Sel: '',
          Rab: '',
          Kam: '',
          Jum: '',
          Sab: '',
          Min: '',
        });
      }

      const savedStats = localStorage.getItem(`bunda_momstats_w${week}`);
      if (savedStats) {
        setMomStats(JSON.parse(savedStats));
      } else {
        const weekInfo = getWeekData(week);
        setMomStats({
          weight: '54.5',
          waist: '82',
          bloodPressure: '118/76',
          sleepHourIndex: 1,
          doctorNote: `• Janin bertumbuh optimal, panjang ~${weekInfo.lengthCm}, berat ~${weekInfo.weightGrams}.\n• Detak jantung terpantau baik ${weekInfo.heartbeatBpm}.\n• Teruskan suplemen asam folat dan cairan minimal 2 liter.`,
        });
      }
    } catch {}
  }, [week]);

  const moods = [
    { label: 'Damai', icon: '🌿', desc: 'Tenang & relaks' },
    { label: 'Bahagia', icon: '❤️', desc: 'Penuh sukacita' },
    { label: 'Terberkati', icon: '✨', desc: 'Sangat bersyukur' },
    { label: 'Lelah', icon: '😴', desc: 'Perlu istirahat' },
    { label: 'Sensitif', icon: '🥺', desc: 'Emosional & lembut' },
  ];

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          callback(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const daysList = [
    { key: 'Sen', label: 'Senin' },
    { key: 'Sel', label: 'Selasa' },
    { key: 'Rab', label: 'Rabu' },
    { key: 'Kam', label: 'Kamis' },
    { key: 'Jum', label: 'Jumat' },
    { key: 'Sab', label: 'Sabtu' },
    { key: 'Min', label: 'Minggu' },
  ];

  return (
    <div className="px-4 py-3 space-y-3.5 max-w-xl mx-auto">
      {/* Top Banner: Sync with Catalog & Open Book Studio */}
      <div className="bg-stone-900 text-stone-200 p-3 rounded-2xl flex items-center justify-between border border-stone-800 shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#708846]" />
          <div>
            <h3 className="font-serif text-xs font-bold text-white">
              Formulir Jurnal 100 Halaman
            </h3>
            <p className="text-[9.5px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Langsung tersimpan otomatis ke buku Studio B5
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenBookPreview && (
            <>
              <button
                onClick={onOpenBookPreview}
                className="px-2.5 py-1.5 bg-[#C87A64] hover:bg-[#b56b56] text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Buka Studio & Download PDF B5"
              >
                <Download className="w-3 h-3" />
                <span>Download PDF B5</span>
              </button>
              <button
                onClick={onOpenBookPreview}
                className="px-2.5 py-1.5 bg-[#556B2F] hover:bg-[#465926] text-white text-[10px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Eye className="w-3 h-3" />
                <span>Lihat Studio</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chapter Navigation Selector (Mirrors Catalog Structure) */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-stone-200/70 rounded-xl border border-stone-300/60">
        <button
          onClick={() => setActiveChapter('bab2')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeChapter === 'bab2'
              ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Bab 2: Mingguan (W5-40)
        </button>

        <button
          onClick={() => setActiveChapter('bab1')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeChapter === 'bab1'
              ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Bab 1: Awal Mula
        </button>

        <button
          onClick={() => setActiveChapter('bab3')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeChapter === 'bab3'
              ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Bab 3: Persiapan
        </button>

        <button
          onClick={() => setActiveChapter('bab4')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeChapter === 'bab4'
              ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Bab 4: Kelahiran
        </button>

        <button
          onClick={() => setActiveChapter('bab5')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            activeChapter === 'bab5'
              ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
              : 'text-stone-700 hover:text-stone-900'
          }`}
        >
          Bab 5: Kapsul Waktu
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. BAB 2: JURNAL MINGGUAN (MINGGU 5 S.D. 40 • 72 HALAMAN)     */}
      {/* ============================================================== */}
      {activeChapter === 'bab2' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Week Selector Slider */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-serif font-bold text-stone-850 text-sm">
                Minggu ke-{week} dari 40
              </span>
              <span className="font-semibold text-[#556B2F] bg-[#556B2F]/10 px-2 py-0.5 rounded-full text-[10.5px]">
                {weekData.fruitEmoji} Seukuran {weekData.fruitName} ({weekData.lengthCm})
              </span>
            </div>

            <input 
              type="range"
              min="5"
              max="40"
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="w-full accent-[#556B2F] cursor-pointer h-2 bg-stone-100 rounded-lg"
            />

            <div className="flex justify-between items-center mt-1.5 text-[10px] text-stone-400">
              <span className={week <= 13 ? 'text-[#556B2F] font-bold' : ''}>Trimester 1 (W1-13)</span>
              <span className={week > 13 && week <= 27 ? 'text-[#C87A64] font-bold' : ''}>Trimester 2 (W14-27)</span>
              <span className={week > 27 ? 'text-[#556B2F] font-bold' : ''}>Trimester 3 (W28-40)</span>
            </div>
          </div>

          {/* Halaman Kiri: Cerita & Perasaan Harian (Senin - Minggu) */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div>
                <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman Kiri Buku Cetak</span>
                <h4 className="font-serif text-xs font-bold text-stone-850">
                  Catatan Harian Minggu ke-{week} (Senin s.d. Minggu)
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400 font-sans">
                  Maks. 100 karakter
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {daysList.map((day) => {
                const noteVal = dailyNotes[day.key] || '';
                const charCount = noteVal.length;
                return (
                  <div key={day.key} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${day.key === 'Min' ? 'text-[#C87A64]' : 'text-stone-600'}`}>
                        {day.label}
                      </span>
                      <span className={`font-sans text-[9px] ${charCount >= 100 ? 'text-rose-500 font-bold' : charCount >= 85 ? 'text-amber-600' : 'text-stone-400'}`}>
                        {charCount}/100
                      </span>
                    </div>
                    <textarea 
                      rows={2}
                      maxLength={100}
                      value={noteVal}
                      placeholder={`Catatan hari ${day.label}...`}
                      onChange={(e) => handleUpdateDailyNote(day.key, e.target.value)}
                      className="w-full text-xs text-stone-850 bg-stone-50/70 hover:bg-stone-50 focus:bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#556B2F] transition-colors font-serif italic resize-none leading-snug"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracker Tidur & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pola Tidur */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs">
              <h4 className="font-serif text-xs font-bold text-stone-850 mb-2">
                Rata-rata Jam Tidur Bunda
              </h4>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {['9+ Jam', '7-8 Jam', '5-6 Jam', '<5 Jam'].map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleUpdateMomStats('sleepHourIndex', idx)}
                    className={`py-1.5 rounded-lg border text-center transition-colors cursor-pointer ${
                      momStats.sleepHourIndex === idx
                        ? 'bg-[#556B2F] border-[#556B2F] text-white font-bold'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Harian */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs">
              <h4 className="font-serif text-xs font-bold text-stone-850 mb-2">
                Refleksi Suasana Hati
              </h4>
              <div className="grid grid-cols-5 gap-1">
                {moods.map((m, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedMood(idx);
                      try {
                        const targetMoodIndex = idx <= 1 ? 0 : idx === 2 ? 1 : idx === 3 ? 3 : 2;
                        const updatedMoods = [targetMoodIndex, targetMoodIndex, targetMoodIndex, targetMoodIndex, targetMoodIndex, targetMoodIndex, targetMoodIndex];
                        localStorage.setItem(`bunda_daily_moods_w${week}`, JSON.stringify(updatedMoods));
                        window.dispatchEvent(new Event('bunda_journal_updated'));
                      } catch {}
                    }}
                    className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      selectedMood === idx
                        ? 'bg-[#C87A64] text-white font-bold shadow-2xs'
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base block">{m.icon}</span>
                    <span className="text-[9px] block">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pusat Input: Suplemen & Hidrasi (Segmented Bar + Edit/Hapus/Tambah + Air 2L) */}
          <SupplementWaterCard />

          {/* Pusat Input: Kebutuhan Jasmani (Activity Rings + Form Progres Target) */}
          <ActivityRingsCard />

          {/* Halaman Kanan: Statistik Bunda & Catatan Medis Dokter */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman Kanan Buku</span>
              <h4 className="font-serif text-xs font-bold text-stone-850">
                Statistik Fisik Bunda & Catatan Dokter
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-1">Berat Badan:</label>
                <input 
                  type="text" 
                  value={momStats.weight} 
                  onChange={(e) => handleUpdateMomStats('weight', e.target.value)}
                  placeholder="54.5 kg"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-850 text-xs outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-1">Lingkar Perut:</label>
                <input 
                  type="text" 
                  value={momStats.waist} 
                  onChange={(e) => handleUpdateMomStats('waist', e.target.value)}
                  placeholder="82 cm"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-850 text-xs outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-1">Tekanan Darah:</label>
                <input 
                  type="text" 
                  value={momStats.bloodPressure} 
                  onChange={(e) => handleUpdateMomStats('bloodPressure', e.target.value)}
                  placeholder="118/76"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-[#556B2F] text-xs outline-none focus:border-[#556B2F]"
                />
              </div>
            </div>

            <div>
              <label className="text-[9.5px] text-stone-500 font-medium block mb-1">
                Catatan Dokter Obgyn / Bidan:
              </label>
              <textarea 
                value={momStats.doctorNote} 
                onChange={(e) => handleUpdateMomStats('doctorNote', e.target.value)}
                rows={3}
                placeholder="Catatan hasil USG, detak jantung janin, dan saran vitamin..."
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Foto USG / Perut Mingguan */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif text-xs font-bold text-stone-850">
                  Foto Perut / USG Minggu ke-{week}
                </h4>
                <p className="text-[9.5px] text-stone-400">Dicetak di kotak polaroid halaman kanan buku</p>
              </div>

              <label className="px-3 py-1.5 bg-[#556B2F] text-white rounded-lg text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#465926]">
                <Camera className="w-3.5 h-3.5" />
                <span>Pilih Foto</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    handleImageFile(e, (src) => {
                      const newPhoto: PhotoMemory = {
                        id: Date.now().toString(),
                        caption: `Foto USG / Perut W${week}`,
                        date: `Minggu ke-${week}`,
                        src,
                        week,
                        isCustom: true
                      };
                      setPhotos(p => [newPhoto, ...p.filter(x => x.week !== week)]);
                      try {
                        const savedPhotosStr = localStorage.getItem('bunda_photos');
                        let currentList: PhotoMemory[] = savedPhotosStr ? JSON.parse(savedPhotosStr) : [];
                        currentList = currentList.filter(p => p.week !== week);
                        currentList.push(newPhoto);
                        localStorage.setItem('bunda_photos', JSON.stringify(currentList));
                        window.dispatchEvent(new Event('bunda_journal_updated'));
                      } catch {}
                    });
                  }}
                />
              </label>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {photos.filter(p => p.week === week).length === 0 ? (
                <div className="col-span-2 p-4 border-2 border-dashed border-stone-200 rounded-xl text-center text-stone-400 text-xs">
                  Belum ada foto khusus Minggu ke-{week}. Ketuk tombol "Pilih Foto" di atas.
                </div>
              ) : (
                photos.filter(p => p.week === week).map(item => (
                  <div key={item.id} className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                    <img src={item.src} alt={item.caption} className="w-full h-28 object-cover" />
                    <div className="p-1.5 text-[9.5px] flex items-center justify-between">
                      <span className="truncate text-stone-700 font-medium">{item.caption}</span>
                      <button 
                        onClick={() => {
                          setPhotos(p => p.filter(x => x.id !== item.id));
                          try {
                            const savedPhotosStr = localStorage.getItem('bunda_photos');
                            if (savedPhotosStr) {
                              let currentList: PhotoMemory[] = JSON.parse(savedPhotosStr);
                              currentList = currentList.filter(x => x.id !== item.id);
                              localStorage.setItem('bunda_photos', JSON.stringify(currentList));
                              window.dispatchEvent(new Event('bunda_journal_updated'));
                            }
                          } catch {}
                        }}
                        className="text-stone-400 hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. BAB 1: AWAL MULA KISAH (TEST PACK, USG AWAL, NGIDAM)       */}
      {/* ============================================================== */}
      {activeChapter === 'bab1' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Hal 3: Momen Garis Dua */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 3 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Momen Garis Dua (Test Pack Perdana)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Hari & Tanggal:</label>
                <input 
                  type="text" 
                  value={bab1Data.testPackDate}
                  onChange={(e) => setBab1Data({ ...bab1Data, testPackDate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850 outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Waktu & Tempat:</label>
                <input 
                  type="text" 
                  value={bab1Data.testPackTimePlace}
                  onChange={(e) => setBab1Data({ ...bab1Data, testPackTimePlace: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850 outline-none focus:border-[#556B2F]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Yang Pertama Terlintas di Hati Bunda:
              </label>
              <textarea 
                value={bab1Data.motherFeelings}
                onChange={(e) => setBab1Data({ ...bab1Data, motherFeelings: e.target.value })}
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif italic leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Foto Test Pack Garis Dua:</label>
              <label className="block p-3 border-2 border-dashed border-stone-200 hover:border-[#556B2F] rounded-xl text-center cursor-pointer bg-stone-50/50">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab1Data({ ...bab1Data, testPackPhoto: src }))}
                />
                {bab1Data.testPackPhoto ? (
                  <div className="flex items-center justify-between">
                    <img src={bab1Data.testPackPhoto} alt="Test pack" className="h-16 w-24 object-cover rounded-md" />
                    <span className="text-[10px] text-[#556B2F] font-semibold">Ganti Foto</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-stone-500 text-xs">
                    <Camera className="w-4 h-4 text-[#556B2F]" />
                    <span>Upload Foto Test Pack dari Galeri</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Hal 4: Reaksi Ayah & Keluarga */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 4 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Kabar Gembira untuk Ayah & Keluarga
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Cara Memberi Tahu Ayah & Reaksinya:
              </label>
              <textarea 
                value={bab1Data.fatherReaction}
                onChange={(e) => setBab1Data({ ...bab1Data, fatherReaction: e.target.value })}
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif italic leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Sambutan Bahagia Kakek, Nenek & Kerabat:
              </label>
              <textarea 
                value={bab1Data.familyReaction}
                onChange={(e) => setBab1Data({ ...bab1Data, familyReaction: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif italic leading-relaxed"
              />
            </div>
          </div>

          {/* Hal 5: USG Kantung Janin & Detak Pertama */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 5 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                USG Perdana & Detak Pertama
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Rumah Sakit:</label>
                <input 
                  type="text" 
                  value={bab1Data.hospital}
                  onChange={(e) => setBab1Data({ ...bab1Data, hospital: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850 outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Dokter Obgyn:</label>
                <input 
                  type="text" 
                  value={bab1Data.doctor}
                  onChange={(e) => setBab1Data({ ...bab1Data, doctor: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850 outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Detak Jantung:</label>
                <input 
                  type="text" 
                  value={bab1Data.heartRate}
                  onChange={(e) => setBab1Data({ ...bab1Data, heartRate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#556B2F] outline-none focus:border-[#556B2F]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Sensasi Mendengar Detak Jantung Pertamamu:
              </label>
              <textarea 
                value={bab1Data.heartbeatImpression}
                onChange={(e) => setBab1Data({ ...bab1Data, heartbeatImpression: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif italic leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Foto USG Kantung Janin (5-7 Minggu):</label>
              <label className="block p-3 border-2 border-dashed border-stone-200 hover:border-[#556B2F] rounded-xl text-center cursor-pointer bg-stone-50/50">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab1Data({ ...bab1Data, usgKantungPhoto: src }))}
                />
                {bab1Data.usgKantungPhoto ? (
                  <div className="flex items-center justify-between">
                    <img src={bab1Data.usgKantungPhoto} alt="USG Pertama" className="h-16 w-24 object-cover rounded-md" />
                    <span className="text-[10px] text-[#556B2F] font-semibold">Ganti Foto USG</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-stone-500 text-xs">
                    <Camera className="w-4 h-4 text-[#556B2F]" />
                    <span>Upload Foto USG Kantung Janin</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Hal 6: Ngidam & Pantangan */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 6 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Gejala Awal & Cerita Ngidam
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Makanan & Minuman yang Paling Diinginkan (Ngidam):
              </label>
              <textarea 
                value={bab1Data.cravings}
                onChange={(e) => setBab1Data({ ...bab1Data, cravings: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Aroma & Makanan yang Dihindari (Bikin Mual):
              </label>
              <textarea 
                value={bab1Data.avoidedFoods}
                onChange={(e) => setBab1Data({ ...bab1Data, avoidedFoods: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Pahlawan Bunda Selama Masa Mual (Dukungan Suami):
              </label>
              <textarea 
                value={bab1Data.partnerSupport}
                onChange={(e) => setBab1Data({ ...bab1Data, partnerSupport: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BAB 3: PERSIAPAN (NAMA, KAMAR, BELANJA, TAS RS)            */}
      {/* ============================================================== */}
      {activeChapter === 'bab3' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Hal 85: Ide Nama Bayi */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 85 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Inspirasi Nama Buah Hati
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-0.5">Kandidat 1:</label>
                <input 
                  type="text" 
                  value={bab3Data.candidate1} 
                  onChange={(e) => setBab3Data({ ...bab3Data, candidate1: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-850"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-0.5">Kandidat 2:</label>
                <input 
                  type="text" 
                  value={bab3Data.candidate2} 
                  onChange={(e) => setBab3Data({ ...bab3Data, candidate2: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-850"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-0.5">Kandidat 3:</label>
                <input 
                  type="text" 
                  value={bab3Data.candidate3} 
                  onChange={(e) => setBab3Data({ ...bab3Data, candidate3: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-850"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 font-medium block mb-0.5">Kandidat 4:</label>
                <input 
                  type="text" 
                  value={bab3Data.candidate4} 
                  onChange={(e) => setBab3Data({ ...bab3Data, candidate4: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-850"
                />
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#556B2F] block">
                Nama Pilihan Untuk Buah Hati:
              </span>
              <input 
                type="text" 
                value={bab3Data.chosenName}
                onChange={(e) => setBab3Data({ ...bab3Data, chosenName: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-sm font-serif font-bold text-stone-900"
              />
              <input 
                type="text" 
                value={bab3Data.chosenMeaning}
                onChange={(e) => setBab3Data({ ...bab3Data, chosenMeaning: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-1 text-xs font-serif italic text-stone-600"
              />
            </div>
          </div>

          {/* Hal 86: Kamar Si Kecil */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 86 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Kamar & Box Tidur Si Kecil
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Foto Sudut Kamar / Box Bayi:</label>
              <label className="block p-3 border-2 border-dashed border-stone-200 hover:border-[#556B2F] rounded-xl text-center cursor-pointer bg-stone-50/50">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab3Data({ ...bab3Data, nurseryPhoto: src }))}
                />
                {bab3Data.nurseryPhoto ? (
                  <div className="flex items-center justify-between">
                    <img src={bab3Data.nurseryPhoto} alt="Kamar Bayi" className="h-16 w-24 object-cover rounded-md" />
                    <span className="text-[10px] text-[#556B2F] font-semibold">Ganti Foto</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-stone-500 text-xs">
                    <Camera className="w-4 h-4 text-[#556B2F]" />
                    <span>Upload Foto Kamar Bayi</span>
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1.5">Checklist Kamar Bayi:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { k: 'nurseryBoxChecked', label: 'Box & Matras Empuk' },
                  { k: 'nurseryNetChecked', label: 'Kelambu Nyamuk' },
                  { k: 'nurseryLampChecked', label: 'Lampu Redup Hangat' },
                  { k: 'nurseryChairChecked', label: 'Kursi Menyusui' },
                  { k: 'nurseryWardrobeChecked', label: 'Lemari Popok' },
                  { k: 'nurseryThermoChecked', label: 'Termometer Suhu' },
                ].map((item) => (
                  <button 
                    key={item.k}
                    type="button"
                    onClick={() => setBab3Data((p: any) => ({ ...p, [item.k]: !p[item.k] }))}
                    className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-lg text-left cursor-pointer hover:bg-stone-100"
                  >
                    {(bab3Data as any)[item.k] ? (
                      <CheckSquare className="w-4 h-4 text-[#556B2F] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-300 shrink-0" />
                    )}
                    <span className={(bab3Data as any)[item.k] ? 'text-stone-800 font-medium' : 'text-stone-400 line-through'}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hal 87-88: Belanja Bayi & Hal 89-90: Tas RS */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 87-90 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Checklist Belanja & Tas Bersalin RS
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-semibold text-[11px] block text-stone-800 mb-1">Belanja Bayi:</span>
                <span className="text-[10px] text-stone-600 block">• Pakaian & Bedong (6-8 set)</span>
                <span className="text-[10px] text-stone-600 block">• Sabun & Handuk Mandi</span>
                <span className="text-[10px] text-stone-600 block">• Popok & Perlak Waterproof</span>
                <span className="text-[10px] text-stone-600 block">• Pompa ASI & Botol Kaca</span>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-semibold text-[11px] block text-stone-800 mb-1">Perlengkapan Bersalin:</span>
                <span className="text-[10px] text-stone-600 block">• Tas Bunda (Baju, Pembalut, BPJS)</span>
                <span className="text-[10px] text-stone-600 block">• Tas Bayi (Baju Pulang, Topi, Popok)</span>
                <span className="text-[10px] text-stone-600 block">• Tas Ayah (Baju ganti, Charger)</span>
                <span className="text-[10px] text-[#556B2F] font-medium block mt-1">Status: Siap di Mobil</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. BAB 4: KELAHIRAN (PROSES, BIODATA, CAP KAKI, FOTO KELUARGA)  */}
      {/* ============================================================== */}
      {activeChapter === 'bab4' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Hal 91-92: Proses Kelahiran & Tangisan Pertama */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 91-92 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Hari Persalinan & Tangisan Pertama
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Kontraksi Pertama:</label>
                <input 
                  type="text" 
                  value={bab4Data.contractionTime}
                  onChange={(e) => setBab4Data({ ...bab4Data, contractionTime: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Tiba di Rumah Sakit:</label>
                <input 
                  type="text" 
                  value={bab4Data.arrivalTime}
                  onChange={(e) => setBab4Data({ ...bab4Data, arrivalTime: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Kisah Perjuangan Persalinan:</label>
              <textarea 
                value={bab4Data.laborStory}
                onChange={(e) => setBab4Data({ ...bab4Data, laborStory: e.target.value })}
                rows={3}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 font-serif italic leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Yang Bunda Rasakan Saat Memeluk Pertama Kali:</label>
              <textarea 
                value={bab4Data.holdingBabyFeeling}
                onChange={(e) => setBab4Data({ ...bab4Data, holdingBabyFeeling: e.target.value })}
                rows={2}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 font-serif italic leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Foto Momen IMD / Pelukan Pertama:</label>
              <label className="block p-3 border-2 border-dashed border-stone-200 hover:border-[#556B2F] rounded-xl text-center cursor-pointer bg-stone-50/50">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab4Data({ ...bab4Data, birthPhoto: src }))}
                />
                {bab4Data.birthPhoto ? (
                  <div className="flex items-center justify-between">
                    <img src={bab4Data.birthPhoto} alt="Foto Lahir" className="h-16 w-24 object-cover rounded-md" />
                    <span className="text-[10px] text-[#556B2F] font-semibold">Ganti Foto</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-stone-500 text-xs">
                    <Camera className="w-4 h-4 text-[#556B2F]" />
                    <span>Upload Foto Bayi Baru Lahir</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Hal 93: Biodata Lengkap Sang Bayi */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 93 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Biodata Lengkap Sang Bayi
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Nama Lengkap Resmi Bayi:</label>
              <input 
                type="text" 
                value={bab4Data.babyName}
                onChange={(e) => setBab4Data({ ...bab4Data, babyName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-serif font-bold text-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Tanggal Lahir:</label>
                <input 
                  type="text" 
                  value={bab4Data.birthDate}
                  onChange={(e) => setBab4Data({ ...bab4Data, birthDate: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Pukul Kelahiran:</label>
                <input 
                  type="text" 
                  value={bab4Data.birthTime}
                  onChange={(e) => setBab4Data({ ...bab4Data, birthTime: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Berat Badan:</label>
                <input 
                  type="text" 
                  value={bab4Data.birthWeight}
                  onChange={(e) => setBab4Data({ ...bab4Data, birthWeight: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-[#556B2F]"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Panjang Badan:</label>
                <input 
                  type="text" 
                  value={bab4Data.birthLength}
                  onChange={(e) => setBab4Data({ ...bab4Data, birthLength: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Lingkar Kepala:</label>
                <input 
                  type="text" 
                  value={bab4Data.headCircumference}
                  onChange={(e) => setBab4Data({ ...bab4Data, headCircumference: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[9.5px] text-stone-500 block mb-0.5">Golongan Darah:</label>
                <input 
                  type="text" 
                  value={bab4Data.bloodType}
                  onChange={(e) => setBab4Data({ ...bab4Data, bloodType: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Hal 94-96: Cap Kaki, Gelang RS, Foto Keluarga */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 94-96 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Cap Kaki, Gelang RS & Foto Pulang ke Rumah
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="p-3 border-2 border-dashed border-stone-200 rounded-xl text-center cursor-pointer bg-stone-50 block">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab4Data({ ...bab4Data, leftFootprintPhoto: src }))}
                />
                <Footprints className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <span className="text-[10px] font-medium block text-stone-700">Cap Kaki Kiri/Kanan</span>
                <span className="text-[9px] text-stone-400">{bab4Data.leftFootprintPhoto ? '✓ Foto Terpasang' : 'Unggah foto'}</span>
              </label>

              <label className="p-3 border-2 border-dashed border-stone-200 rounded-xl text-center cursor-pointer bg-stone-50 block">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageFile(e, (src) => setBab4Data({ ...bab4Data, familyHomePhoto: src }))}
                />
                <Home className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <span className="text-[10px] font-medium block text-stone-700">Foto Keluarga Perdana</span>
                <span className="text-[9px] text-stone-400">{bab4Data.familyHomePhoto ? '✓ Foto Terpasang' : 'Unggah foto'}</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. BAB 5: SURAT KAPSUL WAKTU (AYAH & BUNDA • HALAMAN 97-100)  */}
      {/* ============================================================== */}
      {activeChapter === 'bab5' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Hal 97-98: Surat dari Bunda */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 97-98 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Surat Cinta dari Bunda (Buka Usia 17 Tahun)
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Pesan, Nasihat & Doa Bunda:</label>
              <textarea 
                value={bab5Data.bundaLetter}
                onChange={(e) => setBab5Data({ ...bab5Data, bundaLetter: e.target.value })}
                rows={7}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 font-serif italic leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500 font-medium">Tertanda Bunda:</span>
              <input 
                type="text" 
                value={bab5Data.bundaSignName}
                onChange={(e) => setBab5Data({ ...bab5Data, bundaSignName: e.target.value })}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-serif font-bold text-stone-850"
              />
            </div>
          </div>

          {/* Hal 99-100: Surat dari Ayah */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block">Halaman 99-100 Buku</span>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Surat Cinta dari Ayah
              </h4>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">Pesan, Keteguhan & Doa Ayah:</label>
              <textarea 
                value={bab5Data.ayahLetter}
                onChange={(e) => setBab5Data({ ...bab5Data, ayahLetter: e.target.value })}
                rows={7}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 font-serif italic leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-stone-500 font-medium">Tertanda Ayah:</span>
              <input 
                type="text" 
                value={bab5Data.ayahSignName}
                onChange={(e) => setBab5Data({ ...bab5Data, ayahSignName: e.target.value })}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-serif font-bold text-stone-850"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save & Studio Action Bar */}
      <div className="pt-2">
        <button
          onClick={() => {
            onSaveCurrentEntry();
            if (onOpenBookPreview) {
              onOpenBookPreview();
            }
          }}
          className="w-full py-3 bg-[#556B2F] hover:bg-[#465926] text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-200" />
          <span>Buka Studio & Tinjau Seluruh 100 Halaman B5</span>
        </button>
      </div>
    </div>
  );
};
