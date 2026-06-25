export const queryKeys = {
  masterCv: ['master-cv'] as const,
  applications: {
    all: ['applications'] as const,
    list: (status: string, search: string) => ['applications', status, search] as const,
  },
} as const;
