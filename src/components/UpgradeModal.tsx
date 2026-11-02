import React from 'react';
import { X, Sparkles, BookHeart } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

// Gate output 49k vs 129k: input Bab 1-5 tetap bebas, cek cuma di output.
// Copy persis sesuai spec produk.
export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-[#F5F2EB] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-300 relative text-[#292524]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200/50 cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-3">
          <BookHeart className="w-5 h-5 text-[#556B2F]" />
          <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
            Jurnal Bunda udah 87% jadi, mau dibikin buku warisan?
          </h3>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Tulisan &amp; foto Bunda di Bab 1-5 udah lengkap. Yang 49rb bisa dibaca di HP, tapi belum bisa export PDF clean &amp; cetak hardcover linen SAGE. Bunda udah bayar Rp49rb, tinggal tambah Rp80rb aja jadi total Rp129rb — data yang udah ditulis gak ilang, langsung bisa export PDF + diskon cetak 249rb (dari 399rb).
        </p>
        <div className="mt-5 space-y-2">
          <button
            onClick={onUpgrade}
            className="w-full py-3 bg-[#C87A64] hover:bg-[#b56b56] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade Sekarang +80rb</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium cursor-pointer"
          >
            Nanti aja, lanjut nulis dulu
          </button>
        </div>
        <p className="text-[10px] text-stone-500 mt-4 leading-relaxed border-t border-stone-200 pt-3">
          Catatan: Upgrade cuma bayar selisih. Bunda yang beli 49rb gak bayar double. Data jurnal tetap kesimpen.
        </p>
      </div>
    </div>
  );
};
