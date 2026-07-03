import type { QueryClient } from '@tanstack/react-query';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import type { Application, ApplicationStatus, ApplicationsListResponse } from '@applyai/shared';

import { api } from '@/lib/api';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { queryKeys } from '@/lib/query-keys';
import { debounce } from '@/lib/utils';

type UpdateApplicationPayload = {
  readonly status?: ApplicationStatus;
  readonly notes?: string;
  readonly cvSent?: string;
  readonly coverLetter?: string;
};

const syncApplicationInCache = (queryClient: QueryClient, updated: Application) => {
  queryClient.setQueriesData(
    { queryKey: queryKeys.applications.all },
    (old: ApplicationsListResponse | undefined) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        applications: old.applications.map((app) => (app.id === updated.id ? updated : app)),
      };
    },
  );
};

export const useApplicationsListQuery = (statusFilter: string, searchQuery: string) => {
  const debouncedSearch = useDebouncedValue(searchQuery, 500);

  return useQuery({
    queryKey: queryKeys.applications.list(statusFilter, debouncedSearch),
    queryFn: () =>
      api.getApplications({
        status: statusFilter,
        search: debouncedSearch || undefined,
      }),
    placeholderData: keepPreviousData,
  });
};

export const useUpdateApplicationMutation = (applicationId: string) => {
  const queryClient = useQueryClient();
  const applicationIdRef = useRef(applicationId);
  applicationIdRef.current = applicationId;

  return useMutation({
    mutationFn: (payload: UpdateApplicationPayload) =>
      api.updateApplication(applicationIdRef.current, payload),
    onSuccess: (updated, variables) => {
      if (variables.status !== undefined) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
        return;
      }

      syncApplicationInCache(queryClient, updated);
    },
  });
};

export const useDebouncedNotesSave = (applicationId: string) => {
  const queryClient = useQueryClient();
  const applicationIdRef = useRef(applicationId);
  applicationIdRef.current = applicationId;

  return debounce((notes: string) => {
    void api.updateApplication(applicationIdRef.current, { notes }).then((updated) => {
      syncApplicationInCache(queryClient, updated);
    });
  }, 500);
};
