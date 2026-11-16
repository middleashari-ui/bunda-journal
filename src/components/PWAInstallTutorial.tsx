import { storageSet } from '../lib/storage/appStorage';
import React, { useState, useEffect } from 'react';
import { Check, Download, Share2, PlusSquare, MoreVertical, Smartphone, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

interface PWAInstallTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueToApp?: () => void;
}

export const PWAInstallTutorial: React.FC<PWAInstallTutorialProps> = ({
  isOpen,
  onClose,
  onContinueToApp,
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  // Auto-detect User Agent on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setPlatform(isIOS ? 'ios' : 'android');

      // Capture beforeinstallprompt for native prompt on Android/Chrome
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setInstalledSuccess(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        storageSet('bunda_pwa_tutorial_dismissed', 'true');
      } catch {}
    }
    onClose();
  };

  const handleInstallClick = async () => {
    if (dontShowAgain) {
      try {
        storageSet('bunda_pwa_tutorial_dismissed', 'true');
      } catch {}
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalledSuccess(true);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
      setDeferredPrompt(null);
    } else {
      // Manual scroll or inform user to follow the 3 steps below
      const stepElem = document.getElementById('pwa-tutorial-steps');
      if (stepElem) {
        stepElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    if (onContinueToApp) {
      setTimeout(() => {
        onContinueToApp();
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#F9F6F0]/88 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Cara pasang aplikasi Bunda Journal" className="bg-white/95 rounded-[20px] max-w-[390px] w-full p-4 border border-[#EDE8DF] shadow-[0_12px_40px_rgba(0,0,0,0.08)] flex flex-col space-y-2.5 font-sans text-[#292524] relative max-h-[96vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Green Check Circle + Titles */}
        <div className="text-center space-y-1">
          <div className="w-9 h-9 rounded-full bg-[#556B2F]/12 text-[#556B2F] flex items-center justify-center mx-auto shadow-2xs">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-tight">
              Pembayaran Berhasil
            </h3>
            <p className="text-[11px] font-serif italic text-[#556B2F] font-semibold">
              Bunda Journal Aktif
            </p>
          </div>
          <div>
            <span className="inline-block bg-[#556B2F]/10 text-[#556B2F] border border-[#556B2F]/20 text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-full uppercase">
              Jadikan Aplikasi
            </span>
          </div>
        </div>

        {/* Benefits Row: Offline, Pengingat, Foto */}
        <div className="grid grid-cols-3 gap-1.5 py-1.5 px-1 border-y border-stone-100 text-center">
          <div className="flex flex-col items-center space-y-0.5">
            <span className="text-sm">⚡</span>
            <span className="text-[10px] font-bold text-stone-800">Offline</span>
            <span className="text-[8.5px] text-stone-500 leading-tight">Buka tanpa kuota</span>
          </div>
          <div className="flex flex-col items-center space-y-0.5 border-x border-stone-100 px-1">
            <span className="text-sm">🔔</span>
            <span className="text-[10px] font-bold text-stone-800">Pengingat</span>
            <span className="text-[8.5px] text-stone-500 leading-tight">Jadwal & vitamin</span>
          </div>
          <div className="flex flex-col items-center space-y-0.5">
            <span className="text-sm">🖼️</span>
            <span className="text-[10px] font-bold text-stone-800">Foto USG</span>
            <span className="text-[8.5px] text-stone-500 leading-tight">Privat di HP</span>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex bg-[#F4EFE6] p-1 rounded-xl border border-[#EDE8DF]">
          <button
            type="button"
            onClick={() => setPlatform('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              platform === 'android'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              platform === 'ios'
                ? 'bg-white text-stone-900 shadow-2xs font-bold'
                : 'text-stone-600 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* Steps Container */}
        <div id="pwa-tutorial-steps" className="space-y-3 pt-1">
          {platform === 'android' ? (
            /* ANDROID STEPS */
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-stone-850">
                    Ketuk menu tiga titik (⋮) di pojok kanan atas
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Buka peramban Google Chrome di ponsel Android Anda.
                  </p>
                </div>
              </div>

              {/* Step 2 + Mockup Dialog */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-stone-850">
                      Pilih menu <strong className="text-stone-900">"Instal aplikasi"</strong>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Atau pilih "Tambahkan ke Layar Utama".
                    </p>
                  </div>
                </div>

                {/* Android Mockup Dialog CLEAN */}
                <div className="mt-2 mx-1 p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-3">
                    <img
                      src="/b_dot_transparent_FINAL.png"
                      alt="Logo"
                      className="w-9 h-9 object-contain rounded-lg bg-[#FAF6EE] p-1 border border-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-serif font-bold text-stone-900 truncate">
                        Instal aplikasi Bunda Journal
                      </p>
                      <p className="text-[10.5px] text-stone-500 font-sans truncate">
                        www.bundajournal.my.id
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-500 px-2 py-1">Batal</span>
                    <span className="bg-[#556B2F] text-white px-3 py-1 rounded-md font-semibold">
                      Instal
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <span className="w-5 h-5 rounded-full bg-[#556B2F] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-stone-850">
                    Ketuk tombol hijau <strong className="text-[#556B2F]">"Instal"</strong>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Ikon Bunda Journal akan langsung muncul di beranda ponsel Anda.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* IOS STEPS */
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-stone-850 flex items-center gap-1.5">
                    Ketuk ikon Bagikan <Share2 className="w-3.5 h-3.5 text-blue-600 inline" /> di bar Safari
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Terletak di bagian bawah layar Safari ponsel Anda.
                  </p>
                </div>
              </div>

              {/* Step 2 + Mockup */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-xs space-y-0.5">
                    <p className="font-semibold text-stone-850 flex items-center gap-1.5">
                      Pilih <PlusSquare className="w-3.5 h-3.5 text-stone-700 inline" /> <strong className="text-stone-900">"Tambahkan ke Layar Utama"</strong>
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Gulir ke bawah menu berbagi untuk menemukan opsi ini.
                    </p>
                  </div>
                </div>

                {/* iOS Mockup Share Sheet Item */}
                <div className="mt-2 mx-1 p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900 text-[11.5px]">
                        Tambahkan ke Layar Utama
                      </p>
                      <p className="text-[10px] text-stone-400">bundajournal.my.id</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md">
                    Tambah
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50/70 border border-stone-150">
                <span className="w-5 h-5 rounded-full bg-[#556B2F] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs space-y-0.5">
                  <p className="font-semibold text-stone-850">
                    Ketuk <strong className="text-blue-600">"Tambah"</strong> di pojok kanan atas
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Aplikasi akan terpasang rapi di home screen iPhone Anda.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons and Checkbox Section */}
        <div className="space-y-3 pt-2">
          {/* Main Action: Pasang Sekarang (44px black pill) */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full h-11 min-h-[44px] rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Pasang Sekarang</span>
          </button>

          {/* Secondary Action: Nanti saja #8C887F */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[#6B655C] hover:text-stone-700 text-xs font-medium cursor-pointer transition-colors py-1"
            >
              Nanti saja, langsung buka jurnal
            </button>
          </div>

          {/* Checkbox: Jangan tampilkan lagi */}
          <label className="flex items-center justify-center gap-2 pt-1 text-[11px] text-stone-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer accent-stone-900"
            />
            <span>Jangan tampilkan panduan ini lagi</span>
          </label>
        </div>
      </div>
    </div>
  );
};
