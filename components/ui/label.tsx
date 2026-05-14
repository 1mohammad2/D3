interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={`block text-sm font-semibold text-slate-200 ${className ?? ''}`} {...props} />;
}
