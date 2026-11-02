import { noteSchema, resourceUrlSchema, tagsSchema, titleInputSchema } from '@/shared';
import { z } from 'zod';

/** Tags are typed as one comma-separated field and checked with the API's own rule. */
export function splitTags(text: string): string[] {
  return text
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');
}

/**
 * FR-U1 to FR-U3: the save and edit forms validate with the same Zod rules the API applies,
 * so a message shown in the browser matches the one the API would return.
 */
export const resourceFormSchema = z.object({
  url: resourceUrlSchema,
  title: titleInputSchema,
  note: noteSchema,
  tags: z.string().transform(splitTags).pipe(tagsSchema),
});

export type ResourceFormInput = z.input<typeof resourceFormSchema>;
export type ResourceFormValues = z.output<typeof resourceFormSchema>;

export const EMPTY_RESOURCE_FORM: ResourceFormInput = { url: '', title: '', note: '', tags: '' };
