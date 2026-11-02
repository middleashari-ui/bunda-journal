import React, { useState } from 'react';
import { Calendar, ArrowRight, User } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: {
    name: string;
    babyNickname: string;
    week: number;
    hplDate: string;
    doctorName?: string;
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [name, setName] = useState('');
  const [hpl, setHpl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama Bunda wajib diisi.');
      return;
    }
    if (!hpl.trim()) {
      setErrorMsg('Hari Perkiraan Lahir (HPL) wajib diisi.');
      return;
    }
    setErrorMsg('');

    // Hitung estimasi minggu kehamilan otomatis dari HPL (40 minggu total)
    let calculatedWeek = 32;
    try {
      const hplDate = new Date(hpl);
      const now = new Date();
      const diffTime = hplDate.getTime() - now.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const remainingWeeks = diffDays / 7;
      const derivedWeek = Math.round(40 - remainingWeeks);
      if (derivedWeek >= 5 && derivedWeek <= 40) {
        calculatedWeek = derivedWeek;
      }
    } catch {}

    onComplete({
      name: name.trim(),
      babyNickname: '',
      week: calculatedWeek,
      hplDate: hpl.trim(),
      doctorName: '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-md flex items-center justify-center p-3 select-none">
      <div className="bg-[#F5F2EB] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-300 text-[#292524]">
        <div className="text-center mb-5">
          <span className="font-serif text-3xl font-bold tracking-tight text-stone-900">bunda.</span>
          <h2 className="text-sm font-serif font-bold text-stone-800 mt-1">Form Informasi Bunda</h2>
          <p className="text-[11px] text-stone-600 mt-0.5">
            Lengkapi data dasar kehamilan untuk menyesuaikan panduan jurnal harian Bunda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}
          {/* 1. Nama Bunda (Wajib) */}
          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between mb-1">
              <span>Nama Bunda <span className="text-[#C87A64]">*</span></span>
              <span className="text-[10px] text-stone-400">Wajib</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input 
                type="text" 
                id="input-form-nama"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bunda Sarah"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#556B2F] outline-none text-stone-800"
              />
            </div>
          </div>

          {/* 2. Hari Perkiraan Lahir (HPL) (Wajib Date Picker) */}
          <div>
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between mb-1">
              <span>Hari Perkiraan Lahir (HPL) <span className="text-[#C87A64]">*</span></span>
              <span className="text-[10px] text-stone-400">Date Picker (Wajib)</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                id="input-form-hpl"
                required
                value={hpl}
                onChange={(e) => setHpl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#556B2F] outline-none text-stone-800"
              />
            </div>
          </div>

          <div className="text-[11px] text-stone-500 bg-white/60 p-3 rounded-xl border border-stone-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#556B2F] shrink-0" />
            <span>Dokter & pengaturan lanjutan dapat diatur kapan saja di Tab Profil.</span>
          </div>

          {/* Tombol Simpan Jelas */}
          <button
            type="submit"
            id="btn-simpan-form-bunda"
            className="w-full py-3.5 bg-[#556B2F] text-white rounded-xl text-sm font-bold hover:bg-[#465926] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors mt-2"
          >
            <span>Simpan Informasi & Masuk Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
