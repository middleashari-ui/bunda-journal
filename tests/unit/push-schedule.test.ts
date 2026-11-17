import { describe, expect, it } from 'vitest';
import {
  isTimeHHMM,
  localToUtcTime,
  normalizePushReminders,
  utcClock,
} from '../../functions/_lib/pushSchedule';

describe('jadwal web push', () => {
  it('mengonversi WIB (-420) ke UTC', () => {
    expect(localToUtcTime('08:00', -420)).toBe('01:00');
    expect(localToUtcTime('20:00', -420)).toBe('13:00');
    expect(localToUtcTime('00:30', -420)).toBe('17:30');
    expect(localToUtcTime('08:00', 0)).toBe('08:00');
  });

  it('menolak jam tidak valid', () => {
    expect(isTimeHHMM('24:00')).toBe(false);
    expect(localToUtcTime('7:00', -420)).toBeNull();
  });

  it('menormalkan dan membatasi pengingat', () => {
    const rows = normalizePushReminders(
      [
        { tag: 'bunda-vitamin', title: 'Minum vitamin', body: 'Pagi', timeLocal: '08:00', enabled: true },
        { tag: 'bunda-vitamin', title: 'Duplikat', timeLocal: '09:00' },
        { tag: 'bad tag!', title: 'X', timeLocal: '09:00' },
        { tag: 'custom-1', title: 'Minum obat', timeLocal: '13:15', enabled: false },
      ],
      -420
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ tag: 'bunda-vitamin', timeUtc: '01:00', enabled: 1 });
    expect(rows[1]).toMatchObject({ tag: 'custom-1', timeUtc: '06:15', enabled: 0 });
  });

  it('membaca jam UTC untuk cron', () => {
    const clock = utcClock(new Date(Date.UTC(2026, 10, 17, 1, 5)));
    expect(clock).toEqual({ time: '01:05', date: '2026-11-17' });
  });
});
