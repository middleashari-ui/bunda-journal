import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

export interface ReminderPopupData {
  tag: string;
  title: string;
  message: string;
  time?: string;
}

interface ReminderPopupProps {
  reminder: ReminderPopupData | null;
  onOpenJournal: () => void;
  onClose: () => void;
}

export const ReminderPopup: React.FC<ReminderPopupProps> = ({ reminder, onOpenJournal, onClose }) => {
  const dialogRef = useModalA11y(!!reminder, onClose);
  if (!reminder) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-popup-title"
        className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl p-5 text-[#292524]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#556B2F]/12 text-[#556B2F] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <button onClick={onClose} aria-label="Tutup pengingat" className="text-stone-500 hover:text-stone-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E665C]">
          Pengingat Bunda {reminder.time ? `• ${reminder.time} WIB` : ''}
        </p>
        <h3 id="reminder-popup-title" className="mt-1 font-serif text-xl font-bold text-stone-900">
          {reminder.title.replace(/^Bunda Journal\s*—\s*/, '')}
        </h3>
        <p className="mt-1.5 text-xs text-stone-700 leading-relaxed">{reminder.message}</p>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
          >
            Nanti
          </button>
          <button
            onClick={onOpenJournal}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#556B2F] text-white text-xs font-bold hover:bg-[#465926] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Buka Jurnal
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
