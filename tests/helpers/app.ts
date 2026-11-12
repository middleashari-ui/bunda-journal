import { Page, Route } from '@playwright/test';

export const TEST_EMAIL = 'una@example.com';

/** Matikan dialog print + mock API supaya test tidak butuh backend. */
export async function preparePage(page: Page) {
  await page.addInitScript(() => {
    // print tidak boleh memblokir test
    window.print = () => {};
  });

  await page.route('**/api/auth/me?token=*', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, email: TEST_EMAIL, name: 'Una', tier: 'vip' }),
    })
  );
  await page.route('**/api/google-config', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, clientId: '' }) })
  );
  await page.route('**/api/userdata*', (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, exists: false, payload: null, updated_at: null }),
    })
  );
}

export interface SeedOptions {
  week?: number;
  withHabits?: boolean;
  withNotes?: boolean;
  withPhoto?: boolean;
}

/** Isi data contoh: profil, 7 hari kebiasaan, catatan, mood. */
export async function seedApp(page: Page, options: SeedOptions = {}) {
  const { week = 19, withHabits = true, withNotes = true, withPhoto = false } = options;

  await page.evaluate(
    ({ week, withHabits, withNotes, withPhoto, email }) => {
      localStorage.clear();
      localStorage.setItem('bunda_is_paid', 'true');
      localStorage.setItem('bunda_is_onboarded', 'true');
      localStorage.setItem('bunda_isLoggedIn', 'true');
      localStorage.setItem('bunda_user_email', email);
      localStorage.setItem('bunda_user_tier', 'vip');
      localStorage.setItem('bunda_profile', JSON.stringify({ name: 'Una', babyNickname: 'Ash', hplDate: '2027-04-16' }));
      localStorage.setItem('bunda_week', String(week));
      localStorage.setItem('bunda_onboarding_done', 'true');
      localStorage.setItem('bunda_pwa_tutorial_dismissed', 'true');

      if (withHabits) {
        const days = [
          { vit: true, water: 2000, jalan: 25, senam: 0, tidur: 7 },
          { vit: true, water: 1500, jalan: 15, senam: 10, tidur: 8 },
          { vit: true, water: 2000, jalan: 30, senam: 0, tidur: 7 },
          { vit: false, water: 800, jalan: 0, senam: 0, tidur: 6 },
          { vit: true, water: 1800, jalan: 20, senam: 15, tidur: 8 },
          { vit: true, water: 2000, jalan: 10, senam: 0, tidur: 9 },
          { vit: true, water: 1200, jalan: 15, senam: 0, tidur: 7 },
        ];
        days.forEach((d, i) => {
          localStorage.setItem(`bunda_${week}_${i}_suplemen`, JSON.stringify({ vitamin: d.vit, asamFolat: d.vit, count: d.vit ? 1 : 0 }));
          localStorage.setItem(`bunda_${week}_${i}_hidrasi`, JSON.stringify({ current: d.water, target: 2000 }));
          localStorage.setItem(`bunda_${week}_${i}_jasmani`, JSON.stringify({ jalan: d.jalan, senam: d.senam, tidur: d.tidur }));
        });
      }

      if (withNotes) {
        localStorage.setItem(
          `bunda_daily_w${week}`,
          JSON.stringify({
            Sen: 'Ayah bikin bubur ayam spesial. Kami makan berdua sambil membayangkan wajah si kecil nanti.',
            Sel: 'Si kecil aktif sekali malam ini, tendangannya terasa sampai samping kanan.',
            Rab: 'Kontrol dokter, semuanya baik.',
          })
        );
        localStorage.setItem(`bunda_daily_moods_w${week}`, JSON.stringify([1, 0, 1, 3, 0, 1, 2]));
      }

      localStorage.setItem(
        `bunda_momstats_w${week}`,
        JSON.stringify({
          weight: '54.5',
          waist: '82',
          bloodPressure: '118/76',
          doctorNote: 'Panjang janin 15.3 cm. Detak jantung 145 bpm.',
        })
      );

      localStorage.setItem(
        `bunda_appointment::${email}`,
        JSON.stringify({
          dokter: 'dr. Ayu Prameswari, Sp.OG',
          jenis: 'USG pertumbuhan',
          lokasi: 'RS Bunda Sehat',
          klinik: 'Poli Obgyn',
          date: '2026-11-20',
          jam: '10:30',
          minggu: '20',
          pesanAyah: 'Ayah, tolong kosongkan jadwal ya.',
        })
      );
      localStorage.setItem(`bunda_appointment_status::${email}`, 'BOOKED');

      if (withPhoto) {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#e8dfd2';
          ctx.fillRect(0, 0, 240, 180);
          ctx.fillStyle = '#556b2f';
          ctx.fillRect(40, 40, 160, 100);
        }
        localStorage.setItem('bunda_photos', JSON.stringify([{ week, src: canvas.toDataURL('image/jpeg', 0.7), caption: 'USG' }]));
      }
    },
    { week, withHabits, withNotes, withPhoto, email: TEST_EMAIL }
  );
}

/** Buka aplikasi dengan sesi siap pakai (tanpa backend). */
export async function openApp(page: Page, path = '/') {
  await preparePage(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await seedApp(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
}
