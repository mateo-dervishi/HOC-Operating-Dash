import { requireAdmin } from "@/lib/admin/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await requireAdmin();

  return (
    <div className="min-h-screen bg-black">
      <Sidebar adminUser={adminUser} unreadNotifications={3} />

      {/* Main Content */}
      <main className="lg:pl-[280px] min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
