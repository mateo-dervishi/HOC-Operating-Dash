import { requireAdmin } from "@/lib/admin/auth";
import { DashboardMetrics } from "@/types/admin";
import Link from "next/link";
import {
  Users,
  FileText,
  Package,
  CheckSquare,
  Clock,
  Truck,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";

function getMockMetrics(): DashboardMetrics {
  return {
    leadsThisWeek: 12,
    leadsThisMonth: 47,
    quotesNeedingResponse: 8,
    ordersInProgress: 15,
    revenueThisMonth: 124500, // Kept in type but not displayed
    overdueFollowUps: 3,
    totalClients: 156,
    deliveriesThisWeek: 6,
  };
}

function getMockTaskStats() {
  return {
    pendingTasks: 5,
    overdueTasks: 2,
    tasksCompletedToday: 3,
  };
}

export default async function DashboardPage() {
  const adminUser = await requireAdmin();
  const metrics = getMockMetrics();
  const taskStats = getMockTaskStats();

  const statCards = [
    {
      title: "Leads This Month",
      value: metrics.leadsThisMonth,
      subtitle: `${metrics.leadsThisWeek} this week`,
      icon: Users,
      href: "/dashboard/clients?stage=new_lead",
    },
    {
      title: "Quotes Pending",
      value: metrics.quotesNeedingResponse,
      subtitle: "Awaiting response",
      icon: FileText,
      href: "/dashboard/quotes?status=sent",
    },
    {
      title: "Active Orders",
      value: metrics.ordersInProgress,
      subtitle: "In progress",
      icon: Package,
      href: "/dashboard/orders?status=in_progress",
    },
    {
      title: "Pending Tasks",
      value: taskStats.pendingTasks,
      subtitle: taskStats.overdueTasks > 0 ? `${taskStats.overdueTasks} overdue` : "All on track",
      icon: CheckSquare,
      href: "/dashboard/tasks",
      alert: taskStats.overdueTasks > 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-white">Dashboard</h1>
        <p className="text-white/40 mt-1 font-light">
          Welcome back, {adminUser.name.split(" ")[0]}
        </p>
      </div>

      {/* Alerts */}
      {metrics.overdueFollowUps > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-light text-white">
              You have {metrics.overdueFollowUps} overdue follow-up
              {metrics.overdueFollowUps !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-white/40 font-light">
              These clients are waiting to hear from you
            </p>
          </div>
          <Link
            href="/dashboard/clients?filter=overdue"
            className="px-4 py-2 bg-white text-black text-sm font-light rounded-lg hover:bg-white/90 transition-colors"
          >
            View Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className={`rounded-xl p-6 border transition-all group ${
              stat.alert 
                ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10" 
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                stat.alert ? "bg-red-500/10" : "bg-white/10"
              }`}>
                <stat.icon className={`w-6 h-6 ${stat.alert ? "text-red-400" : "text-white"}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className={`text-3xl font-light ${stat.alert ? "text-red-400" : "text-white"}`}>{stat.value}</p>
            <p className="text-sm text-white/60 mt-1 font-light">{stat.title}</p>
            <p className={`text-xs mt-0.5 font-light ${stat.alert ? "text-red-400/60" : "text-white/40"}`}>{stat.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{metrics.totalClients}</p>
              <p className="text-xs text-white/40 font-light">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{metrics.deliveriesThisWeek}</p>
              <p className="text-xs text-white/40 font-light">Deliveries This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{metrics.overdueFollowUps}</p>
              <p className="text-xs text-white/40 font-light">Overdue Follow-ups</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{metrics.leadsThisWeek}</p>
              <p className="text-xs text-white/40 font-light">Leads This Week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
