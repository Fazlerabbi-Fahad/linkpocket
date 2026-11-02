import type { AccountExport, CurrentUser } from '@/shared';
import { api, isApiError } from './api';

/** Messages for the account settings forms (FR-D1, FR-D2, change password), by API code. */
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'That password is not correct.',
  ACCOUNT_LOCKED: 'Too many wrong passwords. Try again in 15 minutes.',
  RATE_LIMITED: 'Too many attempts from this device. Wait a few minutes and try again.',
};

/** Which part of a form an account error belongs to. */
export interface AccountErrorMessage {
  field: 'current' | 'new' | null;
  message: string;
}

export function accountErrorMessage(error: unknown, fallback: string): AccountErrorMessage {
  if (isApiError(error, 'INVALID_CREDENTIALS')) {
    return { field: 'current', message: MESSAGES.INVALID_CREDENTIALS! };
  }
  if (isApiError(error, 'PASSWORD_TOO_WEAK')) {
    return {
      field: 'new',
      message: error.fields[0]?.message ?? 'Choose a stronger password.',
    };
  }
  if (isApiError(error) && MESSAGES[error.code]) {
    return { field: null, message: MESSAGES[error.code]! };
  }
  return { field: null, message: fallback };
}

export function changePassword(body: { currentPassword: string; newPassword: string }) {
  return api<{ user: CurrentUser; csrfToken: string }>('/auth/change-password', {
    method: 'POST',
    body,
  });
}

export function deleteAccount(password: string) {
  return api<void>('/account', { method: 'DELETE', body: { password } });
}

/** The same name the API's Content-Disposition uses. */
export function exportFileName(data: Pick<AccountExport, 'exportedAt'>): string {
  return `linkpocket-export-${data.exportedAt.slice(0, 10)}.json`;
}

/**
 * FR-D1: fetched through `api` so a failure (rate limit, expired session) is shown on the
 * page instead of opening a JSON error, then saved as a file. Returns the file name.
 */
export async function downloadExport(): Promise<string> {
  const data = await api<AccountExport>('/account/export');
  const name = exportFileName(data);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 0);
  return name;
}
