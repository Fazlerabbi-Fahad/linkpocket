'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { RESOURCE_LIMITS } from '@/shared';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { InputField, TextareaField } from '@/components/ui/field';
import { isApiError } from '@/lib/api';
import {
  resourceFormSchema,
  type ResourceFormInput,
  type ResourceFormValues,
} from '@/lib/resource-form';

export type ResourceForm = UseFormReturn<ResourceFormInput, unknown, ResourceFormValues>;

export function useResourceForm(defaultValues: ResourceFormInput): ResourceForm {
  return useForm<ResourceFormInput, unknown, ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues,
  });
}

const FORM_FIELDS = new Set(['url', 'title', 'note', 'tags']);

/**
 * Puts API validation errors on the matching field (FR-U3). Returns a form-level message for
 * anything that does not belong to one field.
 */
export function applyServerError(form: ResourceForm, error: unknown): string {
  if (isApiError(error, 'INVALID_URL')) {
    form.setError('url', {
      message: error.fields[0]?.message ?? 'Enter a valid http or https URL.',
    });
    return '';
  }
  if (isApiError(error, 'VALIDATION_FAILED') && error.fields.length > 0) {
    let placed = false;
    for (const field of error.fields) {
      const name = field.path.split('.')[0] ?? '';
      if (FORM_FIELDS.has(name)) {
        form.setError(name as keyof ResourceFormInput, { message: field.message });
        placed = true;
      }
    }
    if (placed) return '';
  }
  if (isApiError(error, 'RATE_LIMITED'))
    return 'You are saving very quickly. Wait a moment and try again.';
  if (isApiError(error) && error.status < 500) return error.message;
  return 'Could not save the link. Check your connection and try again.';
}

/** Title, note and tags: the optional details of a link (FR-R1, FR-R2). */
export function DetailFields({ form }: { form: ResourceForm }) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <>
      <InputField
        label="Title"
        hint="Leave blank to use the site name."
        maxLength={RESOURCE_LIMITS.titleMax}
        error={errors.title?.message}
        {...register('title')}
      />
      <TextareaField
        label="Note"
        hint={`Up to ${RESOURCE_LIMITS.noteMax} characters.`}
        error={errors.note?.message}
        {...register('note')}
      />
      <InputField
        label="Tags"
        hint={`Separate with commas. Up to ${RESOURCE_LIMITS.tagsMax} tags.`}
        placeholder="design, reading"
        autoCapitalize="none"
        error={errors.tags?.message}
        {...register('tags')}
      />
    </>
  );
}
