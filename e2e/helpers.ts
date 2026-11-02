import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';
import { OUTBOX_DIR } from '../playwright.config';

/** Test-only password for throwaway accounts in the in-memory database. */
export const PASSWORD = 'correct horse battery staple';

let counter = 0;
export function uniqueEmail(label: string): string {
  counter += 1;
  return `${label}-${Date.now()}-${process.pid}-${counter}@example.test`;
}

interface OutboxMessage {
  to: string;
  template: string;
  text: string;
}

/** The newest verification link sent to `email`, read from the API's file outbox. */
export async function verificationLink(email: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const names = (await readdir(OUTBOX_DIR).catch(() => [] as string[])).sort().reverse();
        for (const name of names) {
          const message = JSON.parse(
            await readFile(join(OUTBOX_DIR, name), 'utf8'),
          ) as OutboxMessage;
          if (message.to === email) {
            link = /https?:\/\/\S+\/verify-email#token=[A-Za-z0-9_-]+/.exec(message.text)?.[0];
            if (link) return true;
          }
        }
        return false;
      },
      { timeout: 15_000 },
    )
    .toBe(true);
  return link!;
}

export async function signUp(page: Page, email: string): Promise<void> {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/verify-email$/);
}

/** Signs up, follows the emailed link and lands in an empty library. */
export async function signUpVerified(page: Page, label: string): Promise<string> {
  const email = uniqueEmail(label);
  await signUp(page, email);
  await page.goto(await verificationLink(email));
  await expect(page).toHaveURL(/\/library$/);
  await expect(page.getByRole('heading', { name: 'Your library' })).toBeVisible();
  return email;
}

export async function logIn(page: Page, email: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
}

export async function saveLink(
  page: Page,
  url: string,
  details?: { title?: string; tags?: string },
) {
  const form = page.getByRole('form', { name: 'Save a link' });
  await form.getByLabel('Paste a link').fill(url);
  if (details) {
    await form.getByRole('button', { name: 'Add a title, note or tags' }).click();
    if (details.title) await form.getByLabel('Title', { exact: true }).fill(details.title);
    if (details.tags) await form.getByLabel('Tags', { exact: true }).fill(details.tags);
  }
  await form.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(form.getByLabel('Paste a link')).toHaveValue('');
}

export function cardTitles(page: Page) {
  return page.getByTestId('resource-card').locator('h2');
}

/** Seeded by apps/api/scripts/e2e-server.ts (test-only account in an in-memory database). */
export const ADMIN_EMAIL = 'admin@example.test';

export async function logInAsAdmin(page: Page): Promise<void> {
  await page.goto('/login?next=%2Fadmin');
  await logIn(page, ADMIN_EMAIL);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
}
