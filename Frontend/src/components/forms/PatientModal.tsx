'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorApi } from '@/lib/api';
import { Patient, PatientCondition } from '@/types';
import { X, Loader2, UserPlus } from 'lucide-react';

const CONDITIONS: PatientCondition[] = [
  'Critical',
  'Serious',
  'Stable',
  'Fair',
  'Good',
  'Recovered',
  'Under Observation',
  'Discharged',
];

export interface PatientModalProps {
  patient?: Patient | null;
  onClose: () => void;
  onSave: (data: Partial<Patient>) => void;
  isSaving: boolean;
  hideAssignedDoctor?: boolean;
  defaultDoctorId?: string;
  doctorName?: string;
  isStacked?: boolean;
}

export default function PatientModal({
  patient,
  onClose,
  onSave,
  isSaving,
  hideAssignedDoctor = false,
  defaultDoctorId,
  doctorName,
  isStacked = false,
}: PatientModalProps) {
  const [form, setForm] = useState<Partial<Patient>>(() => {
    if (patient) {
      return {
        ...patient,
        assignedDoctor:
          typeof patient.assignedDoctor === 'object'
            ? (patient.assignedDoctor as any)?._id
            : patient.assignedDoctor || defaultDoctorId || '',
      };
    }
    return {
      name: '',
      age: undefined,
      gender: 'Male',
      condition: 'Stable',
      phone: '',
      email: '',
      address: '',
      diagnosis: '',
      notes: '',
      admissionDate: new Date().toISOString().split('T')[0],
      assignedDoctor: defaultDoctorId || '',
    };
  });

  // Load doctors for dropdown only if assignedDoctor is not hidden
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list-dropdown'],
    queryFn: async () => {
      const res = await doctorApi.getAll({ limit: 100 });
      return res.data.data;
    },
    enabled: !hideAssignedDoctor,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (defaultDoctorId && !form.assignedDoctor) {
      setForm((prev) => ({ ...prev, assignedDoctor: defaultDoctorId }));
    }
  }, [defaultDoctorId, form.assignedDoctor]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value === '' ? undefined : parseInt(value, 10)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = { ...form };
    if (hideAssignedDoctor && defaultDoctorId) {
      submissionData.assignedDoctor = defaultDoctorId;
    } else if (!submissionData.assignedDoctor) {
      submissionData.assignedDoctor = null as any;
    }
    onSave(submissionData);
  };

  const isStackedModal = isStacked || hideAssignedDoctor;

  return (
    <div
      className={isStackedModal ? 'modal-overlay-stacked' : 'modal-overlay'}
      style={{ zIndex: isStackedModal ? 85 : 50 }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '640px', position: 'relative', zIndex: isStackedModal ? 90 : 51 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(165, 236, 235, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)',
                }}
              >
                <UserPlus size={18} />
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                {patient ? 'Edit Patient' : 'Add New Patient'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4"
        >
          {/* Row 1: Name, Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Full Name *
              </label>
              <input
                id="patient-name-input"
                name="name"
                value={form.name || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Alice Smith"
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Age *
              </label>
              <input
                id="patient-age-input"
                name="age"
                type="number"
                value={form.age ?? ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 35"
                min={0}
                max={150}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Gender *
              </label>
              <select
                id="patient-gender-select"
                name="gender"
                value={form.gender || 'Male'}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2: Condition & (optional) Assigned Doctor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Clinical Condition *
              </label>
              <select
                id="patient-condition-select"
                name="condition"
                value={form.condition || 'Stable'}
                onChange={handleChange}
                className="input-field"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* ONLY rendered when NOT inside a doctor view */}
            {!hideAssignedDoctor ? (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Assigned Doctor
                </label>
                <select
                  id="patient-assigned-doctor-select"
                  name="assignedDoctor"
                  value={(form.assignedDoctor as string) || ''}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">— None (Unassigned) —</option>
                  {doctorsData?.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Admission Date
                </label>
                <input
                  id="patient-admission-date-input"
                  name="admissionDate"
                  type="date"
                  value={
                    form.admissionDate
                      ? new Date(form.admissionDate).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Row 3: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Phone
              </label>
              <input
                id="patient-phone-input"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="+1-555-0199 or 018..."
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Email
              </label>
              <input
                id="patient-email-input"
                name="email"
                type="email"
                value={form.email || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="patient@example.com"
              />
            </div>
          </div>

          {/* Row 4: Diagnosis & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Primary Diagnosis
              </label>
              <input
                id="patient-diagnosis-input"
                name="diagnosis"
                value={form.diagnosis || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Acute appendicitis"
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}
              >
                Address
              </label>
              <input
                id="patient-address-input"
                name="address"
                value={form.address || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. 742 Evergreen Terrace"
              />
            </div>
          </div>

          {/* Row 5: Notes */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}
            >
              Clinical Notes
            </label>
            <textarea
              id="patient-notes-input"
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              className="input-field"
              placeholder="Allergies, previous procedures, current medications..."
              rows={2}
              style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />{' '}
                  Saving...
                </>
              ) : patient ? (
                'Update Patient'
              ) : (
                'Add Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
