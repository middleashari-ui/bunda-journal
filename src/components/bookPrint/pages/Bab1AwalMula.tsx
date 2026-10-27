import React, { useState, useEffect } from 'react';
import { BookThemeConfig } from '../../../types/bookPrint';
import { UserProfile, PhotoMemory } from '../../../types';
import { Camera } from 'lucide-react';

interface Bab1AwalMulaProps {
  theme: BookThemeConfig;
  userProfile: UserProfile;
  photos?: PhotoMemory[];
  isFillMode?: boolean;
  spreadIndex?: 0 | 1; // 0 for Pages 3-4, 1 for Pages 5-6
}

export const Bab1AwalMula: React.FC<Bab1AwalMulaProps> = ({
  theme,
  userProfile,
  isFillMode = true,
  spreadIndex = 0,
}) => {
  const getSavedBab1 = () => {
    try {
      const s = localStorage.getItem('bunda_bab1');
      if (s) return JSON.parse(s);
    } catch {}
    return null;
  };
  const savedBab1 = getSavedBab1();

  // Page 3 & 4 editable states with localStorage persistence
  const [testPackPhoto, setTestPackPhoto] = useState<string | null>(savedBab1?.testPackPhoto || null);
  const [testPackDate, setTestPackDate] = useState(savedBab1?.testPackDate || 'Sabtu, 14 September 2024');
  const [testPackTimePlace, setTestPackTimePlace] = useState(savedBab1?.testPackTimePlace || '06:15 Pagi • Kamar Mandi Rumah');
  const [motherFirstThought, setMotherFirstThought] = useState(
    savedBab1?.motherFeelings || savedBab1?.motherFirstThought || 'Tangan bunda gemetar saat melihat garis samar itu berubah menjadi jelas. Air mata haru langsung menetes di atas wastafel...'
  );
  const [fatherReaction, setFatherReaction] = useState(
    savedBab1?.fatherReaction || 'Bunda meletakkan kotak kado kecil berisi test pack di samping cangkir kopi ayah. Saat membukanya, ayah terdiam sejenak lalu memeluk bunda erat sekali...'
  );
  const [familyReaction, setFamilyReaction] = useState(
    savedBab1?.familyReaction || 'Nenek langsung sujud syukur dan menelepon semua keluarga. Doa-doa terbaik mengalir tiada henti untuk kesehatan calon cucu...'
  );

  // Page 5 & 6 editable states with localStorage persistence
  const [usgPhoto, setUsgPhoto] = useState<string | null>(savedBab1?.usgKantungPhoto || null);
  const [hospital, setHospital] = useState(savedBab1?.hospital || userProfile.hospitalName || 'RSIA Bunda Menteng');
  const [doctor, setDoctor] = useState(savedBab1?.doctor || userProfile.doctorName || 'dr. Sarah Sp.OG');
  const [heartRate, setHeartRate] = useState(savedBab1?.heartRate || '142 bpm (Normal & Kuat)');
  const [heartbeatImpression, setHeartbeatImpression] = useState(
    savedBab1?.heartbeatImpression || 'Bunyinya cepat seperti derap kepakan sayap burung kecil. Air mata bunda menetes haru di ranjang periksa dokter...'
  );
  const [cravings, setCravings] = useState(
    savedBab1?.cravings || '1. Buah mangga muda asam manis potong dingin\n2. Sup kaldu ayam jahe hangat buatan nenek\n3. Es air kelapa muda murni di siang hari'
  );
  const [avoidedFoods, setAvoidedFoods] = useState(
    savedBab1?.avoidedFoods || '• Bau tumisan bawang putih dan minyak panas\n• Kopi hitam pekat\n• Parfum beraroma manis menyengat'
  );
  const [partnerSupport, setPartnerSupport] = useState(
    savedBab1?.partnerSupport || 'Ayah yang rela membelikan biskuit jahe jam 11 malam dan memijat punggung bunda setiap subuh...'
  );

  // Save changes automatically so TabJurnal and PrintStudio stay in sync
  useEffect(() => {
    try {
      const data = {
        testPackPhoto,
        testPackDate,
        testPackTimePlace,
        motherFeelings: motherFirstThought,
        fatherReaction,
        familyReaction,
        usgKantungPhoto: usgPhoto,
        hospital,
        doctor,
        heartRate,
        heartbeatImpression,
        cravings,
        avoidedFoods,
        partnerSupport
      };
      localStorage.setItem('bunda_bab1', JSON.stringify(data));
    } catch {}
  }, [
    testPackPhoto, testPackDate, testPackTimePlace, motherFirstThought,
    fatherReaction, familyReaction, usgPhoto, hospital, doctor,
    heartRate, heartbeatImpression, cravings, avoidedFoods, partnerSupport
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
    // Pages 3 & 4
    return (
      <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
        {/* ============================================================== */}
        {/* HALAMAN 3: MOMEN PERTAMA GARIS DUA                            */}
        {/* ============================================================== */}
        <div 
          className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                  Bab 1: Awal Mula Kisah
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>
                  Momen Garis Dua
                </h2>
              </div>

              {/* Photo Box for Test Pack */}
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-white p-2.5 shadow-md border border-stone-200 mb-3">
                <div 
                  className="washi-tape"
                  style={{
                    position: 'absolute',
                    width: '32mm',
                    height: '8mm',
                    backgroundColor: theme.washiBg,
                    transform: 'rotate(-4deg)',
                    top: '-4mm',
                    left: '50%',
                    marginLeft: '-16mm',
                    zIndex: 10,
                  }}
                />
                
                <label className="block cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(e, setTestPackPhoto)} 
                  />
                  {testPackPhoto ? (
                    <img 
                      src={testPackPhoto} 
                      alt="Test Pack" 
                      className="w-full h-36 sm:h-44 object-cover border border-stone-200" 
                    />
                  ) : (
                    <div className="w-full h-36 sm:h-44 bg-stone-50 group-hover:bg-amber-50/50 transition-colors border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-3 text-center">
                      <Camera className="w-6 h-6 text-stone-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-semibold text-stone-600 block">
                        Tempel Foto Test Pack Garis Dua
                      </span>
                      <span className="text-[8.5px] text-stone-400 mt-0.5">
                        (Ketuk untuk pilih foto dari galeri)
                      </span>
                    </div>
                  )}
                </label>

                <div className="mt-1 text-center text-[9.5px] font-serif italic text-stone-600">
                  "Dua garis merah muda yang mengubah hidup kita selamanya..."
                </div>
              </div>

              {/* Discovery Metadata (Interactive / Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[10.5px]">
                <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                  <span className="text-[8px] text-stone-400 uppercase tracking-wider block font-medium">Hari & Tanggal:</span>
                  {isFillMode ? (
                    <input 
                      type="text" 
                      value={testPackDate}
                      onChange={(e) => setTestPackDate(e.target.value)}
                      className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none border-b border-transparent hover:border-stone-300 focus:border-[#556B2F]"
                    />
                  ) : (
                    <span className="font-serif text-stone-400">________________________</span>
                  )}
                </div>

                <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                  <span className="text-[8px] text-stone-400 uppercase tracking-wider block font-medium">Waktu & Tempat:</span>
                  {isFillMode ? (
                    <input 
                      type="text" 
                      value={testPackTimePlace}
                      onChange={(e) => setTestPackTimePlace(e.target.value)}
                      className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none border-b border-transparent hover:border-stone-300 focus:border-[#556B2F]"
                    />
                  ) : (
                    <span className="font-serif text-stone-400">________________________</span>
                  )}
                </div>
              </div>

              {/* Lined section: Mother's feelings */}
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Yang Pertama Terlintas di Hati Bunda
                </div>
                {isFillMode ? (
                  <textarea 
                    value={motherFirstThought}
                    onChange={(e) => setMotherFirstThought(e.target.value)}
                    rows={3}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
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

            <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span>3</span>
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Awal Mula Kisah</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* HALAMAN 4: REAKSI AYAH & KELUARGA BESAR                       */}
        {/* ============================================================== */}
        <div 
          className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
          style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
                <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                  Bab 1: Awal Mula Kisah
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>
                  Kabar Gembira untuk Ayah
                </h2>
              </div>

              {/* Reaksi Ayah */}
              <div className="mb-3">
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Cara Bunda Memberi Tahu Ayah & Reaksinya
                </div>
                {isFillMode ? (
                  <textarea 
                    value={fatherReaction}
                    onChange={(e) => setFatherReaction(e.target.value)}
                    rows={3}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-20 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                  />
                )}
              </div>

              {/* Reaksi Kakek, Nenek & Keluarga */}
              <div className="mb-3">
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Sambutan Bahagia Kakek, Nenek & Kerabat
                </div>
                {isFillMode ? (
                  <textarea 
                    value={familyReaction}
                    onChange={(e) => setFamilyReaction(e.target.value)}
                    rows={3}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-20 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                  />
                )}
              </div>

              {/* Quote Footer Card */}
              <div className="border p-2.5 bg-white/70 text-center rounded-xs" style={{ borderColor: theme.borderColor }}>
                <p className="font-serif italic text-[11px] text-stone-750">
                  "Sejak hari itu, rumah kecil kita terasa jauh lebih hangat dan dipenuhi senyuman baru."
                </p>
              </div>
            </div>

            <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
              <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Reaksi Keluarga</span>
              <span>4</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Spread 1: Pages 5 & 6 (USG Awal & Gejala Trimester 1)
  return (
    <div className="flex flex-row items-center justify-center gap-0 print:gap-0 print:block w-full">
      {/* ============================================================== */}
      {/* HALAMAN 5: KUNJUNGAN DOKTER PERDANA & USG KANTUNG JANIN        */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-left relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                Bab 1: Awal Mula Kisah
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>
                USG & Detak Pertama
              </h2>
            </div>

            {/* USG Photo Frame with Direct Upload */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto bg-white p-2.5 shadow-md border border-stone-200 mb-3">
              <div 
                className="washi-tape"
                style={{
                  position: 'absolute',
                  width: '32mm',
                  height: '8mm',
                  backgroundColor: theme.washiBg,
                  transform: 'rotate(-2deg)',
                  top: '-4mm',
                  left: '50%',
                  marginLeft: '-16mm',
                  zIndex: 10,
                }}
              />
              <label className="block cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, setUsgPhoto)} 
                />
                {usgPhoto ? (
                  <img 
                    src={usgPhoto} 
                    alt="USG Pertama" 
                    className="w-full h-36 sm:h-44 object-cover border border-stone-200" 
                  />
                ) : (
                  <div className="w-full h-36 sm:h-44 bg-stone-50 group-hover:bg-amber-50/50 transition-colors border-2 border-dashed border-stone-300 flex flex-col items-center justify-center p-3 text-center">
                    <Camera className="w-6 h-6 text-stone-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold text-stone-600 block">
                      Tempel Foto USG Kantung Janin Pertama
                    </span>
                    <span className="text-[8.5px] text-stone-400 mt-0.5">
                      (Gestational Sac 5-7W • Ketuk untuk upload)
                    </span>
                  </div>
                )}
              </label>

              <div className="mt-1 text-center text-[9.5px] font-serif italic text-stone-600">
                "Titik kecil paling berharga di layar monitor dokter..."
              </div>
            </div>

            {/* Clinic Info Grid (Interactive / Editable) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-[10px]">
              <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                <span className="text-[8px] text-stone-400 uppercase block font-medium">Rumah Sakit:</span>
                {isFillMode ? (
                  <input 
                    type="text" 
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none"
                  />
                ) : (
                  <span className="text-stone-400 font-serif">______________</span>
                )}
              </div>

              <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                <span className="text-[8px] text-stone-400 uppercase block font-medium">Dokter Obgyn:</span>
                {isFillMode ? (
                  <input 
                    type="text" 
                    value={doctor}
                    onChange={(e) => setDoctor(e.target.value)}
                    className="w-full font-serif font-bold text-stone-850 bg-transparent outline-none"
                  />
                ) : (
                  <span className="text-stone-400 font-serif">______________</span>
                )}
              </div>

              <div className="bg-white p-2 border rounded-xs" style={{ borderColor: theme.borderColor }}>
                <span className="text-[8px] text-stone-400 uppercase block font-medium">Detak Jantung:</span>
                {isFillMode ? (
                  <input 
                    type="text" 
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full font-serif font-bold text-[#556B2F] bg-transparent outline-none"
                  />
                ) : (
                  <span className="text-stone-400 font-serif">______________</span>
                )}
              </div>
            </div>

            {/* Impression Note */}
            <div>
              <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                Sensasi Mendengar Detak Jantung Pertamamu
              </div>
              {isFillMode ? (
                <textarea 
                  value={heartbeatImpression}
                  onChange={(e) => setHeartbeatImpression(e.target.value)}
                  rows={2}
                  className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                  style={{ borderColor: theme.borderColor }}
                />
              ) : (
                <div 
                  className="h-16 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                  style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                />
              )}
            </div>
          </div>

          <div className="pt-2 text-left text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span>5</span>
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">USG Kantung Janin</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* HALAMAN 6: GEJALA AWAL & CATATAN NGIDAM TRIMESTER 1            */}
      {/* ============================================================== */}
      <div 
        className="b5-page b5-page-right relative overflow-hidden box-border p-[20mm] flex flex-col justify-between border border-stone-200/80 shadow-xs print:shadow-none print:m-0 print:break-after-page rounded-none"
        style={{ backgroundColor: theme.pageBg, color: theme.textColor, borderColor: theme.borderColor }}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="border-b-2 pb-2 mb-3" style={{ borderColor: theme.textColor }}>
              <span className="text-[9px] uppercase tracking-widest font-sans text-stone-500 block mb-0.5">
                Bab 1: Awal Mula Kisah
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: theme.textColor }}>
                Gejala Awal & Ngidam
              </h2>
            </div>

            {/* Editable Cravings & Sickness */}
            <div className="space-y-2.5 mb-3">
              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Makanan & Minuman yang Paling Diinginkan (Ngidam)
                </div>
                {isFillMode ? (
                  <textarea 
                    value={cravings}
                    onChange={(e) => setCravings(e.target.value)}
                    rows={3}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-16 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                  />
                )}
              </div>

              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Aroma & Makanan yang Dihindari
                </div>
                {isFillMode ? (
                  <textarea 
                    value={avoidedFoods}
                    onChange={(e) => setAvoidedFoods(e.target.value)}
                    rows={2}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-14 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                  />
                )}
              </div>

              <div>
                <div className="border py-0.5 text-center text-[9px] font-semibold uppercase tracking-widest mb-1" style={{ backgroundColor: theme.headerBg, borderColor: theme.borderColor }}>
                  Pahlawan Bunda Selama Masa Mual
                </div>
                {isFillMode ? (
                  <textarea 
                    value={partnerSupport}
                    onChange={(e) => setPartnerSupport(e.target.value)}
                    rows={2}
                    className="w-full text-[11px] font-serif italic text-stone-800 bg-white/60 p-2 border rounded-xs outline-none focus:border-[#556B2F] leading-relaxed resize-none"
                    style={{ borderColor: theme.borderColor }}
                  />
                ) : (
                  <div 
                    className="h-12 border-b border-stone-300 relative text-[10px] font-serif italic text-stone-700 px-1 pt-0.5 leading-[7mm]"
                    style={{ backgroundImage: `repeating-linear-gradient(transparent, transparent 6.8mm, ${theme.borderColor} 7mm)`, backgroundSize: '100% 7mm' }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 text-right text-[9px] font-sans text-stone-400 border-t border-stone-200 flex justify-between items-center">
            <span className="text-[8px] font-serif uppercase tracking-widest text-stone-400">Cerita Ngidam</span>
            <span>6</span>
          </div>
        </div>
      </div>
    </div>
  );
};
