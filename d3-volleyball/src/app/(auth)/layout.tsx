// ✅ فقط div wrapper — لا يوجد <html> أو <body> أبداً
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 40px, #fff 40px, #fff 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, #fff 40px, #fff 41px)
          `,
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight">
            D<span className="text-orange-500">3</span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Volleyball Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
