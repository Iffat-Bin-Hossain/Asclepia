import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { PatientCondition } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, formatStr = 'MMM dd, yyyy'): string {
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(dateString: string): string {
  return formatDate(dateString, 'MMM dd, yyyy HH:mm');
}

/**
 * Returns inline style objects for condition badges matching Asclepia's
 * signature dark obsidian and cyan/slate palette (no clashing red/green).
 */
export const CONDITION_BADGE_STYLES: Record<PatientCondition, React.CSSProperties> = {
  Critical:            { background: 'rgba(165, 236, 235, 0.18)', color: '#f0fdfa', border: '1px solid rgba(165, 236, 235, 0.45)', fontWeight: 600 },
  Serious:             { background: 'rgba(165, 236, 235, 0.14)', color: '#A5ECEB', border: '1px solid rgba(165, 236, 235, 0.35)' },
  Stable:              { background: 'rgba(165, 236, 235, 0.10)', color: '#A5ECEB', border: '1px solid rgba(165, 236, 235, 0.25)' },
  Fair:                { background: 'rgba(103, 232, 249, 0.10)', color: '#67e8f9', border: '1px solid rgba(103, 232, 249, 0.22)' },
  Good:                { background: 'rgba(165, 236, 235, 0.08)', color: '#A5ECEB', border: '1px solid rgba(165, 236, 235, 0.20)' },
  Recovered:           { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.25)' },
  'Under Observation': { background: 'rgba(125, 253, 240, 0.10)', color: '#7DFDF0', border: '1px solid rgba(125, 253, 240, 0.22)' },
  Discharged:          { background: 'rgba(148, 163, 184, 0.10)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.20)' },
};

// Keep legacy string map for backward-compat (no longer applied as className)
export const CONDITION_COLORS: Record<PatientCondition, string> = {
  Critical:            'condition-critical',
  Serious:             'condition-serious',
  Stable:              'condition-stable',
  Fair:                'condition-fair',
  Good:                'condition-good',
  Recovered:           'condition-recovered',
  'Under Observation': 'condition-observation',
  Discharged:          'condition-discharged',
};

export const CONDITION_CHART_COLORS: Record<string, string> = {
  Critical:            '#7DFDF0',
  Serious:             '#A5ECEB',
  Stable:              '#38bdf8',
  Fair:                '#67e8f9',
  Good:                '#93c5fd',
  Recovered:           '#cbd5e1',
  'Under Observation': '#5eead4',
  Discharged:          '#64748b',
};

export const GENDER_CHART_COLORS: Record<string, string> = {
  Male:   '#3b82f6',
  Female: '#ec4899',
  Other:  '#8b5cf6',
};

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return axiosError.response?.data?.message || axiosError.message || 'An error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
