import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 24 }: { size?: number }) {
  return <Loader2 className="animate-spin text-primary-500" size={size} />;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-600/20',
    secondary: 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 shadow-sm',
    ghost: 'hover:bg-neutral-100 text-neutral-600',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-7 py-3.5 text-base rounded-xl',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-neutral-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
