import React, { useMemo, useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { storageGet, storageSet } from '../lib/storage/appStorage';
import { idbSet } from '../lib/idb';
import { getHplDate, getWeekDatesMonday, getTodayPosition, isSameDay, storageIndexOf } from '../lib/pregnancyDate';
import { DAILY_NOTE_MAX_CHARS, countDailyNoteChars } from '../config/journal';
import { useModalA11y } from '../hooks/useModalA11y';

const DAY_KEYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_LABELS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const TEMPLATES = [
  'Hari ini Bunda sempat berhenti sejenak dan merasakan gerakan si kecil. Badan terasa lebih ringan setelah istirahat.',
  'Bunda mencatat satu hal kecil yang membuat tersenyum hari ini, meski jadwal sedang padat.',
  'Perut terasa lebih kencang beberapa kali. Bunda memilih duduk, minum air, dan mengatur napas.',
  'Malam ini Bunda ingin berterima kasih pada tubuh yang sudah menemani sejauh ini.',
  'Ada rasa lelah, tapi Bunda tetap menyempatkan makan dan minum dengan cukup.',
  'Bunda membayangkan wajah si kecil sebentar sebelum tidur. Rasanya campur aduk, tapi hangat.',
];

interface Suggestion {
  date: Date;
  week: number;
  dayIndex: number;
  dayKey: string;
  text: string;
  checked: boolean;
}

interface AutoFillJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied: (count: number) => void;
}

function readExistingNote(week: number, dayKey: string, dayIndex: number): string {
  try {
    const saved = storageGet(`bunda_daily_w${week}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed[dayKey] === 'string') return parsed[dayKey];
    }
  } catch {}
  try {
    const raw = storageGet(`bunda_${week}_${dayIndex}_catatan`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.text === 'string') return parsed.text;
    }
  } catch {}
  return '';
}

function buildSuggestions(): Suggestion[] {
  const { week: currentWeek } = getTodayPosition();
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: Suggestion[] = [];
  let templateIndex = 0;

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = new Date(startOfToday);
    date.setDate(startOfToday.getDate() - offset);

    let week = 0;
    for (let w = Math.max(1, currentWeek - 4); w <= Math.min(40, currentWeek); w += 1) {
      const dates = getWeekDatesMonday(w, getHplDate());
      if (dates.some((d) => d && isSameDay(d, date))) {
        week = w;
        break;
      }
    }
    if (!week) continue;

    const dayIndex = storageIndexOf(date);
    const dayKey = DAY_KEYS[dayIndex];
    if (readExistingNote(week, dayKey, dayIndex).trim()) continue;

    out.push({
      date,
      week,
      dayIndex,
      dayKey,
      text: TEMPLATES[templateIndex % TEMPLATES.length],
      checked: true,
    });
    templateIndex += 1;
  }

  return out;
}

function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export const AutoFillJournalModal: React.FC<AutoFillJournalModalProps> = ({ isOpen, onClose, onApplied }) => {
  const [rows, setRows] = useState<Suggestion[]>(() => (isOpen ? buildSuggestions() : []));
  const dialogRef = useModalA11y(isOpen, onClose);

  // Bangun ulang saat modal dibuka supaya data terbaru ikut terbaca.
  React.useEffect(() => {
    if (isOpen) setRows(buildSuggestions());
  }, [isOpen]);

  const selectedCount = useMemo(() => rows.filter((row) => row.checked).length, [rows]);

  if (!isOpen) return null;

  const apply = () => {
    let applied = 0;
    const byWeek = new Map<number, Record<string, string>>();

    rows.forEach((row) => {
      if (!row.checked) return;
      const text = row.text.trim().slice(0, DAILY_NOTE_MAX_CHARS);
      if (!text) return;

      if (!byWeek.has(row.week)) {
        let existing: Record<string, string> = {};
        try {
          const raw = storageGet(`bunda_daily_w${row.week}`);
          if (raw) existing = JSON.parse(raw);
        } catch {}
        byWeek.set(row.week, { ...existing });
      }
      const weekNotes = byWeek.get(row.week)!;
      weekNotes[row.dayKey] = text;

      try {
        const savedAt = new Date().toTimeString().slice(0, 5);
        storageSet(
          `bunda_${row.week}_${row.dayIndex}_catatan`,
          JSON.stringify({ text, savedAt, status: 'Selesai' })
        );
      } catch {}
      applied += 1;
    });

    byWeek.forEach((notes, week) => {
      try {
        storageSet(`bunda_daily_w${week}`, JSON.stringify(notes));
        void idbSet(`bunda_daily_w${week}`, notes);
      } catch {}
    });

    try {
      window.dispatchEvent(new Event('bunda_journal_updated'));
    } catch {}

    onApplied(applied);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="autofill-title"
        className="bg-[#F5F2EB] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-stone-300 relative text-[#292524]"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h3 id="autofill-title" className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#556B2F]" />
              Isi otomatis hari yang terlewat
            </h3>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Ini <strong>contoh kalimat</strong>, bukan catatan asli Bunda. Baca, ubah, lalu centang
              hari yang ingin disimpan. Hari yang sudah ada catatannya tidak ditampilkan.
            </p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="text-stone-600 hover:text-stone-800 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-2.5">
          {rows.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-600">
              Semua hari dalam 14 hari terakhir sudah punya catatan. Tidak ada yang perlu diisi.
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={`${row.week}-${row.dayKey}`} className={`rounded-xl border p-3 ${row.checked ? 'border-[#556B2F]/40 bg-white' : 'border-stone-200 bg-white/60'}`}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.checked}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = { ...row, checked: e.target.checked };
                        setRows(next);
                      }}
                      className="w-3.5 h-3.5 accent-[#556B2F]"
                    />
                    {DAY_LABELS[row.dayIndex]}, {formatDate(row.date)}
                    <span className="text-[10px] font-normal text-stone-600">Minggu {row.week}</span>
                  </label>
                  <span className={`text-[10px] ${countDailyNoteChars(row.text) > DAILY_NOTE_MAX_CHARS ? 'text-rose-600' : 'text-stone-600'}`}>
                    {countDailyNoteChars(row.text)}/{DAILY_NOTE_MAX_CHARS}
                  </span>
                </div>
                <textarea
                  value={row.text}
                  onChange={(e) => {
                    const next = [...rows];
                    next[index] = { ...row, text: e.target.value };
                    setRows(next);
                  }}
                  rows={2}
                  maxLength={DAILY_NOTE_MAX_CHARS}
                  aria-label={`Contoh catatan ${DAY_LABELS[row.dayIndex]} ${formatDate(row.date)}`}
                  className="w-full text-[11px] leading-relaxed font-serif italic bg-white border border-stone-200 rounded-lg p-2 outline-none focus:border-[#556B2F] resize-none"
                />
              </div>
            ))
          )}
        </div>

        <div className="p-5 pt-3 border-t border-stone-200/70 flex items-center justify-between gap-3">
          <button onClick={onClose} className="px-3.5 py-2 text-xs rounded-xl border border-stone-300 text-stone-700 hover:bg-white cursor-pointer">
            Batal
          </button>
          <button
            onClick={apply}
            disabled={selectedCount === 0}
            className="px-4 py-2 text-xs rounded-xl bg-[#556B2F] text-white font-semibold hover:bg-[#465926] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Terapkan {selectedCount} hari
          </button>
        </div>
      </div>
    </div>
  );
};
