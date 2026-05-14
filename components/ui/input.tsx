import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20',
        className
      )}
      {...props}
    />
  );
}
