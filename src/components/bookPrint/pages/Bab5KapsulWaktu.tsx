import React, { useState, useEffect } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';
import { UserProfile } from '../../../types';

interface Bab5KapsulWaktuProps {
  theme: BookThemeConfig;
  spreadIndex: 0 | 1; // 0 for Pages 97-98 (Surat Bunda), 1 for Pages 99-100 (Surat Ayah)
  leftPageNum: number;
  rightPageNum: number;
  userProfile: UserProfile;
  isFillMode?: boolean;
}

export const Bab5KapsulWaktu: React.FC<Bab5KapsulWaktuProps> = ({
  theme,
  spreadIndex,
  leftPageNum,
  rightPageNum,
  userProfile,
  isFillMode = true,
}) => {
  const getSavedBab5 = () => {
    try {
      const s = localStorage.getItem('bunda_bab5');
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  };
  const savedBab5 = getSavedBab5();

  // Bunda's letters with localStorage persistence
  const [bundaLetterPart1, setBundaLetterPart1] = useState(
    savedBab5?.bundaLetterPart1 ||
    'Anakku sayang,\n\nSaat kamu membaca surat ini, mungkin jemari tanganmu sudah jauh lebih besar dari jemari mungil yang dulu bunda genggam erat di ruang bersalin. Waktu berlalu begitu cepat, nak.\n\nBunda menulis lembaran ini saat kamu baru beberapa hari terlelap di dada bunda. Rasanya baru kemarin bunda merasakan detak jantungmu pertama kali di layar USG yang remang. Ketahuilah, sejak hari pertama tahu kehadiranmu, doa bunda tidak pernah berhenti mengalir untuk setiap helaan napasmu...'
  );
  const [bundaLetterPart2, setBundaLetterPart2] = useState(
    savedBab5?.bundaLetterPart2 ||
    'Jadilah pribadi yang berhati lembut, teguh membela kebenaran, dan selalu bersyukur atas hal-hal sederhana. Di saat dunia luar terasa begitu bising dan melelahkan, ingatlah bahwa pelukan bunda dan rumah ini akan selalu menjadi dermaga teraman tempatmu berlabuh pulang.\n\nTerima kasih telah memilih bunda menjadi ibumu di dunia ini. Kamu adalah anugerah dan kebanggaan terbesar dalam hidup bunda.'
  );
  const [bundaSignName, setBundaSignName] = useState(savedBab5?.bundaSignName || userProfile.name || 'Bunda Jessica');

  // Ayah's letters with localStorage persistence
  const [ayahLetterPart1, setAyahLetterPart1] = useState(
    savedBab5?.ayahLetterPart1 ||
    'Wahai buah hatiku,\n\nSaat kamu membaca surat ini, mungkin pundak ayah sudah tak sekuat dulu lagi untuk menggendongmu di atas bahu mengelilingi taman. Namun ketahuilah, rasa cinta dan perlindungan ayah kepadamu tak akan pernah luntur sedetik pun.\n\nAyah mungkin tidak selalu pandai merangkai kata seindah bundamu. Tapi di setiap tetes peluh kerja keras ayah, ada namamu yang selalu ayah sebut dalam sujud. Ayah ingin kamu tumbuh menjadi insan yang jujur, berani bermimpi besar, dan pantang menyerah...'
  );
  const [ayahLetterPart2, setAyahLetterPart2] = useState(
    savedBab5?.ayahLetterPart2 ||
    'Jangan pernah takut gagal, nak. Gagal adalah tanda bahwa kamu sedang berjuang keras menggapai cita-cita mulia. Ayah akan selalu ada di belakangmu, menjadi dinding kokoh yang menopang langkahmu.\n\nHormatilah ibumu yang telah mengandungmu selama 9 bulan penuh pengorbanan suci. Bahagiakan dia di setiap hembusan usiamu.\n\nDengan rasa bangga yang tak terhingga,\nAyahmu.'
  );
  const [ayahSignName, setAyahSignName] = useState(savedBab5?.ayahSignName || 'Ayah Tersayang');

  // Persist back to bunda_bab5 automatically
  useEffect(() => {
    try {
      const data = {
        bundaLetterPart1,
        bundaLetterPart2,
        bundaSignName,
        ayahLetterPart1,
        ayahLetterPart2,
        ayahSignName,
      };
      localStorage.setItem('bunda_bab5', JSON.stringify(data));
    } catch {}
  }, [bundaLetterPart1, bundaLetterPart2, bundaSignName, ayahLetterPart1, ayahLetterPart2, ayahSignName]);

  if (spreadIndex === 0) {
    // Pages 97 & 98: Surat dari Bunda
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* Hal 97: Surat Bunda Bagian 1 */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 5: Surat Kapsul Waktu</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Surat dari Bunda (1)</h2>
                <span className="text-[9px] text-[#C87A64] font-sans italic">"Buka saat usiamu genap 17 tahun atau di hari pernikahanmu kelak..."</span>
              </div>

              <div>
                {isFillMode ? (
                  <textarea 
                    value={bundaLetterPart1}
                    onChange={(e) => setBundaLetterPart1(e.target.value)}
                    rows={12}
                    className="w-full text-[11.5px] font-serif italic text-stone-800 bg-white/60 p-3 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-72 border-b border-stone-300 relative text-[10.5px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7.4mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 7.3mm, ${theme.borderColor} 7.4mm)`, backgroundSize: '100% 7.4mm' }}
                  />
                )}
              </div>
            </div>
            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>{leftPageNum}</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Surat Bunda</span>
            </div>
          </div>
        </div>

        {/* Hal 98: Surat Bunda Bagian 2 */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 5: Surat Kapsul Waktu</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Surat dari Bunda (2)</h2>
              </div>

              <div>
                {isFillMode ? (
                  <textarea 
                    value={bundaLetterPart2}
                    onChange={(e) => setBundaLetterPart2(e.target.value)}
                    rows={9}
                    className="w-full text-[11.5px] font-serif italic text-stone-800 bg-white/60 p-3 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-56 border-b border-stone-300 relative text-[10.5px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7.4mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 7.3mm, ${theme.borderColor} 7.4mm)`, backgroundSize: '100% 7.4mm' }}
                  />
                )}
              </div>

              <div className="mt-4 pt-3 flex justify-between items-end border-t border-stone-200">
                <div className="text-[9.5px] font-sans text-stone-500">
                  Tertanda dengan sejuta cinta,
                </div>
                <div className="text-right border-b border-stone-400 pb-1 min-w-[40mm]">
                  {isFillMode ? (
                    <input 
                      type="text" 
                      value={bundaSignName}
                      onChange={(e) => setBundaSignName(e.target.value)}
                      className="font-serif text-sm font-bold block text-right bg-transparent outline-none w-full"
                      style={{ color: theme.textColor }}
                    />
                  ) : (
                    <span className="font-serif text-sm font-bold text-stone-400">________________</span>
                  )}
                  <span className="text-[8.5px] text-stone-400 italic">Bundamu selamanya</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Pesan Bunda</span>
              <span>{rightPageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pages 99 & 100: Surat dari Ayah
  return (
    <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
      {/* Hal 99: Surat Ayah Bagian 1 */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 5: Surat Kapsul Waktu</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Surat dari Ayah (1)</h2>
              <span className="text-[9px] text-[#556B2F] font-sans italic">"Pesan seorang pria yang pertama kali mengumandangkan adzan di telingamu..."</span>
            </div>

            <div>
              {isFillMode ? (
                <textarea 
                  value={ayahLetterPart1}
                  onChange={(e) => setAyahLetterPart1(e.target.value)}
                  rows={12}
                  className="w-full text-[11.5px] font-serif italic text-stone-800 bg-white/60 p-3 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                  style={{ borderColor: theme.borderColor }}
                />
              ) : (
                <div 
                  className="h-72 border-b border-stone-300 relative text-[10.5px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7.4mm]"
                  style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 7.3mm, ${theme.borderColor} 7.4mm)`, backgroundSize: '100% 7.4mm' }}
                />
              )}
            </div>
          </div>
          <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span>{leftPageNum}</span>
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Surat Ayah</span>
          </div>
        </div>
      </div>

      {/* Hal 100: Surat Ayah Bagian 2 & Segel Akhir 100 Halaman */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 5: Surat Kapsul Waktu</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Surat dari Ayah (2)</h2>
            </div>

            <div>
              {isFillMode ? (
                <textarea 
                  value={ayahLetterPart2}
                  onChange={(e) => setAyahLetterPart2(e.target.value)}
                  rows={8}
                  className="w-full text-[11.5px] font-serif italic text-stone-800 bg-white/60 p-3 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                  style={{ borderColor: theme.borderColor }}
                />
              ) : (
                <div 
                  className="h-52 border-b border-stone-300 relative text-[10.5px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7.4mm]"
                  style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 7.3mm, ${theme.borderColor} 7.4mm)`, backgroundSize: '100% 7.4mm' }}
                />
              )}
            </div>

            <div className="mt-2 pt-2 flex justify-between items-end border-t border-stone-200">
              <div className="text-[9.5px] font-sans text-stone-500">
                Tertanda dengan rasa bangga,
              </div>
              <div className="text-right border-b border-stone-400 pb-1 min-w-[40mm]">
                {isFillMode ? (
                  <input 
                    type="text" 
                    value={ayahSignName}
                    onChange={(e) => setAyahSignName(e.target.value)}
                    className="font-serif text-sm font-bold block text-right bg-transparent outline-none w-full"
                    style={{ color: theme.textColor }}
                  />
                ) : (
                  <span className="font-serif text-sm font-bold text-stone-400">________________</span>
                )}
                <span className="text-[8.5px] text-stone-400 italic">Ayahmu selamanya</span>
              </div>
            </div>

            {/* Final Book Seal */}
            <div className="mt-3 p-2.5 bg-white border text-center shadow-xs rounded-xs" style={{ borderColor: theme.primaryColor }}>
              <div className="w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center mb-1 text-xs font-serif font-bold" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
                ❦
              </div>
              <span className="font-serif text-[11px] font-bold block tracking-wider uppercase" style={{ color: theme.textColor }}>
                Jurnal 100 Halaman Selesai
              </span>
              <p className="text-[9px] text-stone-400 font-sans mt-0.5">
                "Setiap detik perjalanan ini terukir abadi untukmu, buah hati tercinta."
              </p>
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Pesan Ayah & Segel Buku</span>
            <span>{rightPageNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
