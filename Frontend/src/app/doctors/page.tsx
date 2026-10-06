'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorApi, patientApi } from '@/lib/api';
import { Doctor, DoctorFilters, PatientFilters, Patient } from '@/types';
import Topbar from '@/components/layout/Topbar';
import PatientModal from '@/components/forms/PatientModal';
import PaginationControl from '@/components/ui/PaginationControl';
import { formatDate, CONDITION_BADGE_STYLES } from '@/lib/utils';
import {
  Plus, Search, Trash2, Edit2, X, Loader2,
  Stethoscope, Hospital, Users,
  ChevronUp, ChevronDown, ChevronsUpDown,
  UserMinus
} from 'lucide-react';
import DateSearchInput from '@/components/ui/DateSearchInput';
import DnaBackground from '@/components/ui/DnaBackground';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

// ============================================
// Skeleton Loader
// ============================================
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ whiteSpace: 'nowrap' }}>Doctor</th>
          <th style={{ whiteSpace: 'nowrap' }}>Specialization</th>
          <th style={{ whiteSpace: 'nowrap' }}>Hospital</th>
          <th style={{ whiteSpace: 'nowrap' }}>Patients</th>
          <th style={{ whiteSpace: 'nowrap' }}>Contact</th>
          <th style={{ whiteSpace: 'nowrap' }}>Registered</th>
          <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div className="skeleton" style={{ width: 140, height: 14 }} />
              </div>
            </td>
            <td><div className="skeleton" style={{ width: 120, height: 22, borderRadius: 6 }} /></td>
            <td><div className="skeleton" style={{ width: 130, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 70, height: 20, borderRadius: 12 }} /></td>
            <td><div className="skeleton" style={{ width: 100, height: 14 }} /></td>
            <td><div className="skeleton" style={{ width: 80, height: 14 }} /></td>
            <td>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <div className="skeleton" style={{ width: 72, height: 28, borderRadius: 6 }} />
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
// Doctor Form Modal
// ============================================
function DoctorModal({
  doctor, onClose, onSave, isSaving,
}: {
  doctor?: Doctor | null;
  onClose: () => void;
  onSave: (data: Partial<Doctor>) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Partial<Doctor>>(
    doctor || { name: '', specialization: '', hospital: '', phone: '', email: '', bio: '' }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {doctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
              <input name="name" value={form.name || ''} onChange={handleChange} className="input-field" placeholder="Dr. Jane Smith" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Specialization *</label>
              <input name="specialization" value={form.specialization || ''} onChange={handleChange} className="input-field" placeholder="Cardiology" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Hospital *</label>
            <input name="hospital" value={form.hospital || ''} onChange={handleChange} className="input-field" placeholder="City General Hospital" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone *</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange} className="input-field" placeholder="+1-555-0101" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email *</label>
              <input name="email" type="email" value={form.email || ''} onChange={handleChange} className="input-field" placeholder="doctor@hospital.com" required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Bio</label>
            <textarea name="bio" value={form.bio || ''} onChange={handleChange} className="input-field" placeholder="Brief professional summary..." rows={3} style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : (doctor ? 'Update Doctor' : 'Add Doctor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Doctor Patients Modal (No Assigned Doctor field, fixed 10 chunk)
// ============================================
function DoctorPatientsModal({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [patientFilters, setPatientFilters] = useState<PatientFilters>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search for doctor's patients (acts as filter)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPatientFilters((prev) => ({ ...prev, search: patientSearchInput, page: 1 }));
    }, 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [patientSearchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-patients', doctor._id, patientFilters],
    queryFn: async () => {
      const res = await doctorApi.getPatients(doctor._id, patientFilters);
      return res.data;
    },
    staleTime: 10 * 1000,
    placeholderData: (prev) => prev,
  });

  // Add Patient inside doctor: hideAssignedDoctor=true, defaultDoctorId=doctor._id
  const createPatientMutation = useMutation({
    mutationFn: (newPatientData: Partial<Patient>) =>
      patientApi.create({ ...newPatientData, assignedDoctor: doctor._id }),
    onSuccess: (res) => {
      toast.success(`Patient ${res.data.data?.name || ''} added to Dr. ${doctor.name}!`);
      setIsAddPatientModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['doctor-patients', doctor._id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add patient');
    },
  });

  // Remove patient from doctor
  const removePatientMutation = useMutation({
    mutationFn: (patientId: string) => doctorApi.removePatient(doctor._id, patientId),
    onSuccess: () => {
      toast.success('Patient removed from doctor');
      queryClient.invalidateQueries({ queryKey: ['doctor-patients', doctor._id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove patient');
    },
  });

  const handleRemovePatient = (patientId: string, patientName: string) => {
    if (window.confirm(`Unassign ${patientName} from Dr. ${doctor.name}?`)) {
      removePatientMutation.mutate(patientId);
    }
  };

  const patientsList = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>

      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          style={{ maxWidth: '780px', width: '95%' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {doctor.name}'s Patients
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                {doctor.specialization} • {doctor.hospital}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                id="doctor-add-patient-btn"
                onClick={() => setIsAddPatientModalOpen(true)}
                className="btn btn-primary btn-sm"
                title="Add patient to this doctor"
              >
                <Plus size={14} /> Add Patient
              </button>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search box working as the only filter */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <DateSearchInput
              id="doctor-patient-search"
              value={patientSearchInput}
              onChange={setPatientSearchInput}
              size="sm"
              placeholder="Search patient name, condition, diagnosis, phone, age, or date..."
            />
          </div>

          {/* Patients List Body */}
          <div style={{ padding: '16px 24px' }}>
            {isLoading && !data ? (
              <div style={{ padding: '20px 0' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '6px', marginBottom: '8px' }} />
                ))}
              </div>
            ) : !patientsList.length ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>No patients found</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  {patientSearchInput ? 'No patients match your search query.' : 'Click "Add Patient" above to assign the first patient.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ whiteSpace: 'nowrap' }}>Patient</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Age / Gender</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Condition</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Diagnosis</th>
                        <th style={{ whiteSpace: 'nowrap' }}>Admitted</th>
                        <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientsList.map((p: any) => {
                        const badgeStyle = CONDITION_BADGE_STYLES[p.condition as keyof typeof CONDITION_BADGE_STYLES] || {};
                        return (
                          <tr key={p._id}>
                            <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {p.name}
                            </td>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '13px' }}>
                              {p.age}y • {p.gender}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className="badge" style={{ ...badgeStyle, fontSize: '11px', padding: '2px 8px' }}>
                                {p.condition}
                              </span>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.diagnosis}>
                              {p.diagnosis || '—'}
                            </td>
                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '12px' }}>
                              {formatDate(p.admissionDate || p.createdAt)}
                            </td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => handleRemovePatient(p._id, p.name)}
                                className="btn btn-secondary btn-sm"
                                title="Unassign patient from this doctor"
                                disabled={removePatientMutation.isPending}
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                              >
                                <UserMinus size={12} /> Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View (< md) */}
                <div className="block md:hidden space-y-3">
                  {patientsList.map((p: any) => {
                    const badgeStyle = CONDITION_BADGE_STYLES[p.condition as keyof typeof CONDITION_BADGE_STYLES] || {};
                    return (
                      <div
                        key={p._id}
                        className="bg-[#070d14]/90 border border-[#A5ECEB]/20 rounded-xl p-3.5 space-y-2.5 shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{p.name}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">{p.age}y • {p.gender}</p>
                          </div>
                          <span className="badge" style={{ ...badgeStyle, fontSize: '11px', padding: '2px 8px' }}>
                            {p.condition}
                          </span>
                        </div>
                        {p.diagnosis && (
                          <div className="text-xs text-slate-300 bg-[#0b151f] p-2 rounded border border-[#A5ECEB]/10">
                            <span className="text-slate-400">Diagnosis: </span>{p.diagnosis}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-[#A5ECEB]/10 text-xs text-slate-400">
                          <span>Admitted: {formatDate(p.admissionDate || p.createdAt)}</span>
                          <button
                            onClick={() => handleRemovePatient(p._id, p.name)}
                            disabled={removePatientMutation.isPending}
                            className="inline-flex items-center gap-1 text-slate-300 hover:text-slate-100 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700 text-xs font-medium"
                          >
                            <UserMinus size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Fixed chunk pagination */}
            {pagination && pagination.total > 0 && (
              <PaginationControl
                pagination={pagination}
                onPageChange={(page) => setPatientFilters((p) => ({ ...p, page }))}
                itemLabel="patients"
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Patient Modal Scoped to this Doctor: Opens cleanly on top of this modal */}
      {isAddPatientModalOpen && (
        <PatientModal
          patient={null}
          hideAssignedDoctor={true}
          defaultDoctorId={doctor._id}
          doctorName={doctor.name}
          isStacked={true}
          onClose={() => setIsAddPatientModalOpen(false)}
          onSave={(data) => createPatientMutation.mutate(data)}
          isSaving={createPatientMutation.isPending}
        />
      )}
    </>
  );
}

// ============================================
// Main Doctors Page
// ============================================
export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const { isAdmin, isAssistant } = useAuth();
  const [filters, setFilters] = useState<DoctorFilters>({
    page: 1,
    limit: 10, // Fixed 10 entities per chunk
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [viewPatients, setViewPatients] = useState<Doctor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — the search box acts as the complete filter for any parameter
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

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', filters],
    queryFn: async () => {
      const res = await doctorApi.getAll(filters);
      return res.data;
    },
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: doctorApi.create,
    onSuccess: () => {
      toast.success('Doctor added successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add doctor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Doctor> }) => doctorApi.update(id, data),
    onSuccess: () => {
      toast.success('Doctor updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setModalOpen(false);
      setEditDoctor(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update doctor'),
  });

  const deleteMutation = useMutation({
    mutationFn: doctorApi.delete,
    onSuccess: () => {
      toast.success('Doctor deleted');
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete doctor'),
  });

  const handleSave = (formData: Partial<Doctor>) => {
    if (editDoctor) updateMutation.mutate({ id: editDoctor._id, data: formData });
    else createMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete ${name}? This will unassign all their patients.`)) {
      deleteMutation.mutate(id);
    }
  };

  const doctors = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0fdfa] relative overflow-hidden">
      <DnaBackground opacity={0.08} />
      <Topbar title="Doctors Directory" subtitle="Manage clinical doctors & patient rosters" />

      {(modalOpen || editDoctor) && (
        <DoctorModal
          doctor={editDoctor}
          onClose={() => { setModalOpen(false); setEditDoctor(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {viewPatients && (
        <DoctorPatientsModal doctor={viewPatients} onClose={() => setViewPatients(null)} />
      )}

      <div className="fade-in relative z-10 p-4 sm:p-6 md:p-7">
        {/* Toolbar: Search box acts as filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <DateSearchInput
              id="doctor-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by doctor, specialization, hospital, contact, or date (YYYY-MM-DD, DD/MM/YYYY)..."
            />
          </div>

          {isAdmin && (
            <button
              id="add-doctor-btn"
              onClick={() => { setEditDoctor(null); setModalOpen(true); }}
              className="btn btn-primary w-full sm:w-auto"
              style={{ height: '42px', padding: '0 20px' }}
            >
              <Plus size={16} /> Add Doctor
            </button>
          )}
        </div>

        {/* Table / Cards Container */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading && !data ? (
            <TableSkeleton />
          ) : !doctors.length ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Stethoscope size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>No doctors found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {searchInput ? 'No doctors match your search query.' : 'Add your first clinical doctor to get started.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortTh label="Doctor" field="name" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <SortTh label="Specialization" field="specialization" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <SortTh label="Hospital" field="hospital" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ whiteSpace: 'nowrap' }}>Patients</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Contact</th>
                      <SortTh label="Registered" field="createdAt" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {doctors.map((doctor) => {
                      const patientCount = doctor.patientCount ?? (Array.isArray(doctor.patients) ? doctor.patients.length : 0);
                      return (
                        <tr key={doctor._id}>
                          {/* Doctor: 1 single line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: 'rgba(165,236,235,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                                  {doctor.name.replace('Dr. ', '').charAt(0)}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                {doctor.name}
                              </span>
                            </div>
                          </td>

                          {/* Specialization: 1 single line with ellipsis */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                background: 'rgba(165,236,235,0.08)',
                                color: 'var(--brand-primary)',
                                border: '1px solid rgba(165,236,235,0.2)',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                verticalAlign: 'middle',
                              }}
                              title={doctor.specialization}
                            >
                              {doctor.specialization}
                            </span>
                          </td>

                          {/* Hospital: 1 single line with ellipsis */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                verticalAlign: 'middle',
                              }}
                              title={doctor.hospital}
                            >
                              <Hospital size={13} style={{ flexShrink: 0 }} /> {doctor.hospital}
                            </span>
                          </td>

                          {/* Patients count: 1 single line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => setViewPatients(doctor)}
                              style={{
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: 'rgba(165, 236, 235, 0.08)',
                                color: 'var(--brand-primary)',
                                border: '1px solid rgba(165, 236, 235, 0.25)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                              }}
                              title="Click to view and add assigned patients"
                            >
                              <Users size={11} /> {patientCount} {patientCount === 1 ? 'patient' : 'patients'}
                            </button>
                          </td>

                          {/* Contact: 1 single line */}
                          <td style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {doctor.phone || doctor.email}
                          </td>

                          {/* Registered date: 1 single line */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {formatDate(doctor.createdAt)}
                          </td>

                          {/* Actions: 1 single line */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => setViewPatients(doctor)}
                                className="btn btn-secondary btn-sm"
                                title="View & Add Patients"
                                style={{ color: 'var(--brand-primary)', borderColor: 'rgba(165,236,235,0.3)', whiteSpace: 'nowrap' }}
                              >
                                <Users size={13} /> Patients
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => { setEditDoctor(doctor); setModalOpen(true); }}
                                    className="btn btn-secondary btn-sm"
                                    title="Edit Doctor"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doctor._id, doctor.name)}
                                    className="btn btn-secondary btn-sm"
                                    title="Delete Doctor"
                                    disabled={deleteMutation.isPending}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
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
                {doctors.map((doctor) => {
                  const patientCount = doctor.patientCount ?? (Array.isArray(doctor.patients) ? doctor.patients.length : 0);
                  return (
                    <div
                      key={doctor._id}
                      className="bg-[#070d14]/85 border border-[#A5ECEB]/20 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center font-bold text-[#A5ECEB] text-sm flex-shrink-0">
                            {doctor.name.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">
                              {doctor.name}
                            </h4>
                            <span className="inline-block mt-0.5 text-xs text-[#A5ECEB] font-medium bg-[#A5ECEB]/10 px-2 py-0.5 rounded border border-[#A5ECEB]/20 truncate max-w-[190px]">
                              {doctor.specialization}
                            </span>
                          </div>
                        </div>

                        {/* Patient Count Badge */}
                        <button
                          onClick={() => setViewPatients(doctor)}
                          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#A5ECEB]/15 text-[#7DFDF0] border border-[#A5ECEB]/30 hover:bg-[#A5ECEB]/25 transition-all"
                          title="View assigned patients"
                        >
                          <Users size={12} />
                          <span>{patientCount}</span>
                        </button>
                      </div>

                      {/* Info Details */}
                      <div className="p-2.5 rounded-lg bg-[#0b151f] border border-[#A5ECEB]/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Hospital:</span>
                          <span className="text-slate-300 font-medium truncate max-w-[200px] flex items-center gap-1">
                            <Hospital size={12} className="text-[#A5ECEB] flex-shrink-0" />
                            <span className="truncate">{doctor.hospital}</span>
                          </span>
                        </div>
                        {(doctor.phone || doctor.email) && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Contact:</span>
                            <span className="text-slate-300 truncate max-w-[200px]">
                              {doctor.phone || doctor.email}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Registered:</span>
                          <span className="text-slate-400">{formatDate(doctor.createdAt)}</span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#A5ECEB]/10">
                        <button
                          onClick={() => setViewPatients(doctor)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 transition-all"
                        >
                          <Users size={13} />
                          <span>View Patients ({patientCount})</span>
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setEditDoctor(doctor); setModalOpen(true); }}
                              className="p-2 rounded-lg text-slate-300 hover:text-[#A5ECEB] bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
                              title="Edit Doctor"
                              aria-label="Edit Doctor"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(doctor._id, doctor.name)}
                              disabled={deleteMutation.isPending}
                              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all"
                              title="Delete Doctor"
                              aria-label="Delete Doctor"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
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
            itemLabel="doctors"
          />
        )}
      </div>
    </div>
  );
}
