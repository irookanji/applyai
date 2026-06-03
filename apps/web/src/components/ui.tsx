import type { ApplicationStatus } from '@applyai/shared';
import { statusLabels } from '@applyai/shared';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: ButtonVariant;
};

const variantClasses: Readonly<Record<ButtonVariant, string>> = {
  primary: 'bg-primary text-white hover:bg-blue-700',
  secondary: 'border border-border bg-surface text-ink hover:bg-neutral-soft',
  ghost: 'text-muted hover:bg-neutral-soft',
};

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeProps = {
  readonly status: ApplicationStatus;
};

const badgeClasses: Readonly<Record<ApplicationStatus, string>> = {
  applied: 'bg-primary-soft text-primary',
  interview: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
  no_response: 'bg-neutral-soft text-muted',
};

export function Badge({ status }: BadgeProps) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

type CardProps = {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly selected?: boolean;
  readonly onClick?: () => void;
};

export function Card({ children, className = '', selected = false, onClick }: CardProps) {
  const cardClassName = `rounded-2xl border bg-surface p-4 text-left transition ${selected ? 'border-primary bg-primary-soft shadow-sm' : 'border-border hover:border-primary/40'} ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {children}
      </button>
    );
  }

  return <div className={cardClassName}>{children}</div>;
}

type FilterPillProps = {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
};

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-ink text-surface' : 'bg-neutral-soft text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

type StatCardProps = {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'default' | 'success' | 'danger' | 'muted';
};

const toneClasses: Readonly<Record<NonNullable<StatCardProps['tone']>, string>> = {
  default: 'text-ink',
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-muted',
};

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className={`text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

type TextAreaFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly rows?: number;
};

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
}: TextAreaFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 outline-none focus:border-primary"
      />
    </label>
  );
}

type InputFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly type?: string;
};

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: InputFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

export function ErrorBanner({ message }: { readonly message: string }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function WarningBanner({ message }: { readonly message: string }) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm text-warning-text">
      {message}
    </div>
  );
}

export function LoadingState({ message }: { readonly message: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
