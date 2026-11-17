import { storageGet, storageSet } from '../lib/storage/appStorage';
import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Sparkles, BookOpen, ArrowRight, Download, RefreshCw } from 'lucide-react';
import { PWAInstallTutorial } from './PWAInstallTutorial';
import { notifyUserChanged } from '../lib/appointmentStore';
import { trackMetaOnce, hasRecentCheckout, getLastPaidAmount } from '../lib/metaPixel';

interface SuccessPageProps {
  onOpenJurnal?: () => void;
  userEmail?: string;
  userTier?: string;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  onOpenJurnal,
  userEmail: propEmail,
  userTier: propTier,
}) => {
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return storageGet('bunda_pwa_tutorial_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const [email, setEmail] = useState<string>(() => {
    if (propEmail) return propEmail;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return (
        urlParams.get('email') ||
        storageGet('bunda_user_email') ||
        'bunda@bundajournal.my.id'
      );
    } catch {
      return 'bunda@bundajournal.my.id';
    }
  });

  const [orderId, setOrderId] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('order_id') || `BJ-${Date.now().toString().slice(-6)}`;
    } catch {
      return `BJ-${Date.now().toString().slice(-6)}`;
    }
  });

  const [tier, setTier] = useState<string>(() => {
    if (propTier) return propTier;
    try {
      return storageGet('bunda_user_tier') || 'vip';
    } catch {
      return 'vip';
    }
  });

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  // Default FALSE: status bayar harus dibuktikan server, bukan diasumsikan benar.
  const [isPaidVerified, setIsPaidVerified] = useState<boolean>(false);

  // Poll GET /api/subscription?email=... to confirm Cloudflare D1 persistence
  useEffect(() => {
    let isMounted = true;
    const verifyD1 = async () => {
      if (!email) {
        setIsPaidVerified(false);
        return;
      }
      setIsVerifying(true);
      try {
        const res = await fetch(`/api/subscription?email=${encodeURIComponent(email)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ok) {
            if (data.tier) setTier(data.tier);
            // Hanya true kalau server benar-benar bilang is_paid.
            setIsPaidVerified(Boolean(data.is_paid));
            if (data.order_id) setOrderId(data.order_id);
          }
        } else if (isMounted) {
          setIsPaidVerified(false);
        }
      } catch (err) {
        console.warn('Subscription fetch notice:', err);
        if (isMounted) setIsPaidVerified(false);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyD1();
    return () => {
      isMounted = false;
    };
  }, [email]);

  // Meta: Purchase hanya setelah server menyatakan is_paid, dan hanya untuk
  // checkout yang baru terjadi (< 2 jam) supaya user lama tidak terhitung lagi.
  useEffect(() => {
    if (!isPaidVerified || !hasRecentCheckout()) return;

    const isVip = tier === 'vip';
    const value = getLastPaidAmount(isVip ? 129000 : 49000);

    trackMetaOnce(
      `purchase:${orderId}`,
      'Purchase',
      {
        value,
        currency: 'IDR',
        content_name: isVip ? 'VIP Bundle' : 'Essential Access',
        content_ids: [isVip ? 'vip' : 'essential'],
        content_type: 'product',
        num_items: 1,
        order_id: orderId,
      },
      720,
      orderId
    );
  }, [isPaidVerified, orderId, tier]);

  const handleOpenJurnal = () => {
    try {
      // Jangan pernah menandai LUNAS tanpa verifikasi server yang lolos.
      if (isPaidVerified) storageSet('bunda_is_paid', 'true');
      if (email) storageSet('bunda_user_email', email);
      notifyUserChanged(email);
      if (tier && isPaidVerified) storageSet('bunda_user_tier', tier);
    } catch {}

    if (onOpenJurnal) {
      onOpenJurnal();
    } else {
      window.location.hash = '#/jurnal';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#292524] antialiased flex flex-col items-center justify-center p-4 sm:p-6 relative select-none">
      {/* Container max 390px */}
      <div className="w-full max-w-[390px] mx-auto space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="/b_dot_transparent_FINAL.png"
            alt="Bunda Journal"
            className="h-10 w-auto object-contain"
          />
          <span className="font-serif text-lg font-bold text-stone-900 tracking-tight">
            Bunda Journal
          </span>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-[20px] p-6 border border-[#EDE8DF] shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-5 text-center">
          {/* Green Check Icon */}
          <div className="w-14 h-14 rounded-full bg-[#556B2F]/12 text-[#556B2F] flex items-center justify-center mx-auto shadow-2xs">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          {/* Titles */}
          <div className="space-y-1">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              Pembayaran Berhasil!
            </h1>
            <p className="text-xs sm:text-sm font-sans text-stone-600">
              Akses Bunda Journal Anda kini telah aktif seumur hidup.
            </p>
          </div>

          {/* Tier Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#556B2F]/10 border border-[#556B2F]/20 text-[#556B2F] text-xs font-bold font-sans">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Paket {tier === 'vip' ? 'VIP Seumur Hidup' : 'Essential'}</span>
          </div>

          {/* Receipt Details Box */}
          <div className="bg-[#F9F6F0] rounded-xl p-3.5 border border-[#EDE8DF] text-left text-xs space-y-2 font-sans">
            <div className="flex items-center justify-between text-stone-600">
              <span>Akun Terdaftar:</span>
              <span className="font-medium text-stone-850 truncate max-w-[190px]">{email}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Nomor Pesanan:</span>
              <span className="font-mono text-[11px] text-stone-700">{orderId}</span>
            </div>
            <div className="flex items-center justify-between text-stone-600">
              <span>Status Lisensi:</span>
              <span className="inline-flex items-center gap-1 text-[#556B2F] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isPaidVerified ? 'Aktif & Terverifikasi' : 'Diproses'}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleOpenJurnal}
              className="w-full h-11 min-h-[44px] rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Jurnal Kehamilan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="w-full h-11 min-h-[44px] rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-[#556B2F]" />
              <span>Petunjuk Jadikan Aplikasi</span>
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <p className="text-center text-[11px] text-stone-600 font-sans">
          Bunda Journal • www.bundajournal.my.id
        </p>
      </div>

      {/* PWA Install Tutorial Overlay */}
      <PWAInstallTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onContinueToApp={handleOpenJurnal}
      />
    </div>
  );
};
