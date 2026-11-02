import React, { useState } from 'react';
import { X, ShieldCheck, UserCheck, DollarSign, ListOrdered, CheckCircle2 } from 'lucide-react';

interface PicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const PicModal: React.FC<PicModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [picEmail, setPicEmail] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'payments' | 'pricing' | 'flags'>('pricing');

  // Dynamic pricing state (49k, 129k, 249k/299k)
  const [priceDigital, setPriceDigital] = useState('49.000');
  const [priceSoftcover, setPriceSoftcover] = useState('129.000');
  const [priceHardcover, setPriceHardcover] = useState('249.000');

  // Feature Flags
  const [flags, setFlags] = useState({
    enableHeicWebp: true,
    enableStorageLimit50MB: true,
    enableWhoCurve: true,
    enableFatherMode: true,
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (picEmail.trim().toLowerCase() === 'm.yamin.ashri') {
      setIsAuthorized(true);
      if (onShowToast) onShowToast('Login PIC Berhasil: m.yamin.ashri');
    } else {
      alert('Akses Ditolak: Khusus PIC resmi m.yamin.ashri');
    }
  };

  const handleSavePricing = () => {
    localStorage.setItem('bunda_pricing_digital', priceDigital);
    localStorage.setItem('bunda_pricing_softcover', priceSoftcover);
    localStorage.setItem('bunda_pricing_hardcover', priceHardcover);
    if (onShowToast) onShowToast('Harga berhasil diperbarui tanpa deploy!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-stone-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#556B2F]" />
            <h3 className="font-serif font-bold text-base text-stone-900">PIC Internal Control (/pic)</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-full cursor-pointer">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {!isAuthorized ? (
          <form onSubmit={handleLogin} className="py-6 space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
              Gerbang khusus PIC terautentikasi (User Management, Payment Log & Pricing Control).
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">ID PIC (Username)</label>
              <input 
                type="text" 
                value={picEmail}
                onChange={(e) => setPicEmail(e.target.value)}
                placeholder="m.yamin.ashri"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:border-[#556B2F] outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#556B2F] text-white rounded-xl text-xs font-bold hover:bg-[#465926] cursor-pointer"
            >
              Masuk Dashboard PIC
            </button>
          </form>
        ) : (
          <div className="py-3 space-y-4">
            <div className="flex items-center justify-between text-xs bg-stone-100 p-2 rounded-xl">
              <span className="font-medium text-stone-600">PIC: <strong className="text-stone-900">m.yamin.ashri</strong></span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">VERIFIED</span>
            </div>

            {/* Nav Sub-tabs */}
            <div className="flex gap-1.5 p-1 bg-stone-100 rounded-xl text-xs">
              <button 
                onClick={() => setActiveSubTab('pricing')}
                className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${activeSubTab === 'pricing' ? 'bg-white shadow-2xs text-[#556B2F]' : 'text-stone-600'}`}
              >
                Pricing
              </button>
              <button 
                onClick={() => setActiveSubTab('payments')}
                className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${activeSubTab === 'payments' ? 'bg-white shadow-2xs text-[#556B2F]' : 'text-stone-600'}`}
              >
                Payments
              </button>
              <button 
                onClick={() => setActiveSubTab('flags')}
                className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${activeSubTab === 'flags' ? 'bg-white shadow-2xs text-[#556B2F]' : 'text-stone-600'}`}
              >
                Flags
              </button>
            </div>

            {activeSubTab === 'pricing' && (
              <div className="space-y-3">
                <p className="text-[11px] text-stone-500">Ubah harga langsung tanpa perlu rebuild/deploy ulang frontend:</p>
                <div>
                  <label className="text-[10px] text-stone-500 font-bold">Tier 1 - Digital PDF (Rp)</label>
                  <input 
                    type="text" 
                    value={priceDigital} 
                    onChange={(e) => setPriceDigital(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 font-bold">Tier 2 - Softcover B5 (Rp)</label>
                  <input 
                    type="text" 
                    value={priceSoftcover} 
                    onChange={(e) => setPriceSoftcover(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 font-bold">Tier 3 - Hardcover Linen B5 (Rp)</label>
                  <input 
                    type="text" 
                    value={priceHardcover} 
                    onChange={(e) => setPriceHardcover(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  onClick={handleSavePricing}
                  className="w-full py-2 bg-[#556B2F] text-white rounded-xl text-xs font-bold hover:bg-[#465926] cursor-pointer"
                >
                  Simpan Harga Sekarang
                </button>
              </div>
            )}

            {activeSubTab === 'payments' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>TC02-TEST-001</span>
                    <span className="text-emerald-700">PAID</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>bunda@example.com</span>
                    <span>Rp 249.000 (QRIS Mock)</span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'flags' && (
              <div className="space-y-2.5 text-xs">
                <label className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                  <span>Kompresi HEIC {'->'} WebP 500px</span>
                  <input type="checkbox" checked={flags.enableHeicWebp} onChange={e => setFlags({...flags, enableHeicWebp: e.target.checked})} />
                </label>
                <label className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                  <span>Storage Bar Limit 50MB</span>
                  <input type="checkbox" checked={flags.enableStorageLimit50MB} onChange={e => setFlags({...flags, enableStorageLimit50MB: e.target.checked})} />
                </label>
                <label className="flex items-center justify-between p-2 bg-stone-50 rounded-xl">
                  <span>Mode Ayah Read-Only</span>
                  <input type="checkbox" checked={flags.enableFatherMode} onChange={e => setFlags({...flags, enableFatherMode: e.target.checked})} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

