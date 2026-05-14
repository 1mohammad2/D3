import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return <div className={clsx('rounded-[32px] border border-slate-700/80 bg-slate-950/70 p-6 shadow-glow', className)} {...props} />;
}
