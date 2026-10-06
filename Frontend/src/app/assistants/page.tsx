'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assistantApi, doctorApi } from '@/lib/api';
import { Assistant, AssistantFilters, Doctor } from '@/types';
import Topbar from '@/components/layout/Topbar';
import PaginationControl from '@/components/ui/PaginationControl';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Search, Trash2, Edit2, X, Loader2,
  Stethoscope, Check, XCircle, Clock,
  ChevronUp, ChevronDown, ChevronsUpDown,
  UserCheck
} from 'lucide-react';
import DateSearchInput from '@/components/ui/DateSearchInput';
import DnaBackground from '@/components/ui/DnaBackground';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// Skeleton Loader (Matching Doctors and Patients)
// ============================================
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ whiteSpace: 'nowrap' }}>Assistant</th>
          <th style={{ whiteSpace: 'nowrap' }}>Status</th>
          <th style={{ whiteSpace: 'nowrap' }}>Assigned Doctor</th>
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
                <div className="skeleton" style={{ width: 130, height: 14 }} />
              </div>
            </td>
            <td><div className="skeleton" style={{ width: 80, height: 22, borderRadius: 999 }} /></td>
            <td><div className="skeleton" style={{ width: 130, height: 14 }} /></td>
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
// Assistant Form Modal
// ============================================
function AssistantModal({
  assistant,
  doctors,
  onClose,
  onSave,
  isSaving,
}: {
  assistant?: Assistant | null;
  doctors: Doctor[];
  onClose: () => void;
  onSave: (data: Partial<Assistant> & { password?: string }) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Partial<Assistant> & { password?: string }>(() => {
    if (assistant) {
      const doc = assistant.assignedDoctor;
      const docId = typeof doc === 'object' ? (doc as any)?._id : (doc || '');
      return {
        ...assistant,
        assignedDoctor: docId,
        password: '',
      };
    }
    return {
      name: '',
      email: '',
      password: '',
      age: undefined,
      gender: 'Male',
      phone: '',
      assignedDoctor: '',
      status: 'pending',
      reason: '',
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast.error('Please enter assistant name');
      return;
    }
    if (!form.email?.trim()) {
      toast.error('Please enter assistant email');
      return;
    }
    if (!assistant && (!form.password || form.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '100%' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {assistant ? 'Edit Assistant' : 'Add New Assistant'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
              <input name="name" value={form.name || ''} onChange={handleChange} className="input-field" placeholder="Full name" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email *</label>
              <input name="email" type="email" value={form.email || ''} onChange={handleChange} className="input-field" placeholder="assistant@hospital.com" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Status</label>
              <select name="status" value={form.status || 'pending'} onChange={handleChange} className="input-field">
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {assistant ? 'Change Password (optional)' : 'Password *'}
              </label>
              <input
                name="password"
                type="password"
                value={form.password || ''}
                onChange={handleChange}
                className="input-field"
                placeholder={assistant ? 'Leave blank to keep current' : 'Min 6 characters'}
                required={!assistant}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Assigned Doctor</label>
            <select
              name="assignedDoctor"
              value={form.status === 'approved' ? ((form.assignedDoctor as string) || '') : ''}
              onChange={handleChange}
              className="input-field"
              disabled={form.status !== 'approved'}
              style={{ opacity: form.status !== 'approved' ? 0.5 : 1 }}
            >
              <option value="">{form.status === 'approved' ? '— Unassigned —' : 'Approve the assistant first'}</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.specialization ? `(${d.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Reason / Notes</label>
            <textarea
              name="reason"
              value={form.reason || ''}
              onChange={handleChange}
              className="input-field"
              rows={2}
              placeholder="Clinical department or reason for request..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              {assistant ? 'Update Assistant' : 'Create Assistant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Assign Doctor Modal
// ============================================
function AssignDoctorModal({
  assistant,
  doctors,
  onClose,
  onAssign,
  isSaving,
}: {
  assistant: Assistant;
  doctors: Doctor[];
  onClose: () => void;
  onAssign: (doctorId: string | null) => void;
  isSaving: boolean;
}) {
  const currentDoc = assistant.assignedDoctor;
  const currentDocId = typeof currentDoc === 'object' ? (currentDoc as any)?._id : (currentDoc || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(currentDocId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(selectedDocId || null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Assign Doctor</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Delegate assistant {assistant.name} to a clinical doctor
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Doctor</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="input-field"
            >
              <option value="">— Unassign / None —</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.specialization ? `(${d.specialization})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Main Assistants Page
// ============================================
export default function AssistantsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<AssistantFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAssistant, setEditAssistant] = useState<Assistant | null>(null);
  const [assignDoctorAssistant, setAssignDoctorAssistant] = useState<Assistant | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
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

  // Fetch Assistants
  const { data, isLoading } = useQuery({
    queryKey: ['assistants', filters],
    queryFn: async () => {
      const res = await assistantApi.getAll(filters);
      return res.data;
    },
    staleTime: 15 * 1000,
    placeholderData: (prev) => prev,
  });

  // Fetch Doctors for assignment dropdowns
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list-assignment'],
    queryFn: async () => {
      const res = await doctorApi.getAll({ limit: 100 });
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  const doctorsList = doctorsData || [];

  // Create Assistant
  const createMutation = useMutation({
    mutationFn: assistantApi.create,
    onSuccess: () => {
      toast.success('Assistant added successfully');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add assistant');
    },
  });

  // Update Assistant
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assistant> }) =>
      assistantApi.update(id, data),
    onSuccess: () => {
      toast.success('Assistant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      setModalOpen(false);
      setEditAssistant(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update assistant');
    },
  });

  // Update Status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'pending' }) =>
      assistantApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'approved'
          ? 'Assistant approved successfully'
          : 'Assistant rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update assistant status');
    },
  });

  // Assign Doctor
  const assignDoctorMutation = useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId: string | null }) =>
      assistantApi.assignDoctor(id, doctorId),
    onSuccess: () => {
      toast.success('Doctor assignment updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setAssignDoctorAssistant(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign doctor');
    },
  });

  // Delete Assistant
  const deleteMutation = useMutation({
    mutationFn: (id: string) => assistantApi.delete(id),
    onSuccess: () => {
      toast.success('Assistant account removed');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete assistant');
    },
  });

  const handleSave = (formData: Partial<Assistant> & { password?: string }) => {
    if (editAssistant) {
      updateMutation.mutate({ id: editAssistant._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete assistant ${name}? This will remove their portal access.`)) {
      deleteMutation.mutate(id);
    }
  };

  const assistants = data?.data || [];
  const pagination = data?.pagination;
  const pendingCount = data?.meta?.pendingCount || 0;

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0fdfa] relative overflow-hidden">
      <DnaBackground opacity={0.08} />
      <Topbar
        title="Assistants Directory"
        subtitle="Manage clinical assistants & doctor delegations"
      />

      {(modalOpen || editAssistant) && (
        <AssistantModal
          assistant={editAssistant}
          doctors={doctorsList}
          onClose={() => { setModalOpen(false); setEditAssistant(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {assignDoctorAssistant && (
        <AssignDoctorModal
          assistant={assignDoctorAssistant}
          doctors={doctorsList}
          onClose={() => setAssignDoctorAssistant(null)}
          onAssign={(doctorId) =>
            assignDoctorMutation.mutate({
              id: assignDoctorAssistant._id,
              doctorId,
            })
          }
          isSaving={assignDoctorMutation.isPending}
        />
      )}

      <div className="fade-in relative z-10 p-4 sm:p-6 md:p-7">
        {/* Toolbar: Search input, status tabs, and add button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <DateSearchInput
              id="assistant-search"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search by assistant, email, doctor, or date (YYYY-MM-DD, DD/MM/YYYY)..."
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#0b151f] p-1 rounded-xl border border-[#A5ECEB]/20">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
              const active = (filters.status || 'all') === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilters((prev) => ({ ...prev, status: tab, page: 1 }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#A5ECEB] text-[#070d14] font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab}
                  {tab === 'pending' && pendingCount > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        active ? 'bg-[#070d14] text-[#A5ECEB]' : 'bg-[#A5ECEB]/20 text-[#7DFDF0]'
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button
              id="add-assistant-btn"
              onClick={() => { setEditAssistant(null); setModalOpen(true); }}
              className="btn btn-primary w-full sm:w-auto"
              style={{ height: '42px', padding: '0 20px' }}
            >
              <Plus size={16} /> Add Assistant
            </button>
          )}
        </div>

        {/* Table / Cards Container */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {isLoading && !data ? (
            <TableSkeleton />
          ) : !assistants.length ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <UserCheck size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>No assistants found</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                {searchInput ? 'No assistants match your search query.' : 'Register an assistant or manage delegations to get started.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortTh label="Assistant" field="name" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <SortTh label="Status" field="status" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ whiteSpace: 'nowrap' }}>Assigned Doctor</th>
                      <SortTh label="Registered" field="createdAt" sortBy={filters.sortBy || 'createdAt'} sortOrder={filters.sortOrder || 'desc'} onSort={handleSort} />
                      <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {assistants.map((assistant) => {
                      const isPending = assistant.status === 'pending';
                      const isApproved = assistant.status === 'approved';
                      const isRejected = assistant.status === 'rejected';

                      const doc = assistant.assignedDoctor;
                      const docName = doc && typeof doc === 'object'
                        ? (doc as any).name
                        : null;

                      return (
                        <tr key={assistant._id}>
                          {/* Assistant Name & Avatar: 1 line */}
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
                                  {assistant.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', display: 'block' }}>
                                  {assistant.name}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'block' }}>
                                  {assistant.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status: 1 line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {isPending && (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(165, 236, 235, 0.12)',
                                  color: 'var(--brand-primary)',
                                  border: '1px solid rgba(165, 236, 235, 0.3)',
                                }}
                              >
                                Pending
                              </span>
                            )}
                            {isApproved && (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(125, 253, 240, 0.16)',
                                  color: '#7DFDF0',
                                  border: '1px solid rgba(125, 253, 240, 0.35)',
                                }}
                              >
                                Approved
                              </span>
                            )}
                            {isRejected && (
                              <span
                                className="badge"
                                style={{
                                  background: 'rgba(148, 163, 184, 0.12)',
                                  color: '#94a3b8',
                                  border: '1px solid rgba(148, 163, 184, 0.25)',
                                }}
                              >
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Assigned Doctor: 1 line */}
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {docName ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  color: 'var(--brand-primary)',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  maxWidth: '220px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={assistant.reason ? `${docName} • Reason: ${assistant.reason}` : docName}
                              >
                                <Stethoscope size={13} style={{ flexShrink: 0 }} />
                                <span className="truncate">{docName.startsWith('Dr.') ? docName : `Dr. ${docName}`}</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                {isPending ? 'Awaiting approval' : isRejected ? '—' : '— Unassigned —'}
                              </span>
                            )}
                          </td>

                          {/* Registered: 1 line */}
                          <td style={{ color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {formatDate(assistant.createdAt)}
                          </td>

                          {/* Actions: 1 line */}
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'approved' })}
                                    className="btn btn-secondary btn-sm"
                                    title="Approve Assistant"
                                    style={{ color: '#7DFDF0', borderColor: 'rgba(125, 253, 240, 0.35)' }}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'rejected' })}
                                    className="btn btn-secondary btn-sm"
                                    title="Reject Assistant"
                                    style={{ color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.25)' }}
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <XCircle size={13} />
                                  </button>
                                </>
                              )}
                              {isApproved && (
                                <button
                                  onClick={() => setAssignDoctorAssistant(assistant)}
                                  className="btn btn-secondary btn-sm"
                                  title={docName ? 'Change Doctor' : 'Assign Doctor'}
                                  style={{ color: 'var(--brand-primary)', borderColor: 'rgba(165, 236, 235, 0.3)' }}
                                >
                                  <Stethoscope size={13} />
                                </button>
                              )}
                              {isRejected && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'approved' })}
                                  className="btn btn-secondary btn-sm"
                                  title="Re-approve Assistant"
                                  style={{ color: '#7DFDF0', borderColor: 'rgba(125, 253, 240, 0.35)' }}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Check size={13} />
                                </button>
                              )}
                              <button
                                onClick={() => { setEditAssistant(assistant); setModalOpen(true); }}
                                className="btn btn-secondary btn-sm"
                                title="Edit Assistant"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(assistant._id, assistant.name)}
                                className="btn btn-secondary btn-sm"
                                title="Delete Assistant"
                                disabled={deleteMutation.isPending}
                                style={{ color: 'var(--text-secondary)' }}
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
                {assistants.map((assistant) => {
                  const isPending = assistant.status === 'pending';
                  const isApproved = assistant.status === 'approved';
                  const isRejected = assistant.status === 'rejected';

                  const doc = assistant.assignedDoctor;
                  const docName = doc && typeof doc === 'object'
                    ? (doc as any).name
                    : null;

                  return (
                    <div
                      key={assistant._id}
                      className="bg-[#070d14]/85 border border-[#A5ECEB]/20 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(165, 236, 235, 0.12)',
                              border: '1px solid rgba(165, 236, 235, 0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-primary)' }}>
                              {assistant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">
                              {assistant.name}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {assistant.email}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="badge flex-shrink-0" style={{ background: 'rgba(165, 236, 235, 0.12)', color: 'var(--brand-primary)', border: '1px solid rgba(165, 236, 235, 0.3)', fontSize: '11px', padding: '3px 9px' }}>
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="badge flex-shrink-0" style={{ background: 'rgba(125, 253, 240, 0.16)', color: '#7DFDF0', border: '1px solid rgba(125, 253, 240, 0.35)', fontSize: '11px', padding: '3px 9px' }}>
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="badge flex-shrink-0" style={{ background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.25)', fontSize: '11px', padding: '3px 9px' }}>
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Info Details */}
                      <div className="p-2.5 rounded-lg bg-[#0b151f] border border-[#A5ECEB]/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Doctor:</span>
                          {docName ? (
                            <span className="text-[#A5ECEB] font-medium truncate max-w-[190px] flex items-center gap-1">
                              <Stethoscope size={12} className="flex-shrink-0" />
                              <span className="truncate">{docName.startsWith('Dr.') ? docName : `Dr. ${docName}`}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">{isPending ? 'Awaiting approval' : isRejected ? '—' : '— Unassigned —'}</span>
                          )}
                        </div>

                        {assistant.reason && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Reason:</span>
                            <span className="text-slate-300 truncate max-w-[190px]" title={assistant.reason}>{assistant.reason}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Registered:</span>
                          <span className="text-slate-400">{formatDate(assistant.createdAt)}</span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#A5ECEB]/10">
                        {isPending && (
                          <>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'approved' })}
                              disabled={updateStatusMutation.isPending}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#070d14] bg-[#A5ECEB] hover:bg-[#8ee5e4] transition-all"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'rejected' })}
                              disabled={updateStatusMutation.isPending}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => setAssignDoctorAssistant(assistant)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 transition-all"
                          >
                            <Stethoscope size={13} />
                            <span>{docName ? 'Change Doctor' : 'Assign Doctor'}</span>
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: assistant._id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                          >
                            <Check size={13} />
                            <span>Re-approve</span>
                          </button>
                        )}

                        <button
                          onClick={() => { setEditAssistant(assistant); setModalOpen(true); }}
                          className="p-2 rounded-lg text-slate-300 hover:text-[#A5ECEB] bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
                          title="Edit Assistant"
                          aria-label="Edit Assistant"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(assistant._id, assistant.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-all"
                          title="Delete Assistant"
                          aria-label="Delete Assistant"
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

        {/* Server Side Pagination */}
        {pagination && pagination.total > 0 && (
          <PaginationControl
            pagination={pagination}
            onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
            itemLabel="assistants"
          />
        )}
      </div>
    </div>
  );
}
