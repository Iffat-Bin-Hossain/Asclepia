'use client';

import { useRef, useId } from 'react';
import { Search, Calendar, X } from 'lucide-react';

interface DateSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function DateSearchInput({
  value,
  onChange,
  placeholder = 'Search by name, details, or date (YYYY-MM-DD, DD/MM/YYYY)...',
  id,
  size = 'md',
  className = '',
}: DateSearchInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const datePickerRef = useRef<HTMLInputElement>(null);

  const isSmall = size === 'sm';

  // Check if current search matches standard date patterns
  const isDateQuery =
    /^\d{4}[-/.]\d{1,2}([-/.]\d{1,2})?$/.test(value.trim()) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(value.trim()) ||
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(value.trim());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onChange(e.target.value);
    }
  };

  const openDatePicker = () => {
    if (datePickerRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          datePickerRef.current.showPicker();
        } catch {
          datePickerRef.current.focus();
        }
      } else {
        datePickerRef.current.focus();
      }
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Left Search Icon */}
      <Search
        size={isSmall ? 14 : 16}
        className="absolute left-3 text-slate-400 pointer-events-none z-10"
      />

      {/* Main Text Input */}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0b151f] border border-[#A5ECEB]/20 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#A5ECEB] focus:ring-1 focus:ring-[#A5ECEB] transition-all"
        style={{
          height: isSmall ? '38px' : '44px',
          paddingLeft: isSmall ? '34px' : '40px',
          paddingRight: isSmall ? '76px' : '86px',
          fontSize: isSmall ? '13px' : '14px',
        }}
        placeholder={placeholder}
      />

      {/* Right Controls: Date Picker Trigger & Clear Button */}
      <div className="absolute right-2 flex items-center gap-1 z-10">
        {/* Hidden Native Date Input */}
        <input
          ref={datePickerRef}
          type="date"
          onChange={handleDateChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Date Picker Button */}
        <button
          type="button"
          onClick={openDatePicker}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            isDateQuery
              ? 'bg-[#A5ECEB]/20 text-[#A5ECEB] border border-[#A5ECEB]/40'
              : 'text-slate-400 hover:text-[#A5ECEB] hover:bg-slate-800/60'
          }`}
          title="Filter by date (Pick date)"
          aria-label="Pick date filter"
        >
          <Calendar size={isSmall ? 14 : 16} />
        </button>

        {/* Clear Search Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors flex items-center justify-center"
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={isSmall ? 14 : 16} />
          </button>
        )}
      </div>

      {/* Visual date indicator tag if date query active */}
      {isDateQuery && (
        <span
          className="absolute -top-5 right-2 text-[10px] font-semibold text-[#A5ECEB] bg-[#A5ECEB]/10 px-2 py-0.5 rounded-full border border-[#A5ECEB]/30 flex items-center gap-1 select-none pointer-events-none"
        >
          <span>Date Search Active</span>
        </span>
      )}
    </div>
  );
}
