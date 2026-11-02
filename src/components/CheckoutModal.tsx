import React, { useState } from 'react';
import { X, CheckCircle2, QrCode, Mail, ArrowRight, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { PRICING_CONFIG, PlanConfig } from '../config/pricing';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string, tier: 'essential' | 'vip', amount: number) => void;
  defaultPlan?: 'essential' | 'vip' | 'hardcover' | 'upgrade_vip';
  currentTier?: 'none' | 'essential' | 'vip';
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultPlan = 'essential',
  currentTier = 'none',
}) => {
  const [step, setStep] = useState<'plan' | 'payment' | 'gmail'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'vip' | 'hardcover' | 'upgrade_vip'>(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'midtrans'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gmailInput, setGmailInput] = useState('');
  const [realSnapLoading, setRealSnapLoading] = useState(false);
  const [snapError, setSnapError] = useState<string | null>(null);

  // Sinkronkan selectedPlan jika defaultPlan berubah saat modal dibuka
  React.useEffect(() => {
    setSelectedPlan(defaultPlan);
    setStep('plan');
    setSnapError(null);
  }, [defaultPlan, isOpen]);

  if (!isOpen) return null;

  const currentPlanConfig: PlanConfig = PRICING_CONFIG[selectedPlan] || PRICING_CONFIG.vip;

  const handleOpenRealSnap = async () => {
    setRealSnapLoading(true);
    setSnapError(null);
    try {
      const res = await fetch('/api/midtrans/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentPlanConfig.price,
          customer_name: 'Bunda',
          customer_email: localStorage.getItem('bunda_user_email') || 'bunda@bundajournal.my.id'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Gagal membuat transaksi Midtrans');
      }

      const snapToken = data.token;
      const snap = (window as any).snap;

      if (!snap || typeof snap.pay !== 'function') {
        // Fallback buka URL snap redirection jika snap.js belum ke-load
        if (data.redirect_url) {
          window.open(data.redirect_url, '_blank');
          return;
        }
        throw new Error('Midtrans Snap SDK belum siap.');
      }

      snap.pay(snapToken, {
        onSuccess: function (result: any) {
          console.log('Midtrans Snap Success:', result);
          if (currentTier === 'essential' && selectedPlan === 'upgrade_vip') {
            const email = localStorage.getItem('bunda_user_email') || 'bunda.user@gmail.com';
            onSuccess(email, 'vip', currentPlanConfig.price);
          } else {
            setStep('gmail');
          }
        },
        onPending: function (result: any) {
          console.log('Midtrans Snap Pending:', result);
        },
        onError: function (result: any) {
          console.error('Midtrans Snap Error:', result);
          setSnapError('Pembayaran gagal atau dibatalkan.');
        },
        onClose: function () {
          console.log('Customer closed the Snap popup without finishing the payment');
        }
      });
    } catch (err: any) {
      console.error('Snap charge error:', err);
      setSnapError(err.message || 'Terjadi kesalahan sistem pembayaran');
    } finally {
      setRealSnapLoading(false);
    }
  };

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (currentTier === 'essential' && selectedPlan === 'upgrade_vip') {
        // Upgrade langsung sukses untuk user yang sudah login
        const email = localStorage.getItem('bunda_user_email') || 'bunda.user@gmail.com';
        onSuccess(email, 'vip', 80000);
      } else {
        setStep('gmail');
      }
    }, 1200);
  };

  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput.trim() || !gmailInput.includes('@')) {
      alert('Masukkan email Google yang valid.');
      return;
    }
    const resolvedTier = (selectedPlan === 'vip' || selectedPlan === 'upgrade_vip' || selectedPlan === 'hardcover') ? 'vip' : 'essential';
    onSuccess(gmailInput.trim().toLowerCase(), resolvedTier, currentPlanConfig.price);
  };

  const handleSimulateGoogleAuth = () => {
    // Simulasi respons OAuth Google dengan scope: email only
    const demoEmail = gmailInput.trim() || 'bunda.ashari@gmail.com';
    const resolvedTier = (selectedPlan === 'vip' || selectedPlan === 'upgrade_vip' || selectedPlan === 'hardcover') ? 'vip' : 'essential';
    onSuccess(demoEmail.toLowerCase(), resolvedTier, currentPlanConfig.price);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#F5F2EB] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-300 relative text-[#292524]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-5 text-[11px] font-semibold text-stone-500">
          <span className={`px-2 py-0.5 rounded ${step === 'plan' ? 'bg-[#556B2F] text-white' : 'bg-stone-200 text-stone-700'}`}>1. Paket</span>
          <span>→</span>
          <span className={`px-2 py-0.5 rounded ${step === 'payment' ? 'bg-[#556B2F] text-white' : 'bg-stone-200 text-stone-700'}`}>2. Bayar</span>
          <span>→</span>
          <span className={`px-2 py-0.5 rounded ${step === 'gmail' ? 'bg-[#556B2F] text-white' : 'bg-stone-200 text-stone-700'}`}>3. Akun Google</span>
        </div>

        {/* STEP 1: Pilih Paket */}
        {step === 'plan' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                {currentTier === 'essential' ? 'Upgrade Paket Akun' : 'Pilih Paket Akses'}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                {currentTier === 'essential'
                  ? 'Tingkatkan akun Bunda ke VIP untuk mendampingi kehamilan secara menyeluruh.'
                  : 'Satu kali bayar. Akses seumur hidup untuk mendampingi kehamilan.'}
              </p>
            </div>

            <div className="space-y-2.5">
              {(currentTier === 'essential'
                ? (['upgrade_vip', 'hardcover'] as const)
                : (['vip', 'hardcover'] as const)
              ).map((key) => {
                const item = PRICING_CONFIG[key];
                const isSelected = selectedPlan === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#556B2F] bg-white shadow-xs'
                        : 'border-stone-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{item.name}</span>
                        {item.badge && (
                          <span className="bg-[#556B2F]/10 text-[#556B2F] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                      <p className="text-[10px] text-emerald-700 font-medium mt-0.5">{item.adminFeeText}</p>
                    </div>
                    <div className="text-right pl-3">
                      <span className="text-sm font-bold text-stone-900 block">{item.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep('payment')}
              className="w-full py-3 bg-[#556B2F] text-white rounded-xl text-xs font-bold hover:bg-[#465926] flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <span>Lanjut Pembayaran ({currentPlanConfig.label})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Pembayaran Midtrans Snap QRIS Simulator & Real */}
        {step === 'payment' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Pembayaran Midtrans Snap</h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Total Tagihan: <span className="font-bold text-stone-900">{currentPlanConfig.label}</span> ({currentPlanConfig.name})
              </p>
            </div>

            {/* Tombol Snap Popup Real */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-center">
              <p className="text-xs font-bold text-emerald-950 mb-1">
                Buka Popup QRIS Real Midtrans Snap
              </p>
              <p className="text-[11px] text-emerald-800 mb-3">
                Membuat transaksi resmi QRIS Midtrans Snap ke Production Server Key.
              </p>
              <button
                type="button"
                id="btn-open-real-snap"
                disabled={realSnapLoading}
                onClick={handleOpenRealSnap}
                className="w-full py-2.5 bg-[#556B2F] text-white rounded-lg text-xs font-bold hover:bg-[#465926] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{realSnapLoading ? 'Menghubungkan Midtrans...' : `Tampilkan QRIS Snap (${currentPlanConfig.label})`}</span>
              </button>
              {snapError && (
                <p className="text-[11px] text-rose-600 mt-2 font-medium">{snapError}</p>
              )}
            </div>

            {/* Selector Metode - Diarahkan khusus QRIS Gratis Biaya Admin */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  paymentMethod === 'qris'
                    ? 'border-[#556B2F] bg-[#556B2F]/10 text-[#556B2F]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS Instant (Midtrans Snap)</span>
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 text-center flex flex-col items-center justify-center">
              <div className="w-44 h-44 bg-stone-50 border border-stone-300 rounded-lg flex flex-col items-center justify-center p-2 mb-2 relative shadow-inner">
                <QrCode className="w-28 h-28 text-stone-800" />
                <span className="text-[10px] font-mono font-bold text-stone-700 tracking-wider mt-1">
                  NMID: ID102459982390
                </span>
                <span className="text-[9px] text-[#556B2F] font-bold">Midtrans Snap QRIS 0%</span>
              </div>
              <div className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[11px] font-semibold mb-2">
                ✓ Gratis biaya admin (0%)
              </div>
              <p className="text-[11px] text-stone-600">
                Pindai QRIS memakai GoPay, OVO, DANA, ShopeePay, BCA, Mandiri Livin, atau BRImo.
              </p>

              <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#556B2F]" />
                <span>Midtrans Snap Production • Standar Enkripsi BI QRIS</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="w-1/3 py-2.5 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold hover:bg-stone-300 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                id="btn-confirm-pay"
                disabled={isProcessing}
                onClick={handlePay}
                className="w-2/3 py-2.5 bg-[#556B2F] text-white rounded-xl text-xs font-bold hover:bg-[#465926] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Memverifikasi Pembayaran...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Bayar {currentPlanConfig.label}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Izin Gmail (Hanya minta Email saja) */}
        {step === 'gmail' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 text-[#556B2F] rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">Pembayaran Berhasil!</h3>
              <p className="text-xs text-stone-600 mt-1">
                Akses aktif. Sambungkan email Google untuk menyimpan data jurnal Bunda.
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1.5">
              <p className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#556B2F]" />
                <span>Izin Akun Google (Email Saja):</span>
              </p>
              <p className="text-stone-700 leading-relaxed">
                Kami hanya meminta alamat email untuk verifikasi status akses dan simpan data. Kami tidak membaca isi Gmail, kontak, atau Google Drive Bunda.
              </p>
            </div>

            <form onSubmit={handleGmailSubmit} className="space-y-3">
              <button
                type="button"
                id="btn-google-oauth"
                onClick={handleSimulateGoogleAuth}
                className="w-full py-3 border border-stone-300 bg-white text-stone-800 rounded-xl text-xs font-semibold hover:bg-stone-50 flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Lanjut dengan Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-stone-200"></div>
                <span className="shrink mx-2 text-[10px] text-stone-600 font-medium uppercase">Atau ketik email</span>
                <div className="grow border-t border-stone-200"></div>
              </div>

              <div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-600 absolute left-3 top-3" />
                  <input
                    type="email"
                    id="input-gmail"
                    value={gmailInput}
                    onChange={(e) => setGmailInput(e.target.value)}
                    placeholder="nama.bunda@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:border-[#556B2F] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-gmail"
                className="w-full py-2.5 bg-[#556B2F] text-white rounded-xl text-xs font-bold hover:bg-[#465926] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <span>Lanjut ke Form Informasi Bunda</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  id="btn-kembali-landing"
                  onClick={onClose}
                  className="text-[11px] text-stone-600 hover:text-stone-800 underline cursor-pointer"
                >
                  Nanti saja, kembali ke Landing Page
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};