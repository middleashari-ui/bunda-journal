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
import { DAILY_NOTE_MAX_CHARS } from '../config/journal';
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

  // Debounce autosave timers (P0.4): notes & stats pakai timer terpisah agar tidak saling cancel.
  // Debounce tetap 300ms (notes) dan 500ms (stats).
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNoteRef = useRef<{
    dayKey: string;
    val: string;
    entry: DailyNoteEntry;
    weekAtSchedule: number;
    dayIndexAtSchedule: number;
  } | null>(null);
  const pendingStatsRef = useRef<{ snapshot: any; weekAtSchedule: number } | null>(null);
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
  const [isRiwayatOpen, setIsRiwayatOpen] = useState<boolean>(false);

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

  const statusLabel =
    status === 'BOOKED' ? 'Sudah booking' : status === 'PENDING' ? 'Menunggu konfirmasi' : 'Perlu booking';

  const doctorInitials = (() => {
    const words = (appointment.dokter || '')
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w) && !/^(dr|drg|sp)$/i.test(w));
    const letters = words.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    return letters || 'Dr';
  })();

  // Kartu jadwal untuk dikirim ke Ayah (PNG 1080x1280).
  // Gaya mengikuti buku cetak: kertas linen, serif, aksen olive & terakota.
  const R = () => {
    const canvas = appointmentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1280;
    canvas.width = W;
    canvas.height = H;

    const tanggalText = appointment.date ? wt(appointment.date) : 'Tanggal belum diisi';
    const jamText = appointment.jam || 'Jam belum diisi';
    const tempatText = appointment.lokasi || '';
    const dokterText = appointment.dokter || 'Dokter belum diisi';
    const jenisText = appointment.jenis || 'Kontrol kehamilan';
    const pesanText = appointment.pesanAyah || 'Ayah, tolong kosongkan jadwal ini ya.';
    const namaAnak = (userProfile.babyNickname || '').trim();

    // Kertas
    ctx.fillStyle = '#FAF9F7';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, W - 56, H - 56);

    // Washi tape
    ctx.save();
    ctx.translate(W / 2, 64);
    ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(200, 122, 100, 0.38)';
    ctx.fillRect(-110, -18, 220, 36);
    ctx.restore();

    const wrap = (text: string, x: number, y: number, maxW: number, lh: number, font: string, color: string) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const words = String(text || '').split(/\s+/);
      let line = '';
      let cy = y;
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, x, cy);
          cy += lh;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, cy);
      return cy;
    };

    // Label kecil
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#A25E4B';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText('JADWAL KONTROL', 96, 190);

    // Tanggal besar
    ctx.fillStyle = '#1C1917';
    ctx.font = '700 62px Lora, Georgia, serif';
    ctx.fillText(tanggalText, 96, 268);

    // Jam & tempat
    ctx.fillStyle = '#78716C';
    ctx.font = '30px Inter, sans-serif';
    const sub = [jamText, appointment.klinik || '', tempatText].filter(Boolean).join('  •  ');
    ctx.fillText(sub, 96, 318);

    if (appointment.minggu !== '' && appointment.minggu !== null && appointment.minggu !== undefined) {
      ctx.fillStyle = '#556B2F';
      ctx.font = '600 26px Inter, sans-serif';
      ctx.fillText(`Minggu ke-${appointment.minggu}`, 96, 366);
    }

    // Garis
    ctx.strokeStyle = '#E7E5E4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, 410);
    ctx.lineTo(W - 96, 410);
    ctx.stroke();

    // Dokter
    ctx.fillStyle = '#F1F4EA';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(96, 450, 92, 92, 46);
    else ctx.arc(142, 496, 46, 0, Math.PI * 2);
    ctx.fill();

    const initials = (() => {
      const words = dokterText.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !/^(dr|drg|sp)$/i.test(w));
      return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'Dr';
    })();
    ctx.fillStyle = '#556B2F';
    ctx.font = '700 34px Lora, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(initials, 142, 508);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#1C1917';
    ctx.font = '600 38px Lora, Georgia, serif';
    ctx.fillText(dokterText, 214, 494);
    ctx.fillStyle = '#78716C';
    ctx.font = '26px Inter, sans-serif';
    ctx.fillText(jenisText, 214, 534);

    // Chip Book H-7
    if (appointment.date) {
      try {
        const d7 = new Date(appointment.date);
        if (!isNaN(d7.getTime())) {
          d7.setDate(d7.getDate() - 7);
          const h7 = `Book H-7: ${d7.getDate()} ${MONTH_NAMES[d7.getMonth()]}`;
          ctx.font = '600 24px Inter, sans-serif';
          const w = ctx.measureText(h7).width + 44;
          ctx.fillStyle = '#FDF6EA';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(W - 96 - w, 458, w, 48, 12);
          else ctx.fillRect(W - 96 - w, 458, w, 48);
          ctx.fill();
          ctx.fillStyle = '#B45309';
          ctx.fillText(h7, W - 96 - w + 22, 490);
        }
      } catch {}
    }

    // Pesan untuk Ayah
    ctx.fillStyle = '#8A8178';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('PESAN UNTUK AYAH', 96, 640);
    const lastY = wrap(`\u201c${pesanText}\u201d`, 96, 700, W - 192, 52, 'italic 40px Lora, Georgia, serif', '#44403C');

    // Nama anak
    if (namaAnak) {
      ctx.fillStyle = '#8A8178';
      ctx.font = '24px Inter, sans-serif';
      ctx.fillText(`Untuk ${namaAnak}`, 96, Math.max(lastY + 70, 860));
    }

    // Garis penutup + satu kalimat pengingat (mengisi ruang bawah dengan tenang)
    const lineY = Math.max(lastY + 170, 950);
    ctx.strokeStyle = '#EFE8DC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, lineY);
    ctx.lineTo(W - 96, lineY);
    ctx.stroke();

    ctx.fillStyle = '#A8A29E';
    ctx.font = 'italic 30px Lora, Georgia, serif';
    ctx.fillText('Kontrol rutin membantu memastikan si kecil tumbuh baik.', 96, lineY + 56);

    // Footer
    ctx.fillStyle = '#C9C3B8';
    ctx.font = '22px Inter, sans-serif';
    ctx.fillText('bundajournal.my.id', 96, H - 96);
    ctx.fillStyle = '#1C1917';
    ctx.font = '700 40px Lora, Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('bunda.', W - 96, H - 92);
    ctx.textAlign = 'left';
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

  // Kirim kartu jadwal sebagai GAMBAR ke WhatsApp (share sheet: WhatsApp langsung muncul).
  // Fallback: simpan gambar + buka WhatsApp dengan teks, kalau browser tidak mendukung file share.
  const shareJadwal = async () => {
    if (isAppointmentEmpty(appointment)) return;
    R();
    const canvas = appointmentCanvasRef.current;
    let blob: Blob | null = null;
    if (canvas) blob = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));

    const namaAnak = (userProfile.babyNickname || '').trim();
    const when = appointment.date ? wt(appointment.date) : '';
    const jam = appointment.jam ? ` pukul ${appointment.jam}` : '';
    const tempat = appointment.lokasi ? ` di ${appointment.lokasi}` : '';
    const jenis = appointment.jenis || 'kontrol kehamilan';
    const pesan = appointment.pesanAyah || `Ayah, tolong kosongkan jadwal${when ? ` ${when}` : ''}${jam} ya.`;
    const lines = [pesan, '', `${jenis}${tempat}${when ? ` — ${when}${jam}` : ''}`];
    if (namaAnak) lines.push(`Untuk ${namaAnak}`);
    const text = lines.join('\n');

    const file = blob ? new File([blob], 'jadwal-bunda.png', { type: 'image/png' }) : null;
    const canShareFiles =
      !!file && typeof navigator !== 'undefined' && !!(navigator as any).canShare?.({ files: [file] });

    if (canShareFiles) {
      try {
        await (navigator as any).share({ files: [file], text, title: 'Jadwal kontrol' });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jadwal-bunda.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + '\n\n(kartu jadwal tersimpan sebagai gambar — lampirkan ya)')}`,
      '_blank'
    );
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
  type MonthPhoto = { url: string; label: string; date: string };

  // Sinkron dua arah dengan array global `bunda_photos`: Studio (PrintBookStudio)
  // & dokumen PDF hanya membaca `bunda_photos` / customPhotos, jadi foto yang
  // diunggah di Jurnal harus ikut ditulis ke sana supaya langsung tercetak.
  const readGlobalPhotos = (): PhotoMemory[] => {
    try {
      const raw = localStorage.getItem('bunda_photos');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const syncPhotoToGlobal = (w: number, photo: MonthPhoto) => {
    try {
      const base = (photos && photos.length ? photos : readGlobalPhotos()).filter((p) => p.week !== w);
      const next: PhotoMemory[] = [
        ...base,
        {
          id: `week-${w}`,
          caption: photo.label || 'Foto USG',
          date: photo.date || '',
          src: photo.url,
          url: photo.url,
          week: w,
          isCustom: true,
        },
      ];
      localStorage.setItem('bunda_photos', JSON.stringify(next));
      setPhotos(next);
    } catch {}
  };

  const removePhotoFromGlobal = (w: number, photo: MonthPhoto | null | undefined) => {
    if (!photo?.url) return;
    try {
      const base = photos && photos.length ? photos : readGlobalPhotos();
      const next = base.filter((p) => !(p.week === w && (p.src === photo.url || p.url === photo.url)));
      localStorage.setItem('bunda_photos', JSON.stringify(next));
      setPhotos(next);
    } catch {}
  };

  // 5 frame foto minggu ini. Kalau key lama (bunda_{week}_foto_{i}) kosong,
  // pakai foto global `bunda_photos` agar tidak hilang antar-halaman.
  const loadMonthPhotos = (w: number): Record<number, MonthPhoto | null> => {
    const initial: Record<number, MonthPhoto | null> = {};
    for (let i = 0; i < 5; i++) {
      initial[i] = null;
      try {
        const saved = localStorage.getItem(`bunda_${w}_foto_${i}`);
        if (saved) initial[i] = JSON.parse(saved);
      } catch {}
    }
    if (!Object.values(initial).some(Boolean)) {
      const global = readGlobalPhotos().find((p) => p.week === w && (p.src || p.url));
      if (global) {
        initial[0] = {
          url: global.src || global.url || '',
          label: global.caption || 'Foto USG',
          date: global.date || '',
        };
      }
    }
    return initial;
  };

  const [monthPhotos, setMonthPhotos] = useState<Record<number, MonthPhoto | null>>(() => loadMonthPhotos(week));

  // Dedicated handlers with separate 300ms/500ms debounce save & IndexedDB write queue
  const persistNoteNow = (
    entry: DailyNoteEntry,
    dayKey: string,
    weekVal: number,
    dayIndexVal: number,
  ) => {
    setDayNotesMap((prev: Record<number, DailyNoteEntry>) => ({
      ...prev,
      [dayIndexVal]: entry,
    }));

    setDailyNotes((prev: Record<string, string>) => {
      const updated = { ...prev, [dayKey]: entry.text };
      try {
        localStorage.setItem(`bunda_daily_w${weekVal}`, JSON.stringify(updated));
        idbSet(`bunda_daily_w${weekVal}`, updated);
        addToSyncQueue({
          table: 'bunda_daily_notes',
          data: { week: weekVal, notes: updated },
          action: 'upsert'
        });
        window.dispatchEvent(new Event('bunda_journal_updated'));
        setSaveStatus(`Tersimpan ${entry.savedAt}`);
      } catch {}
      return updated;
    });

    if (dayKey === 'Sen') {
      setJournalText(entry.text);
    }
  };

  const persistStatsNow = (updated: any, weekVal: number) => {
    try {
      const str = JSON.stringify(updated);
      localStorage.setItem(`bunda_momstats_w${weekVal}`, str);
      void idbSet(`bunda_momstats_w${weekVal}`, updated);
      void addToSyncQueue({
        table: 'bunda_momstats',
        data: { week: weekVal, stats: updated },
        action: 'upsert'
      });
      window.dispatchEvent(new Event('bunda_journal_updated'));
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSaveStatus(`Tersimpan ${timeStr}`);
    } catch {}
  };

  const flushPendingNotes = () => {
    if (notesTimerRef.current) {
      clearTimeout(notesTimerRef.current);
      notesTimerRef.current = null;
    }
    const pending = pendingNoteRef.current;
    pendingNoteRef.current = null;
    if (pending) {
      persistNoteNow(pending.entry, pending.dayKey, pending.weekAtSchedule, pending.dayIndexAtSchedule);
    }
  };

  const flushPendingStats = () => {
    if (statsTimerRef.current) {
      clearTimeout(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    const pending = pendingStatsRef.current;
    pendingStatsRef.current = null;
    if (pending) {
      persistStatsNow(pending.snapshot, pending.weekAtSchedule);
    }
  };

  const flushAllPending = () => {
    flushPendingNotes();
    flushPendingStats();
  };

  const handleUpdateDailyNote = (dayKey: string, val: string) => {
    const trimmed = val.slice(0, DAILY_NOTE_MAX_CHARS);
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
    pendingNoteRef.current = {
      dayKey,
      val: trimmed,
      entry: updatedEntry,
      weekAtSchedule: week,
      dayIndexAtSchedule: selectedDayIndex,
    };
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      const pending = pendingNoteRef.current;
      pendingNoteRef.current = null;
      notesTimerRef.current = null;
      if (!pending) return;
      persistNoteNow(pending.entry, pending.dayKey, pending.weekAtSchedule, pending.dayIndexAtSchedule);
    }, 300);
  };

  const handleUpdateMomStats = (key: string, val: any) => {
    setMomStats((prev: any) => {
      const updated = { ...prev, [key]: val };
      setSaveStatus('Menyimpan...');
      pendingStatsRef.current = { snapshot: updated, weekAtSchedule: week };
      if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
      statsTimerRef.current = setTimeout(() => {
        const pending = pendingStatsRef.current;
        pendingStatsRef.current = null;
        statsTimerRef.current = null;
        if (!pending) return;
        persistStatsNow(pending.snapshot, pending.weekAtSchedule);
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
  // P0.4: flush pending debounce (old week) dulu sebelum state ditimpa data minggu baru.
  useEffect(() => {
    flushAllPending();
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

  // Suasana hati per hari — disimpan ke `bunda_daily_moods_w{week}`
  // (dibaca juga oleh buku jurnal & widget Beranda).
  const [weekMoods, setWeekMoods] = useState<Array<number | null>>(() => {
    try {
      const raw = localStorage.getItem(`bunda_daily_moods_w${week}`);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.from({ length: 7 }, (_, i) => (typeof arr?.[i] === 'number' ? arr[i] : null));
    } catch {
      return Array.from({ length: 7 }, () => null);
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`bunda_daily_moods_w${week}`);
      const arr = raw ? JSON.parse(raw) : [];
      setWeekMoods(Array.from({ length: 7 }, (_, i) => (typeof arr?.[i] === 'number' ? arr[i] : null)));
    } catch {
      setWeekMoods(Array.from({ length: 7 }, () => null));
    }
  }, [week]);

  const MOOD_CHOICES = [
    { emoji: '🥰', label: 'Bahagia' },
    { emoji: '😊', label: 'Tenang' },
    { emoji: '🥺', label: 'Cemas' },
    { emoji: '😫', label: 'Lelah' },
  ];

  const handleMoodSelect = (idx: number) => {
    setWeekMoods((prev) => {
      const next = [...prev];
      next[selectedDayIndex] = prev[selectedDayIndex] === idx ? null : idx;
      try {
        localStorage.setItem(`bunda_daily_moods_w${week}`, JSON.stringify(next));
        window.dispatchEvent(new Event('bunda_journal_updated'));
      } catch {}
      return next;
    });
  };

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
    setMonthPhotos(loadMonthPhotos(week));
  }, [week]);

  // Dispatch day change for PLUS SYNC (bunda_{week}_{dayIndex}_suplemen, hidrasi, jasmani)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bunda_day_selected', {
      detail: { week, dayIndex: selectedDayIndex }
    }));
  }, [week, selectedDayIndex]);

  const dynamicWeekDays = getWeekDays(week);
  const weekNoteCount = Object.values(dayNotesMap).filter(
    (n: any) => n && (n.status === 'Selesai' || (n.text && String(n.text).trim()))
  ).length;
  const latestNoteEntry = (() => {
    const list = dynamicWeekDays
      .map((d: any, i: number) => ({ day: d.dayNameFull, text: (dayNotesMap[i]?.text || '').trim() }))
      .filter((e: any) => e.text);
    return list.length ? list[list.length - 1] : null;
  })();
  const activeDay = dynamicWeekDays[selectedDayIndex] || dynamicWeekDays[3];

  /** Geser satu hari; otomatis pindah minggu kalau lewat Senin/Minggu. */
  const moveDayBy = (delta: number) => {
    let idx = selectedDayIndex + delta;
    let w = week;
    while (idx > 6) { idx -= 7; w += 1; }
    while (idx < 0) { idx += 7; w -= 1; }
    if (w < 1 || w > 40) return;
    flushAllPending();
    setWeek(w);
    setSelectedDayIndex(idx);
  };

  // P0.4: flush pending saat tab disembunyikan/ditutup + saat unmount (pindah halaman).
  const flushAllPendingRef = useRef(flushAllPending);
  flushAllPendingRef.current = flushAllPending;
  useEffect(() => {
    const onPersist = () => {
      try {
        flushAllPendingRef.current();
      } catch {}
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try {
          flushAllPendingRef.current();
        } catch {}
      }
    };
    window.addEventListener('beforeunload', onPersist);
    window.addEventListener('pagehide', onPersist);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onPersist);
      window.removeEventListener('pagehide', onPersist);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  useEffect(() => {
    return () => {
      try {
        flushAllPendingRef.current();
      } catch {}
    };
  }, []);

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
        <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-stone-200/70 rounded-xl border border-stone-300/60 snap-x snap-mandatory">
          <button
            onClick={() => setActiveChapter('bab2')}
            className={`snap-start px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeChapter === 'bab2'
                ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Jurnal
          </button>

          <button
            onClick={() => setActiveChapter('bab1')}
            className={`snap-start px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeChapter === 'bab1'
                ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Awal
          </button>

          <button
            onClick={() => setActiveChapter('bab3')}
            className={`snap-start px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeChapter === 'bab3'
                ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Persiapan
          </button>

          <button
            onClick={() => setActiveChapter('bab4')}
            className={`snap-start px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeChapter === 'bab4'
                ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Lahir
          </button>

          <button
            onClick={() => setActiveChapter('bab5')}
            className={`snap-start px-3 py-1.5 rounded-lg text-[11.5px] font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeChapter === 'bab5'
                ? 'bg-[#556B2F] text-white font-bold shadow-2xs'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            Kapsul
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
            <div id="journal-empty-state" className="bg-[#F9F6F0] p-5 rounded-2xl border border-[#EDE8DF] text-center space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-850 text-sm">
                  Belum ada catatan untuk hari ini.
                </h4>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Tulis catatan harian pertamamu. Mulai dari satu kalimat — nanti bisa Bunda baca lagi kapan saja.
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
                if (week > 5) { flushAllPending(); setWeek(week - 1); }
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
                if (week < 40) { flushAllPending(); setWeek(week + 1); }
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
                    onClick={() => { flushAllPending(); setSelectedDayIndex(idx); }}
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
          <div id="tour-step-catatan-bunda" className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EDE8DF] shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-3">
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
                maxLength={DAILY_NOTE_MAX_CHARS}
                defaultValue={activeNote}
                inputMode="text"
                enterKeyHint="done"
                placeholder={`Tulis perasaan atau momen Bunda pada hari ${activeDay.dayNameFull}...`}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const ta = e.currentTarget as HTMLTextAreaElement;
                  ta.style.height = 'auto';
                  ta.style.height = ta.scrollHeight + 'px';
                  const val = ta.value.slice(0, DAILY_NOTE_MAX_CHARS);
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
                className="w-full text-xs sm:text-sm text-stone-850 bg-stone-50/60 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#556B2F] rounded-xl p-3 outline-none transition-colors font-serif italic leading-relaxed min-h-[110px] resize-none relative z-10 pointer-events-auto overflow-visible"
                style={{ touchAction: 'manipulation', height: 'auto', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' as any }}
              />

              {/* Suasana hati hari ini — masuk ke buku jurnal & widget Beranda */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-stone-400">Suasana hati</span>
                <div className="flex items-center gap-1.5">
                  {MOOD_CHOICES.map((m, idx) => {
                    const active = weekMoods[selectedDayIndex] === idx;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => handleMoodSelect(idx)}
                        title={m.label}
                        aria-label={m.label}
                        aria-pressed={active}
                        className={`w-7 h-7 rounded-full text-[13px] flex items-center justify-center border transition-colors cursor-pointer ${
                          active
                            ? 'border-[#556B2F] bg-[#F1F4EA]'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        {m.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer: Autosave Status & Character Counter */}
              <div className="flex items-center justify-between text-[11px] mt-1.5 px-0.5">
                <span className="text-[#556B2F] font-medium font-sans flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#556B2F] animate-pulse" />
                  {saveStatus}
                </span>
                <span className={`font-sans font-medium ${
                  currentNoteLength >= DAILY_NOTE_MAX_CHARS
                    ? 'text-rose-500 font-bold'
                    : currentNoteLength >= DAILY_NOTE_MAX_CHARS - 20
                    ? 'text-amber-600'
                    : 'text-stone-400'
                }`} title="Batas agar catatan muat 2 baris di buku jurnal">
                  {`${currentNoteLength}/${DAILY_NOTE_MAX_CHARS} karakter`}
                </span>
              </div>
            </div>

          {/* Riwayat catatan — ringkas, bisa dilipat */}
            <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F] shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <h4 className="font-serif text-[13px] font-bold text-stone-900">Riwayat catatan</h4>
                  <p className="text-[10px] text-stone-400">
                    {weekNoteCount}/7 hari terisi minggu ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRiwayatOpen((v) => !v)}
                className="text-[10.5px] font-semibold text-[#556B2F] hover:text-[#465926] px-2 py-1 rounded-lg hover:bg-[#556B2F]/10 cursor-pointer flex items-center gap-1 shrink-0"
              >
                {isRiwayatOpen ? 'Tutup' : 'Lihat'}
                {isRiwayatOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {!isRiwayatOpen && (
              <p className="mt-2.5 text-[11px] text-stone-500 leading-relaxed">
                {latestNoteEntry ? (
                  <>
                    Terakhir: <span className="text-stone-700 font-medium">{latestNoteEntry.day}</span>
                    {' — '}
                    <span className="font-serif italic text-stone-600">
                      &ldquo;{latestNoteEntry.text.length > 70 ? latestNoteEntry.text.slice(0, 70) + '…' : latestNoteEntry.text}&rdquo;
                    </span>
                  </>
                ) : (
                  'Belum ada catatan minggu ini. Satu kalimat sudah cukup.'
                )}
              </p>
            )}

            {isRiwayatOpen && (
              <div className="mt-2 divide-y divide-stone-100">
                {dynamicWeekDays.map((day: any, idx: number) => {
                  const noteItem = (dayNotesMap as any)[idx] || { text: '', savedAt: '', status: 'Belum' };
                  const isSelesai = noteItem.status === 'Selesai' || !!(noteItem.text && String(noteItem.text).trim());
                  const isOpen = openAccordionDayIndex === idx;

                  return (
                    <div key={day.key} className="py-2">
                      <button
                        type="button"
                        onClick={() => setOpenAccordionDayIndex(isOpen ? null : idx)}
                        className="w-full flex items-center gap-2 text-left cursor-pointer group"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            isSelesai ? 'bg-[#556B2F]' : 'bg-stone-300'
                          }`}
                        />
                        <span className="text-[10.5px] font-semibold text-stone-600 shrink-0">
                          {String(day.dayNameFull).slice(0, 3)}, {day.dateNum} {day.monthLabel}
                        </span>
                        <span
                          className={`flex-1 truncate text-[11px] ${
                            isSelesai ? 'text-stone-600' : 'text-stone-400 italic'
                          }`}
                        >
                          {isSelesai ? noteItem.text : 'Belum ada catatan'}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="mt-2 pl-3.5 space-y-2 animate-in fade-in duration-150">
                          <p className="font-serif text-[12px] leading-relaxed text-stone-700 whitespace-pre-wrap">
                            {noteItem.text || 'Belum ada catatan pada hari ini.'}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            {noteItem.savedAt ? (
                              <span className="text-[9px] text-stone-400">Tersimpan {noteItem.savedAt}</span>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                flushAllPending();
                                setSelectedDayIndex(idx);
                                const el = document.getElementById('textarea-catatan-harian');
                                if (el) {
                                  el.focus();
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="px-2.5 py-1 bg-[#556B2F] hover:bg-[#465926] text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
                            >
                              {isSelesai ? 'Edit' : 'Tulis'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
                Ikut tercetak di buku
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
                  <p className="text-[9px] text-stone-400">Foto ini ikut tercetak di halaman kanan buku.</p>
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
                        syncPhotoToGlobal(week, newPhoto);
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
                              removePhotoFromGlobal(week, photoEntry);
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
                                syncPhotoToGlobal(week, newPhoto);
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
            {/* Arsip pemeriksaan sebelumnya (bagian dari kartu yang sama) */}
            <div className="pt-3 border-t border-stone-100">
              <button
                type="button"
                id="btn-toggle-arsip-dokter"
                onClick={() => setIsArsipDokterOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <span className="font-serif text-[11.5px] font-bold text-stone-800">
                  Arsip pemeriksaan ({arsipDokterList.length})
                </span>
                <span className="flex items-center gap-1 text-[10px] text-stone-500">
                  {isArsipDokterOpen ? 'Tutup' : 'Lihat'}
                  {isArsipDokterOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  )}
                </span>
              </button>

              {isArsipDokterOpen && (
                <div className="mt-2 space-y-2">
                  {arsipDokterList.length === 0 && (
                    <p className="text-[10.5px] text-stone-400 leading-relaxed">
                      Belum ada arsip. Simpan catatan dokter minggu ini untuk mulai mengumpulkan riwayat.
                    </p>
                  )}
                  {arsipDokterList.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-200/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-stone-900 text-[11.5px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#556B2F]" />
                          {item.date}{item.doctor ? ` • ${item.doctor}` : ''}
                        </span>
                        <span className="text-[9.5px] text-[#556B2F] font-semibold bg-[#556B2F]/10 px-2 py-0.5 rounded-md">
                          {item.bp} mmHg
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[10px] text-stone-500">
                        <span className="flex items-center gap-3">
                          <span>Berat: <strong className="text-stone-700">{item.weight}</strong></span>
                          <span>Lingkar: <strong className="text-stone-700">{item.waist}</strong></span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setWeek(item.week);
                            setActiveChapter('bab2');
                          }}
                          className="text-[9.5px] font-semibold text-[#556B2F] hover:text-[#465926] cursor-pointer shrink-0"
                        >
                          Buka minggu {item.week}
                        </button>
                      </div>
                      <p className="text-[11px] font-serif text-stone-600 italic leading-relaxed">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
              <span className="flex flex-col items-start leading-tight">
                <span className="font-semibold">Simpan catatan dokter</span>
                <span className="text-[9.5px] font-normal text-white/80">{saveStatus}</span>
              </span>
            </button>
            </div>
          </div>

          {/* Jadwal kontrol + pesan untuk Ayah */}
          <div id="tour-step-jadwal" className="bg-white p-4 rounded-2xl border border-stone-200/70 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#A25E4B] font-semibold">Jadwal kontrol</p>
                <p className="font-serif text-[17px] text-stone-850 mt-1 leading-tight">
                  {appointment.date ? wt(appointment.date) : 'Belum ada tanggal'}
                </p>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  {appointment.jam ? appointment.jam : 'Jam belum diisi'}
                  {appointment.klinik ? ` \u2022 ${appointment.klinik}` : ''}
                  {appointment.minggu !== '' ? ` \u2022 Minggu ${appointment.minggu}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const order = ['PERLU BOOK', 'BOOKED', 'PENDING'];
                    const nextStatus = order[(order.indexOf(status) + 1) % order.length];
                    setStatus(nextStatus);
                    persistAppointmentStatus(nextStatus, activeEmail || getActiveEmail());
                  }}
                  className={`px-2.5 py-1 rounded-full text-[9.5px] font-semibold tracking-wide transition-colors cursor-pointer ${
                    status === 'BOOKED'
                      ? 'bg-[#F1F4EA] text-[#556B2F] border border-[#E3E9D6]'
                      : status === 'PENDING'
                      ? 'bg-sky-50 text-sky-700 border border-sky-100'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                  title="Ketuk untuk ubah status"
                >
                  {statusLabel}
                </button>
                <button
                  type="button"
                  onClick={openEditModal}
                  aria-label="Ubah jadwal"
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isAppointmentEmpty(appointment) ? (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#DED6C8] bg-[#FCFAF5] px-3 py-2.5">
                <p className="text-[10.5px] text-stone-500 leading-snug">
                  Belum ada jadwal. Isi sekali, nanti bisa langsung dikirim ke Ayah.
                </p>
                <button
                  type="button"
                  id="btn-atur-jadwal"
                  onClick={openEditModal}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#556B2F] hover:bg-[#465926] text-white text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Atur
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#F1F4EA] text-[#556B2F] flex items-center justify-center font-serif text-[12px] font-bold shrink-0">
                    {doctorInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-stone-800 truncate">
                      {appointment.dokter || 'Dokter belum diisi'}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {appointment.jenis || 'Kontrol kehamilan'}
                      {appointment.lokasi ? ` \u2022 ${appointment.lokasi}` : ''}
                    </p>
                  </div>
                  {appointment.date && (() => {
                    try {
                      const d = new Date(appointment.date);
                      if (isNaN(d.getTime())) return null;
                      d.setDate(d.getDate() - 7);
                      return (
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 shrink-0">
                          Book H-7: {d.getDate()} {MONTH_NAMES[d.getMonth()]}
                        </span>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>

                <div className="mt-3 rounded-xl bg-[#FCFAF5] border border-[#EFE8DC] px-3 py-2.5">
                  <p className="text-[8.5px] uppercase tracking-[0.14em] text-stone-400 font-semibold">Pesan untuk Ayah</p>
                  <p className="font-serif italic text-[12px] text-stone-600 mt-0.5 leading-relaxed line-clamp-3">
                    {appointment.pesanAyah
                      ? `\u201c${appointment.pesanAyah}\u201d`
                      : 'Tulis pesan singkat \u2014 nanti ikut terkirim bersama kartu jadwal.'}
                  </p>
                </div>
              </>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={shareJadwal}
                disabled={isAppointmentEmpty(appointment)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Kirim ke Ayah
              </button>
              <button
                type="button"
                onClick={De}
                disabled={isAppointmentEmpty(appointment)}
                title="Simpan kartu sebagai gambar"
                className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 text-[11px] font-medium flex items-center gap-1.5 hover:bg-stone-50 disabled:opacity-40 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Kartu
              </button>
            </div>
            <p className="text-[9px] text-stone-400 mt-2 leading-snug">
              Kartu berisi tanggal, dokter, dan pesan Bunda — terkirim sebagai gambar lewat WhatsApp.
            </p>
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
