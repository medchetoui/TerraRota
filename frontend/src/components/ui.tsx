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
    <div className="mb-8">
      {/* Visual Step Indicator */}
      <div className="flex items-center justify-between max-w-xl mx-auto mb-6">
        {steps.map((s, idx) => {
          const isDone = s.num < currentStep;
          const isActive = s.num === currentStep;

          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950'
                      : isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 shadow-md shadow-emerald-950/40'
                      : 'bg-white/5 text-slate-500 border border-white/10'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 hidden sm:block ${
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

      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1.5">{subtitle}</p>}
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
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-emerald-400">*</span>}
        </label>
        {help && !error && (
          <span className="text-[11px] text-slate-500">{help}</span>
        )}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs mt-1.5 text-rose-400 font-medium flex items-center gap-1">
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
      aria-describedby={error ? `${id}-error` : undefined}
      aria-invalid={!!error}
      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold bg-black/40 border text-slate-100 placeholder-slate-600 transition-all focus:outline-none focus:ring-2 ${
        error
          ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/20'
          : 'border-white/10 hover:border-white/20 focus:border-emerald-400 focus:ring-emerald-400/20'
      }`}
      {...rest}
    />
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`w-full px-4 py-3 rounded-xl text-sm font-semibold bg-[#0a110b] border text-slate-100 transition-all focus:outline-none focus:ring-2 cursor-pointer ${
        error
          ? 'border-rose-500/50 focus:border-rose-400 focus:ring-rose-500/20'
          : 'border-white/10 hover:border-white/20 focus:border-emerald-400 focus:ring-emerald-400/20'
      }`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0f1712] text-slate-100 py-2">
          {o.label}
        </option>
      ))}
    </select>
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
    <div className="flex items-center gap-3 mt-8">
      {onBack && (
        <button
          id="back-btn"
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backBtn')}</span>
        </button>
      )}
      {onNext && (
        <button
          id={nextId}
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="w-full max-w-3xl">
        {children}
      </div>
    </div>
  );
}
