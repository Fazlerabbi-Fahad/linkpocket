'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/field';
import { cn } from '@/lib/cn';
import { EMPTY_RESOURCE_FORM } from '@/lib/resource-form';
import { useCreateResource } from '@/lib/resources';
import { applyServerError, DetailFields, useResourceForm } from './resource-fields';

/**
 * The library's signature: a monospace slot that takes a pasted link. Details are optional and
 * fold out underneath (FR-R1, FR-R2). Duplicates are saved with a notice (FR-R7).
 */
export function SaveSlot({ onSaved }: { onSaved: (message: string) => void }) {
  const form = useResourceForm(EMPTY_RESOURCE_FORM);
  const create = useCreateResource();
  const [details, setDetails] = useState(false);
  const [formError, setFormError] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const urlId = useId();
  const detailsId = useId();
  const urlError = form.formState.errors.url?.message;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('');
    setDuplicate(false);
    try {
      const result = await create.mutateAsync(values);
      form.reset(EMPTY_RESOURCE_FORM);
      setDetails(false);
      setDuplicate(result.duplicate);
      onSaved('Link saved');
    } catch (error) {
      setFormError(applyServerError(form, error));
      if ((['title', 'note', 'tags'] as const).some((name) => form.getFieldState(name).error)) {
        setDetails(true);
      }
    }
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate aria-label="Save a link">
      <label htmlFor={urlId} className="mb-2 block text-sm font-medium">
        Paste a link
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-4 transition-colors focus-within:border-ring',
          urlError ? 'border-destructive' : 'border-input',
        )}
      >
        <input
          id={urlId}
          type="url"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://"
          aria-invalid={urlError ? true : undefined}
          aria-describedby={urlError ? `${urlId}-error` : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          {...form.register('url')}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {urlError ? (
        <p id={`${urlId}-error`} className="mt-2 text-sm text-destructive">
          {urlError}
        </p>
      ) : null}

      <button
        type="button"
        aria-expanded={details}
        aria-controls={detailsId}
        onClick={() => setDetails((open) => !open)}
        className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronDown
          className={cn('size-4 transition-transform', details && 'rotate-180')}
          aria-hidden
        />
        {details ? 'Hide details' : 'Add a title, note or tags'}
      </button>
      <div id={detailsId} hidden={!details} className="mt-3 flex flex-col gap-4">
        <DetailFields form={form} />
      </div>

      <div className="mt-3 flex flex-col gap-2 empty:hidden">
        {formError ? <FormAlert>{formError}</FormAlert> : null}
        {duplicate ? (
          <FormAlert tone="info">
            You had already saved this link. It is saved again, so both copies are in your library.
          </FormAlert>
        ) : null}
      </div>
    </form>
  );
}
