import type {
  Application,
  ApplicationsListResponse,
  CheckDuplicateRequest,
  CreateApplicationRequest,
  DuplicateCheckResponse,
  GeneratePreview,
  MasterCv,
  UpdateApplicationRequest,
} from '@applyai/shared';

const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getApplications(params?: { status?: string; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params?.search) {
      searchParams.set('search', params.search);
    }

    const query = searchParams.toString();
    return request<ApplicationsListResponse>(`/applications${query ? `?${query}` : ''}`);
  },

  getApplication(id: string) {
    return request<Application>(`/applications/${id}`);
  },

  updateApplication(id: string, body: UpdateApplicationRequest) {
    return request<Application>(`/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  checkDuplicate(body: CheckDuplicateRequest) {
    return request<DuplicateCheckResponse>('/applications/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  generateApplication(formData: FormData) {
    return request<GeneratePreview>('/applications/generate', {
      method: 'POST',
      body: formData,
    });
  },

  createApplication(body: CreateApplicationRequest) {
    return request<Application>('/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  },

  getMasterCv() {
    return request<MasterCv | null>('/cv/master');
  },

  uploadMasterCv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return request<MasterCv>('/cv/master', {
      method: 'POST',
      body: formData,
    });
  },
};
