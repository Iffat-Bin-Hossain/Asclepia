// ============================================
// Core Entity Types
// ============================================

export interface Admin {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'assistant';
  status?: 'pending' | 'approved' | 'rejected';
  assignedDoctor?: Doctor | string | null;
  createdAt: string;
}

export type User = Admin;

export interface Assistant {
  _id: string;
  email: string;
  name: string;
  age?: number | null;
  gender?: 'Male' | 'Female' | 'Other' | null;
  phone?: string | null;
  role: 'assistant';
  status: 'pending' | 'approved' | 'rejected';
  requestedDoctor?: Doctor | string | null;
  requestedDoctorName?: string | null;
  reason?: string | null;
  assignedDoctor?: Doctor | string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  bio?: string;
  patients?: Patient[] | string[];
  patientCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  condition: PatientCondition;
  phone?: string;
  email?: string;
  address?: string;
  diagnosis?: string;
  admissionDate: string;
  dischargeDate?: string | null;
  assignedDoctor?: Doctor | string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PatientCondition =
  | 'Critical'
  | 'Serious'
  | 'Stable'
  | 'Fair'
  | 'Good'
  | 'Recovered'
  | 'Under Observation'
  | 'Discharged';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  doctor?: { _id: string; name: string; specialization?: string; hospital?: string };
  meta?: { total?: number; pendingCount?: number };
  noDoctorAssigned?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  doctor?: { _id: string; name: string; specialization?: string; hospital?: string };
  pagination: Pagination;
  meta?: { total?: number; pendingCount?: number };
  noDoctorAssigned?: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: Admin;
  user?: Admin;
  pendingApproval?: boolean;
  assistant?: Partial<Assistant>;
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardStats {
  role?: 'admin' | 'assistant';
  noDoctorAssigned?: boolean;
  assignedDoctor?: Doctor | null;
  overview: { totalDoctors: number; totalPatients: number };
  conditionStats: { condition: string; count: number }[];
  genderStats: { gender: string; count: number }[];
  patientsPerDoctor: { _id: string; name: string; specialization: string; hospital: string; patientCount: number }[];
  trends: {
    last7DaysPatients: { date: string; count: number }[];
    last7DaysDoctors: { date: string; count: number }[];
  };
  recent: {
    patients: Patient[];
    doctors: Doctor[];
  };
}

export interface MonthlyStats {
  year: number;
  monthlyPatients: { month: number; count: number }[];
  monthlyDoctors: { month: number; count: number }[];
}

// ============================================
// Query Filter Types
// ============================================

export interface DoctorFilters {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  isActive?: boolean | string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientFilters {
  page?: number;
  limit?: number;
  search?: string;
  condition?: string;
  gender?: string;
  assignedDoctor?: string;
  dateType?: 'createdAt' | 'admissionDate';
  startDate?: string;
  endDate?: string;
  minAge?: number | string;
  maxAge?: number | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssistantFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
