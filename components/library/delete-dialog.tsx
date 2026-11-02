'use client';

import type { ResourceDto } from '@/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FormAlert } from '@/components/ui/field';
import { displayDomain } from '@/lib/links';
import { useDeleteResource } from '@/lib/resources';

/** FR-R4: deleting asks first and cannot be undone. */
export function DeleteDialog({
  resource,
  onClose,
  onDeleted,
}: {
  resource: ResourceDto | null;
  onClose: () => void;
  onDeleted: (message: string) => void;
}) {
  const remove = useDeleteResource();
  const [error, setError] = useState('');

  async function confirm() {
    if (!resource) return;
    setError('');
    try {
      await remove.mutateAsync(resource.id);
      onDeleted('Link deleted');
      onClose();
    } catch {
      setError('Could not delete the link. Check your connection and try again.');
    }
  }

  return (
    <Dialog
      open={resource !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError('');
          onClose();
        }
      }}
      title="Delete this link?"
      description="It is removed from your library for good. This cannot be undone."
    >
      {resource ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border px-3 py-2.5">
            <p className="font-medium break-words">{resource.title}</p>
            <p className="font-mono text-xs text-muted-foreground">{displayDomain(resource.url)}</p>
          </div>
          {error ? <FormAlert>{error}</FormAlert> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Keep it
            </Button>
            <Button variant="danger" disabled={remove.isPending} onClick={() => void confirm()}>
              {remove.isPending ? 'Deleting…' : 'Delete link'}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
