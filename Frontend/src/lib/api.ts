import apiClient from './apiClient';
import {
  AuthResponse,
  LoginCredentials,
  Doctor,
  DoctorFilters,
  Patient,
  PatientFilters,
  PaginatedResponse,
  ApiResponse,
  DashboardStats,
  MonthlyStats,
  Assistant,
  AssistantFilters,
} from '@/types';

// ============================================
// Auth API
// ============================================
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),
  getSignupDoctors: () =>
    apiClient.get<ApiResponse<Pick<Doctor, '_id' | 'name' | 'specialization' | 'hospital'>[]>>('/auth/doctors'),
  register: (data: {
    email: string;
    password: string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    requestedDoctor?: string;
    requestedDoctorName?: string;
    reason?: string;
  }) =>
    apiClient.post<AuthResponse>('/auth/register', data),
  getMe: () => apiClient.get<ApiResponse<{ admin: any }>>('/auth/me'),
};

// ============================================
// Doctor API
// ============================================
export const doctorApi = {
  getAll: (filters: DoctorFilters = {}) =>
    apiClient.get<PaginatedResponse<Doctor>>('/doctors', { params: filters }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`),

  getSpecializations: () =>
    apiClient.get<ApiResponse<string[]>>('/doctors/specializations'),

  create: (data: Partial<Doctor>) =>
    apiClient.post<ApiResponse<Doctor>>('/doctors', data),

  update: (id: string, data: Partial<Doctor>) =>
    apiClient.put<ApiResponse<Doctor>>(`/doctors/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/doctors/${id}`),

  getPatients: (doctorId: string, params: PatientFilters = {}) =>
    apiClient.get<PaginatedResponse<Patient>>(`/doctors/${doctorId}/patients`, {
      params,
    }),

  assignPatient: (doctorId: string, patientId: string) =>
    apiClient.post<ApiResponse<null>>(`/doctors/${doctorId}/patients/${patientId}`),

  removePatient: (doctorId: string, patientId: string) =>
    apiClient.delete<ApiResponse<null>>(`/doctors/${doctorId}/patients/${patientId}`),
};

// ============================================
// Patient API
// ============================================
export const patientApi = {
  getAll: (filters: PatientFilters = {}) =>
    apiClient.get<PaginatedResponse<Patient>>('/patients', { params: filters }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Patient>>(`/patients/${id}`),

  create: (data: Partial<Patient>) =>
    apiClient.post<ApiResponse<Patient>>('/patients', data),

  update: (id: string, data: Partial<Patient>) =>
    apiClient.put<ApiResponse<Patient>>(`/patients/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/patients/${id}`),

  getConditions: () =>
    apiClient.get<ApiResponse<string[]>>('/patients/conditions'),
};

// ============================================
// Analytics API
// ============================================
export const analyticsApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard'),

  getMonthly: (year?: number) =>
    apiClient.get<ApiResponse<MonthlyStats>>('/analytics/monthly', {
      params: { year },
    }),
};

// ============================================
// Assistant API (Admin Management)
// ============================================
export const assistantApi = {
  getAll: (filters: AssistantFilters = {}) =>
    apiClient.get<PaginatedResponse<Assistant>>('/assistants', { params: filters }),

  create: (data: Partial<Assistant> & { password?: string }) =>
    apiClient.post<ApiResponse<Assistant>>('/assistants', data),

  update: (id: string, data: Partial<Assistant>) =>
    apiClient.put<ApiResponse<Assistant>>(`/assistants/${id}`, data),

  updateStatus: (id: string, status: 'approved' | 'rejected' | 'pending') =>
    apiClient.put<ApiResponse<Assistant>>(`/assistants/${id}/status`, { status }),

  assignDoctor: (id: string, doctorId: string | null) =>
    apiClient.put<ApiResponse<Assistant>>(`/assistants/${id}/assign-doctor`, { doctorId }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/assistants/${id}`),
};

