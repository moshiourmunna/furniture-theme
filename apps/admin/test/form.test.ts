import { describe, expect, it } from 'vitest';
import { schemaFor, toDhakaInput, toForm, toPayload } from '@/lib/form';
import { RESOURCE_UI } from '@/lib/resources';
import { compactTaka, methodLabel } from '@/components/ui';
import type { FieldDef } from '@/components/fields';

const fields: FieldDef[] = [
  { name: 'titleEn', label: 'Title', required: true },
  { name: 'sortOrder', label: 'Sort', type: 'number' },
  { name: 'startsAt', label: 'Starts', type: 'datetime' },
  { name: 'isActive', label: 'Active', type: 'bool' },
  { name: 'slug', label: 'Slug', type: 'slug' },
  { name: 'note', label: 'Note' },
];

describe('admin form mapping', () => {
  it('shows dates in Asia/Dhaka and round-trips them', () => {
    expect(toDhakaInput('2026-11-02T19:30:00Z', true)).toBe('2026-11-03T01:30');
    const form = toForm(fields, { titleEn: 'Hi', sortOrder: 3, startsAt: '2026-11-02T19:30:00.000Z', isActive: false, slug: null, note: null });
    expect(form).toMatchObject({ titleEn: 'Hi', sortOrder: '3', startsAt: '2026-11-03T01:30', isActive: false, slug: '', note: '' });
    expect(toPayload(fields, form)).toEqual({ titleEn: 'Hi', sortOrder: 3, startsAt: '2026-11-02T19:30:00.000Z', isActive: false, slug: undefined, note: null });
  });
  it('defaults isActive to true for new rows', () => expect(toForm(fields, null).isActive).toBe(true));
  it('validates required, numbers and slugs', () => {
    const s = schemaFor(fields);
    expect(s.safeParse({ titleEn: '', sortOrder: '', slug: '' }).success).toBe(false);
    expect(s.safeParse({ titleEn: 'x', sortOrder: 'abc', slug: '' }).success).toBe(false);
    expect(s.safeParse({ titleEn: 'x', sortOrder: '2', slug: 'Bad Slug' }).success).toBe(false);
    expect(s.safeParse({ titleEn: 'x', sortOrder: '2', slug: 'good-slug' }).success).toBe(true);
  });
});

describe('resource registry', () => {
  it('every section has columns, fields and a permission group', () => {
    for (const [key, ui] of Object.entries(RESOURCE_UI)) {
      expect(ui.columns.length, key).toBeGreaterThan(0);
      expect(ui.fields.length, key).toBeGreaterThan(0);
      expect(ui.group, key).toMatch(/^[a-z]+$/);
      expect(new Set(ui.fields.map((f) => f.name)).size, `${key} has duplicate fields`).toBe(ui.fields.length);
    }
  });
});

describe('labels', () => {
  it('formats axis values and payment methods', () => {
    expect([compactTaka(850), compactTaka(85000), compactTaka(170000), compactTaka(26000000)]).toEqual(['850', '85k', '1.7L', '2.6Cr']);
    expect(methodLabel('bkash')).toBe('bKash');
    expect(methodLabel('other')).toBe('other');
  });
});
