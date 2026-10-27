import React, { useState, useEffect } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';
import { Camera, CheckSquare, Square, ShoppingBag } from 'lucide-react';

interface Bab3PersiapanProps {
  theme: BookThemeConfig;
  spreadIndex: 0 | 1 | 2; // 0 for 85-86, 1 for 87-88, 2 for 89-90
  leftPageNum: number;
  rightPageNum: number;
  isFillMode?: boolean;
}

export const Bab3Persiapan: React.FC<Bab3PersiapanProps> = ({
  theme,
  spreadIndex,
  leftPageNum,
  rightPageNum,
  isFillMode = true,
}) => {
  const getSavedBab3 = () => {
    try {
      const s = localStorage.getItem('bunda_bab3');
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  };
  const savedBab3 = getSavedBab3();

  // Baby names state with localStorage persistence
  const [candidates, setCandidates] = useState([
    { name: savedBab3?.candidate1 ? `1. ${savedBab3.candidate1.replace(/^\d+\.\s*/, '')}` : '1. Rayyan Al-Fatih', meaning: 'Pintu surga bagi orang yang berpuasa & sang penakluk berbudi luhur' },
    { name: savedBab3?.candidate2 ? `2. ${savedBab3.candidate2.replace(/^\d+\.\s*/, '')}` : '2. Kinanti Ayudia', meaning: 'Tembang harapan yang anggun dan memancarkan kelembutan' },
    { name: savedBab3?.candidate3 ? `3. ${savedBab3.candidate3.replace(/^\d+\.\s*/, '')}` : '3. Malik Ibrahim', meaning: 'Pemimpin bijaksana yang teguh hatinya' },
    { name: savedBab3?.candidate4 ? `4. ${savedBab3.candidate4.replace(/^\d+\.\s*/, '')}` : '4. Nayla Salsabila', meaning: 'Anugerah kesuksesan yang mengalir jernih seperti mata air surga' },
  ]);
  const [chosenName, setChosenName] = useState(savedBab3?.chosenName || 'Kalandra Atharrazka');
  const [chosenMeaning, setChosenMeaning] = useState(
    savedBab3?.chosenMeaning || '"Penerang yang riang gembira dan senantiasa dilimpahi rezeki bersih."'
  );

  // Nursery photo & checklist state with localStorage persistence
  const [nurseryPhoto, setNurseryPhoto] = useState<string | null>(savedBab3?.nurseryPhoto || null);
  const [nurseryItems, setNurseryItems] = useState([
    { label: 'Box Tidur Bayi & Matras Empuk', checked: savedBab3?.nurseryBoxChecked ?? true },
    { label: 'Kelambu Nyamuk Halus', checked: savedBab3?.nurseryNetChecked ?? true },
    { label: 'Lampu Tidur Redup Hangat', checked: savedBab3?.nurseryLampChecked ?? true },
    { label: 'Kursi Menyusui Nyaman Bunda', checked: savedBab3?.nurseryChairChecked ?? true },
    { label: 'Lemari Pakaian & Laci Popok', checked: savedBab3?.nurseryWardrobeChecked ?? true },
    { label: 'Termometer & Pengatur Suhu', checked: savedBab3?.nurseryThermometerChecked ?? true },
  ]);

  // Persist back to bunda_bab3 automatically
  useEffect(() => {
    try {
      const data = {
        candidate1: candidates[0]?.name || '',
        candidate2: candidates[1]?.name || '',
        candidate3: candidates[2]?.name || '',
        candidate4: candidates[3]?.name || '',
        chosenName,
        chosenMeaning,
        nurseryPhoto,
        nurseryBoxChecked: nurseryItems[0]?.checked ?? true,
        nurseryNetChecked: nurseryItems[1]?.checked ?? true,
        nurseryLampChecked: nurseryItems[2]?.checked ?? true,
        nurseryChairChecked: nurseryItems[3]?.checked ?? true,
        nurseryWardrobeChecked: nurseryItems[4]?.checked ?? true,
        nurseryThermometerChecked: nurseryItems[5]?.checked ?? true,
      };
      localStorage.setItem('bunda_bab3', JSON.stringify(data));
    } catch {}
  }, [candidates, chosenName, chosenMeaning, nurseryPhoto, nurseryItems]);

  // Shopping list 1 state
  const [clothesList, setClothesList] = useState([
    { name: 'Baju Lengan Pendek & Kutung (6 pcs)', done: true },
    { name: 'Baju Lengan Panjang & Celana Tutup (6 pcs)', done: true },
    { name: 'Kain Bedong Lembut Katun (6-8 lembar)', done: true },
    { name: 'Sarung Tangan & Kaos Kaki Rajut (4 pasang)', done: true },
    { name: 'Topi Katun Bayi Baru Lahir (3 pcs)', done: true },
  ]);
  const [bathList, setBathList] = useState([
    { name: 'Bak Mandi Bayi Ergonomis', done: true },
    { name: 'Handuk Bayi Bahan Bambu Super Lembut (3 pcs)', done: true },
    { name: 'Sabun & Sampo Head-to-Toe Organik Hypoallergenic', done: true },
    { name: 'Kapas Bulat Steril & Minyak Telon Alami', done: true },
  ]);

  // Shopping list 2 state
  const [diaperList, setDiaperList] = useState([
    { name: 'Popok Kain / Positif Newborn (2 ball / 12 pcs)', done: true },
    { name: 'Tisu Basah Khusus Kulit Sensitif (99% Pure Water)', done: true },
    { name: 'Perlak Waterproof Anti Bocor (2 lembar)', done: true },
    { name: 'Krim Ruam Popok / Diaper Rash Balm', done: true },
  ]);
  const [feedingList, setFeedingList] = useState([
    { name: 'Pompa ASI Hospital Grade (Electric / Manual)', done: true },
    { name: 'Kantong ASI & Botol Kaca Penyimpan ASI (30 pcs)', done: true },
    { name: 'Bantal Menyusui U-Shape Ergonomis', done: true },
    { name: 'Nipple Cream Lanolin Murni & Breast Pad', done: true },
  ]);

  // Hospital bag items
  const [hospitalBagMom, setHospitalBagMom] = useState([
    { text: 'KTP, KK, Buku KIA / Pink, Kartu BPJS/Asuransi', checked: true },
    { text: 'Daster Kancing Depan / Baju Menyusui (3 stel)', checked: true },
    { text: 'Bra Menyusui & Celana Dalam Hamil (4 pcs)', checked: true },
    { text: 'Pembalut Bersalin Super Panjang & Maternity Panties', checked: true },
    { text: 'Sandal Kamar Nyaman & Selimut Favorit', checked: true },
  ]);

  const [hospitalBagBaby, setHospitalBagBaby] = useState([
    { text: 'Baju Pulang Bayi + Topi + Sarung Kaki (2 set)', checked: true },
    { text: 'Bedong Halus & Selimut Bayi Hangat (3 lembar)', checked: true },
    { text: 'Popok Newborn & Tisu Basah Tanpa Alkohol', checked: true },
    { text: 'Minyak Telon & Gendongan Bayi Nyaman', checked: true },
  ]);

  const [hospitalBagDad, setHospitalBagDad] = useState([
    { text: 'Baju Ganti Santai & Jaket Hangat (2 stel)', checked: true },
    { text: 'Charger Ponsel, Powerbank & Kamera', checked: true },
    { text: 'Snack Energi, Air Mineral & Madu Murni', checked: true },
    { text: 'Alat Ibadah & Doa Mempermudah Persalinan', checked: true },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setter(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCheck = (list: any[], setter: (v: any[]) => void, idx: number, key = 'checked') => {
    const updated = [...list];
    updated[idx][key] = !updated[idx][key];
    setter(updated);
  };

  if (spreadIndex === 0) {
    // Pages 85 & 86: Nama & Kamar Bayi
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* Hal 85: Ide Nama Bayi */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Inspirasi Nama Buah Hati</h2>
              </div>

              <div className="space-y-3 mb-3">
                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Kandidat Nama & Makna
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    {candidates.map((row, i) => (
                      <div key={i} className="p-1.5 bg-white border rounded-xs" style={{ borderColor: theme.borderColor }}>
                        {isFillMode ? (
                          <>
                            <input 
                              type="text"
                              value={row.name}
                              onChange={(e) => {
                                const up = [...candidates];
                                up[i].name = e.target.value;
                                setCandidates(up);
                              }}
                              className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none text-[11px]"
                            />
                            <input 
                              type="text"
                              value={row.meaning}
                              onChange={(e) => {
                                const up = [...candidates];
                                up[i].meaning = e.target.value;
                                setCandidates(up);
                              }}
                              className="w-full text-[9.5px] text-stone-500 italic bg-transparent outline-none"
                            />
                          </>
                        ) : (
                          <>
                            <span className="font-serif font-bold text-stone-400 block">Kandidat {i + 1}: ________________________</span>
                            <span className="text-[9px] text-stone-400 italic block">Makna: _____________________________________________</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final Name Decision Box */}
                <div className="p-3 bg-white border-2 border-dashed text-center rounded-xs" style={{ borderColor: theme.primaryColor }}>
                  <span className="text-[9px] uppercase font-bold tracking-wider block mb-1" style={{ color: theme.primaryColor }}>
                    Nama Pilihan Untuk Buah Hati:
                  </span>
                  {isFillMode ? (
                    <>
                      <input 
                        type="text"
                        value={chosenName}
                        onChange={(e) => setChosenName(e.target.value)}
                        className="font-serif text-xl sm:text-2xl font-bold py-0.5 text-center w-full bg-transparent outline-none" 
                        style={{ color: theme.textColor }}
                      />
                      <input 
                        type="text"
                        value={chosenMeaning}
                        onChange={(e) => setChosenMeaning(e.target.value)}
                        className="text-[10px] text-stone-500 italic font-serif text-center w-full bg-transparent outline-none mt-1"
                      />
                    </>
                  ) : (
                    <div className="py-2 text-stone-400 font-serif">_________________________________</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>{leftPageNum}</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Ide Nama</span>
            </div>
          </div>
        </div>

        {/* Hal 86: Kamar & Pojok Menyusui */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Kamar Si Kecil</h2>
              </div>

              {/* Photo placeholder for Nursery */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-white p-2.5 shadow-md border border-stone-200 mb-3">
                <div className="washi-tape" style={{ position: 'absolute', width: '32mm', height: '8mm', backgroundColor: theme.washiBg, transform: 'rotate(2deg)', top: '-4mm', left: '50%', marginLeft: '-16mm', zIndex: 10 }} />
                
                <label className="block cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setNurseryPhoto)} 
                  />
                  {nurseryPhoto ? (
                    <img 
                      src={nurseryPhoto} 
                      alt="Kamar Bayi" 
                      className="w-full h-36 sm:h-44 object-cover border border-stone-200" 
                    />
                  ) : (
                    <div className="w-full h-36 sm:h-44 bg-stone-50 group-hover:bg-amber-50/50 transition-colors border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-3 text-center">
                      <Camera className="w-6 h-6 text-stone-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-semibold text-stone-600 block">
                        Tempel Foto Box Bayi / Sudut Kamar
                      </span>
                      <span className="text-[8.5px] text-stone-400 mt-0.5">
                        (Ketuk untuk pilih foto dekorasi kamar)
                      </span>
                    </div>
                  )}
                </label>

                <div className="mt-1 text-center text-[9px] font-serif italic text-stone-500">"Pojok ternyaman yang siap menyambut tidur lelapmu..."</div>
              </div>

              {/* Nursery Checklist (Interactive) */}
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>Checklist Penataan Kamar</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[9.5px] bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                  {nurseryItems.map((item, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => toggleCheck(nurseryItems, setNurseryItems, idx, 'checked')}
                      className="flex items-center gap-1.5 text-left cursor-pointer hover:bg-stone-50 p-1 rounded-xs transition-colors"
                    >
                      {item.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#556B2F] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      )}
                      <span className={item.checked ? 'text-stone-850 font-medium' : 'text-stone-400 line-through'}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Pojok Kamar</span>
              <span>{rightPageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (spreadIndex === 1) {
    // Pages 87 & 88: Shopping List 1 & 2
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* Hal 87: Shopping List Bagian 1 */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Belanja Bayi (1)</h2>
              </div>

              <div className="space-y-3">
                {/* Section A: Pakaian & Kain */}
                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Pakaian, Bedong & Sarung Tangan
                  </div>
                  <div className="bg-white border p-2 space-y-1.5 text-[10px] rounded-xs" style={{ borderColor: theme.borderColor }}>
                    {clothesList.map((row, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => toggleCheck(clothesList, setClothesList, i, 'done')}
                        className="flex items-center justify-between w-full border-b border-stone-100 pb-1 cursor-pointer hover:bg-stone-50 text-left"
                      >
                        <span className={row.done ? 'text-stone-850 font-medium' : 'text-stone-400'}>{row.name}</span>
                        {row.done ? (
                          <span className="text-[9px] font-bold text-[#556B2F] px-1.5 py-0.2 bg-[#556B2F]/10 rounded-sm">Sudah</span>
                        ) : (
                          <span className="text-[9px] text-stone-400 px-1.5 py-0.2 bg-stone-100 rounded-sm">Belum</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section B: Mandi & Kebersihan */}
                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Perlengkapan Mandi & Kulit Bayi
                  </div>
                  <div className="bg-white border p-2 space-y-1.5 text-[10px] rounded-xs" style={{ borderColor: theme.borderColor }}>
                    {bathList.map((row, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => toggleCheck(bathList, setBathList, i, 'done')}
                        className="flex items-center justify-between w-full border-b border-stone-100 pb-1 cursor-pointer hover:bg-stone-50 text-left"
                      >
                        <span className={row.done ? 'text-stone-850 font-medium' : 'text-stone-400'}>{row.name}</span>
                        {row.done ? (
                          <span className="text-[9px] font-bold text-[#556B2F] px-1.5 py-0.2 bg-[#556B2F]/10 rounded-sm">Sudah</span>
                        ) : (
                          <span className="text-[9px] text-stone-400 px-1.5 py-0.2 bg-stone-100 rounded-sm">Belum</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>{leftPageNum}</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Belanja Pakaian</span>
            </div>
          </div>
        </div>

        {/* Hal 88: Shopping List Bagian 2 */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Belanja Bayi (2)</h2>
              </div>

              <div className="space-y-3">
                {/* Section C: Sanitasi & Popok */}
                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Popok, Sanitasi & Perlak
                  </div>
                  <div className="bg-white border p-2 space-y-1.5 text-[10px] rounded-xs" style={{ borderColor: theme.borderColor }}>
                    {diaperList.map((row, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => toggleCheck(diaperList, setDiaperList, i, 'done')}
                        className="flex items-center justify-between w-full border-b border-stone-100 pb-1 cursor-pointer hover:bg-stone-50 text-left"
                      >
                        <span className={row.done ? 'text-stone-850 font-medium' : 'text-stone-400'}>{row.name}</span>
                        {row.done ? (
                          <span className="text-[9px] font-bold text-[#556B2F] px-1.5 py-0.2 bg-[#556B2F]/10 rounded-sm">Sudah</span>
                        ) : (
                          <span className="text-[9px] text-stone-400 px-1.5 py-0.2 bg-stone-100 rounded-sm">Belum</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section D: Kebutuhan Menyusui & ASI */}
                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Perlengkapan ASI & Kenyamanan Bunda
                  </div>
                  <div className="bg-white border p-2 space-y-1.5 text-[10px] rounded-xs" style={{ borderColor: theme.borderColor }}>
                    {feedingList.map((row, i) => (
                      <button 
                        key={i} 
                        type="button"
                        onClick={() => toggleCheck(feedingList, setFeedingList, i, 'done')}
                        className="flex items-center justify-between w-full border-b border-stone-100 pb-1 cursor-pointer hover:bg-stone-50 text-left"
                      >
                        <span className={row.done ? 'text-stone-850 font-medium' : 'text-stone-400'}>{row.name}</span>
                        {row.done ? (
                          <span className="text-[9px] font-bold text-[#556B2F] px-1.5 py-0.2 bg-[#556B2F]/10 rounded-sm">Sudah</span>
                        ) : (
                          <span className="text-[9px] text-stone-400 px-1.5 py-0.2 bg-stone-100 rounded-sm">Belum</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Belanja Popok & ASI</span>
              <span>{rightPageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spread 2: Pages 89 & 90: Hospital Bag Checklist
  return (
    <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
      {/* Hal 89: Tas Bersalin Bunda & Ayah */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Tas RS: Bunda & Ayah</h2>
            </div>

            <div className="space-y-3">
              {/* Tas Bunda */}
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Tas Perlengkapan & Berkas Bunda
                </div>
                <div className="space-y-1 bg-white p-2 border rounded-xs text-[10px]" style={{ borderColor: theme.borderColor }}>
                  {hospitalBagMom.map((row, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => toggleCheck(hospitalBagMom, setHospitalBagMom, i, 'checked')}
                      className="flex items-center gap-2 w-full text-left py-0.5 cursor-pointer hover:bg-stone-50"
                    >
                      {row.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#556B2F] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      )}
                      <span className={row.checked ? 'text-stone-850 font-medium' : 'text-stone-400 line-through'}>{row.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tas Ayah Siaga */}
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Tas Perlengkapan Ayah Siaga
                </div>
                <div className="space-y-1 bg-white p-2 border rounded-xs text-[10px]" style={{ borderColor: theme.borderColor }}>
                  {hospitalBagDad.map((row, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => toggleCheck(hospitalBagDad, setHospitalBagDad, i, 'checked')}
                      className="flex items-center gap-2 w-full text-left py-0.5 cursor-pointer hover:bg-stone-50"
                    >
                      {row.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#556B2F] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      )}
                      <span className={row.checked ? 'text-stone-850 font-medium' : 'text-stone-400 line-through'}>{row.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span>{leftPageNum}</span>
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Tas Bunda & Ayah</span>
          </div>
        </div>
      </div>

      {/* Hal 90: Tas Bayi & Dokumen Kelahiran */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 3: Persiapan</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Tas RS: Buah Hati</h2>
            </div>

            <div className="space-y-3">
              {/* Tas Bayi */}
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1.5" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Tas Perlengkapan Lahir Si Kecil
                </div>
                <div className="space-y-1 bg-white p-2 border rounded-xs text-[10px]" style={{ borderColor: theme.borderColor }}>
                  {hospitalBagBaby.map((row, i) => (
                    <button 
                      key={i} 
                      type="button"
                      onClick={() => toggleCheck(hospitalBagBaby, setHospitalBagBaby, i, 'checked')}
                      className="flex items-center gap-2 w-full text-left py-0.5 cursor-pointer hover:bg-stone-50"
                    >
                      {row.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#556B2F] shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      )}
                      <span className={row.checked ? 'text-stone-850 font-medium' : 'text-stone-400 line-through'}>{row.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ready Status Card */}
              <div className="border p-3 bg-white/80 rounded-xs text-center" style={{ borderColor: theme.borderColor }}>
                <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-stone-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider block text-stone-800">
                  Tas Bersalin & Dokumen Telah Siap
                </span>
                <p className="font-serif italic text-[9.5px] text-stone-500 mt-1">
                  "Siap berangkat kapan pun kontraksi cinta itu memanggil kita menuju ruang persalinan..."
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Tas Buah Hati</span>
            <span>{rightPageNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
