'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/lib/api';
import { Patient, PatientFilters } from '@/types';
import Topbar from '@/components/layout/Topbar';
import PatientModal from '@/components/forms/PatientModal';
import PaginationControl from '@/components/ui/PaginationControl';
import { formatDate, CONDITION_BADGE_STYLES } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Search, Trash2, Edit2, X, Users,
  ChevronUp, ChevronDown, ChevronsUpDown, Stethoscope, AlertCircle
} from 'lucide-react';
import DateSearchInput from '@/components/ui/DateSearchInput';
import DnaBackground from '@/components/ui/DnaBackground';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// Skeleton Loader
// ============================================
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ whiteSpace: 'nowrap' }}>Patient</th>
          <th style={{ whiteSpace: 'nowrap' }}>Age / Gender</th>
          <th style={{ whiteSpace: 'nowrap' }}>Condition</th>
          <th style={{ whiteSpace: 'nowrap' }}>Assigned Doctor</th>
          <th style={{ whiteSpace: 'nowrap' }}>Diagnosis</th>
          <th style={{ whiteSpace: 'nowrap' }}>Contact</th>
          <th style={{ whiteSpace: 'nowrap' }}>Admitted</th>
          <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div className="skeleton" style={{ width: 130, height: 14 }} />
              </div>
            </td>
            <td><div className="skeleton" style={{ width: 70, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 80, height: 22, borderRadius: 999 }} /></td>
            <td><div className="skeleton" style={{ width: 110, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 120, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 100, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 80, height: 14 }} /></td>
            <td>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================
// Sort Header
// ============================================
function SortTh({
  label, field, sortBy, sortOrder, onSort,
}: {
  label: string; field: string; sortBy: string; sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const active = sortBy === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title={`Sort by ${label}`}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (sortOrder === 'asc' ? <ChevronUp size={13} style={{ color: 'var(--brand-primary)' }} /> : <ChevronDown size={13} style={{ color: 'var(--brand-primary)' }} />)
          : <ChevronsUpDown size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />}
      </span>
    </th>
  );
}

// ============================================
// Main Patients Page
// ============================================
export default function PatientsPage() {
  const queryClient = useQueryClient();
  const { isAdmin, isAssistant, assignedDoctor, refreshProfile } = useAuth();
  const [filters, setFilters] = useState<PatientFilters>({
    page: 1,
    limit: 10, // Fixed 10 entities per chunk
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync latest assigned doctor on mount for assistants
  useEffect(() => {
    if (isAssistant) {
      refreshProfile();
    }
  }, [isAssistant, refreshProfile]);

  // Debounced search — the search box acts as the complete filter across all parameters
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  };

  const assignedDocObj = assignedDoctor as any;
  const assignedDocId = assignedDocObj?._id || (typeof assignedDoctor === 'string' ? assignedDoctor : null);
  const assignedDocName = assignedDocObj?.name
    ? `Dr. ${assignedDocObj.name.replace('Dr. ', '')}`
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', filters, isAssistant ? (assignedDocId || 'unassigned') : 'all'],
    queryFn: async () => {
      if (isAssistant && !assignedDocId) {
        return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false }, noDoctorAssigned: true };
      }
      const res = await patientApi.getAll(filters);
      return res.data;
    },
    staleTime: 5 * 1000,
    refetchInterval: isAssistant ? 6000 : false,
  });

  const createMutation = useMutation({
    mutationFn: patientApi.create,
    onSuccess: () => {
      toast.success('Patient added successfully!');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['patients-recent'] });
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add patient'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) => patientApi.update(id, data),
    onSuccess: () => {
      toast.success('Patient updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['patients-recent'] });
      setModalOpen(false);
      setEditPatient(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update patient'),
  });

  const deleteMutation = useMutation({
    mutationFn: patientApi.delete,
    onSuccess: () => {
      toast.success('Patient deleted');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['patients-recent'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete patient'),
  });

  const handleSave = (formData: Partial<Patient>) => {
    if (editPatient) updateMutation.mutate({ id: editPatient._id, data: formData });
    else createMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete patient ${name}?`)) deleteMutation.mutate(id);
  };

  const isNoDoctorAssigned = isAssistant && (!assignedDocId || data?.noDoctorAssigned);
  const patients = isNoDoctorAssigned ? [] : (data?.data || []);
  const pagination = isNoDoctorAssigned ? { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false } : data?.pagination;

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0fdfa] relative overflow-hidden">
      <DnaBackground opacity={0.08} />
      <Topbar
        title={isAssistant && assignedDocName && !isNoDoctorAssigned ? `${assignedDocName}'s Patients` : 'Patient Registry'}
        subtitle={
          isAssistant
            ? assignedDocName && !isNoDoctorAssigned
              ? `Patient registry for ${assignedDocName}`
              : 'Assistant Clinical Access'
            : 'Manage admitted patients & clinical records'
        }
      />

      {(modalOpen || editPatient) && (
        <PatientModal
          patient={editPatient}
          hideAssignedDoctor={isAssistant}
          defaultDoctorId={isAssistant ? assignedDocId : undefined}
          doctorName={isAssistant ? (assignedDocObj?.name || 'Assigned Doctor') : undefined}
          onClose={() => { setModalOpen(false); setEditPatient(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="fade-in relative z-10 p-4 sm:p-6 md:p-7">
        {/* Assistant with NO doctor assigned state */}
        {isAssistant && isNoDoctorAssigned && (
          <div className="bg-[#0b151f]/85 border border-[#A5ECEB]/25 rounded-2xl p-6 mb-6 text-center max-w-md mx-auto shadow-xl space-y-2.5">
            <div className="w-12 h-12 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB] mx-auto">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">No Doctor Assigned</h3>
            <p className="text-xs text-slate-400">
              Awaiting doctor assignment by administrator.
            </p>
          </div>
        )}

        {/* Assistant with doctor assigned banner */}
        {isAssistant && !isNoDoctorAssigned && (
          <div className="bg-[#0b151f]/85 border border-[#A5ECEB]/25 rounded-xl p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <Stethoscope size={18} />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#A5ECEB] uppercase tracking-wider">
                  Assigned Doctor
                </div>
                <div className="text-sm font-bold text-slate-200">
                  {assignedDocName} &bull; <span className="font-normal text-slate-400">{assignedDocObj?.specialization || 'Clinical Specialist'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar: Search box with date picker & Action Button */}
        {(!isAssistant || !isNoDoctorAssigned) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <DateSearchInput
                id="patient-search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Search patient name, condition, diagnosis, phone, doctor, or date (YYYY-MM-DD, DD/MM/YYYY)..."
              />
            </div>

            <button
              id="add-patient-btn"
              onClick={() => { setEditPatient(null); setModalOpen(true); }}
              className="btn btn-primary w-full sm:w-auto"
              style={{ height: '42px', padding: '0 20px' }}
            >
              <Plus size={16} /> Add Patient
            </button>
          </div>
        )}

        {/* Table / Cards Container */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading && !data ? (
            <TableSkeleton />
          ) : !patients.length ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Users size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>No patients found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {searchInput ? 'No patients match your search query.' : 'Admit your first patient into the registry to get started.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortTh label="Patient" field="name" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <SortTh label="Age / Gender" field="age" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <SortTh label="Condition" field="condition" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ whiteSpace: 'nowrap' }}>Assigned Doctor</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Diagnosis</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Contact</th>
                      <SortTh label="Admitted" field="admissionDate" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {patients.map((patient) => {
                      const doctor = patient.assignedDoctor && typeof patient.assignedDoctor === 'object' ? (patient.assignedDoctor as any) : null;
                      const badgeStyle = CONDITION_BADGE_STYLES[patient.condition] || {};
                      return (
                        <tr key={patient._id}>
                          {/* Patient Name: 1 line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'rgba(165, 236, 235, 0.12)',
                                  border: '1px solid rgba(165, 236, 235, 0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                                  {patient.name.charAt(0)}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                {patient.name}
                              </span>
                            </div>
                          </td>

                          {/* Age / Gender: 1 line */}
                          <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {patient.age}y • {patient.gender}
                          </td>

                          {/* Condition: 1 line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span className="badge" style={badgeStyle}>{patient.condition}</span>
                          </td>

                          {/* Assigned Doctor: 1 line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {doctor ? (
                              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--brand-primary)' }}>
                                {doctor.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                — Unassigned —
                              </span>
                            )}
                          </td>

                          {/* Diagnosis: 1 line with ellipsis */}
                          <td
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              verticalAlign: 'middle',
                            }}
                            title={patient.diagnosis}
                          >
                            {patient.diagnosis || '—'}
                          </td>

                          {/* Contact: 1 line */}
                          <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {patient.phone || patient.email || '—'}
                          </td>

                          {/* Admitted: 1 line */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            {formatDate(patient.admissionDate || patient.createdAt)}
                          </td>

                          {/* Actions: 1 line */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => { setEditPatient(patient); setModalOpen(true); }}
                                className="btn btn-secondary btn-sm"
                                title="Edit Patient"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(patient._id, patient.name)}
                                className="btn btn-secondary btn-sm"
                                title="Delete Patient"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (< md) */}
              <div className="block md:hidden p-3.5 space-y-3.5">
                {patients.map((patient) => {
                  const doctor = patient.assignedDoctor && typeof patient.assignedDoctor === 'object' ? (patient.assignedDoctor as any) : null;
                  const badgeStyle = CONDITION_BADGE_STYLES[patient.condition] || {};
                  return (
                    <div
                      key={patient._id}
                      className="bg-[#070d14]/85 border border-[#A5ECEB]/20 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center font-bold text-[#A5ECEB] text-sm flex-shrink-0">
                            {patient.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">
                              {patient.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {patient.age}y • {patient.gender}
                            </p>
                          </div>
                        </div>

                        {/* Condition Badge */}
                        <span className="badge flex-shrink-0" style={{ ...badgeStyle, fontSize: '11px', padding: '3px 9px' }}>
                          {patient.condition}
                        </span>
                      </div>

                      {/* Info Details */}
                      <div className="p-2.5 rounded-lg bg-[#0b151f] border border-[#A5ECEB]/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Doctor:</span>
                          {doctor ? (
                            <span className="text-[#A5ECEB] font-semibold truncate max-w-[190px] flex items-center gap-1">
                              <Stethoscope size={12} className="flex-shrink-0" />
                              <span className="truncate">{doctor.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">— Unassigned —</span>
                          )}
                        </div>

                        {patient.diagnosis && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Diagnosis:</span>
                            <span className="text-slate-300 font-medium truncate max-w-[190px]" title={patient.diagnosis}>
                              {patient.diagnosis}
                            </span>
                          </div>
                        )}

                        {(patient.phone || patient.email) && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Contact:</span>
                            <span className="text-slate-300 truncate max-w-[190px]">
                              {patient.phone || patient.email}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Admitted:</span>
                          <span className="text-slate-400">
                            {formatDate(patient.admissionDate || patient.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#A5ECEB]/10">
                        <button
                          onClick={() => { setEditPatient(patient); setModalOpen(true); }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 transition-all"
                        >
                          <Edit2 size={13} />
                          <span>Edit Patient</span>
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id, patient.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all"
                          title="Delete Patient"
                          aria-label="Delete Patient"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Server Side Pagination: Fixed 10 chunk, no rows per page */}
        {pagination && pagination.total > 0 && (
          <PaginationControl
            pagination={pagination}
            onPageChange={(newPage) => setFilters((p) => ({ ...p, page: newPage }))}
            itemLabel="patients"
          />
        )}
      </div>
    </div>
  );
}
