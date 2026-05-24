import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      {/*
        pt-14 = compensates for the fixed mobile top bar (h-14)
        lg:pt-0 = on desktop the bar doesn't exist so no padding needed
      */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
