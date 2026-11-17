import { describe, expect, it } from 'vitest';
import { isReminderDue, minutesOfDay, reminderDayKey } from '../../src/lib/reminderSchedule';

function at(hours: number, minutes: number): Date {
  return new Date(2026, 10, 17, hours, minutes);
}

describe('jadwal pengingat', () => {
  it('membaca jam HH:MM', () => {
    expect(minutesOfDay('08:00')).toBe(480);
    expect(minutesOfDay('20:15')).toBe(1215);
    expect(minutesOfDay('24:00')).toBeNull();
    expect(minutesOfDay('abc')).toBeNull();
  });

  it('jatuh tempo tepat waktu dan setelahnya (dalam toleransi)', () => {
    expect(isReminderDue('11:10', at(11, 10))).toBe(true);
    expect(isReminderDue('11:10', at(11, 25))).toBe(true);
    expect(isReminderDue('11:10', at(14, 9))).toBe(true);
  });

  it('belum jatuh tempo atau sudah terlalu lama', () => {
    expect(isReminderDue('11:10', at(11, 9))).toBe(false);
    expect(isReminderDue('11:10', at(23, 30))).toBe(false);
    expect(isReminderDue('', at(11, 10))).toBe(false);
  });

  it('kunci tanggal berpindah saat ganti hari', () => {
    expect(reminderDayKey(at(23, 59))).toBe('2026-11-17');
    expect(reminderDayKey(new Date(2026, 10, 18, 0, 1))).toBe('2026-11-18');
  });
});
