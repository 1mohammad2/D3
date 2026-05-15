import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";

/**
 * Dashboard Layout — wraps all /admin pages.
 * Double-checks authentication server-side (middleware is first line of defense).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Extra safety check (middleware should catch this first)
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
