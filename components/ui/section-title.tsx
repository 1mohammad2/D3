interface SectionTitleProps {
  title: string;
  subtitle: string;
}

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm uppercase tracking-[0.2em] text-orange-400">D3 platform</p>
      <h2 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      <p className="max-w-2xl text-slate-300">{subtitle}</p>
    </div>
  );
}
