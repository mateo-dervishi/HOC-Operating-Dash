"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  User,
  FileText,
  Package,
  Truck,
  Clock,
  AlertCircle,
  MessageSquare,
  Calendar,
  Trash2,
} from "lucide-react";

type NotificationType = "mention" | "assignment" | "follow_up_due" | "quote_expiring" | "order_update" | "delivery_scheduled" | "new_lead" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned in a note",
    message: "Sarah mentioned you in a note about the Richardson project: 'Need @Mateo to follow up on the tile selection...'",
    link: "/dashboard/clients/1",
    read: false,
    createdAt: "2024-01-22T10:30:00Z",
  },
  {
    id: "2",
    type: "follow_up_due",
    title: "Follow-up due today",
    message: "David Thompson - Scheduled follow-up is due today. Quote was sent 5 days ago.",
    link: "/dashboard/clients/3",
    read: false,
    createdAt: "2024-01-22T09:00:00Z",
  },
  {
    id: "3",
    type: "quote_expiring",
    title: "Quote expiring soon",
    message: "Quote QT-2024-002 for Sarah Mitchell expires in 2 days. Total value: £18,900",
    link: "/dashboard/quotes/2",
    read: false,
    createdAt: "2024-01-22T08:00:00Z",
  },
  {
    id: "4",
    type: "order_update",
    title: "Order items received",
    message: "3 items have been marked as received for order HOC-2024-003 (David Thompson)",
    link: "/dashboard/orders/3",
    read: true,
    createdAt: "2024-01-21T16:45:00Z",
  },
  {
    id: "5",
    type: "delivery_scheduled",
    title: "Delivery scheduled for tomorrow",
    message: "Delivery DEL-001 for James Richardson is scheduled for tomorrow, 9:00 AM - 12:00 PM",
    link: "/dashboard/deliveries",
    read: true,
    createdAt: "2024-01-21T14:30:00Z",
  },
  {
    id: "6",
    type: "new_lead",
    title: "New lead assigned to you",
    message: "Robert Taylor has been assigned to you. Property type: Residential renovation. Estimated value: £15,000",
    link: "/dashboard/clients/7",
    read: true,
    createdAt: "2024-01-21T11:00:00Z",
  },
  {
    id: "7",
    type: "assignment",
    title: "New client assigned",
    message: "Lisa Anderson has been assigned to you by Sarah. Priority: Normal",
    link: "/dashboard/clients/6",
    read: true,
    createdAt: "2024-01-20T15:20:00Z",
  },
  {
    id: "8",
    type: "system",
    title: "Weekly report ready",
    message: "Your weekly pipeline report is ready to view. 12 new leads, 5 quotes sent, £124,500 in orders.",
    link: "/dashboard/reports",
    read: true,
    createdAt: "2024-01-20T09:00:00Z",
  },
];

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bgColor: string }> = {
  mention: { icon: MessageSquare, color: "text-blue-600", bgColor: "bg-blue-100" },
  assignment: { icon: User, color: "text-purple-600", bgColor: "bg-purple-100" },
  follow_up_due: { icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100" },
  quote_expiring: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-100" },
  order_update: { icon: Package, color: "text-green-600", bgColor: "bg-green-100" },
  delivery_scheduled: { icon: Truck, color: "text-teal-600", bgColor: "bg-teal-100" },
  new_lead: { icon: User, color: "text-indigo-600", bgColor: "bg-indigo-100" },
  system: { icon: Bell, color: "text-gray-600", bgColor: "bg-gray-100" },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <div
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.read ? "bg-blue-50/50" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={`font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-3">
            {notification.link && (
              <a
                href={notification.link}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View Details →
              </a>
            )}
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark as read
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter(
    (n) => filter === "all" || !n.read
  );

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            filter === "unread"
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              filter === "unread" ? "bg-white/20" : "bg-blue-500 text-white"
            }`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

