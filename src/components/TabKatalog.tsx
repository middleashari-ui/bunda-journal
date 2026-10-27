import React, { useState } from 'react';
import { PhotoMemory, JournalEntry, UserProfile, BookOrder } from '../types';
import { 
  BookOpen, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Palette, 
  Eye, 
  Gift, 
  X,
  CreditCard
} from 'lucide-react';

interface TabKatalogProps {
  userProfile: UserProfile;
  photos: PhotoMemory[];
  journalText: string;
  onOpenBookPreview: () => void;
  onPlaceOrder: (order: BookOrder) => void;
}

export const TabKatalog: React.FC<TabKatalogProps> = ({
  userProfile,
  photos,
  journalText,
  onOpenBookPreview,
  onPlaceOrder,
}) => {
  const [selectedColor, setSelectedColor] = useState<BookOrder['coverColor']>('sage');
  const [selectedFoil, setSelectedFoil] = useState<BookOrder['foilColor']>('gold');
  const [bookTitle, setBookTitle] = useState('Surat Pertama untuk Malaikat Kecilku');
  const [authorName, setAuthorName] = useState(userProfile.name || 'Bunda Jessica');
  
  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [recipientName, setRecipientName] = useState(userProfile.name || 'Bunda Jessica');
  const [phone, setPhone] = useState('0812-3456-7890');
  const [shippingAddress, setShippingAddress] = useState('Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan');
  const [isOrdering, setIsOrdering] = useState(false);

  const colors = [
    { id: 'sage', label: 'Sage Olive', bgClass: 'bg-[#556B2F]', hex: '#556B2F' },
    { id: 'oatmeal', label: 'Sand Oatmeal', bgClass: 'bg-[#E3DCce]', hex: '#E3DCce' },
    { id: 'terracotta', label: 'Warm Terracotta', bgClass: 'bg-[#C87A64]', hex: '#C87A64' },
    { id: 'rose', label: 'Dusty Rose', bgClass: 'bg-[#D9A098]', hex: '#D9A098' },
    { id: 'charcoal', label: 'Charcoal Linen', bgClass: 'bg-[#292524]', hex: '#292524' },
  ] as const;

  const foils = [
    { id: 'gold', label: 'Emas Murni', color: '#D4AF37' },
    { id: 'silver', label: 'Perak Anggun', color: '#B0B0B0' },
    { id: 'roseGold', label: 'Rose Gold', color: '#B76E79' },
  ] as const;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOrdering(true);
    setTimeout(() => {
      setIsOrdering(false);
      setShowCheckoutModal(false);
      onPlaceOrder({
        coverColor: selectedColor,
        coverTitle: bookTitle,
        authorName: authorName,
        foilColor: selectedFoil,
        paperType: 'fine-art-linen',
        recipientName,
        shippingAddress,
        phoneNumber: phone,
        status: 'ordered',
      });
    }, 1000);
  };

  return (
    <div className="px-5 py-4 space-y-4">
      {/* Header Banner */}
      <div className="text-center pt-2 pb-1">
        <span className="text-[11px] uppercase tracking-widest text-[#556B2F] font-semibold bg-[#556B2F]/10 px-3 py-1 rounded-full">
          Studio Koleksi B5
        </span>
        <h2 className="font-serif text-2xl font-bold text-stone-850 mt-2">
          Studio Buku Kenangan
        </h2>
        <p className="text-xs text-stone-500 font-light mt-1 max-w-xs mx-auto leading-relaxed">
          Personalisasi desain, sampul kain linen, dan cetak seluruh 100 halaman kenangan kehamilan Anda.
        </p>
      </div>

      {/* Hero Image Mockup Placeholder */}
      <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-stone-200/60 shadow-xs text-center">
        <div className="relative mx-auto rounded-2xl overflow-hidden shadow-md border-4 border-white mb-3">
          <img 
            src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" 
            alt="Hardcover Linen Book Mockup" 
            className="w-full h-48 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-4">
            <div className="text-left text-white w-full">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-200 block mb-0.5">
                Koleksi Fisik Kolektor
              </span>
              <p className="font-serif text-base font-semibold tracking-wide drop-shadow-sm">
                "{bookTitle}"
              </p>
              <p className="text-[10px] text-white/80 mt-0.5">
                Oleh {authorName} • Kain Linen {selectedColor.toUpperCase()} • Emboss {selectedFoil.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Price & Action Strip */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 line-through">Rp 399.000</span>
              <span className="font-serif text-2xl font-bold text-[#C87A64]">Rp 249.000</span>
            </div>
            <p className="text-[10px] text-stone-500">Hemat 38% • Pre-order Bundling</p>
          </div>

          <button
            onClick={onOpenBookPreview}
            className="px-3.5 py-2 bg-[#556B2F] hover:bg-[#465926] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Buka Studio 100 Hal</span>
          </button>
        </div>
      </div>

      {/* 100-PAGE FORMAT UTAMA SHOWCASE CARD */}
      <div className="bg-[#FAF8F5] p-4 rounded-3xl border border-stone-200/70 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#556B2F]" />
            <div>
              <h4 className="font-serif text-sm font-bold text-stone-850">
                Format Utama: 100 Halaman (50 Lembar B5)
              </h4>
              <p className="text-[10px] text-stone-500 font-light">
                Standar cetak B5 (176 x 250 mm) dengan 5 pilihan tema tanpa merubah format
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-[#556B2F]/15 text-[#556B2F] font-semibold px-2 py-0.5 rounded-md">
            100 Hal
          </span>
        </div>

        {/* Structure Breakdown Table */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-2.5 text-[10px] space-y-1.5">
          <div className="flex justify-between items-center border-b border-stone-100 pb-1">
            <span className="text-stone-700 font-medium">• Halaman Judul & Pengantar</span>
            <span className="font-sans text-stone-500">2 Halaman (Hal 1-2)</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-100 pb-1">
            <span className="text-stone-700 font-medium">• Bab 1: Awal Mula Kisah (Test Pack & USG)</span>
            <span className="font-sans text-stone-500">4 Halaman (Hal 3-6)</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-100 pb-1">
            <span className="text-stone-700 font-medium">• Quotes & Pembatas Trimester (1, 2, 3)</span>
            <span className="font-sans text-stone-500">6 Halaman</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-100 pb-1 bg-amber-50/50 p-1 rounded-sm">
            <span className="text-stone-800 font-semibold">• Bab 2: Jurnal Mingguan (W5 s.d. W40)</span>
            <span className="font-sans text-[#556B2F] font-bold">72 Halaman (36 Minggu)</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-100 pb-1">
            <span className="text-stone-700 font-medium">• Bab 3: Persiapan (Nama, Belanja, Tas RS)</span>
            <span className="font-sans text-stone-500">6 Halaman (Hal 85-90)</span>
          </div>
          <div className="flex justify-between items-center border-b border-stone-100 pb-1">
            <span className="text-stone-700 font-medium">• Bab 4: Kelahiran (Biodata, Cerita, Cap Kaki)</span>
            <span className="font-sans text-stone-500">6 Halaman (Hal 91-96)</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-stone-700 font-medium">• Bab 5: Surat Kapsul Waktu (Ayah & Bunda)</span>
            <span className="font-sans text-stone-500">4 Halaman (Hal 97-100)</span>
          </div>
        </div>

        <p className="text-[10px] text-stone-500 italic leading-snug">
          *Setiap minggu mendapat jatah 2 halaman berdampingan (halaman kiri untuk tracker tidur, mood & ceklis; halaman kanan untuk polaroid foto USG & catatan dokter).
        </p>

        <button
          onClick={onOpenBookPreview}
          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          <span>Buka Studio Cetak 100 Halaman (B5)</span>
        </button>
      </div>

      {/* Interactive Customizer */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3.5">
        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#556B2F]" />
          <span>Personalisasi Sampul Buku</span>
        </h4>

        {/* Color Swatches */}
        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1.5">
            Warna Kain Linen:
          </label>
          <div className="flex items-center gap-2.5">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                title={c.label}
                className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                  selectedColor === c.id 
                    ? 'border-[#292524] scale-110 shadow-xs' 
                    : 'border-white hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {selectedColor === c.id && (
                  <Check className={`w-3.5 h-3.5 ${c.id === 'oatmeal' ? 'text-stone-800' : 'text-white'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Foil Selection */}
        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1.5">
            Warna Foil Emboss Huruf:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {foils.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFoil(f.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedFoil === f.id
                    ? 'border-[#292524] bg-stone-50 font-bold text-stone-900 shadow-2xs'
                    : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                <span className="truncate">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Title Input */}
        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1">
            Judul di Sampul Depan:
          </label>
          <input 
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden font-serif"
          />
        </div>
      </div>

      {/* Value Props */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/60 shadow-xs space-y-3">
        <h4 className="font-serif text-xs font-bold text-stone-800 uppercase tracking-wider">
          Keunggulan Buku Cetak
        </h4>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#556B2F]/10 flex items-center justify-center text-[#556B2F] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">Hardcover Premium Bersampul Linen</p>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              Bahan kain linen Scandi natural yang awet puluhan tahun, tidak mudah kusam, dan ramah lingkungan.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C87A64]/10 flex items-center justify-center text-[#C87A64] shrink-0 mt-0.5">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">Custom Theme & Layout Otomatis</p>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              Seluruh tanggal, foto USG, dan curahan hati minggu ke minggu otomatis tertata rapi tanpa perlu repot desain manual.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 shrink-0 mt-0.5">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">Gratis Pengiriman ke Seluruh Indonesia</p>
            <p className="text-[11px] text-stone-500 font-light leading-relaxed">
              Dikemas dalam box pita hadiah elegan dan dikirimkan dengan aman menjelang hari kelahiran sang buah hati.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-1">
        <button 
          onClick={() => setShowCheckoutModal(true)}
          className="w-full py-4 px-6 rounded-full bg-[#556B2F] text-white font-medium text-sm tracking-wide shadow-md hover:bg-[#465926] active:scale-98 transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Cetak Jurnalku Sekarang - Rp 249.000</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-[10px] text-center text-stone-400 mt-2 font-light">
          Bisa dipesan sekarang dan dicetak saat masa kehamilan bunda selesai
        </p>
      </div>

      {/* Checkout Drawer / Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#556B2F]" />
                <h3 className="font-serif text-lg font-bold text-stone-850">
                  Formulir Pesanan Buku Linen
                </h3>
              </div>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60 flex items-center justify-between">
                <div>
                  <p className="font-serif font-bold text-stone-800">{bookTitle}</p>
                  <p className="text-[11px] text-stone-500">Linen: {selectedColor} • Foil: {selectedFoil}</p>
                </div>
                <span className="font-bold text-[#C87A64] text-sm">Rp 249.000</span>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Nama Penerima</label>
                <input 
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Nomor WhatsApp / HP</label>
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Alamat Lengkap Pengiriman</label>
                <textarea 
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:ring-1 focus:ring-[#556B2F] focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-stone-600">
                  <span>Harga Buku Hardcover Linen:</span>
                  <span>Rp 399.000</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Diskon Bundling Spesial Bunda:</span>
                  <span>- Rp 150.000</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Ongkos Kirim Seluruh Indonesia:</span>
                  <span className="font-bold text-emerald-700">GRATIS</span>
                </div>
                <div className="border-t border-stone-200 pt-1.5 flex justify-between font-bold text-stone-900 text-xs">
                  <span>Total Pembayaran:</span>
                  <span className="text-[#C87A64] text-sm font-serif">Rp 249.000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isOrdering}
                className="w-full py-3.5 bg-[#556B2F] hover:bg-[#465926] text-white font-medium rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isOrdering ? (
                  <span>Menyiapkan Pesanan...</span>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Konfirmasi & Cetak Jurnal</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
