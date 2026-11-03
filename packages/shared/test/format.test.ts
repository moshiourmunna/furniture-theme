import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, formatPrice, fromBnDigits, groupLakh, pick, slugify, toBnDigits } from '../src/format';

describe('Bangla digits', () => {
  it('converts both ways', () => {
    expect(toBnDigits('2026-11-03')).toBe('২০২৬-১১-০৩');
    expect(toBnDigits(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
    expect(fromBnDigits('০১৭১১২৩৪৫৬৭')).toBe('01711234567');
    expect(fromBnDigits(toBnDigits('98765'))).toBe('98765');
  });
});

describe('lakh/crore grouping', () => {
  it.each([
    [0, '0'], [999, '999'], [1000, '1,000'], [84500, '84,500'], [100000, '1,00,000'], [1250000, '12,50,000'], [123456789, '12,34,56,789'], [-45000, '-45,000'], [1234.5, '1,234.50'],
  ])('groupLakh(%s) = %s', (n, s) => expect(groupLakh(n)).toBe(s));
  it('formats prices with ৳ and BN digits', () => {
    expect(formatPrice(84500)).toBe('৳84,500');
    expect(formatPrice(84500, 'bn')).toBe('৳৮৪,৫০০');
    expect(formatPrice(99.6)).toBe('৳100');
    expect(formatNumber(1250000, 'bn')).toBe('১২,৫০,০০০');
  });
});

describe('formatDate (Asia/Dhaka)', () => {
  it('shifts UTC to Dhaka across midnight', () => {
    expect(formatDate('2026-10-24T19:30:00Z')).toBe('25 Oct 2026');
    expect(formatDate('2026-10-24T19:30:00Z', 'bn')).toBe('২৫ অক্টো ২০২৬');
  });
  it('appends time', () => {
    expect(formatDate('2026-11-03T08:05:00Z', 'en', true)).toBe('3 Nov 2026, 2:05 pm');
    expect(formatDate('2026-11-02T18:00:00Z', 'en', true)).toBe('3 Nov 2026, 12:00 am');
    expect(formatDate('2026-11-03T08:05:00Z', 'bn', true)).toBe('৩ নভে ২০২৬, ২:০৫');
  });
});

describe('pick / slugify', () => {
  const p = { nameEn: 'Sofa', nameBn: 'সোফা', shortEn: 'Soft', shortBn: '' };
  it('picks locale with EN fallback', () => {
    expect(pick(p, 'name', 'bn')).toBe('সোফা');
    expect(pick(p, 'name', 'en')).toBe('Sofa');
    expect(pick(p, 'short', 'bn')).toBe('Soft');
    expect(pick(p, 'missing', 'bn')).toBe('');
  });
  it('slugifies', () => {
    expect(slugify('  Meghna Oak — Dinner Wagon! ')).toBe('meghna-oak-dinner-wagon');
    expect(slugify('Café Crème')).toBe('cafe-creme');
    expect(slugify('x'.repeat(200))).toHaveLength(150);
  });
});
