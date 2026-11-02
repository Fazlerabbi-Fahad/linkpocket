'use client';

import type { CreateResourceInput, ResourceDto, ResourceList, UpdateResourceBody } from '@/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { api } from './api';

export interface LibraryFilters {
  q: string;
  tags: string[];
  pinned: boolean;
}

const RESOURCES_KEY = ['resources'] as const;

export function libraryKey(filters: LibraryFilters) {
  return [...RESOURCES_KEY, filters] as const;
}

function listPath(filters: LibraryFilters, cursor: string | null): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  for (const tag of filters.tags) params.append('tag', tag);
  if (filters.pinned) params.set('pinned', 'true');
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return `/resources${query ? `?${query}` : ''}`;
}

/** FR-L1 to FR-L5: one page of 50 at a time, newest first with pinned links on top. */
export function useLibrary(filters: LibraryFilters) {
  return useInfiniteQuery({
    queryKey: libraryKey(filters),
    queryFn: ({ pageParam }) => api<ResourceList>(listPath(filters, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

type Pages = InfiniteData<ResourceList, string | null>;

function forEachList(client: QueryClient, edit: (data: Pages) => Pages) {
  client.setQueriesData<Pages>({ queryKey: RESOURCES_KEY }, (data) => (data ? edit(data) : data));
}

function replaceItem(data: Pages, next: ResourceDto): Pages {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === next.id ? next : item)),
    })),
  };
}

function invalidate(client: QueryClient) {
  return client.invalidateQueries({ queryKey: RESOURCES_KEY });
}

export function useCreateResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateResourceInput) =>
      api<{ resource: ResourceDto; duplicate: boolean }>('/resources', { method: 'POST', body }),
    onSuccess: () => invalidate(client),
  });
}

export function useUpdateResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateResourceBody }) =>
      api<{ resource: ResourceDto }>(`/resources/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body,
      }),
    onSuccess: ({ resource }) => {
      forEachList(client, (data) => replaceItem(data, resource));
      return invalidate(client);
    },
  });
}

export function useDeleteResource() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/resources/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: (_, id) => {
      forEachList(client, (data) => ({
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== id),
        })),
      }));
      return invalidate(client);
    },
  });
}

/**
 * FR-C1, DESIGN DIRECTION: the pin flips at once. A newly pinned link jumps to the top; an
 * unpinned one stays put until the server order comes back. A failure restores the cache.
 */
export function useTogglePin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api<{ resource: ResourceDto }>(`/resources/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: { isPinned },
      }),
    onMutate: async ({ id, isPinned }) => {
      await client.cancelQueries({ queryKey: RESOURCES_KEY });
      const snapshot = client.getQueriesData<Pages>({ queryKey: RESOURCES_KEY });
      forEachList(client, (data) => {
        const target = data.pages.flatMap((page) => page.items).find((item) => item.id === id);
        if (!target) return data;
        const next: ResourceDto = {
          ...target,
          isPinned,
          pinnedAt: isPinned ? new Date().toISOString() : null,
        };
        if (!isPinned) return replaceItem(data, next);
        const pages = data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== id),
        }));
        const [first, ...rest] = pages;
        return first
          ? { ...data, pages: [{ ...first, items: [next, ...first.items] }, ...rest] }
          : data;
      });
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      for (const [key, data] of context?.snapshot ?? []) client.setQueryData(key, data);
    },
    onSettled: () => invalidate(client),
  });
}
