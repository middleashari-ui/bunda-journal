import React, { useState } from 'react';
import { HabitState, ReminderSettings } from '../types';
import { playGentleChime, requestNotificationPermission, sendSystemNotification } from '../utils/notifications';
import { 
  BellRing, 
  Pill, 
  Clock, 
  CheckCircle2, 
  Droplets, 
  Footprints, 
  Moon, 
  Settings2, 
  Volume2, 
  ChevronRight,
  X
} from 'lucide-react';

interface DailyReminderWidgetProps {
  habits: HabitState;
  toggleHabit: (key: keyof HabitState) => void;
  reminderSettings: ReminderSettings;
  onUpdateReminderSettings: (newSettings: ReminderSettings) => void;
  onShowToast?: (message: string) => void;
}

export const DailyReminderWidget: React.FC<DailyReminderWidgetProps> = ({
  habits,
  toggleHabit,
  reminderSettings,
  onUpdateReminderSettings,
  onShowToast,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempVitaminTime, setTempVitaminTime] = useState(reminderSettings.vitaminTime || '08:00');
  const [tempJournalTime, setTempJournalTime] = useState(reminderSettings.journalTime || '20:00');
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const completedCount = [habits.water, habits.vitamins, habits.walk, habits.sleep].filter(Boolean).length;
  const isVitaminsDone = habits.vitamins;
  const isAllDone = completedCount === 4;

  const handleMarkVitaminDone = () => {
    if (!habits.vitamins) {
      toggleHabit('vitamins');
    }
    if (reminderSettings.soundEnabled) {
      playGentleChime();
    }
    if (onShowToast) {
      onShowToast('Hebat! Asupan vitamin hari ini sudah tercatat.');
    }
  };

  const handleTestNotification = async () => {
    if (reminderSettings.soundEnabled) {
      playGentleChime();
    }
    const perm = await requestNotificationPermission();
    setNotificationStatus(perm);

    if (perm === 'granted') {
      sendSystemNotification(
        'Pengingat Bunda: Waktunya Minum Vitamin',
        'Jangan lupa konsumsi asam folat, kalsium, dan segelas air hangat untuk si kecil tercinta.'
      );
      if (onShowToast) {
        onShowToast('Notifikasi pengingat berhasil dikirim ke perangkat Anda!');
      }
    } else {
      if (onShowToast) {
        onShowToast('Pengingat in-app aktif: Waktunya minum vitamin & hidrasi!');
      }
    }
  };

  const handleSaveSettings = () => {
    onUpdateReminderSettings({
      ...reminderSettings,
      vitaminTime: tempVitaminTime,
      journalTime: tempJournalTime,
    });
    setShowConfigModal(false);
    if (onShowToast) {
      onShowToast(`Jadwal pengingat diperbarui ke ${tempVitaminTime} WIB`);
    }
  };

  return (
    <>
      <div className={`p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        !isVitaminsDone
          ? 'bg-gradient-to-br from-[#FFF8F2] via-white to-[#F7F2EC] border-[#C87A64]/40 shadow-sm'
          : isAllDone
            ? 'bg-gradient-to-br from-[#F4F7EE] via-white to-[#EBF0E1] border-[#556B2F]/30 shadow-xs'
            : 'bg-white border-stone-200/70 shadow-xs'
      }`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-xl flex items-center justify-center ${
              !isVitaminsDone 
                ? 'bg-[#C87A64]/15 text-[#C87A64]' 
                : isAllDone
                  ? 'bg-[#556B2F]/15 text-[#556B2F]'
                  : 'bg-stone-100 text-stone-600'
            }`}>
              {!isVitaminsDone ? <BellRing className="w-4 h-4 animate-pulse" /> : <CheckCircle2 className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Pengingat Harian Bunda
                </span>
                <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded-md font-sans">
                  {reminderSettings.vitaminTime} WIB
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                {!isVitaminsDone 
                  ? 'Jangan Lupa Minum Vitamin Rutin!' 
                  : isAllDone 
                    ? 'Target Kebiasaan Sehat Lengkap!' 
                    : 'Vitamin Selesai, Lengkapi Rutinitas Lainnya'}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              title="Atur Waktu Pengingat"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body based on condition */}
        {!isVitaminsDone ? (
          <div className="mt-2.5 space-y-2.5">
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Asupan <strong>asam folat, zat besi, & kalsium</strong> sangat penting hari ini untuk pembentukan sel darah serta perkembangan tabung saraf si kecil.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleMarkVitaminDone}
                className="flex-1 py-2 px-3.5 bg-[#C87A64] hover:bg-[#b36752] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Tandai Sudah Minum Vitamin</span>
              </button>

              <button
                onClick={handleTestNotification}
                className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-750 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Cek notifikasi & bunyi pengingat"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden sm:inline">Uji Bunyi</span>
              </button>
            </div>
          </div>
        ) : isAllDone ? (
          <div className="mt-2 text-xs text-stone-600 flex items-center justify-between">
            <p className="font-light">
              Hebat Bunda! Semua asupan nutrisi, hidrasi, dan istirahat hari ini terpenuhi 100%. Si kecil bahagia dan sehat!
            </p>
            <CheckCircle2 className="w-5 h-5 text-[#556B2F] shrink-0 ml-2" />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-stone-600 font-light">
              Vitamin rutin sudah dicatat. Yuk lengkapi target hari ini:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {!habits.water && (
                <button
                  onClick={() => toggleHabit('water')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-[#556B2F]/10 hover:text-[#556B2F] text-stone-700 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Droplets className="w-3 h-3 text-cyan-600" />
                  <span>+ Minum Air 2L</span>
                </button>
              )}
              {!habits.walk && (
                <button
                  onClick={() => toggleHabit('walk')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-[#556B2F]/10 hover:text-[#556B2F] text-stone-700 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Footprints className="w-3 h-3 text-amber-600" />
                  <span>+ Jalan Santai</span>
                </button>
              )}
              {!habits.sleep && (
                <button
                  onClick={() => toggleHabit('sleep')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-[#556B2F]/10 hover:text-[#556B2F] text-stone-700 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Moon className="w-3 h-3 text-indigo-600" />
                  <span>+ Tidur Cukup</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Browser permission tip if not granted */}
        {notificationStatus !== 'granted' && (
          <div className="mt-2.5 pt-2 border-t border-stone-200/50 flex items-center justify-between text-[11px] text-stone-500">
            <span>Aktifkan alarm perangkat agar Bunda tidak lupa</span>
            <button
              onClick={handleTestNotification}
              className="text-[#C87A64] font-semibold hover:underline cursor-pointer flex items-center gap-0.5 ml-2 shrink-0"
            >
              <span>Aktifkan</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#556B2F]" />
                <h3 className="font-serif font-bold text-sm text-stone-850">Atur Jadwal Pengingat Harian</h3>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Waktu Minum Vitamin Rutin (Pagi / Siang):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={tempVitaminTime}
                    onChange={(e) => setTempVitaminTime(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 text-sm font-sans focus:outline-[#556B2F]"
                  />
                  <span className="text-stone-400 font-medium">WIB</span>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-medium mb-1">
                  Waktu Refleksi Jurnal & Istirahat (Malam):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={tempJournalTime}
                    onChange={(e) => setTempJournalTime(e.target.value)}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 text-sm font-sans focus:outline-[#556B2F]"
                  />
                  <span className="text-stone-400 font-medium">WIB</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-750">Bunyi Lonceng Lembut</p>
                  <p className="text-[10px] text-stone-400">Audio penanda saat jadwal tiba</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !reminderSettings.soundEnabled;
                    onUpdateReminderSettings({ ...reminderSettings, soundEnabled: nextVal });
                    if (nextVal) playGentleChime();
                  }}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    reminderSettings.soundEnabled ? 'bg-[#556B2F]' : 'bg-stone-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                    reminderSettings.soundEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex-1 py-2 bg-[#556B2F] hover:bg-[#465827] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Simpan Jadwal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
