import React, { useState } from 'react';
import { Pill, Droplets, Plus, Minus, Settings, Check, X } from 'lucide-react';
import { useHealthData, SupplementItem } from '../../context/HealthDataContext';

export type { SupplementItem };

export const SupplementWaterCard: React.FC = () => {
  const {
    supplements,
    toggleSupplement,
    addSupplement,
    deleteSupplement,
    waterLiters,
    waterTarget,
    changeWater,
  } = useHealthData();

  const [isEditing, setIsEditing] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');

  const handleAddSupplement = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSuppName.trim();
    if (!trimmed) return;
    addSupplement(trimmed);
    setNewSuppName('');
  };

  const takenCount = supplements.filter(s => s.taken).length;
  const totalCount = supplements.length;
  const waterProgress = Math.min(100, Math.round((waterLiters / waterTarget) * 100));

  return (
    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/70 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F]">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-stone-850">Suplemen & Hidrasi</h4>
            <p className="text-[10px] text-stone-400 font-sans">
              {takenCount} dari {totalCount} suplemen diminum
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(prev => !prev)}
          className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
            isEditing 
              ? 'bg-[#556B2F] text-white' 
              : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
          }`}
          title={isEditing ? 'Selesai Mengedit' : 'Edit Daftar Suplemen'}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] font-medium hidden sm:inline">
            {isEditing ? 'Selesai' : 'Kelola'}
          </span>
        </button>
      </div>

      {/* Segmented Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 w-full">
          {supplements.map((item, idx) => {
            const isFilled = idx < takenCount;
            return (
              <div
                key={item.id}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  isFilled ? 'bg-[#556B2F]' : 'bg-stone-200/80'
                }`}
                title={`${item.name}: ${item.taken ? 'Diminum' : 'Belum'}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[9px] text-stone-400">
          <span>0%</span>
          <span className="font-medium text-[#556B2F]">
            {Math.round((takenCount / Math.max(1, totalCount)) * 100)}% Lengkap
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Supplement Chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {supplements.map(item => {
            return (
              <div
                key={item.id}
                onClick={() => !isEditing && toggleSupplement(item.id)}
                className={`group relative text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 select-none ${
                  isEditing
                    ? 'bg-stone-50 border-stone-300 text-stone-700'
                    : item.taken
                    ? 'bg-[#556B2F] text-white border-[#556B2F] shadow-2xs font-medium cursor-pointer'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200 cursor-pointer'
                }`}
              >
                {item.taken && !isEditing ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-stone-300' : 'bg-stone-300'}`} />
                )}
                <span>{item.name}</span>

                {/* Delete button in Edit mode */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSupplement(item.id);
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-rose-100 text-stone-400 hover:text-rose-600 cursor-pointer"
                    title={`Hapus ${item.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Add Supplement form when editing */}
        {isEditing && (
          <form onSubmit={handleAddSupplement} className="pt-2 flex items-center gap-2">
            <input
              type="text"
              value={newSuppName}
              onChange={(e) => setNewSuppName(e.target.value)}
              placeholder="Nama suplemen baru (cth: Kalsium)..."
              className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 outline-none focus:border-[#556B2F] text-stone-850"
            />
            <button
              type="submit"
              disabled={!newSuppName.trim()}
              className="px-3 py-1.5 bg-[#556B2F] disabled:opacity-40 text-white text-xs font-medium rounded-xl hover:bg-[#465926] transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </form>
        )}
      </div>

      {/* Pelacak Air Minum (Water Tracker: 0 / 2.0 L) */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-sm font-bold text-stone-850">
                {waterLiters.toFixed(2).replace(/\.00$/, '')} / {waterTarget.toFixed(1)} L
              </span>
              <span className="text-[10px] text-stone-400 font-sans">Air Minum</span>
            </div>
            <div className="w-24 sm:w-32 bg-stone-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${waterProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stepper Buttons (- and +) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => changeWater(-0.25)}
            disabled={waterLiters <= 0}
            className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Kurangi 250 ml (1 gelas)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-medium text-stone-500 px-1 select-none">
            250ml
          </span>
          <button
            type="button"
            onClick={() => changeWater(0.25)}
            disabled={waterLiters >= 4.0}
            className="w-7 h-7 rounded-lg bg-[#556B2F] hover:bg-[#465926] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
            title="Tambah 250 ml (1 gelas)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
