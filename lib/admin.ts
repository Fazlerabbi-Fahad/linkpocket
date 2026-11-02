'use client';

import type { AdminStats, AdminUserList, AdminUserSummary, UserStatus } from '@/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

const ADMIN_KEY = ['admin'] as const;

/** FR-AD3, FR-AD4, FR-AD9: fetched on page load and on demand, never served from cache. */
export function useAdminStats() {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'stats'],
    queryFn: () => api<AdminStats>('/admin/stats'),
    staleTime: 0,
    gcTime: 0,
  });
}

/** FR-AD5 */
export function useAdminUsers(q: string, page: number) {
  return useQuery({
    queryKey: [...ADMIN_KEY, 'users', q, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (page > 1) params.set('page', String(page));
      const query = params.toString();
      return api<AdminUserList>(`/admin/users${query ? `?${query}` : ''}`);
    },
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

/** FR-AD6, FR-AD10: the admin's password travels with every status change. */
export function useSetUserStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, password }: { id: string; status: UserStatus; password: string }) =>
      api<{ user: AdminUserSummary }>(`/admin/users/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: { status, password },
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}
