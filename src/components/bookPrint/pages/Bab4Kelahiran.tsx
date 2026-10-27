import React, { useState, useEffect } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';
import { UserProfile } from '../../../types';
import { Camera, Footprints, FileText } from 'lucide-react';

interface Bab4KelahiranProps {
  theme: BookThemeConfig;
  spreadIndex: 0 | 1 | 2; // 0 for 91-92, 1 for 93-94, 2 for 95-96
  leftPageNum: number;
  rightPageNum: number;
  userProfile: UserProfile;
  isFillMode?: boolean;
}

export const Bab4Kelahiran: React.FC<Bab4KelahiranProps> = ({
  theme,
  spreadIndex,
  leftPageNum,
  rightPageNum,
  userProfile,
  isFillMode = true,
}) => {
  const getSavedBab4 = () => {
    try {
      const s = localStorage.getItem('bunda_bab4');
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  };
  const savedBab4 = getSavedBab4();

  // Page 91 & 92 state with localStorage persistence
  const [contractionTime, setContractionTime] = useState(savedBab4?.contractionTime || 'Pukul 02:30 Dini Hari');
  const [arrivalTime, setArrivalTime] = useState(savedBab4?.arrivalTime || 'Pukul 05:45 Subuh');
  const [laborStory, setLaborStory] = useState(
    savedBab4?.laborStory || 'Setiap gelombang cinta kontraksi bunda hadapi dengan napas panjang. Ayah membisikkan doa dan memegang tangan bunda tanpa sedetik pun melepaskannya. Seluruh rasa sakit sirna seketika saat dokter berkata, "Kepalanya sudah terlihat, Bunda!"...'
  );
  const [birthPhoto, setBirthPhoto] = useState<string | null>(savedBab4?.birthPhoto || null);
  const [holdingBabyFeeling, setHoldingBabyFeeling] = useState(
    savedBab4?.holdingBabyFeeling || 'Kulit hangatmu diletakkan di dada bunda. Mata manismu berkedip perlahan mencari aroma pelukan ini. Selamat datang di dunia, buah hatiku tersayang...'
  );

  // Page 93 & 94 state with localStorage persistence
  const [babyName, setBabyName] = useState(savedBab4?.babyName || userProfile.babyNickname || 'Kalandra Atharrazka');
  const [birthDate, setBirthDate] = useState(savedBab4?.birthDate || userProfile.hplDate || 'Minggu, 18 Mei 2025');
  const [birthTime, setBirthTime] = useState(savedBab4?.birthTime || '09:18 WIB');
  const [birthWeight, setBirthWeight] = useState(savedBab4?.birthWeight || '3.350 gram (3.35 kg)');
  const [birthLength, setBirthLength] = useState(savedBab4?.birthLength || '50 cm');
  const [headCircumference, setHeadCircumference] = useState(savedBab4?.headCircumference || '34 cm');
  const [bloodType, setBloodType] = useState(savedBab4?.bloodType || userProfile.bloodType || 'O (Rhesus Positif)');
  const [leftFootprint, setLeftFootprint] = useState<string | null>(savedBab4?.leftFootprint || null);
  const [rightFootprint, setRightFootprint] = useState<string | null>(savedBab4?.rightFootprint || null);

  // Page 95 & 96 state with localStorage persistence
  const [babyWristbandPhoto, setBabyWristbandPhoto] = useState<string | null>(savedBab4?.babyWristbandPhoto || null);
  const [momWristbandPhoto, setMomWristbandPhoto] = useState<string | null>(savedBab4?.momWristbandPhoto || null);
  const [familyPhoto, setFamilyPhoto] = useState<string | null>(savedBab4?.familyPhoto || null);

  // Persist back to bunda_bab4 automatically
  useEffect(() => {
    try {
      const data = {
        contractionTime,
        arrivalTime,
        laborStory,
        birthPhoto,
        holdingBabyFeeling,
        babyName,
        birthDate,
        birthTime,
        birthWeight,
        birthLength,
        headCircumference,
        bloodType,
        leftFootprint,
        rightFootprint,
        babyWristbandPhoto,
        momWristbandPhoto,
        familyPhoto,
      };
      localStorage.setItem('bunda_bab4', JSON.stringify(data));
    } catch {}
  }, [
    contractionTime, arrivalTime, laborStory, birthPhoto, holdingBabyFeeling,
    babyName, birthDate, birthTime, birthWeight, birthLength,
    headCircumference, bloodType, leftFootprint, rightFootprint,
    babyWristbandPhoto, momWristbandPhoto, familyPhoto
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

  if (spreadIndex === 0) {
    // Pages 91 & 92: Detik Kelahiran & Tangisan Pertama
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* Hal 91: Perjalanan Persalinan */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Hari Yang Dinanti</h2>
              </div>

              <div className="space-y-3 mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                    <span className="text-[8px] text-stone-400 uppercase block font-medium">Kontraksi Pertama:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={contractionTime}
                        onChange={(e) => setContractionTime(e.target.value)}
                        className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none"
                      />
                    ) : (
                      <span className="text-stone-400 font-serif">________________</span>
                    )}
                  </div>

                  <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                    <span className="text-[8px] text-stone-400 uppercase block font-medium">Tiba di Rumah Sakit:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none"
                      />
                    ) : (
                      <span className="text-stone-400 font-serif">________________</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                    Cerita Perjuangan Bunda & Kesetiaan Ayah
                  </div>
                  {isFillMode ? (
                    <textarea 
                      value={laborStory}
                      onChange={(e) => setLaborStory(e.target.value)}
                      rows={5}
                      className="w-full text-[11px] font-serif italic text-stone-800 bg-white/70 p-2.5 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                      style={{ borderColor: theme.borderColor }}
                    />
                  ) : (
                    <div 
                      className="h-32 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                      style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>{leftPageNum}</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Proses Persalinan</span>
            </div>
          </div>
        </div>

        {/* Hal 92: Tangisan Pertama & Foto Lahir */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Tangisan Pertamamu</h2>
              </div>

              {/* Photo placeholder for Birth / IMD */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-white p-2.5 shadow-md border border-stone-200 mb-3">
                <div className="washi-tape" style={{ position: 'absolute', width: '32mm', height: '8mm', backgroundColor: theme.washiBg, transform: 'rotate(-3deg)', top: '-4mm', left: '50%', marginLeft: '-16mm', zIndex: 10 }} />
                
                <label className="block cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setBirthPhoto)} 
                  />
                  {birthPhoto ? (
                    <img 
                      src={birthPhoto} 
                      alt="Foto Kelahiran" 
                      className="w-full h-40 sm:h-48 object-cover border border-stone-200" 
                    />
                  ) : (
                    <div className="w-full h-40 sm:h-48 bg-stone-50 group-hover:bg-amber-50/50 transition-colors border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-3 text-center">
                      <Camera className="w-6 h-6 text-stone-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-semibold text-stone-600 block">
                        Tempel Foto Momen IMD / Pelukan Pertama
                      </span>
                      <span className="text-[8.5px] text-stone-400 mt-0.5">
                        (Ketuk untuk pilih foto bayi baru lahir)
                      </span>
                    </div>
                  )}
                </label>

                <div className="mt-1 text-center text-[9.5px] font-serif italic text-stone-600">
                  "Pukul 09:18 WIB • Tangisan paling merdu di muka bumi..."
                </div>
              </div>

              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Yang Bunda Rasakan Saat Memelukmu Pertama Kali
                </div>
                {isFillMode ? (
                  <textarea 
                    value={holdingBabyFeeling}
                    onChange={(e) => setHoldingBabyFeeling(e.target.value)}
                    rows={3}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/70 p-2.5 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
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
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Detik Kelahiran</span>
              <span>{rightPageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (spreadIndex === 1) {
    // Pages 93 & 94: Biodata Lengkap & Cap Kaki / Tangan
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* Hal 93: Biodata Lengkap Buah Hati */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Biodata Sang Bayi</h2>
              </div>

              {/* Certificate Style Box */}
              <div className="bg-white p-3.5 border-2 shadow-xs space-y-2.5 rounded-xs" style={{ borderColor: theme.primaryColor }}>
                <div className="text-center pb-2 border-b border-stone-200">
                  <span className="text-[8px] uppercase tracking-widest text-stone-400 font-sans block">Nama Lengkap Resmi:</span>
                  {isFillMode ? (
                    <input 
                      type="text"
                      value={babyName}
                      onChange={(e) => setBabyName(e.target.value)}
                      className="font-serif text-lg sm:text-xl font-bold text-center w-full bg-transparent outline-none mt-0.5" 
                      style={{ color: theme.textColor }}
                    />
                  ) : (
                    <div className="font-serif text-lg text-stone-400">___________________________</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Tanggal Lahir:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={birthDate} 
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>

                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Pukul Kelahiran:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={birthTime} 
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>

                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Berat Badan:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={birthWeight} 
                        onChange={(e) => setBirthWeight(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>

                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Panjang Badan:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={birthLength} 
                        onChange={(e) => setBirthLength(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>

                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Lingkar Kepala:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={headCircumference} 
                        onChange={(e) => setHeadCircumference(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>

                  <div>
                    <span className="text-[7.5px] text-stone-400 block font-medium">Golongan Darah:</span>
                    {isFillMode ? (
                      <input 
                        type="text" 
                        value={bloodType} 
                        onChange={(e) => setBloodType(e.target.value)}
                        className="w-full font-bold text-stone-850 bg-transparent outline-none" 
                      />
                    ) : <span>________________</span>}
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-2 text-[9.5px] text-stone-600 flex justify-between">
                  <span>RS: <strong>{userProfile.hospitalName || 'RSIA Bunda'}</strong></span>
                  <span>Dokter: <strong>{userProfile.doctorName || 'dr. Sarah Sp.OG'}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>{leftPageNum}</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Biodata Lahir</span>
            </div>
          </div>
        </div>

        {/* Hal 94: Jejak Kaki & Tangan Mungil */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Cap Kaki & Tangan</h2>
              </div>

              {/* Footprint Stamps Container with Upload Option */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setLeftFootprint)} 
                  />
                  <div className="bg-white border-2 border-dashed h-40 sm:h-48 p-2 flex flex-col items-center justify-center text-center rounded-xs hover:bg-stone-50" style={{ borderColor: theme.borderColor }}>
                    {leftFootprint ? (
                      <img src={leftFootprint} alt="Kaki Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <Footprints className="w-7 h-7 text-stone-300 mb-2" />
                        <span className="text-[8.5px] uppercase tracking-wider text-stone-500 font-semibold">Cap Telapak Kaki Kiri</span>
                        <span className="text-[7.5px] text-stone-400 mt-0.5">(Unggah foto cap)</span>
                      </>
                    )}
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setRightFootprint)} 
                  />
                  <div className="bg-white border-2 border-dashed h-40 sm:h-48 p-2 flex flex-col items-center justify-center text-center rounded-xs hover:bg-stone-50" style={{ borderColor: theme.borderColor }}>
                    {rightFootprint ? (
                      <img src={rightFootprint} alt="Kaki Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <Footprints className="w-7 h-7 text-stone-300 mb-2" />
                        <span className="text-[8.5px] uppercase tracking-wider text-stone-500 font-semibold">Cap Telapak Kaki Kanan</span>
                        <span className="text-[7.5px] text-stone-400 mt-0.5">(Unggah foto cap)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="border p-2.5 bg-white text-center rounded-xs" style={{ borderColor: theme.borderColor }}>
                <p className="font-serif italic text-[10px] text-stone-700">
                  "Jejak langkah pertamamu yang mungil... kelak akan menapaki dunia dengan kebaikan dan keberanian."
                </p>
              </div>
            </div>

            <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Jejak Kaki</span>
              <span>{rightPageNum}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spread 2: Pages 95 & 96 (Gelang RS & Foto Keluarga Perdana)
  return (
    <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
      {/* Hal 95: Gelang Identitas Rumah Sakit */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Gelang Kenangan RS</h2>
            </div>

            <div className="space-y-3 mb-3">
              {/* Box to tape baby's wristband */}
              <div className="bg-white border-2 border-dashed p-3 text-center relative rounded-xs" style={{ borderColor: theme.borderColor }}>
                <div className="washi-tape" style={{ position: 'absolute', width: '32mm', height: '8mm', backgroundColor: theme.washiBg, transform: 'rotate(-2deg)', top: '-4mm', left: '50%', marginLeft: '-16mm', zIndex: 10 }} />
                <FileText className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold block">
                  Tempel Gelang Identitas Bayi Rumah Sakit
                </span>
                
                <label className="block cursor-pointer mt-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setBabyWristbandPhoto)} 
                  />
                  {babyWristbandPhoto ? (
                    <img src={babyWristbandPhoto} alt="Gelang Bayi" className="h-16 mx-auto object-contain" />
                  ) : (
                    <div className="h-14 border border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center text-[8.5px] text-stone-400 hover:text-stone-600">
                      <span>Area Foto Gelang Bayi</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Box to tape mom's wristband */}
              <div className="bg-white border-2 border-dashed p-3 text-center relative rounded-xs" style={{ borderColor: theme.borderColor }}>
                <div className="washi-tape" style={{ position: 'absolute', width: '32mm', height: '8mm', backgroundColor: theme.washiBg, transform: 'rotate(2deg)', top: '-4mm', left: '50%', marginLeft: '-16mm', zIndex: 10 }} />
                <FileText className="w-5 h-5 mx-auto text-stone-400 mb-1" />
                <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold block">
                  Tempel Gelang Identitas Bunda Rumah Sakit
                </span>
                
                <label className="block cursor-pointer mt-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setMomWristbandPhoto)} 
                  />
                  {momWristbandPhoto ? (
                    <img src={momWristbandPhoto} alt="Gelang Bunda" className="h-16 mx-auto object-contain" />
                  ) : (
                    <div className="h-14 border border-stone-200 bg-stone-50/50 flex flex-col items-center justify-center text-[8.5px] text-stone-400 hover:text-stone-600">
                      <span>Area Foto Gelang Bunda</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span>{leftPageNum}</span>
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Gelang RS</span>
          </div>
        </div>
      </div>

      {/* Hal 96: Foto Keluarga Pertama Bertiga */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none" 
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">Bab 4: Kelahiran</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>Keluarga Perdana</h2>
            </div>

            <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-white p-2.5 shadow-md border border-stone-200 mb-3">
              <div className="washi-tape" style={{ position: 'absolute', width: '32mm', height: '8mm', backgroundColor: theme.washiBg, transform: 'rotate(3deg)', top: '-4mm', left: '50%', marginLeft: '-16mm', zIndex: 10 }} />
              
              <label className="block cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, setFamilyPhoto)} 
                />
                {familyPhoto ? (
                  <img src={familyPhoto} alt="Foto Keluarga" className="w-full h-40 sm:h-48 object-cover border border-stone-200" />
                ) : (
                  <div className="w-full h-40 sm:h-48 bg-stone-50 group-hover:bg-amber-50/50 transition-colors border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-3 text-center">
                    <Camera className="w-6 h-6 text-stone-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold text-stone-600 block">
                      Tempel Foto Bertiga: Ayah, Bunda & Buah Hati
                    </span>
                    <span className="text-[8.5px] text-stone-400 mt-0.5">
                      (Momen pulang ke rumah tercinta)
                    </span>
                  </div>
                )}
              </label>

              <div className="mt-1 text-center text-[9px] font-serif italic text-stone-500">"Babak baru kehidupan kita berawal di sini..."</div>
            </div>

            <div className="p-3 bg-white border text-center rounded-xs" style={{ borderColor: theme.borderColor }}>
              <p className="font-serif italic text-[10px] text-stone-700 leading-relaxed">
                "Rumah ini sekarang memiliki suara baru, tawa baru, dan alasan terindah untuk selalu pulang."
              </p>
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Foto Keluarga</span>
            <span>{rightPageNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
