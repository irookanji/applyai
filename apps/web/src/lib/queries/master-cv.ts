import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const useMasterCvQuery = () => {
  return useQuery({
    queryKey: queryKeys.masterCv,
    queryFn: () => api.getMasterCv(),
  });
};

export const useUploadMasterCvMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => api.uploadMasterCv(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.masterCv });
    },
  });
};
