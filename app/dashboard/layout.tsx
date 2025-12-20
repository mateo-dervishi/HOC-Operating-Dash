import { requireAdmin } from "@/lib/admin/auth";
import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect if not an admin
  const adminUser = await requireAdmin();

  // Get unread notification count (with error handling)
  let notificationCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("team_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", adminUser.id)
      .eq("read", false);
    notificationCount = count || 0;
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar adminUser={adminUser} unreadNotifications={notificationCount} />

      {/* Main Content */}
      <main className="lg:pl-[280px] min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

