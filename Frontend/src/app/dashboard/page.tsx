'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, doctorApi, patientApi, assistantApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Topbar from '@/components/layout/Topbar';
import DnaBackground from '@/components/ui/DnaBackground';
import Link from 'next/link';
import {
  Stethoscope, Users, UserCheck, Plus, ArrowUpRight,
  Phone, Mail, Loader2, AlertTriangle, Building, ShieldCheck, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, isAssistant, assignedDoctor, refreshProfile } = useAuth();

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      const res = await analyticsApi.getDashboard();
      return res.data.data;
    },
    staleTime: 5 * 1000,
    refetchInterval: isAssistant ? 6000 : false,
  });

  // Active doctor for assistant (from analytics payload).
  // If backend reports noDoctorAssigned, previous doctor info is completely wiped immediately.
  const assistantDoctor = isAssistant
    ? (analytics?.noDoctorAssigned
        ? null
        : (analytics?.assignedDoctor !== undefined
            ? analytics.assignedDoctor
            : (isAnalyticsLoading ? assignedDoctor : null)))
    : null;
  const isNoDoctorAssigned = isAssistant && (!assistantDoctor || !!analytics?.noDoctorAssigned);

  // Sync profile if doctor reassignment occurs on backend
  useEffect(() => {
    if (isAssistant && analytics) {
      const serverDocId = analytics.noDoctorAssigned ? null : (analytics.assignedDoctor?._id || analytics.assignedDoctor);
      const localDocId = (assignedDoctor as any)?._id || assignedDoctor;
      if (serverDocId !== localDocId) {
        refreshProfile();
      }
    }
  }, [isAssistant, analytics, assignedDoctor, refreshProfile]);

  const { data: doctorsData, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['doctors-recent'],
    queryFn: async () => {
      const res = await doctorApi.getAll({ limit: 5 });
      return res.data;
    },
    enabled: isAdmin,
    staleTime: 30 * 1000,
  });

  const { data: patientsData, isLoading: isPatientsLoading } = useQuery({
    queryKey: ['patients-recent', isAssistant ? (assistantDoctor?._id || 'unassigned') : 'all'],
    queryFn: async () => {
      if (isAssistant && isNoDoctorAssigned) {
        return { data: [], pagination: { total: 0 } };
      }
      const res = await patientApi.getAll({ limit: 5 });
      return res.data;
    },
    enabled: !isNoDoctorAssigned,
    staleTime: 5 * 1000,
    refetchInterval: isAssistant ? 6000 : false,
  });

  const { data: assistantsData } = useQuery({
    queryKey: ['assistants-count'],
    queryFn: async () => {
      const res = await assistantApi.getAll();
      return res.data.data || [];
    },
    enabled: isAdmin,
    staleTime: 30 * 1000,
  });

  const isLoading = isAnalyticsLoading || (isAdmin && isDoctorsLoading) || (isPatientsLoading && !isNoDoctorAssigned);

  const totalDoctors = analytics?.overview?.totalDoctors ?? (doctorsData?.pagination?.total ?? 0);
  const totalPatients = isNoDoctorAssigned ? 0 : (analytics?.overview?.totalPatients ?? (patientsData?.pagination?.total ?? 0));
  const doctorsList = doctorsData?.data || [];
  const patientsList = isNoDoctorAssigned ? [] : (patientsData?.data || analytics?.recent?.patients || []);

  const pendingAssistantsCount = assistantsData?.filter((a: any) => a.status === 'pending').length ?? 0;
  const totalAssistantsCount = assistantsData?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#070d14] text-[#f0fdfa] relative overflow-hidden">
      <DnaBackground opacity={0.08} />
      <Topbar
        title={isAssistant ? "Assistant Workspace" : "Clinical Operations Dashboard"}
        subtitle={isAssistant ? "Assistant Clinical Portal" : "Asclepia Admin Portal"}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 sm:space-y-6 relative z-10">

        {/* ── ASSISTANT UNASSIGNED STATE (Bare minimum info) ── */}
        {isNoDoctorAssigned && (
          <div className="bg-[#0b151f]/85 border border-[#A5ECEB]/25 rounded-2xl p-6 backdrop-blur-md text-center max-w-md mx-auto space-y-2.5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#f0fdfa]">
              No Doctor Assigned
            </h2>
            <p className="text-xs text-slate-400">
              Awaiting doctor assignment by administrator.
            </p>
          </div>
        )}

        {/* ── ASSISTANT ASSIGNED DOCTOR BANNER ── */}
        {isAssistant && assistantDoctor && (
          <div className="bg-[#0b151f]/85 border border-[#A5ECEB]/25 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB] flex-shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#f0fdfa]">
                  Dr. {assistantDoctor.name.replace('Dr. ', '')}
                </h2>
                <p className="text-xs text-[#A5ECEB] font-medium mt-0.5">
                  {assistantDoctor.specialization} {assistantDoctor.hospital ? `• ${assistantDoctor.hospital}` : ''}
                </p>
              </div>
            </div>

            <Link
              href="/patients"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold text-[#070d14] bg-[#A5ECEB] hover:bg-[#8ee5e4] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admit Patient</span>
            </Link>
          </div>
        )}

        {/* ── TOP STATS CARDS ── */}
        <div className={`grid gap-4 ${isAdmin ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Doctors Card (Admin only) */}
          {isAdmin && (
            <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Doctors Directory
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-[#f0fdfa] mt-1.5 tracking-tight">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#A5ECEB]" /> : totalDoctors}
                </p>
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-1 text-[11px] text-[#A5ECEB] hover:text-[#7DFDF0] mt-2 font-medium"
                >
                  <span>View Doctors Directory</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>
          )}

          {/* Patients Card */}
          <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {isAssistant ? 'Assigned Patients' : 'Total Patients'}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#f0fdfa] mt-1.5 tracking-tight">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#A5ECEB]" /> : totalPatients}
              </p>
              <Link
                href="/patients"
                className="inline-flex items-center gap-1 text-[11px] text-[#A5ECEB] hover:text-[#7DFDF0] mt-2 font-medium"
              >
                <span>View Patient Registry</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#A5ECEB]/15 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
              <Users className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>

          {/* Assistants Card (Admin only) */}
          {isAdmin && (
            <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Assistants
                  </p>
                  {pendingAssistantsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#A5ECEB]/15 text-[#A5ECEB] border border-[#A5ECEB]/30">
                      {pendingAssistantsCount} Pending
                    </span>
                  )}
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#f0fdfa] mt-1.5 tracking-tight">
                  {totalAssistantsCount}
                </p>
                <Link
                  href="/assistants"
                  className="inline-flex items-center gap-1 text-[11px] text-[#A5ECEB] hover:text-[#7DFDF0] mt-2 font-medium"
                >
                  <span>Manage Assistants</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#A5ECEB]/10 border border-[#A5ECEB]/30 flex items-center justify-center text-[#A5ECEB]">
                <UserCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            </div>
          )}
        </div>

        {/* ── ADMIN OPERATIONAL ACTIONS ── */}
        {isAdmin && (
          <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f0fdfa] tracking-tight">
                Administrative Operations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized registry controls for clinical doctors, patients, and staff.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Link
                href="/doctors"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-[#070d14] bg-[#A5ECEB] hover:bg-[#8ee5e4] transition-all shadow-[0_0_15px_rgba(165,236,235,0.2)]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Doctor</span>
              </Link>

              <Link
                href="/patients"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 hover:bg-[#A5ECEB]/20 border border-[#A5ECEB]/30 hover:border-[#A5ECEB] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Admit Patient</span>
              </Link>

              <Link
                href="/assistants"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all"
              >
                <UserCheck className="w-4 h-4 text-[#A5ECEB]" />
                <span>Assistants</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── OPERATIONAL LISTS ── */}
        <div className={`grid gap-6 ${isAdmin ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Recent Doctors (Admin Only) */}
          {isAdmin && (
            <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#f0fdfa] tracking-wide">
                      Doctors Directory
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Registered clinical doctors
                    </p>
                  </div>
                  <Link
                    href="/doctors"
                    className="text-xs text-[#A5ECEB] hover:underline font-medium"
                  >
                    View All &rarr;
                  </Link>
                </div>

                {doctorsList.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#A5ECEB]/15 rounded-xl bg-[#070d14]/40">
                    <Stethoscope className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No doctors added to registry yet.</p>
                    <Link
                      href="/doctors"
                      className="inline-flex items-center gap-1.5 text-xs text-[#A5ECEB] font-semibold mt-2 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register First Doctor</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {doctorsList.map((doc: any) => (
                      <div
                        key={doc._id}
                        className="p-3.5 rounded-xl bg-[#070d14]/60 border border-[#A5ECEB]/10 flex items-center justify-between hover:border-[#A5ECEB]/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#A5ECEB]/10 border border-[#A5ECEB]/25 flex items-center justify-center text-[#A5ECEB] font-bold text-xs">
                            {doc.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#f0fdfa]">{doc.name}</p>
                            <p className="text-[11px] text-[#A5ECEB]/70">{doc.specialization}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-950/60 text-[#A5ECEB] border border-cyan-500/20">
                            {doc.patientCount || 0} Patients
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Patients */}
          <div className="bg-[#0b151f]/80 border border-[#A5ECEB]/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#f0fdfa] tracking-wide">
                    {isAssistant ? 'Assigned Patients' : 'Patient Registry'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admitted patients under active care
                  </p>
                </div>
                <Link
                  href="/patients"
                  className="text-xs text-[#A5ECEB] hover:underline font-medium"
                >
                  View All &rarr;
                </Link>
              </div>

              {patientsList.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#A5ECEB]/15 rounded-xl bg-[#070d14]/40">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    {isNoDoctorAssigned ? 'No doctor assigned to manage patients.' : 'No patients registered in database yet.'}
                  </p>
                  {!isNoDoctorAssigned && (
                    <Link
                      href="/patients"
                      className="inline-flex items-center gap-1.5 text-xs text-[#A5ECEB] font-semibold mt-2 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Admit First Patient</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patientsList.map((pt: any) => (
                    <div
                      key={pt._id}
                      className="p-3.5 rounded-xl bg-[#070d14]/60 border border-[#A5ECEB]/10 flex items-center justify-between hover:border-[#A5ECEB]/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#A5ECEB]/10 border border-[#A5ECEB]/25 flex items-center justify-center text-[#A5ECEB] font-bold text-xs">
                          {pt.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#f0fdfa]">{pt.name}</p>
                          <p className="text-[11px] text-slate-400">
                            Age: {pt.age} &bull; {pt.gender}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#070d14] text-slate-300 border border-slate-700/50">
                          {pt.condition || 'General'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

