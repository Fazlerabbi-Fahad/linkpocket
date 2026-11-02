import { RESOURCE_LIMITS } from '@/shared';
import { describe, expect, it } from 'vitest';
import { resourceFormSchema, splitTags } from './resource-form';

const base = { url: 'example.com', title: '', note: '', tags: '' };

describe('resourceFormSchema (FR-U1 to FR-U3)', () => {
  it('normalizes the URL and splits tags with the shared rules', () => {
    expect(resourceFormSchema.parse({ ...base, tags: ' CSS, web ,, css ' })).toEqual({
      url: 'https://example.com',
      title: '',
      note: '',
      tags: ['css', 'web'],
    });
  });

  it('shows the same message as the API for a bad scheme (AC-9)', () => {
    const result = resourceFormSchema.safeParse({ ...base, url: 'javascript:alert(1)' });
    expect(result.error?.issues[0]?.message).toBe('Only http and https links can be saved.');
  });

  it('enforces the shared limits', () => {
    const tags = Array.from({ length: RESOURCE_LIMITS.tagsMax + 1 }, (_, i) => `t${i}`).join(',');
    expect(resourceFormSchema.safeParse({ ...base, tags }).success).toBe(false);
    const note = 'x'.repeat(RESOURCE_LIMITS.noteMax + 1);
    expect(resourceFormSchema.safeParse({ ...base, note }).success).toBe(false);
  });

  it('ignores empty pieces between commas', () => {
    expect(splitTags(' , a,, b ,')).toEqual(['a', 'b']);
  });
});
