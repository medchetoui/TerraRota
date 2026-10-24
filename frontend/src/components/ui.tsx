import { useContext } from 'react';
import { AppContext } from '../App';

interface StepHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
}

export function StepHeader({ currentStep, totalSteps, title }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`step-dot ${i + 1 < currentStep ? 'done' : ''} ${i + 1 === currentStep ? 'active' : ''}`}
          />
        ))}
      </div>
      <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
        Étape {currentStep} / {totalSteps}
      </p>
      <h2 className="text-2xl font-bold">{title}</h2>
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
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1"
        style={{ color: 'var(--color-text)' }}
      >
        {label} {required && <span style={{ color: 'var(--color-terracotta)' }}>*</span>}
      </label>
      {children}
      {help && !error && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{help}</p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs mt-1"
          style={{ color: '#e05c28' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = [
  'w-full px-4 py-3 rounded-xl text-sm font-medium',
  'bg-opacity-50 focus:outline-none focus:ring-2',
  'transition-all',
].join(' ');

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--color-text)',
};

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
      className={inputClass}
      style={{
        ...inputStyle,
        borderColor: error ? 'rgba(224,92,40,0.5)' : 'rgba(255,255,255,0.12)',
      }}
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
      className={inputClass}
      style={{
        ...inputStyle,
        borderColor: error ? 'rgba(224,92,40,0.5)' : 'rgba(255,255,255,0.12)',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: '#162111' }}>
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
    <div className="flex gap-3 mt-8">
      {onBack && (
        <button
          id="back-btn"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          ← {t('backBtn')}
        </button>
      )}
      {onNext && (
        <button
          id={nextId}
          onClick={onNext}
          disabled={disabled}
          className="flex-2 flex-grow py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-light) 100%)',
            color: 'white',
            boxShadow: '0 4px 16px rgba(193,68,14,0.3)',
          }}
        >
          {nextLabel} →
        </button>
      )}
    </div>
  );
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
