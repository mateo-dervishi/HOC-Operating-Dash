"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Filter,
  MoreHorizontal,
  User,
  Package,
  FileText,
  Truck,
  AlertCircle,
  Clock,
  Trash2,
} from "lucide-react";

type NotificationType = "lead" | "quote" | "order" | "delivery" | "reminder" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedTo?: {
    type: "client" | "order" | "quote" | "delivery";
    id: string;
    name: string;
  };
  actionUrl?: string;
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  lead: User,
  quote: FileText,
  order: Package,
  delivery: Truck,
  reminder: Clock,
  system: AlertCircle,
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "lead",
    title: "New Lead",
    message: "James Richardson submitted a selection request",
    read: false,
    createdAt: "2 hours ago",
    relatedTo: { type: "client", id: "1", name: "James Richardson" },
    actionUrl: "/dashboard/clients",
  },
  {
    id: "2",
    type: "quote",
    title: "Quote Viewed",
    message: "Sarah Mitchell viewed quote Q-2024-002",
    read: false,
    createdAt: "5 hours ago",
    relatedTo: { type: "quote", id: "2", name: "Q-2024-002" },
    actionUrl: "/dashboard/quotes",
  },
  {
    id: "3",
    type: "reminder",
    title: "Follow-up Reminder",
    message: "Follow up with David Thompson about pending quote",
    read: false,
    createdAt: "1 day ago",
    relatedTo: { type: "client", id: "3", name: "David Thompson" },
    actionUrl: "/dashboard/clients",
  },
  {
    id: "4",
    type: "delivery",
    title: "Delivery Completed",
    message: "Order HOC-2024-004 successfully delivered to Emma Wilson",
    read: true,
    createdAt: "1 day ago",
    relatedTo: { type: "delivery", id: "4", name: "HOC-2024-004" },
    actionUrl: "/dashboard/deliveries",
  },
  {
    id: "5",
    type: "order",
    title: "Order Status Updated",
    message: "Order HOC-2024-003 moved to Quality Check",
    read: true,
    createdAt: "2 days ago",
    relatedTo: { type: "order", id: "3", name: "HOC-2024-003" },
    actionUrl: "/dashboard/orders",
  },
  {
    id: "6",
    type: "system",
    title: "Weekly Report Ready",
    message: "Your weekly sales report is ready to view",
    read: true,
    createdAt: "3 days ago",
  },
  {
    id: "7",
    type: "quote",
    title: "Quote Expiring",
    message: "Quote Q-2024-001 expires in 2 days",
    read: true,
    createdAt: "3 days ago",
    relatedTo: { type: "quote", id: "1", name: "Q-2024-001" },
    actionUrl: "/dashboard/quotes",
  },
  {
    id: "8",
    type: "delivery",
    title: "Delivery Failed",
    message: "Delivery for order HOC-2024-005 failed - no one home",
    read: true,
    createdAt: "4 days ago",
    relatedTo: { type: "delivery", id: "5", name: "HOC-2024-005" },
    actionUrl: "/dashboard/deliveries",
  },
];

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = NOTIFICATION_ICONS[notification.type];

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
        notification.read
          ? "bg-white/5 border-white/5"
          : "bg-white/10 border-white/10"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        notification.read ? "bg-white/5" : "bg-white/10"
      }`}>
        <Icon className={`w-5 h-5 ${notification.read ? "text-white/40" : "text-white"}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`font-light ${notification.read ? "text-white/60" : "text-white"}`}>
              {notification.title}
            </p>
            <p className={`text-sm font-light mt-0.5 ${notification.read ? "text-white/40" : "text-white/60"}`}>
              {notification.message}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4 text-white/40" />
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-white/40" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-white/30 font-light">{notification.createdAt}</span>
          {notification.relatedTo && (
            <a
              href={notification.actionUrl}
              className="text-xs text-white/60 hover:text-white font-light underline underline-offset-2"
            >
              View {notification.relatedTo.name}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Notifications</h1>
          <p className="text-white/40 mt-1 font-light">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light"
          >
            <Trash2 className="w-4 h-4" />
            Clear all
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-light transition-colors ${
              filter === "all"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-md text-sm font-light transition-colors ${
              filter === "unread"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as NotificationType | "all")}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="all">All types</option>
          <option value="lead">Leads</option>
          <option value="quote">Quotes</option>
          <option value="order">Orders</option>
          <option value="delivery">Deliveries</option>
          <option value="reminder">Reminders</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Bell className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40 font-light">No notifications</p>
        </div>
      )}
    </div>
  );
}
