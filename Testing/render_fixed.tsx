import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToFile } from '@react-pdf/renderer';
import { JournalPdfDocument } from '../src/utils/_legacy/JournalPdfDocument';
import { BOOK_THEMES } from '../src/types/bookPrint';

const QA = 'D:/Appsss/Testing/Single_Folder_Full_QA';
const J = JSON.parse(fs.readFileSync(path.join(QA, 'jurnal-lengkap.json'), 'utf-8'));

const img = (f: string) => {
  const p = path.join(QA, f);
  const b64 = fs.readFileSync(p).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
};

(global as any).window = {} as any;
const store: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
};

// --- seed bunda_bab1 (Hal 3+4) ---
const H3 = J['bab1_hal3_momen_garis_dua'];
const H4 = J['bab1_hal4_kabar_gembira'];
store['bunda_bab1'] = JSON.stringify({
  testPackDate: `${H3['hariTanggal']}`,
  testPackTimePlace: `${H3['waktuTempat']}`,
  motherFeelings: H3['yangPertamaTerlintasDiHati'],
  motherFirstThought: H3['yangPertamaTerlintasDiHati'],
  testPackPhoto: img('foto/testpack_jpg.jpg'),
  fatherReaction: H4['reaksiAyah'],
  familyReaction: H4['sambutanKeluarga'],
  tellDate: H4['hariTanggal'],
  tellTimePlace: H4['waktuTempat'],
  usgKantungPhoto: img('foto/usg-32w_jpg.jpg'),
  doctor: 'dr. SpOG Langganan',
  hospital: 'RS Hermina',
});
// --- seed bab3/4/5 ---
const B3 = J['bab3_persiapan'];
store['bunda_bab3'] = JSON.stringify({
  candidate1: B3['kandidatNama'][0], candidate2: B3['kandidatNama'][1],
  candidate3: B3['kandidatNama'][2], candidate4: B3['kandidatNama'][3],
  chosenName: B3['kandidatNama'][0], chosenMeaning: 'Kemenangan dan cahaya',
  nurseryPhoto: img('foto/perut-32w_jpg.jpg'),
});
store['bunda_bab4'] = JSON.stringify({
  birthDate: 'RENCANA - HPL 24 Desember 2025 (kehamilan W32, belum lahir)',
  laborStory: 'Halaman rencana persalinan: tas RS 6/6 siap, pendamping suami.',
  holdingBabyFeeling: '-',
});
const B5 = J['bab5_kapsul_waktu'];
store['bunda_bab5'] = JSON.stringify({
  bundaLetterPart1: B5['suratBunda'], bundaLetterPart2: B5['milestoneW32'].join('; '),
  bundaSignName: 'Bunda W32', ayahLetterPart1: B5['suratAyah'],
  ayahLetterPart2: 'Tumbuhlah sehat dan bahagia.', ayahSignName: 'Ayah',
});
// --- seed daily W32 ---
store['bunda_daily_w32'] = JSON.stringify({
  Sen: 'Suplemen 5/5, hidrasi 2.0L. Syukur: garis dua 12 Mei tak terlupakan.',
  Sel: 'Jalan 30 mnt pagi, senam 20 mnt. Tendangan aktif malam.',
  Rab: 'Kontrol USG W32: 1950g sefalik, normal P50.',
  Kam: 'Tas RS cek 6/6. Tidur 8 jam miring kiri.',
  Jum: 'Mood 4.6/5 Damai. Kick 10/10.',
  Sab: 'Kelas hamil 3/3. Siap soft launch.',
  Min: 'Doa: sehat sampai HPL 24 Des 2025.',
});
store['bunda_momstats_w32'] = JSON.stringify({
  weight: '68', waist: '30.5', bloodPressure: '110/70',
  doctorNote: 'USG W32: BB janin 1950g, posisi sefalik, kurva WHO P50 normal. Suplemen 5/5, hidrasi 2.0L, jalan 30mnt, tidur 8jam.',
});

const userProfile: any = { name: 'Bunda W32', hplDate: '24 Desember 2025', babyNickname: 'Malaikat Kecil', doctorName: 'dr. SpOG', hospitalName: 'RS Hermina', currentWeek: 32 };
const photos: any[] = [
  { week: 32, src: img('foto/usg-32w_jpg.jpg'), caption: 'USG W32 - 1950g sefalik' },
  { week: 8, src: img('foto/testpack_jpg.jpg'), caption: 'Test pack garis dua - 12 Mei 2025' },
];
const pastEntries: any[] = [
  { week: 32, date: '12 Mei - W32', text: 'Suplemen 5/5 hidrasi 2.0L jalan 30mnt senam 20mnt tidur 8jam kick 10/10 mood 4.6/5. Syukur penuh.' },
];

const el = (wm: boolean) =>
  React.createElement(JournalPdfDocument as any, {
    userProfile, activeTheme: BOOK_THEMES['kinfolk-sage'],
    photos, pastEntries, customPhotos: { 32: photos[0], 8: photos[1] }, currentWeek: 32,
  } as any);

async function main() {
  await renderToFile(el(false), path.join(QA, 'Bunda_Journal_Lengkap_100Hal_FIXED.pdf'));
  console.log('lengkap FIXED done');
}
main();
