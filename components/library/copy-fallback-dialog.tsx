'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { inputClass } from '@/components/ui/field';
import { cn } from '@/lib/cn';

/** FR-C2: when the clipboard is blocked, the link is shown selected so it can be copied by hand. */
export function CopyFallbackDialog({ url, onClose }: { url: string | null; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!url) return;
    const frame = requestAnimationFrame(() => input.current?.select());
    return () => cancelAnimationFrame(frame);
  }, [url]);

  return (
    <Dialog
      open={url !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Copy this link"
      description="Your browser blocked automatic copying. The link is selected: press Ctrl+C, or ⌘C on a Mac."
    >
      <input
        ref={input}
        readOnly
        aria-label="Link"
        value={url ?? ''}
        onFocus={(event) => event.currentTarget.select()}
        className={cn(inputClass, 'h-11 font-mono text-[13px]')}
      />
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
