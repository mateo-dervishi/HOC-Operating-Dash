import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardMetrics } from "@/types/admin";
import Link from "next/link";
import {
  Users,
  FileText,
  Package,
  TrendingUp,
  Clock,
  Truck,
  AlertCircle,
  ArrowRight,
  Calendar,
} from "lucide-react";

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get leads this week
  const { count: leadsThisWeek } = await supabase
    .from("client_pipeline")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfWeek.toISOString());

  // Get leads this month
  const { count: leadsThisMonth } = await supabase
    .from("client_pipeline")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  // Get quotes needing response
  const { count: quotesNeedingResponse } = await supabase
    .from("quotes")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent");

  // Get orders in progress
  const { count: ordersInProgress } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .not("status", "in", '("completed","cancelled","delivered")');

  // Get revenue this month
  const { data: revenueData } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "completed")
    .gte("completed_at", startOfMonth.toISOString());

  const revenueThisMonth =
    revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Get overdue follow-ups
  const { count: overdueFollowUps } = await supabase
    .from("client_pipeline")
    .select("*", { count: "exact", head: true })
    .lt("next_follow_up", now.toISOString())
    .not("stage", "in", '("complete","lost")');

  // Get total clients
  const { count: totalClients } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get deliveries this week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const { count: deliveriesThisWeek } = await supabase
    .from("deliveries")
    .select("*", { count: "exact", head: true })
    .gte("scheduled_date", startOfWeek.toISOString().split("T")[0])
    .lte("scheduled_date", endOfWeek.toISOString().split("T")[0]);

  return {
    leadsThisWeek: leadsThisWeek || 0,
    leadsThisMonth: leadsThisMonth || 0,
    quotesNeedingResponse: quotesNeedingResponse || 0,
    ordersInProgress: ordersInProgress || 0,
    revenueThisMonth,
    overdueFollowUps: overdueFollowUps || 0,
    totalClients: totalClients || 0,
    deliveriesThisWeek: deliveriesThisWeek || 0,
  };
}

export default async function DashboardPage() {
  const adminUser = await requireAdmin();
  const metrics = await getDashboardMetrics();

  const statCards = [
    {
      title: "Leads This Month",
      value: metrics.leadsThisMonth,
      subtitle: `${metrics.leadsThisWeek} this week`,
      icon: Users,
      color: "bg-blue-500",
      href: "/dashboard/clients?stage=new_lead",
    },
    {
      title: "Quotes Pending",
      value: metrics.quotesNeedingResponse,
      subtitle: "Awaiting response",
      icon: FileText,
      color: "bg-amber-500",
      href: "/dashboard/quotes?status=sent",
    },
    {
      title: "Active Orders",
      value: metrics.ordersInProgress,
      subtitle: "In progress",
      icon: Package,
      color: "bg-purple-500",
      href: "/dashboard/orders?status=in_progress",
    },
    {
      title: "Revenue (Month)",
      value: `£${metrics.revenueThisMonth.toLocaleString("en-GB")}`,
      subtitle: new Date().toLocaleDateString("en-GB", { month: "long" }),
      icon: TrendingUp,
      color: "bg-green-500",
      href: "/dashboard/orders?status=completed",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {adminUser.name.split(" ")[0]}
        </p>
      </div>

      {/* Alerts */}
      {metrics.overdueFollowUps > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-800">
              You have {metrics.overdueFollowUps} overdue follow-up
              {metrics.overdueFollowUps !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-red-600">
              These clients are waiting to hear from you
            </p>
          </div>
          <Link
            href="/dashboard/clients?filter=overdue"
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
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
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
          </Link>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-lg font-semibold">{metrics.totalClients}</p>
              <p className="text-xs text-gray-500">Total Clients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-lg font-semibold">{metrics.deliveriesThisWeek}</p>
              <p className="text-xs text-gray-500">Deliveries This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-lg font-semibold">{metrics.overdueFollowUps}</p>
              <p className="text-xs text-gray-500">Overdue Follow-ups</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-lg font-semibold">{metrics.leadsThisWeek}</p>
              <p className="text-xs text-gray-500">Leads This Week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

