import React, { useContext } from 'react';
import { AppContext } from '../App';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
}

export function StepHeader({ currentStep, totalSteps, title, subtitle }: StepHeaderProps) {
  const steps = [
    { num: 1, label: 'Localisation' },
    { num: 2, label: 'Parcelle & Sols' },
    { num: 3, label: 'Vérification' },
  ];

  return (
    <div className="mb-6 w-full">
      {/* Visual Step Indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-5">
        {steps.map((s, idx) => {
          const isDone = s.num < currentStep;
          const isActive = s.num === currentStep;

          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-950'
                      : isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400 shadow-sm shadow-emerald-950/40'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1 hidden sm:block ${
                    isActive ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${
                    idx + 1 < currentStep ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">{subtitle}</p>}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  help?: string;
  id: string;
}

export function FormField({ label, error, children, required, help, id }: FormFieldProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-emerald-400">*</span>}
        </label>
        {help && !error && (
          <span className="text-[10px] text-slate-500">{help}</span>
        )}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs mt-1 text-rose-400 font-medium flex items-center gap-1">
          <span>•</span> {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  ...rest
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  [key: string]: unknown;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-black/40 border transition-all text-slate-100 placeholder-slate-600 focus:outline-none ${
        error
          ? 'border-rose-500/50 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20'
          : 'border-white/10 hover:border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
      }`}
      {...rest}
    />
  );
}

export function SelectInput<T extends string>({
  id,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  error?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#0a110b] border transition-all text-slate-100 focus:outline-none ${
        error
          ? 'border-rose-500/50 focus:border-rose-400'
          : 'border-white/10 hover:border-white/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
      }`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-[#0f1712] text-slate-200">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              isSelected
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface NavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextId?: string;
  disabled?: boolean;
}

export function NavButtons({ onBack, onNext, nextLabel = 'Suivant', nextId = 'next-btn', disabled }: NavButtonsProps) {
  const { t } = useContext(AppContext);
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        {onBack && (
          <button
            id="back-btn"
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('backBtn')}</span>
          </button>
        )}
      </div>
      <div>
        {onNext && (
          <button
            id={nextId}
            type="button"
            onClick={onNext}
            disabled={disabled}
            className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-slate-950 inline-flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-[calc(100vh-5rem)] px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <div className="w-full max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  );
}
