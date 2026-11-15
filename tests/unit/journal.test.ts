import { describe, expect, it } from 'vitest';
import {
  DAILY_NOTE_MAX_CHARS,
  clampDailyNote,
  countDailyNoteChars,
  splitDailyNoteChars,
} from '../../src/config/journal';

describe('catatan harian — batas 160 karakter', () => {
  it('emoji tunggal dihitung 1', () => {
    expect(countDailyNoteChars('Hari ini 😀')).toBe(10);
  });

  it('emoji gabungan (ZWJ) tetap dihitung 1 grapheme', () => {
    expect(countDailyNoteChars('👨‍👩‍👧')).toBe(1);
    expect(countDailyNoteChars('👍🏽')).toBe(1);
  });

  it('tidak memotong grapheme saat mencapai batas', () => {
    const text = '😀'.repeat(DAILY_NOTE_MAX_CHARS + 20);
    const clamped = clampDailyNote(text);
    expect(countDailyNoteChars(clamped)).toBe(DAILY_NOTE_MAX_CHARS);
    expect(splitDailyNoteChars(clamped).every((c) => c === '😀')).toBe(true);
  });

  it('teks pendek dikembalikan apa adanya', () => {
    const text = 'Kontrol dokter, semuanya baik.';
    expect(clampDailyNote(text)).toBe(text);
  });

  it('potong di spasi terakhir supaya kata tidak terbelah', () => {
    const text = `${'a'.repeat(60)} ${'b'.repeat(120)}`;
    const clamped = clampDailyNote(text);
    expect(countDailyNoteChars(clamped)).toBeLessThanOrEqual(DAILY_NOTE_MAX_CHARS);
    expect(clamped.endsWith('a')).toBe(true);
  });

  it('menerima null/undefined tanpa melempar', () => {
    expect(clampDailyNote(undefined as unknown as string)).toBe('');
    expect(countDailyNoteChars(undefined as unknown as string)).toBe(0);
  });
});
