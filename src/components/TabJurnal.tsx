import React, { useRef, useState, useEffect } from 'react';
import { HabitState, PhotoMemory, JournalEntry, UserProfile } from '../types';
import { getWeekData } from '../data/pregnancyWeeks';
import { idbSet, addToSyncQueue } from '../lib/idb';
import { syncBabyDobToSupabase } from '../lib/supabase';
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
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Archive,
  HelpCircle,
  Pencil,
  X
} from 'lucide-react';
import { OnboardingJurnalTutorial } from './OnboardingJurnalTutorial';
import { getTodayPosition, getWeekStrip, isSameDay } from '../lib/pregnancyDate';
import {
  AppointmentData,
  EMPTY_APPOINTMENT,
  getActiveEmail,
  loadAppointment,
  saveAppointment,
  loadCatatanAyah,
  saveCatatanAyah,
  loadStatus as readAppointmentStatus,
  saveStatus as persistAppointmentStatus,
  isAppointmentEmpty,
} from '../lib/appointmentStore';

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
  onShowToast?: (message: string) => void;
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
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeChapter, setActiveChapter] = useState<ChapterTab>('bab2');
  const [selectedImageModal, setSelectedImageModal] = useState<PhotoMemory | null>(null);

  // Week meta info
  const weekData = getWeekData(week);

  // -------------------------------------------------------------
  // BAB 1 STATE (Awal Mula: Dua Garis, Momen Haru, USG Pertama)
  // -------------------------------------------------------------
  const [bab1Data, setBab1Data] = useState(() => {
    try {
      const saved = localStorage.getItem('bunda_bab1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      testPackDate: '',
      testPackTimePlace: '',
      motherFeelings: '',
      fatherReaction: '',
      familyReaction: '',
      hospital: userProfile?.hospitalName || '',
      doctor: userProfile?.doctorName || '',
      heartRate: '',
      heartbeatImpression: '',
      cravings: '',
      avoidedFoods: '',
      partnerSupport: '',
      testPackPhoto: null as string | null,
      usgKantungPhoto: null as string | null,
    };
  });

  // -------------------------------------------------------------
  // BAB 2 STATE (Jurnal Mingguan: Senin-Minggu, Fisik, Dokter)
  // -------------------------------------------------------------
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`bunda_daily_w${week}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      Sen: (journalText || '').slice(0, 70) || '',
      Sel: '',
      Rab: '',
      Kam: '',
      Jum: '',
      Sab: '',
      Min: '',
    };
  });

  const [momStats, setMomStats] = useState(() => {
    try {
      const saved = localStorage.getItem(`bunda_momstats_w${week}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      weight: '',
      waist: '',
      bloodPressure: '',
      sleepHourIndex: 1, // 0: 9+, 1: 7-8, 2: 5-6, 3: <5
      doctorNote: '',
    };
  });

  // -------------------------------------------------------------
  // BAB 3 STATE (Persiapan: Nama, Kamar, Belanja, Tas RS)
  // -------------------------------------------------------------
  const [bab3Data, setBab3Data] = useState(() => {
    try {
      const saved = localStorage.getItem('bunda_bab3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      candidate1: '',
      candidate2: '',
      candidate3: '',
      candidate4: '',
      chosenName: '',
      chosenMeaning: '',
      nurseryPhoto: null as string | null,
      nurseryBoxChecked: false,
      nurseryNetChecked: false,
      nurseryLampChecked: false,
      nurseryChairChecked: false,
      nurseryWardrobeChecked: false,
      nurseryThermoChecked: false,
      // Checklist Belanja
      clothesChecked: false,
      bathChecked: false,
      diapersChecked: false,
      feedingChecked: false,
      // Checklist Tas RS
      bagMomChecked: false,
      bagBabyChecked: false,
      bagDadChecked: false,
    };
  });

  // -------------------------------------------------------------
  // BAB 4 STATE (Kelahiran: Persalinan, Biodata Bayi, Cap Kaki)
  // -------------------------------------------------------------
  const [bab4Data, setBab4Data] = useState(() => {
    try {
      const saved = localStorage.getItem('bunda_bab4');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      contractionTime: '',
      arrivalTime: '',
      laborStory: '',
      holdingBabyFeeling: '',
      babyName: '',
      birthDate: '',
      birthTime: '',
      birthWeight: '',
      birthLength: '',
      headCircumference: '',
      bloodType: '',
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
    try {
      const saved = localStorage.getItem('bunda_bab5');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      bundaLetter: '',
      bundaSignName: userProfile?.name || '',
      ayahLetter: '',
      ayahSignName: '',
    };
  });

  // Save changes automatically & broadcast to Studio Buku
  useEffect(() => {
    localStorage.setItem('bunda_bab1', JSON.stringify(bab1Data));
    window.dispatchEvent(new Event('bunda_journal_updated'));
  }, [bab1Data]);

  // Debounce autosave timer ref & save feedback status
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('Tersimpan otomatis');

  interface DailyNoteEntry {
    text: string;
    savedAt: string;
    status: 'Selesai' | 'Belum';
  }

  const loadDayNotesForWeek = (w: number, currentDailyNotes: Record<string, string>) => {
    const result: Record<number, DailyNoteEntry> = {};
    const dayKeys = ['Rab', 'Kam', 'Jum', 'Sab', 'Min', 'Sen', 'Sel'];
    for (let i = 0; i < 7; i++) {
      try {
        const saved = localStorage.getItem(`bunda_${w}_${i}_catatan`);
        if (saved) {
          result[i] = JSON.parse(saved);
          continue;
        }
      } catch {}
      const existing = currentDailyNotes[dayKeys[i]] || '';
      result[i] = {
        text: existing,
        savedAt: existing ? '19:15' : '',
        status: existing.trim() ? 'Selesai' : 'Belum',
      };
    }
    return result;
  };

  const [dayNotesMap, setDayNotesMap] = useState<Record<number, DailyNoteEntry>>(() => {
    return loadDayNotesForWeek(week, dailyNotes);
  });
  const [openAccordionDayIndex, setOpenAccordionDayIndex] = useState<number | null>(null);

  // POIN 2 State: Jadwal Pertemuan Dokter V10 CLEAN NO DUMMY
  // PER-USER: jadwal disimpan per email user (lihat lib/appointmentStore.ts),
  // jadi login dengan email yang sama akan memuat balik jadwalnya.
  const [activeEmail, setActiveEmail] = useState<string>(() => getActiveEmail());
  const [appointment, setAppointment] = useState<AppointmentData>(() => {
    return loadAppointment(getActiveEmail());
  });
  const [catatanAyah, setCatatanAyah] = useState<string>(() => {
    return loadCatatanAyah(getActiveEmail());
  }); // hapus "Bawa hasil lab..."
  const [doctorNote, setDoctorNote] = useState<string>("");
  const [status, setStatus] = useState<string>(() => {
    return readAppointmentStatus(getActiveEmail());
  }); // ini aja default

  // Re-load jadwal bila identitas user berubah (login/logout) tanpa perlu reload page.
  useEffect(() => {
    const reload = () => {
      const email = getActiveEmail();
      setActiveEmail(email);
      setAppointment(loadAppointment(email));
      setCatatanAyah(loadCatatanAyah(email));
      setStatus(readAppointmentStatus(email));
    };
    const onUserChanged = () => reload();
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key || ev.key === 'bunda_user_email') reload();
    };
    window.addEventListener('bunda_user_changed', onUserChanged as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('bunda_user_changed', onUserChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);


  const [isEditAppointmentModalOpen, setIsEditAppointmentModalOpen] = useState<boolean>(false);
  const [f, setF] = useState({
    date: appointment.date || '',
    jam: appointment.jam || '',
    jenis: appointment.jenis || '',
    minggu: appointment.minggu !== '' ? String(appointment.minggu) : '',
    dokter: appointment.dokter || '',
    lokasi: appointment.lokasi || '',
    klinik: appointment.klinik || '',
    pesanAyah: appointment.pesanAyah || '',
  });
  const [modalCatatanAyah, setModalCatatanAyah] = useState<string>(catatanAyah);

  const openEditModal = () => {
    setF({
      date: appointment.date || '',
      jam: appointment.jam || '',
      jenis: appointment.jenis || '',
      minggu: appointment.minggu !== '' ? String(appointment.minggu) : '',
      dokter: appointment.dokter || '',
      lokasi: appointment.lokasi || '',
      klinik: appointment.klinik || '',
      pesanAyah: appointment.pesanAyah || '',
    });
    setModalCatatanAyah(catatanAyah);
    setIsEditAppointmentModalOpen(true);
  };

  const handleSaveAppointment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      date: f.date ? f.date : null,
      jam: f.jam,
      jenis: f.jenis,
      minggu: f.minggu,
      dokter: f.dokter,
      lokasi: f.lokasi,
      klinik: f.klinik,
      pesanAyah: f.pesanAyah,
    };
    setAppointment(updated);
    setCatatanAyah(modalCatatanAyah);
    // Simpan PER-USER (by email aktif) supaya tidak ketimpa user lain & tidak di-purge boot.
    const email = activeEmail || getActiveEmail();
    saveAppointment(updated, email);
    saveCatatanAyah(modalCatatanAyah, email);
    persistAppointmentStatus(status, email);
    setIsEditAppointmentModalOpen(false);
  };

  const wt = (dateVal: string | null) => {
    if (!dateVal) return "-";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateVal || "-";
    }
  };

  const appointmentCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const R = () => {
    const canvas = appointmentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tanggalText = "-";
    if (!appointment.date) tanggalText = "-";
    else tanggalText = wt(appointment.date);

    // Portrait Canvas 1080x1280
    canvas.width = 1080;
    canvas.height = 1280;
    const W = 1080, H = 1280;

    // Background gradient (linen / SAGE)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#FAF8F5');
    grad.addColorStop(0.5, '#F4EFE6');
    grad.addColorStop(1, '#ECE5D8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.strokeStyle = '#DDD5C7';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, W - 28, H - 28);

    // Helper: wrap text by max width
    const wrap = (text, x, y, maxW, lh, font, color) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const words = (text || '').split(/\s+/);
      let line = '';
      let cy = y;
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, x, cy);
          cy += lh;
          line = w;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, cy);
    };

    // Avatar square
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(60, 60, 180, 180);
    ctx.strokeStyle = '#DDD5C7';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, 180, 180);
    ctx.font = '104px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👩‍⚕️', 150, 152);

    // Doctor name
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 52px serif';
    const dokterText = appointment.dokter || "-";
    ctx.fillText(dokterText, 270, 130);

    // Jenis / Spesialis
    ctx.fillStyle = '#57534E';
    ctx.font = '30px sans-serif';
    const jenisText = appointment.jenis || "-";
    ctx.fillText(jenisText, 270, 178);

    // Lokasi
    ctx.fillStyle = '#556B2F';
    ctx.font = 'bold 30px sans-serif';
    const lokasiText = appointment.lokasi || "-";
    ctx.fillText(lokasiText, 270, 222);

    // Status Badge top right (3-state color)
    const badgeText = status || "PERLU BOOK";
    ctx.font = 'bold 30px sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 48;
    ctx.fillStyle = status === 'BOOKED' ? '#556B2F' : status === 'PENDING' ? '#0EA5E9' : '#D97706';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - 60 - badgeWidth, 60, badgeWidth, 56, 12);
    else ctx.fillRect(W - 60 - badgeWidth, 60, badgeWidth, 56);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, W - 60 - badgeWidth / 2, 98);

    // Middle Box (Jadwal Pertemuan + Book H-7)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(60, 300, W - 120, 240, 24);
    else ctx.fillRect(60, 300, W - 120, 240);
    ctx.fill();
    ctx.strokeStyle = '#EDE8DF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#78716C';
    ctx.font = '26px sans-serif';
    ctx.fillText('JADWAL PERTEMUAN', 96, 350);

    ctx.fillStyle = '#1C1917';
    ctx.font = 'bold 46px serif';
    const jamStr = appointment.jam ? ` • ${appointment.jam}` : '';
    ctx.fillText(`${tanggalText}${jamStr}`, 96, 410);

    // Book H-7 pill (auto = appointment date - 7 days, format "29 Okt")
    if (appointment.date) {
      try {
        const d7 = new Date(appointment.date);
        if (!isNaN(d7.getTime())) {
          d7.setDate(d7.getDate() - 7);
          const h7Text = `Book H-7: ${d7.getDate()} ${MONTH_NAMES[d7.getMonth()]}`;
          ctx.font = 'bold 28px sans-serif';
          const h7w = ctx.measureText(h7Text).width + 40;
          ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(96, 445, h7w, 48, 10);
          else ctx.fillRect(96, 445, h7w, 48);
          ctx.fill();
          ctx.fillStyle = '#D97706';
          ctx.textAlign = 'left';
          ctx.fillText(h7Text, 116, 478);
        }
      } catch {}
    }

    // Klinik or Minggu Badge (right side of middle box)
    const mingguStr = appointment.minggu !== "" ? `Minggu ${appointment.minggu}` : "Minggu -";
    const subBadge = appointment.klinik || mingguStr;
    ctx.font = 'bold 28px sans-serif';
    const subBadgeWidth = ctx.measureText(subBadge).width + 44;
    ctx.fillStyle = 'rgba(85, 107, 47, 0.12)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - 96 - subBadgeWidth, 350, subBadgeWidth, 52, 12);
    else ctx.fillRect(W - 96 - subBadgeWidth, 350, subBadgeWidth, 52);
    ctx.fill();
    ctx.fillStyle = '#556B2F';
    ctx.textAlign = 'center';
    ctx.fillText(subBadge, W - 96 - subBadgeWidth / 2, 384);

    // Divider
    ctx.strokeStyle = '#D6D3D1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 580);
    ctx.lineTo(W - 60, 580);
    ctx.stroke();

    // Pesan Ayah (Catatan Ayah)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#78716C';
    ctx.font = '24px sans-serif';
    ctx.fillText('PESAN AYAH', 60, 630);
    const pesanStr = appointment.pesanAyah ? `"${appointment.pesanAyah}"` : "-";
    wrap(pesanStr, 60, 680, W - 120, 44, 'italic 34px serif', '#44403C');

    // Catatan Bunda (daily note - ikut ke PNG)
    ctx.fillStyle = '#78716C';
    ctx.font = '24px sans-serif';
    ctx.fillText('CATATAN BUNDA', 60, 820);
    const catatanStr = activeNote ? activeNote : "(belum ada catatan)";
    wrap(catatanStr, 60, 870, W - 120, 44, 'italic 34px serif', '#44403C');

    // Footer Watermark + support email
    ctx.fillStyle = '#A8A29E';
    ctx.font = '24px sans-serif';
    ctx.fillText('bunda. JOURNAL • www.bundajournal.my.id', 60, 1190);
    ctx.fillStyle = '#556B2F';
    ctx.font = '24px sans-serif';
    ctx.fillText('support@bundajournal.my.id', 60, 1230);
  };

  useEffect(() => {
    R();
  }, [appointment, status, catatanAyah]);

  const De = () => {
    const canvas = appointmentCanvasRef.current;
    if (!canvas) return;
    R();
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    let fname = 'jadwal-bunda.png';
    if (appointment.date) {
      try {
        const d = new Date(appointment.date);
        if (!isNaN(d.getTime())) fname = `jadwal-bunda-${d.getDate()}${MONTH_NAMES[d.getMonth()]}${d.getFullYear()}.png`;
      } catch {}
    }
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const Gl = () => {
    let tanggalText = "-";
    if (!appointment.date) tanggalText = "-";
    else tanggalText = wt(appointment.date);

    const jamText = appointment.jam ? ` (${appointment.jam})` : '';
    const dokterText = appointment.dokter || '-';
    const lokasiText = appointment.lokasi || '-';
    const pesanText = appointment.pesanAyah || 'Ayah, kosongin jadwal ya';
    const catatanText = activeNote ? `\nCatatan Bunda: ${activeNote.slice(0, 200)}` : '';
    const text = `${pesanText}\nJadwal USG / Dokter: ${dokterText} di ${lokasiText} (${tanggalText}${jamText})\nStatus: ${status}${catatanText}\n\n* lampirkan foto jadwal ya`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Onboarding 8-Step Interactive Tutorial State (bunda_onboarding_done)
  const [showOnboardingTutorial, setShowOnboardingTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bunda_onboarding_done') !== 'true';
    } catch {
      return false;
    }
  });

  // State Arsip Catatan Dokter Collapsed (44px)
  const [isArsipDokterOpen, setIsArsipDokterOpen] = useState<boolean>(false);
  const [arsipDokterList, setArsipDokterList] = useState<Array<{
    week: number;
    date: string;
    weight: string;
    waist: string;
    bp: string;
    note: string;
    doctor: string;
  }>>(() => {
    const list = [];
    try {
      for (let w = 1; w <= 42; w++) {
        const raw = localStorage.getItem(`bunda_momstats_w${w}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.doctorNote || parsed?.weight || parsed?.waist || parsed?.bloodPressure) {
            list.push({
              week: w,
              date: `Minggu ke-${w}`,
              weight: parsed.weight || '-',
              waist: parsed.waist || '-',
              bp: parsed.bloodPressure || '-',
              note: parsed.doctorNote || 'Pemeriksaan rutin berjalan lancar.',
              doctor: userProfile?.doctorName || '',
            });
          }
        }
      }
    } catch {}
    if (list.length === 0) {
      return [];
    }
    return list;
  });

  // POIN 3 State: Bingkai 4/5 Foto dalam 1 Bulan
  const [monthPhotos, setMonthPhotos] = useState<Record<number, { url: string; label: string; date: string } | null>>(() => {
    const initial: Record<number, { url: string; label: string; date: string } | null> = {};
    for (let i = 0; i < 5; i++) {
      try {
        const saved = localStorage.getItem(`bunda_${week}_foto_${i}`);
        if (saved) {
          initial[i] = JSON.parse(saved);
          continue;
        }
      } catch {}
      initial[i] = null;
    }
    return initial;
  });

  // Dedicated handlers with 500ms debounce save & IndexedDB write queue
  const handleUpdateDailyNote = (dayKey: string, val: string) => {
    const trimmed = val.slice(0, 15000);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const status: 'Selesai' | 'Belum' = trimmed.trim() ? 'Selesai' : 'Belum';

    const updatedEntry: DailyNoteEntry = {
      text: trimmed,
      savedAt: timeStr,
      status,
    };

    // Simpan cepat ke localStorage agar data tidak hilang
    try {
      localStorage.setItem(`bunda_${week}_${selectedDayIndex}_catatan`, JSON.stringify(updatedEntry));
    } catch {}

    setSaveStatus('Menyimpan...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setDayNotesMap((prev: Record<number, DailyNoteEntry>) => ({
        ...prev,
        [selectedDayIndex]: updatedEntry,
      }));

      setDailyNotes((prev: Record<string, string>) => {
        const updated = { ...prev, [dayKey]: trimmed };
        try {
          localStorage.setItem(`bunda_daily_w${week}`, JSON.stringify(updated));
          idbSet(`bunda_daily_w${week}`, updated);
          addToSyncQueue({
            table: 'bunda_daily_notes',
            data: { week, notes: updated },
            action: 'upsert'
          });
          window.dispatchEvent(new Event('bunda_journal_updated'));
          setSaveStatus(`Tersimpan ${timeStr}`);
        } catch {}
        return updated;
      });

      if (dayKey === 'Sen') {
        setJournalText(trimmed);
      }
    }, 300);
  };

  const handleUpdateMomStats = (key: string, val: any) => {
    setMomStats((prev: any) => {
      const updated = { ...prev, [key]: val };
      setSaveStatus('Menyimpan...');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const str = JSON.stringify(updated);
          localStorage.setItem(`bunda_momstats_w${week}`, str);
          await idbSet(`bunda_momstats_w${week}`, updated);
          await addToSyncQueue({
            table: 'bunda_momstats',
            data: { week, stats: updated },
            action: 'upsert'
          });
          window.dispatchEvent(new Event('bunda_journal_updated'));
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setSaveStatus(`Tersimpan ${timeStr}`);
        } catch {}
      }, 500);
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
    // MVP email-only: sync baby_dob (tanggal lahir) untuk segmentasi promo 0-1th. Fire-and-forget.
    if (bab4Data.birthDate) {
      try {
        const email = localStorage.getItem('bunda_user_email') || '';
        if (email) syncBabyDobToSupabase(email, bab4Data.birthDate);
      } catch {}
    }
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
        const initialSen = matched?.text ? matched.text.slice(0, 80) : '';
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
        setMomStats({
          weight: '',
          waist: '',
          bloodPressure: '',
          sleepHourIndex: 1,
          doctorNote: '',
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
        const rawUrl = event.target?.result as string;
        if (!rawUrl) return;

        // Auto compress canvas -> WebP 500px polaroid size
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 500;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            try {
              const webpData = canvas.toDataURL('image/webp', 0.85);
              callback(webpData);
              return;
            } catch (err) {
              console.warn('WebP export fallback', err);
            }
          }
          callback(rawUrl);
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Index hari aktif: dihitung dari TANGGAL HARI INI (bukan hardcode 3 = Sab 31 Okt)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => getTodayPosition().dayIndex);

  useEffect(() => {
    const handleReturnToday = (e: any) => {
      const pos = getTodayPosition();
      setSelectedDayIndex(
        typeof e?.detail?.dayIndex === 'number' ? e.detail.dayIndex : pos.dayIndex
      );
      // Ganti minggu HANYA kalau diminta. Kalau tidak, hormati minggu yang
      // sedang dibuka user (mis. Minggu 36 dari HPHT) - jangan dipaksa 33.
      if (typeof e?.detail?.week === 'number') {
        setWeek(e.detail.week);
      }
    };
    window.addEventListener('bunda_return_today', handleReturnToday);
    return () => window.removeEventListener('bunda_return_today', handleReturnToday);
  }, [setWeek]);

  const DAY_KEYS = ['Rab', 'Kam', 'Jum', 'Sab', 'Min', 'Sen', 'Sel'];
  const DAY_LABELS = ['RAB', 'KAM', 'JUM', 'SAB', 'MIN', 'SEN', 'SEL'];
  const DAY_NAMES_FULL = ['Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Senin', 'Selasa'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Tanggal asli dari HPL user (HPL - 280 = HPHT, minggu 1 = Senin minggu HPHT).
  // Kalau HPL belum ada / tidak valid -> tanggal tampil '-', bukan tanggal dummy.
  const getWeekDays = (activeWeek: number) => {
    const strip = getWeekStrip(activeWeek);
    return DAY_KEYS.map((key, i) => {
      const { date: d, isToday } = strip[i];
      return {
        key,
        label: DAY_LABELS[i],
        dayNameFull: DAY_NAMES_FULL[i],
        dateNum: d ? String(d.getDate()) : '-',
        monthLabel: d ? MONTH_NAMES[d.getMonth()] : '',
        year: d ? d.getFullYear() : '',
        isToday,
      };
    });
  };

  // Reload dayNotesMap & monthPhotos on week change
  useEffect(() => {
    setDayNotesMap(loadDayNotesForWeek(week, dailyNotes));
    const updatedPhotos: Record<number, { url: string; label: string; date: string } | null> = {};
    for (let i = 0; i < 5; i++) {
      try {
        const saved = localStorage.getItem(`bunda_${week}_foto_${i}`);
        if (saved) {
          updatedPhotos[i] = JSON.parse(saved);
          continue;
        }
      } catch {}
      updatedPhotos[i] = null;
    }
    setMonthPhotos(updatedPhotos);
  }, [week]);

  // Dispatch day change for PLUS SYNC (bunda_{week}_{dayIndex}_suplemen, hidrasi, jasmani)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bunda_day_selected', {
      detail: { week, dayIndex: selectedDayIndex }
    }));
  }, [week, selectedDayIndex]);

  const dynamicWeekDays = getWeekDays(week);
  const activeDay = dynamicWeekDays[selectedDayIndex] || dynamicWeekDays[3];

  /** Geser satu hari; otomatis pindah minggu kalau lewat Senin/Minggu. */
  const moveDayBy = (delta: number) => {
    let idx = selectedDayIndex + delta;
    let w = week;
    while (idx > 6) { idx -= 7; w += 1; }
    while (idx < 0) { idx += 7; w -= 1; }
    if (w < 1 || w > 40) return;
    setWeek(w);
    setSelectedDayIndex(idx);
  };

  // Swipe kiri/kanan pada strip tanggal -> ganti hari (bisa nyebrang minggu)
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const onStripTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const onStripTouchEnd = (e: React.TouchEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    moveDayBy(dx < 0 ? 1 : -1);
  };
  const activeNote = dayNotesMap[selectedDayIndex]?.text !== undefined ? dayNotesMap[selectedDayIndex].text : (dailyNotes[activeDay.key] || '');

  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentNoteLength, setCurrentNoteLength] = useState<number>(() => activeNote.length);

  // Auto-balik 5 menit ditangani SATU tempat di App.tsx (event `bunda_return_today`),
  // supaya tidak ada 2 timer yang saling menimpa. Handler di atas yang menerapkan
  // hari + minggu hari ini ke TabJurnal.

  useEffect(() => {
    const text = dayNotesMap[selectedDayIndex]?.text !== undefined 
      ? dayNotesMap[selectedDayIndex].text 
      : (dailyNotes[activeDay.key] || '');
    if (noteTextareaRef.current && noteTextareaRef.current.value !== text) {
      noteTextareaRef.current.value = text;
    }
    setCurrentNoteLength(text.length);
  }, [selectedDayIndex, week, activeDay.key]);

  return (
    <div className="px-4 pt-3 pb-28 space-y-3.5 max-w-xl mx-auto relative">
      {/* Chapter Navigation Selector + Help Button */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-stone-200/70 rounded-xl border border-stone-300/60">
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

        {/* ? Help Button to Replay Tour */}
        <button
          type="button"
          onClick={() => setShowOnboardingTutorial(true)}
          className="w-9 h-9 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-[#556B2F] flex items-center justify-center cursor-pointer shadow-2xs shrink-0 transition-colors"
          title="Panduan Mengisi Jurnal (8 Langkah)"
          aria-label="Panduan Mengisi Jurnal"
        >
          <HelpCircle className="w-4 h-4 text-[#556B2F]" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. BAB 2: JURNAL MINGGUAN (MINGGU 5 S.D. 40 • 72 HALAMAN)     */}
      {/* ============================================================== */}
      {activeChapter === 'bab2' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* Week Selector Slider */}
          {(!pastEntries || pastEntries.length === 0) && Object.values(dailyNotes).every(v => !v || v.trim() === '') && (
            <div id="journal-empty-state" className="bg-[#F9F6F0] p-5 rounded-[20px] border border-[#EDE8DF] text-center space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-850 text-sm">
                  Belum ada jurnal, yuk isi hari ini
                </h4>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Tulis catatan harian pertamamu untuk mengabadikan momen kehamilan berharga ini.
                </p>
              </div>
              <button
                type="button"
                id="btn-isi-jurnal-pertama"
                onClick={() => {
                  const firstInput = document.querySelector('textarea');
                  if (firstInput) {
                    firstInput.focus();
                    firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#556B2F] hover:bg-[#465926] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Isi Jurnal Pertama</span>
              </button>
            </div>
          )}

          {/* Week Navigation Header: 44px push buttons + Lora Bold + Day count */}
          <div id="tour-step-week-nav" className="bg-white p-3.5 rounded-2xl border border-stone-200/70 shadow-xs flex items-center justify-between">
            <button
              type="button"
              id="btn-prev-week"
              disabled={week <= 5}
              onClick={() => {
                if (week > 5) setWeek(week - 1);
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition-colors cursor-pointer shrink-0"
              title="Minggu Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center px-2">
              <h3 className="font-serif font-bold text-base text-stone-900 tracking-tight">
                Minggu {week} {weekData.fruitName}
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Hari {week * 7}
              </p>
            </div>

            <button
              type="button"
              id="btn-next-week"
              disabled={week >= 40}
              onClick={() => {
                if (week < 40) setWeek(week + 1);
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 transition-colors cursor-pointer shrink-0"
              title="Minggu Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Strip Navigation (7 Hari) */}
          <div id="tour-step-day-strip" className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                id="btn-hari-sebelum"
                onClick={() => moveDayBy(-1)}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-stone-400 tracking-wide uppercase">geser hari</span>
              <button
                type="button"
                id="btn-hari-berikut"
                onClick={() => moveDayBy(1)}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div
              className="grid grid-cols-7 gap-1.5 sm:gap-2 touch-pan-y select-none"
              onTouchStart={onStripTouchStart}
              onTouchEnd={onStripTouchEnd}
            >
              {dynamicWeekDays.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const noteItem = dayNotesMap[idx];
                const noteContent = noteItem?.text !== undefined ? noteItem.text : (dailyNotes[day.key] || '');
                const hasNote = noteContent.trim().length > 0;

                return (
                  <button
                    key={day.key}
                    id={`btn-day-strip-${idx}`}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`min-w-[42px] h-[58px] rounded-[10px] flex flex-col items-center justify-center p-1 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                        : hasNote
                        ? 'bg-white border-[#556B2F]/40 text-stone-850 hover:bg-stone-50'
                        : day.isToday
                        ? 'bg-white border-stone-800 text-stone-900 hover:bg-stone-50'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className={`text-[9px] font-semibold tracking-wider ${
                      isSelected ? 'text-stone-300' : 'text-stone-400'
                    }`}>
                      {day.label}
                    </span>
                    <span className={`text-[15px] font-bold leading-tight ${
                      isSelected ? 'text-white' : 'text-stone-850'
                    }`}>
                      {day.dateNum}
                    </span>

                    {/* Indicator dots: green if note exists, dark if today & no note, square if empty */}
                    <div className="mt-0.5 flex items-center justify-center h-2">
                      {hasNote ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#98B06F]' : 'bg-[#556B2F]'}`} />
                      ) : day.isToday ? (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-stone-900'}`} />
                      ) : (
                        <span className={`w-1.5 h-1.5 border rounded-xs ${isSelected ? 'border-stone-500' : 'border-stone-300'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend: Hari ini, Sudah dicatat, Belum dicatat */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-stone-500 pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-stone-900 inline-block" />
                Hari ini
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#556B2F] inline-block" />
                Sudah dicatat
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 border border-stone-400 rounded-xs inline-block" />
                Belum dicatat
              </span>
            </div>
          </div>

          {/* Single Box: Catatan Harian Interaktif Terpilih */}
          <div id="tour-step-catatan-bunda" className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#EDE8DF] shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-3">
            {/* Box Header: Date info left, Fruit Badge right */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                  CATATAN BUNDA
                </span>
                <div className="flex items-center flex-wrap gap-1.5">
                  <h4 className="font-serif text-sm font-bold text-stone-900">
                    {activeDay.dayNameFull}, {activeDay.dateNum} {activeDay.monthLabel} {activeDay.year}
                  </h4>
                  {activeDay.isToday && (
                    <span className="px-1.5 py-0.5 bg-stone-900 text-white rounded text-[9px] font-bold tracking-wide">
                      HARI INI
                    </span>
                  )}
                  <span className="text-[11px] text-stone-400 font-sans">
                    • Catat hari ini
                  </span>
                </div>
              </div>

              {/* Fruit Icon in 44px circle with week number badge and fruit name */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-11 h-11 rounded-full bg-[#F9F6F0] border border-[#EDE8DF] flex items-center justify-center text-xl shadow-2xs">
                  <span>{weekData.fruitEmoji}</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#556B2F] text-white rounded-full text-[9px] font-bold">
                    W{week}
                  </span>
                </div>
                <span className="text-[9.5px] font-serif font-semibold text-stone-600 mt-1 max-w-[64px] text-center truncate">
                  {weekData.fruitName}
                </span>
              </div>
            </div>

            {/* Single Fast Native Textarea (Uncontrolled + debounced for smooth Android input) */}
            <div>
              <textarea
                ref={noteTextareaRef}
                id="textarea-catatan-harian"
                rows={4}
                maxLength={15000}
                defaultValue={activeNote}
                inputMode="text"
                enterKeyHint="done"
                placeholder={`Tulis perasaan atau momen Bunda pada hari ${activeDay.dayNameFull}...`}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const val = (e.currentTarget as HTMLTextAreaElement).value.slice(0, 15000);
                  setCurrentNoteLength(val.length);
                  handleUpdateDailyNote(activeDay.key, val);
                }}
                onTouchEnd={(e: React.TouchEvent<HTMLTextAreaElement>) => {
                  e.stopPropagation();
                  setTimeout(() => noteTextareaRef.current?.focus(), 50);
                }}
                onFocus={() => {
                  setTimeout(() => {
                    noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                className="w-full text-xs sm:text-sm text-stone-850 bg-stone-50/60 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#556B2F] rounded-xl p-3 outline-none transition-colors font-serif italic leading-relaxed min-h-[110px] max-h-[360px] resize-y relative z-10 pointer-events-auto"
                style={{ touchAction: 'manipulation' }}
              />

              {/* Footer: Autosave Status & Character Counter */}
              <div className="flex items-center justify-between text-[11px] mt-1.5 px-0.5">
                <span className="text-[#556B2F] font-medium font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#556B2F] animate-pulse" />
                  {saveStatus}
                </span>
                <span className={`font-sans font-medium ${
                  currentNoteLength >= 15000
                    ? 'text-rose-500 font-bold'
                    : currentNoteLength >= 12000
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`}>
                  {currentNoteLength} / 15.000 karakter
                </span>
              </div>
            </div>
          </div>

          {/* POIN 1: Accordion S&K History Catatan Mingguan */}
          <div className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#EDE8DF] shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">
                    Riwayat Catatan Harian (W{week})
                  </h4>
                  <p className="text-[10px] text-stone-400 font-sans">
                    Model S&K • Ketuk baris untuk expand/collapse
                  </p>
                </div>
              </div>
              {(() => {
                const finishedCount = Object.values(dayNotesMap).filter(n => n.status === 'Selesai' || (n.text && n.text.trim())).length;
                const badgeLabel = finishedCount >= 5 ? `${finishedCount}/5 Lengkap` : `${finishedCount}/5`;
                return (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-sans tracking-wide ${
                    finishedCount >= 5
                      ? 'text-[#556B2F] bg-[#556B2F]/10 border border-[#556B2F]/20'
                      : 'text-stone-600 bg-stone-100'
                  }`}>
                    {badgeLabel}
                  </span>
                );
              })()}
            </div>

            <div className="divide-y divide-stone-100">
              {dynamicWeekDays.map((day, idx) => {
                const noteItem = dayNotesMap[idx] || { text: '', savedAt: '', status: 'Belum' };
                const isSelesai = noteItem.status === 'Selesai' || !!(noteItem.text && noteItem.text.trim());
                const isOpen = openAccordionDayIndex === idx;

                return (
                  <div key={day.key} className="py-2.5 transition-colors">
                    <div
                      onClick={() => setOpenAccordionDayIndex(isOpen ? null : idx)}
                      className="flex items-center justify-between gap-2 cursor-pointer select-none group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelesai ? (
                          <span className="w-4.5 h-4.5 rounded-full bg-[#556B2F] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="w-4.5 h-4.5 rounded-full border border-stone-300 text-stone-400 flex items-center justify-center text-[9px] shrink-0 font-sans">
                            {idx + 1}
                          </span>
                        )}
                        <p className="text-xs font-serif font-bold text-stone-850 truncate group-hover:text-[#556B2F] transition-colors">
                          {day.dayNameFull}, {day.dateNum} {day.monthLabel} {day.year}{noteItem.savedAt ? ` ${noteItem.savedAt}` : ''}
                          {noteItem.text ? (
                            <span className="font-sans font-normal text-stone-500 text-[11px] ml-1.5">
                              • {noteItem.text.length > 30 ? noteItem.text.slice(0, 30) + '...' : noteItem.text}
                            </span>
                          ) : (
                            <span className="font-sans font-normal text-stone-400 text-[11px] ml-1.5 italic">
                              • Belum ada catatan
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                          isSelesai
                            ? 'bg-[#556B2F]/10 text-[#556B2F]'
                            : 'bg-stone-100 text-stone-400'
                        }`}>
                          {isSelesai ? 'Selesai' : 'Belum'}
                        </span>
                        <div className="text-stone-400 group-hover:text-stone-600">
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-2.5 pl-6 pr-1 space-y-2 animate-in fade-in duration-150">
                        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-xs text-stone-800 font-serif leading-relaxed">
                          {noteItem.text ? (
                            <p className="whitespace-pre-wrap">{noteItem.text}</p>
                          ) : (
                            <p className="text-stone-400 font-sans italic">
                              Belum ada catatan pada {day.dayNameFull}. Ketuk tombol di bawah untuk mengisi.
                            </p>
                          )}
                          {noteItem.savedAt && (
                            <span className="block text-[9.5px] font-sans text-stone-400 mt-2 border-t border-stone-200/60 pt-1">
                              Tersimpan otomatis: {noteItem.savedAt} WIB
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDayIndex(idx);
                              const el = document.getElementById('textarea-catatan-harian');
                              if (el) {
                                el.focus();
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="px-3 py-1 bg-[#556B2F] hover:bg-[#465926] text-white rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            {isSelesai ? 'Edit Catatan Hari Ini' : 'Tulis Catatan'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pusat Input: Suplemen & Hidrasi (Segmented Bar + Edit/Hapus/Tambah + Air 2L) */}
          <SupplementWaterCard />

          {/* Pusat Input: Kebutuhan Jasmani (Activity Rings + Form Progres Target) */}
          <div id="tour-step-jasmani">
            <ActivityRingsCard />
          </div>

          {/* [HALAMAN KANAN BUKU Statistik Fisik Bunda & Catatan Dokter] */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-xs space-y-3.5">
            <div className="border-b border-stone-100 pb-2">
              <span className="text-[9px] uppercase font-sans text-stone-400 block tracking-wider font-semibold">
                [Halaman Kanan Buku]
              </span>
              <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-850">
                Statistik Fisik Bunda & Catatan Dokter
              </h4>
            </div>

            {/* [Berat: 54.5 kg] [Lingkar: 82 cm] [Tekanan: 118/76] */}
            <div id="tour-step-statistik" className="grid grid-cols-3 gap-2 text-xs">
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

            {/* Catatan Dokter Obgyn / Bidan: 0/500 */}
            <div id="tour-step-dokter" className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9.5px] text-stone-500 font-medium block">
                  Catatan Dokter Obgyn / Bidan:
                </label>
                <span className={`text-[9px] ${((momStats.doctorNote || '').length >= 500) ? 'text-rose-500 font-bold' : ((momStats.doctorNote || '').length >= 450) ? 'text-amber-600' : 'text-stone-400'}`}>
                  {(momStats.doctorNote || '').length}/500
                </span>
              </div>
              <textarea 
                value={momStats.doctorNote} 
                onChange={(e) => handleUpdateMomStats('doctorNote', e.target.value.slice(0, 500))}
                maxLength={500}
                rows={3}
                placeholder="Catatan hasil USG, detak jantung janin, dan saran vitamin (maksimal 500 karakter)..."
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-stone-850 outline-none focus:border-[#556B2F] font-serif leading-relaxed"
              />
            </div>

            {/* Foto USG / Perut Minggu ke-X [Pilih Foto] + 4/5 polaroid (di DALAM card) */}
            <div id="tour-step-foto-usg" className="pt-2 border-t border-stone-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-serif text-xs font-bold text-stone-850">
                    Foto USG / Perut Minggu ke-{week}
                  </h5>
                  <p className="text-[9px] text-stone-400">Bingkai foto kenangan medis dicetak di halaman kanan buku</p>
                </div>

                <label className="px-3 py-1.5 bg-[#556B2F] text-white rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-[#465926] shadow-2xs transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Pilih Foto</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      handleImageFile(e, (dataUrl) => {
                        const newPhoto = {
                          url: dataUrl,
                          label: 'Foto USG',
                          date: `${activeDay.dateNum} ${activeDay.monthLabel} ${activeDay.year}`,
                        };
                        setMonthPhotos(prev => ({ ...prev, 0: newPhoto }));
                        try {
                          localStorage.setItem(`bunda_${week}_foto_0`, JSON.stringify(newPhoto));
                          localStorage.setItem(`bunda_${week}_${selectedDayIndex}_foto`, JSON.stringify(newPhoto));
                          window.dispatchEvent(new Event('bunda_journal_updated'));
                        } catch {}
                      });
                    }}
                  />
                </label>
              </div>

              {/* Row 4/5 Polaroid di DALAM Card */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2 pt-1">
                {[0, 1, 2, 3, 4].map(idx => {
                  const photoEntry = monthPhotos[idx];
                  const frameTitle = idx === 0 ? 'Foto USG' : `Foto ${idx + 1}`;
                  const defaultDate = `${activeDay.dateNum} ${activeDay.monthLabel} ${activeDay.year}`;

                  return (
                    <div
                      key={idx}
                      className="h-[104px] rounded-xl bg-white border border-[#DDD5C7] shadow-xs p-1 flex flex-col justify-between relative overflow-hidden group hover:border-[#556B2F] transition-colors"
                    >
                      {photoEntry?.url ? (
                        <div className="relative w-full h-full flex flex-col justify-between">
                          <img
                            src={photoEntry.url}
                            alt={photoEntry.label || frameTitle}
                            className="w-full h-[64px] object-cover rounded-md"
                          />
                          <div className="pt-0.5 text-center leading-none">
                            <span className="text-[8px] font-bold text-stone-800 block truncate">
                              {photoEntry.label || frameTitle}
                            </span>
                            <span className="text-[7.5px] text-stone-400 block truncate mt-0.5">
                              {photoEntry.date || defaultDate}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setMonthPhotos(prev => ({ ...prev, [idx]: null }));
                              try {
                                localStorage.removeItem(`bunda_${week}_foto_${idx}`);
                                localStorage.removeItem(`bunda_${week}_${selectedDayIndex}_foto`);
                              } catch {}
                            }}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label className="w-full h-full border-2 border-dashed border-stone-300 hover:border-[#556B2F] rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer transition-colors text-center group/btn">
                          <Camera className="w-4 h-4 text-stone-400 group-hover/btn:text-[#556B2F] mb-1" />
                          <span className="text-[8px] font-bold text-stone-600 group-hover/btn:text-[#556B2F]">
                            {idx === 0 ? 'Frame 1' : `Frame ${idx + 1}`}
                          </span>
                          <span className="text-[7px] text-stone-400">Pilih Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              handleImageFile(e, (dataUrl) => {
                                const newPhoto = {
                                  url: dataUrl,
                                  label: idx === 0 ? 'Foto USG' : `Foto Momen ${idx + 1}`,
                                  date: `${activeDay.dateNum} ${activeDay.monthLabel} ${activeDay.year}`,
                                };
                                setMonthPhotos(prev => ({ ...prev, [idx]: newPhoto }));
                                try {
                                  localStorage.setItem(`bunda_${week}_foto_${idx}`, JSON.stringify(newPhoto));
                                  localStorage.setItem(`bunda_${week}_${selectedDayIndex}_foto`, JSON.stringify(newPhoto));
                                  window.dispatchEvent(new Event('bunda_journal_updated'));
                                } catch {}
                              });
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* [✓ Simpan Catatan Dokter Hari Ini (Tersimpan 19:31)] ← BARU DI SINI, di bawah statistik */}
          <div className="pt-1">
            <button
              type="button"
              id="btn-simpan-catatan-dokter"
              onClick={() => {
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                setSaveStatus(`Tersimpan ${timeStr}`);

                // Simpan momStats week ini
                try {
                  localStorage.setItem(`bunda_momstats_w${week}`, JSON.stringify(momStats));
                  idbSet(`bunda_momstats_w${week}`, momStats);
                  addToSyncQueue({
                    action: 'update',
                    table: 'bunda_momstats',
                    data: { week, ...momStats, savedAt: timeStr },
                  });

                  // Update riwayat arsip dokter
                  setArsipDokterList(prev => {
                    const filtered = prev.filter(item => item.week !== week);
                    return [
                      {
                        week,
                        date: `Minggu ke-${week}`,
                        weight: momStats.weight || '-',
                        waist: momStats.waist || '-',
                        bp: momStats.bloodPressure || '-',
                        note: momStats.doctorNote || 'Pemeriksaan rutin berjalan lancar.',
                        doctor: userProfile?.doctorName || '',
                      },
                      ...filtered,
                    ];
                  });

                  window.dispatchEvent(new Event('bunda_journal_updated'));
                } catch {}
              }}
              className="w-full bg-[#556B2F] hover:bg-[#465926] text-white py-3 px-4 rounded-xl font-medium text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.99]"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                Simpan Catatan Dokter Hari Ini ({saveStatus})
              </span>
            </button>
          </div>

          {/* [📚 Arsip Catatan Dokter (5) • Ketuk untuk lihat] 44px collapsed gak makan ruang */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              id="btn-toggle-arsip-dokter"
              onClick={() => setIsArsipDokterOpen(prev => !prev)}
              className="w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <span className="font-serif text-xs font-bold text-stone-850">
                  Arsip Catatan Dokter ({arsipDokterList.length})
                </span>
                <span className="text-[10px] text-stone-400 font-sans hidden sm:inline">
                  • Ketuk untuk lihat
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500">
                <span className="text-[10.5px] font-sans font-medium">
                  {isArsipDokterOpen ? 'Tutup' : 'Lihat'}
                </span>
                {isArsipDokterOpen ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>

            {/* Expanded List Arsip Catatan Dokter */}
            {isArsipDokterOpen && (
              <div className="px-4 pb-3 pt-1 border-t border-stone-100 space-y-2 bg-[#FAF8F5]/50">
                {arsipDokterList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-stone-200/70 shadow-2xs text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-stone-900 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#556B2F]" />
                        {item.date} • {item.doctor}
                      </span>
                      <span className="text-[9.5px] text-[#556B2F] font-semibold bg-[#556B2F]/10 px-2 py-0.5 rounded-md font-sans">
                        {item.bp} mmHg
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-stone-500 font-sans">
                      <span>Berat: <strong className="text-stone-700">{item.weight}</strong></span>
                      <span>Lingkar: <strong className="text-stone-700">{item.waist}</strong></span>
                    </div>

                    <p className="text-[11px] font-serif text-stone-750 italic leading-relaxed bg-stone-50/70 p-2 rounded-lg border border-stone-100">
                      "{item.note}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* [JADWAL PERTEMUAN DOKTER V10 CLEAN NO DUMMY] */}
          <div id="tour-step-jadwal" className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <span className="text-[9px] uppercase font-sans text-stone-400 block tracking-wider font-semibold">
                  JADWAL PERTEMUAN DOKTER
                </span>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">
                  {appointment.jenis ? appointment.jenis : 'USG / Konsultasi Dokter'}{' '}
                  {appointment.minggu === '' ? 'Minggu -' : `Minggu ${appointment.minggu}`} •{' '}
                  {appointment.dokter === '' ? (
                    <span className="italic text-[#B8B2A5]">Belum diisi</span>
                  ) : (
                    appointment.dokter
                  )}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                  title="Ubah Jadwal"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium hidden sm:inline">Ubah</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const order = ['PERLU BOOK', 'BOOKED', 'PENDING'];
                    const nextStatus = order[(order.indexOf(status) + 1) % order.length];
                    setStatus(nextStatus);
                    persistAppointmentStatus(nextStatus, activeEmail || getActiveEmail());
                  }}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    status === 'BOOKED'
                      ? 'bg-[#556B2F] text-white shadow-2xs'
                      : status === 'PENDING'
                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {status}
                </button>
              </div>
            </div>

            {/* Box hitam: appointment.pesanAyah || "Belum ada pesan untuk Ayah - tap ✎ untuk isi" */}
            <div
              onClick={openEditModal}
              className="bg-stone-900 text-stone-200 text-[10px] sm:text-[10.5px] py-2 px-3 rounded-full flex items-center justify-center text-center font-sans tracking-tight cursor-pointer hover:bg-stone-800 transition-colors select-none shadow-xs"
            >
              <span>{appointment.pesanAyah || 'Belum ada pesan untuk Ayah - tap ✎ untuk isi'}</span>
            </div>

            {/* Catatan preview: {catatanAyah.trim() && <div>Preview: "{catatanAyah}"</div>} */}
            {catatanAyah.trim() && (
              <div className="text-[10px] sm:text-xs text-stone-600 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EDE8DF] font-sans">
                Preview: "{catatanAyah}"
              </div>
            )}

            {/* Kartu Nama Dokter 360x210 Aspect */}
            <div className="w-full max-w-[360px] mx-auto min-h-[210px] rounded-2xl p-4 border border-[#2E362E] bg-gradient-to-br from-[#1E251E] to-[#242B23] shadow-sm relative flex flex-col justify-between space-y-3">
              {/* Top Row: Photo left, Doctor info, BOOKED/PERLU BOOK badge top right */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-13 h-13 rounded-2xl bg-white border border-[#2E362E] p-1 flex items-center justify-center text-2xl shadow-2xs">
                    👩‍⚕️
                  </div>
                  <div>
                    <h5 className="font-serif text-sm font-bold text-stone-100 leading-tight">
                      {appointment.dokter === '' ? (
                        <span className="italic text-[#B8B2A5]">Belum diisi</span>
                      ) : (
                        appointment.dokter
                      )}
                    </h5>
                    <p className="text-[10px] text-stone-400 font-sans">
                      {appointment.jenis || 'Spesialis Obstetri & Ginekologi'}
                    </p>
                    <p className="text-[10px] text-[#9CB89A] font-semibold font-sans mt-0.5">
                      {appointment.lokasi || (
                        <span className="italic text-[#B8B2A5]">Lokasi belum diisi</span>
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                    status === 'BOOKED'
                      ? 'bg-[#556B2F] text-white shadow-2xs'
                      : status === 'PENDING'
                      ? 'bg-sky-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Middle Row: Schedule Info — empty state bila belum ada jadwal */}
              {isAppointmentEmpty(appointment) ? (
                <div
                  id="jadwal-empty-state"
                  className="bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-[#EDE8DF] flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-sans">
                      Jadwal Pertemuan
                    </span>
                    <span className="font-serif italic text-xs text-stone-500">
                      Belum ada jadwal
                    </span>
                  </div>
                  <button
                    type="button"
                    id="btn-atur-jadwal"
                    onClick={openEditModal}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#556B2F] hover:bg-[#46591f] text-white text-[10px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Atur Jadwal</span>
                  </button>
                </div>
              ) : (
              <div className="bg-white/80 backdrop-blur-xs rounded-xl p-2.5 border border-[#EDE8DF] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 block font-sans">
                    Jadwal Pertemuan
                  </span>
                  <span className="font-serif font-bold text-stone-850">
                    {appointment.date ? wt(appointment.date) : '-'}
                    {appointment.jam ? ` • ${appointment.jam}` : ''}
                  </span>
                  {appointment.date && (() => {
                    try {
                      const d = new Date(appointment.date);
                      if (isNaN(d.getTime())) return null;
                      d.setDate(d.getDate() - 7);
                      return <span className="text-[9px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 mt-1 inline-block">Book H-7: {d.getDate()} {MONTH_NAMES[d.getMonth()]}</span>;
                    } catch { return null; }
                  })()}
                </div>
                <span className="text-[10px] text-[#9CB89A] font-semibold bg-[#556B2F]/20 px-2 py-1 rounded-lg">
                  {appointment.klinik || (appointment.minggu === '' ? 'Minggu -' : `Minggu ${appointment.minggu}`)}
                </span>
              </div>
              )}

              {/* Bottom Row: Sweet message + Direct WA & Download De */}
              <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                <p className="font-serif italic text-xs text-stone-300 truncate max-w-[160px]" title={appointment.pesanAyah || 'Belum ada pesan'}>
                  {appointment.pesanAyah ? `"${appointment.pesanAyah}"` : <span className="italic text-[#B8B2A5]">Belum ada pesan</span>}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={De}
                    title="Unduh Kartu PNG"
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={Gl}
                    title="Kirim ke WhatsApp Ayah"
                    className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA Suami</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden Canvas for Canvas R() */}
            <canvas ref={appointmentCanvasRef} width={1080} height={1280} className="hidden" />
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
                  type="date"
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
                  placeholder="Contoh: Pagi hari di rumah"
                  onChange={(e) => setBab1Data({ ...bab1Data, testPackTimePlace: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-850 outline-none focus:border-[#556B2F] placeholder:text-stone-300 placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-stone-500 font-medium block mb-1">
                Yang Pertama Terlintas di Hati Bunda: <span className="text-stone-400 font-normal">{(bab1Data.motherFeelings || '').length}/500</span>
              </label>
              <textarea
                value={bab1Data.motherFeelings}
                onChange={(e) => setBab1Data({ ...bab1Data, motherFeelings: e.target.value.slice(0, 500) })}
                rows={3}
                placeholder=""
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

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Kontraksi Pertama:</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Pukul 02:30 Dini Hari"
                  value={bab4Data.contractionTime}
                  onChange={(e) => setBab4Data({ ...bab4Data, contractionTime: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-bold text-stone-850"
                />
              </div>

              <div>
                <label className="text-[10px] text-stone-500 font-medium block mb-1">Tiba di Rumah Sakit:</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Pukul 04:15 Pagi"
                  value={bab4Data.hospitalArrivalTime}
                  onChange={(e) => setBab4Data({ ...bab4Data, hospitalArrivalTime: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs font-bold text-stone-850"
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
      <div className="pt-2 space-y-2">
        <button
          id="btn-simpan-hari-ini"
          onClick={() => {
            onSaveCurrentEntry();
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setSaveStatus(`Tersimpan ${timeStr}`);
            if (onShowToast) onShowToast(`Catatan tersimpan pukul ${timeStr}`);
          }}
          className="w-full py-3 bg-[#556B2F] hover:bg-[#465926] text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Check className="w-4 h-4 text-emerald-200" />
          <span>Simpan Catatan Hari Ini ({saveStatus})</span>
        </button>

        <button
          onClick={() => {
            onSaveCurrentEntry();
            if (onOpenBookPreview) {
              onOpenBookPreview();
            }
          }}
          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-2xl text-xs flex items-center justify-center gap-2 border border-stone-250 transition-all active:scale-98 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-stone-600" />
          <span>Buka Studio & Tinjau Seluruh Halaman Buku</span>
        </button>
      </div>

      {/* Footer 5 legal links & Midtrans badge (SAGE Locked) */}
      <footer className="pt-6 pb-6 border-t border-[#EDE8DF] text-center space-y-3 font-sans">
        <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center text-[11.5px] text-[#5A6E4A]">
          <a href="/about.html" className="hover:underline">Tentang Kami</a>
          <span className="text-stone-300">•</span>
          <a href="/contact.html" className="hover:underline">Kontak</a>
          <span className="text-stone-300">•</span>
          <a href="/terms.html" className="hover:underline">Syarat &amp; Ketentuan</a>
          <span className="text-stone-300">•</span>
          <a href="/privacy.html" className="hover:underline">Kebijakan Privasi</a>
          <span className="text-stone-300">•</span>
          <a href="/refund.html" className="hover:underline">Kebijakan Refund</a>
        </div>
        <div className="text-[10px] text-stone-500 leading-relaxed">
          © 2026 BUN - Bunda Journal • <a href="mailto:support@bundajournal.my.id" className="underline hover:text-stone-800">support@bundajournal.my.id</a><br />
          Midtrans: GoPay, QRIS, Bank Transfer VA, BSI VA, ShopeePay, OVO, DANA — HTTPS Secured
        </div>
      </footer>

      {/* Modal Edit Appointment */}
      {isEditAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-xl space-y-4 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-serif font-bold text-base text-stone-900">Ubah Jadwal Pertemuan</h3>
              <button
                type="button"
                onClick={() => setIsEditAppointmentModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Nama Dokter</label>
                <input
                  type="text"
                  value={f.dokter}
                  onChange={(e) => setF({ ...f, dokter: e.target.value })}
                  placeholder="Nama dokter, contoh: Dr. SpOG"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Lokasi RS / Klinik</label>
                <input
                  type="text"
                  value={f.lokasi}
                  onChange={(e) => setF({ ...f, lokasi: e.target.value })}
                  placeholder="Nama RS/Klinik"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Jenis Pemeriksaan</label>
                <select
                  value={f.jenis}
                  onChange={(e) => setF({ ...f, jenis: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F] bg-white"
                >
                  <option value="">Pilih jenis</option>
                  <option value="USG Trimester 1">USG Trimester 1</option>
                  <option value="USG Trimester 2">USG Trimester 2</option>
                  <option value="USG Trimester 3">USG Trimester 3</option>
                  <option value="USG Fetomaternal">USG Fetomaternal</option>
                  <option value="Konsultasi Rutin Obgyn">Konsultasi Rutin Obgyn</option>
                  <option value="Pemeriksaan Bidan">Pemeriksaan Bidan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={f.date || ''}
                    onChange={(e) => setF({ ...f, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Jam</label>
                  <input
                    type="time"
                    value={f.jam}
                    onChange={(e) => setF({ ...f, jam: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Minggu Ke-</label>
                  <input
                    type="text"
                    value={f.minggu}
                    onChange={(e) => setF({ ...f, minggu: e.target.value })}
                    placeholder="Contoh: 32"
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Klinik / Poli</label>
                  <input
                    type="text"
                    value={f.klinik}
                    onChange={(e) => setF({ ...f, klinik: e.target.value })}
                    placeholder="Contoh: Poli Kebidanan"
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Pesan untuk Ayah</label>
                <input
                  type="text"
                  value={f.pesanAyah}
                  onChange={(e) => setF({ ...f, pesanAyah: e.target.value })}
                  placeholder="Pesan singkat untuk Ayah..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-medium text-stone-600 mb-1">Catatan Persiapan Ayah</label>
                <textarea
                  rows={2}
                  value={modalCatatanAyah}
                  onChange={(e) => setModalCatatanAyah(e.target.value)}
                  placeholder="Catatan persiapan, contoh: Bawa buku KIA..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-[#556B2F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditAppointmentModalOpen(false)}
                  className="px-3 py-1.5 text-stone-500 hover:text-stone-800 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#556B2F] hover:bg-[#475a27] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Jurnal Interactive Tutorial (8 Steps Spotlight) */}
      <OnboardingJurnalTutorial
        isOpen={showOnboardingTutorial}
        onClose={() => setShowOnboardingTutorial(false)}
        onFinish={() => {
          setShowOnboardingTutorial(false);
          try {
            localStorage.setItem('bunda_onboarding_done', 'true');
          } catch {}
          setTimeout(() => {
            const textarea = document.getElementById('textarea-catatan-harian');
            if (textarea) {
              textarea.focus();
              textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }}
      />
    </div>
  );
};
