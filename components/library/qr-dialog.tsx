'use client';

import type { ResourceDto } from '@/shared';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { qrFileName } from '@/lib/links';
import { qrDataUrl } from '@/lib/qr';

/** FR-C3, FR-C4: a QR code of the exact saved URL, generated in the browser, downloadable as PNG. */
export function QrDialog({
  resource,
  onOpenChange,
}: {
  resource: ResourceDto | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [image, setImage] = useState<{ url: string; src: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const url = resource?.url;

  useEffect(() => {
    if (!url) return;
    let live = true;
    setFailed(false);
    qrDataUrl(url)
      .then((src) => live && setImage({ url, src }))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [url]);

  const src = image && image.url === url ? image.src : null;

  return (
    <Dialog open={resource !== null} onOpenChange={onOpenChange} title="QR code">
      {resource ? (
        <div className="flex flex-col gap-4">
          <div className="mx-auto aspect-square w-full max-w-[280px] rounded-xl border border-border bg-qr-paper p-2">
            {src ? (
              // A plain img: the source is a local data: URL.
              <img
                src={src}
                alt={`QR code for ${resource.url}`}
                width={512}
                height={512}
                className="size-full [image-rendering:pixelated]"
              />
            ) : (
              <p
                role="status"
                className="flex size-full items-center justify-center text-sm text-qr-ink"
              >
                {failed ? 'This link is too long for a QR code.' : 'Drawing the code…'}
              </p>
            )}
          </div>
          <p className="font-mono text-[13px] leading-5 break-all text-muted-foreground">
            {resource.url}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {src ? (
              <a href={src} download={qrFileName(resource.url)} className={buttonVariants()}>
                <Download aria-hidden />
                Download PNG
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
