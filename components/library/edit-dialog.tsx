'use client';

import type { ResourceDto } from '@/shared';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormAlert, InputField } from '@/components/ui/field';
import { useUpdateResource } from '@/lib/resources';
import { applyServerError, DetailFields, useResourceForm } from './resource-fields';

/** FR-R3: edit any field of a saved link. */
export function EditDialog({
  resource,
  onClose,
  onSaved,
}: {
  resource: ResourceDto | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  return (
    <Dialog open={resource !== null} onOpenChange={(open) => !open && onClose()} title="Edit link">
      {resource ? (
        <EditForm key={resource.id} resource={resource} onClose={onClose} onSaved={onSaved} />
      ) : null}
    </Dialog>
  );
}

function EditForm({
  resource,
  onClose,
  onSaved,
}: {
  resource: ResourceDto;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const form = useResourceForm({
    url: resource.url,
    title: resource.title,
    note: resource.note,
    tags: resource.tags.join(', '),
  });
  const update = useUpdateResource();
  const [formError, setFormError] = useState('');

  useEffect(() => form.setFocus('url'), [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError('');
    try {
      await update.mutateAsync({ id: resource.id, body: values });
      onSaved('Changes saved');
      onClose();
    } catch (error) {
      setFormError(applyServerError(form, error));
    }
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex flex-col gap-4">
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <InputField
        label="URL"
        type="url"
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        className="font-mono text-[14px]"
        error={form.formState.errors.url?.message}
        {...form.register('url')}
      />
      <DetailFields form={form} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
