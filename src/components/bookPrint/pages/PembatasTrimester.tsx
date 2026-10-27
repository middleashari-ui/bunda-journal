import React, { useState } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';

interface PembatasTrimesterProps {
  trimester: 1 | 2 | 3;
  theme: BookThemeConfig;
  leftPageNum: number;
  rightPageNum: number;
  isFillMode?: boolean;
}

export const PembatasTrimester: React.FC<PembatasTrimesterProps> = ({
  trimester,
  theme,
  leftPageNum,
  rightPageNum,
  isFillMode = true,
}) => {
  const trimesterMeta = {
    1: {
      title: 'Trimester Pertama',
      range: 'Minggu ke-1 hingga Minggu ke-13',
      subtitle: 'Awal Mula Keajaiban Tersembunyi',
      quote: 'Dari sebutir sel yang tak kasat mata, kini kau bertumbuh menjadi manusia kecil dengan detak jantung penuh cinta.',
      defaultReflection: 'Masa-masa adaptasi luar biasa. Rasa mual, letih, dan cemas berganti menjadi haru tak terhingga saat melihat kantung janinmu pertama kali.',
      focus: ['Asupan Asam Folat & Kalsium', 'Istirahat Cukup & Kurangi Beban', 'Doa di Setiap Detak Pertama'],
      defaultPrayer: 'Semoga si kecil selalu terlindungi, organ-organnya berkembang sempurna, dan bunda senantiasa diberikan kelapangan hati...'
    },
    2: {
      title: 'Trimester Kedua',
      range: 'Minggu ke-14 hingga Minggu ke-27',
      subtitle: 'Masa Emas & Sentuhan Kupu-Kupu',
      quote: 'Saat kepakan lembut di dalam perut bunda itu nyata... itu adalah salam cinta pertamamu dari dalam rahim.',
      defaultReflection: 'Energi bunda kembali bersemi. Perut mulai membuncit anggun dan ayah tak pernah lelah meletakkan telinganya di atas perut setiap malam.',
      focus: ['Merasakan Gerakan Aktif Si Kecil', 'Pemeriksaan USG Detail Morfologi', 'Mulai Mengajak Bicara & Mendengar Musik'],
      defaultPrayer: 'Semoga tulang dan otak buah hati kami bertumbuh kuat, sehat tanpa kekurangan suatu apa pun, dan menjadi penyejuk hati...'
    },
    3: {
      title: 'Trimester Ketiga',
      range: 'Minggu ke-28 hingga Minggu ke-40',
      subtitle: 'Menghitung Hari Menuju Dekapan',
      quote: 'Setiap tarikan napas kini adalah doa, setiap tendangan kuatmu adalah kabar bahwa rumah cinta kita segera lengkap.',
      defaultReflection: 'Ruang rahim kian sempit karena tubuh mungilmu sudah montok sempurna. Tak sabar rasanya mencium aroma surgawi rambut kecilmu.',
      focus: ['Latihan Pernapasan & Senam Hamil', 'Menata Tas Bersalin ke Rumah Sakit', 'Menanti Hari Kelahiran Penuh Kepasrahan'],
      defaultPrayer: 'Ya Tuhan, mudahkanlah proses persalinan nanti, berikan bunda kekuatan, dan selamatkan kami berdua dalam pelukan yang hangat...'
    },
  }[trimester];

  const [reflection, setReflection] = useState(trimesterMeta.defaultReflection);
  const [prayer, setPrayer] = useState(trimesterMeta.defaultPrayer);

  return (
    <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
      {/* ============================================================== */}
      {/* HALAMAN KIRI: FULL EDITORIAL QUOTE DIVIDER                    */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between items-center text-center py-6 sm:py-8 border-2 rounded-xs" style={{ borderColor: theme.borderColor }}>
          <div className="pt-2 sm:pt-4">
            <span className="text-[10px] uppercase tracking-[0.25em] font-sans text-stone-500 block mb-1">
              Pembatas Buku • Bab 2
            </span>
            <span className="text-xs font-sans font-bold" style={{ color: theme.primaryColor }}>
              {trimesterMeta.range}
            </span>
          </div>

          <div className="my-auto max-w-xs px-4 sm:px-6">
            <span className="font-serif italic text-5xl sm:text-6xl block mb-1 opacity-30 select-none" style={{ color: theme.secondaryColor }}>
              “
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal leading-tight mb-3" style={{ color: theme.textColor }}>
              {trimesterMeta.title}
            </h2>
            <div className="w-12 h-0.5 mx-auto mb-3" style={{ backgroundColor: theme.secondaryColor }} />
            <p className="font-serif italic text-xs sm:text-sm text-stone-700 leading-relaxed font-light">
              "{trimesterMeta.quote}"
            </p>
          </div>

          <div className="pb-2 sm:pb-4">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-sans">
              {trimesterMeta.subtitle}
            </span>
          </div>
        </div>

        <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
          <span>{leftPageNum}</span>
          <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Pembatas Trimester</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HALAMAN KANAN: RANGKUMAN & TARGET TRIMESTER                    */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                Refleksi Awal
              </span>
              <h3 className="font-serif text-2xl font-bold" style={{ color: theme.textColor }}>
                Menyambut {trimesterMeta.title}
              </h3>
            </div>

            {/* Editable Reflection */}
            <div className="mb-3">
              <span className="text-[8.5px] uppercase tracking-wider text-stone-500 font-medium block mb-1">
                Catatan Hati Bunda:
              </span>
              {isFillMode ? (
                <textarea 
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={3}
                  className="w-full text-[11px] font-serif italic text-stone-800 bg-white/70 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                  style={{ borderColor: theme.borderColor }}
                />
              ) : (
                <div 
                  className="h-20 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                  style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                />
              )}
            </div>

            {/* Focus Checklist */}
            <div className="mb-3">
              <div 
                className="border py-1 text-center text-[9.5px] font-semibold uppercase tracking-widest mb-2"
                style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
              >
                Fokus Utama Kesehatan & Doa Bunda
              </div>
              <div className="space-y-1.5">
                {trimesterMeta.focus.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white border rounded-xs" style={{ borderColor: theme.borderColor }}>
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: theme.primaryColor }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    </div>
                    <span className="text-[10px] text-stone-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable Prayer Note Area */}
            <div>
              <div 
                className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1"
                style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor, color: theme.textColor }}
              >
                Harapan & Doa Khusus Bunda di Trimester Ini
              </div>
              {isFillMode ? (
                <textarea 
                  value={prayer}
                  onChange={(e) => setPrayer(e.target.value)}
                  rows={3}
                  className="w-full text-[11px] font-serif italic text-stone-800 bg-white/70 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                  style={{ borderColor: theme.borderColor }}
                />
              ) : (
                <div 
                  className="h-20 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                  style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                />
              )}
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">{trimesterMeta.title}</span>
            <span>{rightPageNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
