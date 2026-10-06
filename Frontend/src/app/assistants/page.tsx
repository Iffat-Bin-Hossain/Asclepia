'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assistantApi, doctorApi } from '@/lib/api';
import { Assistant, Doctor } from '@/types';
import Topbar from '@/components/layout/Topbar';
import DnaBackground from '@/components/ui/DnaBackground';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Stethoscope,
  Trash2,
  X,
  UserPlus,
  Loader2,
  Users,
  AlertCircle,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function AssistantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Fetch Assistants
  const { data, isLoading } = useQuery({
    queryKey: ['assistants', search, statusFilter],
    queryFn: async () => {
      const res = await assistantApi.getAll({
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      return res.data;
    },
    staleTime: 15 * 1000,
  });

  // Fetch all active doctors for assignment dropdown
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list-assignment'],
    queryFn: async () => {
      const res = await doctorApi.getAll({ limit: 100 });
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  // Approve / Reject Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' | 'pending' }) =>
      assistantApi.updateStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'approved'
          ? 'Assistant approved successfully!'
          : 'Assistant rejected'
      );
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update assistant status');
    },
  });

  // Assign Doctor Mutation
  const assignDoctorMutation = useMutation({
    mutationFn: ({ id, doctorId }: { id: string; doctorId: string | null }) =>
      assistantApi.assignDoctor(id, doctorId),
    onSuccess: () => {
      toast.success('Doctor assignment updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patients-recent'] });
      setSelectedAssistant(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to assign doctor');
    },
  });

  // Delete Assistant Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => assistantApi.delete(id),
    onSuccess: () => {
      toast.success('Assistant account removed');
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistants-list-badge'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete assistant');
    },
  });

  const assistants = data?.data || [];
  const pendingCount = data?.meta?.pendingCount || 0;
  const totalCount = data?.meta?.total || assistants.length;
  const approvedCount = assistants.filter((a) => a.status === 'approved').length;

  const handleOpenAssignModal = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    const currDoctor = assistant.assignedDoctor as any;
    setSelectedDoctorId(currDoctor?._id || (typeof currDoctor === 'string' ? currDoctor : ''));
  };

  const handleSaveDoctorAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistant) return;
    assignDoctorMutation.mutate({
      id: selectedAssistant._id,
      doctorId: selectedDoctorId || null,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete assistant account for "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0fdfa] relative overflow-hidden">
      <DnaBackground opacity={0.08} />
      <Topbar
        title="Assistant Management"
        subtitle="Review registration requests and assign doctors"
      />

      <div className="fade-in relative z-10 p-5 md:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0b151f] border border-[#A5ECEB]/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Assistants
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <Users size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#A5ECEB]" /> : totalCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Registered assistant portal accounts
            </div>
          </div>

          <div className="bg-[#0b151f] border border-[#A5ECEB]/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <Clock size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#A5ECEB]" />
              ) : (
                <>
                  <span>{pendingCount}</span>
                  {pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A5ECEB]/15 text-[#A5ECEB] border border-[#A5ECEB]/30 uppercase">
                      Action Required
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Assistant status: Pending
            </div>
          </div>

          <div className="bg-[#0b151f] border border-[#A5ECEB]/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Approved & Active
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <UserCheck size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#A5ECEB]" />
              ) : (
                approvedCount
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Authorized clinical assistants
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0b151f]/80 p-3 rounded-2xl border border-[#A5ECEB]/15">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assistants by name or email..."
              className="w-full bg-[#070d14] border border-[#A5ECEB]/20 rounded-xl pl-10 pr-9 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#A5ECEB]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#070d14] p-1 rounded-xl border border-[#A5ECEB]/15 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
              const active = statusFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#A5ECEB] text-[#070d14] shadow-[0_0_12px_rgba(165,236,235,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{tab}</span>
                  {tab === 'pending' && pendingCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-[#070d14] text-[#A5ECEB]' : 'bg-[#A5ECEB]/20 text-[#7DFDF0] border border-[#A5ECEB]/30'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Assistants Table ── */}
        <div className="glass-card overflow-hidden border border-[#A5ECEB]/20 rounded-2xl bg-[#0b151f]/90 shadow-2xl">
          {isLoading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#A5ECEB] mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading assistants registry...</p>
            </div>
          ) : !assistants.length ? (
            <div className="p-16 text-center">
              <UserCheck size={48} className="mx-auto text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-200">No assistants found</h3>
            </div>
          ) : (
            <>
              {/* ── Desktop Table View (>= md) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap">Assistant</th>
                      <th className="whitespace-nowrap">Status</th>
                      <th className="whitespace-nowrap">Assigned Doctor</th>
                      <th className="whitespace-nowrap">Registered</th>
                      <th className="whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistants.map((assistant) => {
                      const isPending = assistant.status === 'pending';
                      const isApproved = assistant.status === 'approved';
                      const isRejected = assistant.status === 'rejected';

                      const doctor = assistant.assignedDoctor as any;
                      const doctorName = doctor?.name ? `Dr. ${doctor.name}` : null;

                      return (
                        <tr key={assistant._id}>
                          {/* Assistant Profile */}
                          <td className="whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center font-bold text-[#A5ECEB] text-xs">
                                {assistant.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-200">
                                  {assistant.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {assistant.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="whitespace-nowrap">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#A5ECEB]/10 text-[#A5ECEB] border border-[#A5ECEB]/25">
                                <Clock size={12} />
                                <span>Pending</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#A5ECEB]/20 text-[#7DFDF0] border border-[#A5ECEB]/40">
                                <CheckCircle size={12} />
                                <span>Approved</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/60">
                                <XCircle size={12} />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* Assigned Doctor */}
                          <td className="whitespace-nowrap">
                            {doctorName ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-[#A5ECEB]/10 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                                  <Stethoscope size={13} />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-slate-200">
                                    {doctorName}
                                  </div>
                                  <div className="text-[11px] text-slate-400">
                                    {doctor?.specialization} &bull; {doctor?.hospital}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-[#A5ECEB]/15">
                                <AlertCircle size={12} className="text-[#A5ECEB]" />
                                <span>No doctor Assigned yet</span>
                              </div>
                            )}
                          </td>

                          {/* Registered Date */}
                          <td className="whitespace-nowrap text-xs text-slate-400">
                            {formatDate(assistant.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* If pending: Approve / Reject quick buttons */}
                              {isPending && (
                                <>
                                  <button
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: assistant._id,
                                        status: 'approved',
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-[#A5ECEB] text-[#070d14] hover:bg-[#8ee5e4] transition-all shadow-[0_0_10px_rgba(165,236,235,0.2)]"
                                    title="Approve assistant access"
                                  >
                                    <CheckCircle size={13} />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: assistant._id,
                                        status: 'rejected',
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100 border border-slate-700 transition-all"
                                    title="Reject assistant request"
                                  >
                                    <XCircle size={13} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}

                              {/* Assign Doctor Button (Available for approved assistants) */}
                              {isApproved && (
                                <button
                                  onClick={() => handleOpenAssignModal(assistant)}
                                  className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 hover:border-[#A5ECEB] transition-all"
                                  title="Assign doctor to manage"
                                >
                                  <Stethoscope size={13} />
                                  <span>{doctorName ? 'Change Doctor' : 'Assign Doctor'}</span>
                                </button>
                              )}

                              {/* Re-approve for rejected */}
                              {isRejected && (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: assistant._id,
                                      status: 'approved',
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-700 transition-all"
                                >
                                  Re-approve
                                </button>
                              )}

                              {/* Delete Assistant Button */}
                              <button
                                onClick={() => handleDelete(assistant._id, assistant.name)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60 transition-all"
                                title="Delete assistant account"
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

              {/* ── Mobile Card View (< md) ── */}
              <div className="block md:hidden p-3.5 space-y-3.5">
                {assistants.map((assistant) => {
                  const isPending = assistant.status === 'pending';
                  const isApproved = assistant.status === 'approved';
                  const isRejected = assistant.status === 'rejected';

                  const doctor = assistant.assignedDoctor as any;
                  const doctorName = doctor?.name ? `Dr. ${doctor.name}` : null;

                  return (
                    <div
                      key={assistant._id}
                      className="bg-[#070d14]/80 border border-[#A5ECEB]/20 rounded-xl p-4 space-y-3 shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center font-bold text-[#A5ECEB] text-sm flex-shrink-0">
                            {assistant.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-100 truncate">
                              {assistant.name}
                            </h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {assistant.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#A5ECEB]/10 text-[#A5ECEB] border border-[#A5ECEB]/25">
                              <Clock size={11} />
                              <span>Pending</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#A5ECEB]/20 text-[#7DFDF0] border border-[#A5ECEB]/40">
                              <CheckCircle size={11} />
                              <span>Approved</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700">
                              <XCircle size={11} />
                              <span>Rejected</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Row: Assigned Doctor & Registered Date */}
                      <div className="p-2.5 rounded-lg bg-[#0b151f] border border-[#A5ECEB]/10 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Assigned Doctor:</span>
                          {doctorName ? (
                            <span className="font-semibold text-[#A5ECEB] flex items-center gap-1">
                              <Stethoscope size={12} />
                              {doctorName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">No doctor Assigned yet</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Registered:</span>
                          <span className="text-slate-300">{formatDate(assistant.createdAt)}</span>
                        </div>
                      </div>

                      {/* Mobile Action Buttons */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#A5ECEB]/10">
                        {isPending && (
                          <>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: assistant._id,
                                  status: 'approved',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-[#A5ECEB] text-[#070d14] hover:bg-[#8ee5e4] transition-all"
                            >
                              <CheckCircle size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: assistant._id,
                                  status: 'rejected',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
                            >
                              <XCircle size={13} />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleOpenAssignModal(assistant)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 transition-all"
                          >
                            <Stethoscope size={13} />
                            <span>{doctorName ? 'Change Doctor' : 'Assign Doctor'}</span>
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: assistant._id,
                                status: 'approved',
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
                          >
                            Re-approve
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(assistant._id, assistant.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-700/60 transition-all"
                          title="Delete assistant account"
                          aria-label="Delete assistant"
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
      </div>

      {/* ── Assign Doctor Modal ── */}
      {selectedAssistant && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedAssistant(null)}
          style={{ zIndex: 70 }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[#A5ECEB]/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Assign Doctor to Assistant
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Managing patient authority for {selectedAssistant.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssistant(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDoctorAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Doctor
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="input-field w-full bg-[#070d14] border border-[#A5ECEB]/20 rounded-xl px-4 py-3 text-sm text-slate-100"
                >
                  <option value="">-- No Doctor Assigned (Unassigned) --</option>
                  {(doctorsData || []).map((doc: Doctor) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} — {doc.specialization} ({doc.hospital})
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#A5ECEB]/15">
                <button
                  type="button"
                  onClick={() => setSelectedAssistant(null)}
                  className="btn btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignDoctorMutation.isPending}
                  className="btn btn-primary px-5 py-2 text-xs flex items-center gap-1.5"
                >
                  {assignDoctorMutation.isPending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Assignment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Confirm Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
