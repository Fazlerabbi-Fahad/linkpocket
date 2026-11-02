import { describe, expect, it } from 'vitest';
import { accountErrorMessage, exportFileName } from './account';
import { ApiError } from './api';

const FALLBACK = 'Could not do it.';

describe('accountErrorMessage (FR-D2, change password)', () => {
  it('puts a wrong password on the password field', () => {
    expect(accountErrorMessage(new ApiError(401, 'INVALID_CREDENTIALS', 'x'), FALLBACK)).toEqual({
      field: 'current',
      message: 'That password is not correct.',
    });
  });

  it('puts the screening reason on the new password field (FR-A10)', () => {
    const error = new ApiError(400, 'PASSWORD_TOO_WEAK', 'x', [
      { path: 'password', message: 'This password is too common. Choose another.' },
    ]);
    expect(accountErrorMessage(error, FALLBACK)).toEqual({
      field: 'new',
      message: 'This password is too common. Choose another.',
    });
  });

  it.each([
    ['ACCOUNT_LOCKED', 'Too many wrong passwords. Try again in 15 minutes.'],
    ['RATE_LIMITED', 'Too many attempts from this device. Wait a few minutes and try again.'],
  ])('explains %s at form level', (code, message) => {
    expect(accountErrorMessage(new ApiError(429, code, 'x'), FALLBACK)).toEqual({
      field: null,
      message,
    });
  });

  it('falls back for anything else, including network failures', () => {
    expect(accountErrorMessage(new ApiError(500, 'INTERNAL', 'x'), FALLBACK).message).toBe(
      FALLBACK,
    );
    expect(accountErrorMessage(new TypeError('Failed to fetch'), FALLBACK)).toEqual({
      field: null,
      message: FALLBACK,
    });
  });
});

describe('exportFileName (FR-D1)', () => {
  it('matches the API attachment name', () => {
    expect(exportFileName({ exportedAt: '2026-11-01T09:30:00.000Z' })).toBe(
      'linkpocket-export-2026-11-01.json',
    );
  });
});
