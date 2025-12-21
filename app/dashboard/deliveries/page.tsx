"use client";

import { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Calendar,
  MapPin,
  Phone,
  User,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

type DeliveryStatus = "scheduled" | "confirmed" | "out_for_delivery" | "delivered" | "failed" | "rescheduled";

interface Delivery {
  id: string;
  deliveryNumber: string;
  orderNumber: string;
  clientName: string;
  address: string;
  contactPhone: string;
  scheduledDate: string;
  timeWindow: string;
  status: DeliveryStatus;
  itemCount: number;
  notes?: string;
}

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "1",
    deliveryNumber: "DEL-001",
    orderNumber: "HOC-2024-001",
    clientName: "James Richardson",
    address: "42 Kensington Gardens, London W8 4PX",
    contactPhone: "020 7123 4567",
    scheduledDate: "2024-01-25",
    timeWindow: "9:00 AM - 12:00 PM",
    status: "confirmed",
    itemCount: 8,
    notes: "Ring doorbell twice. Building has service entrance.",
  },
  {
    id: "2",
    deliveryNumber: "DEL-002",
    orderNumber: "HOC-2024-002",
    clientName: "Sarah Mitchell",
    address: "15 Chelsea Manor, London SW3 5RZ",
    contactPhone: "020 8234 5678",
    scheduledDate: "2024-01-25",
    timeWindow: "2:00 PM - 5:00 PM",
    status: "scheduled",
    itemCount: 5,
  },
  {
    id: "3",
    deliveryNumber: "DEL-003",
    orderNumber: "HOC-2024-003",
    clientName: "David Thompson",
    address: "78 Mayfair Place, London W1K 6JP",
    contactPhone: "07700 900123",
    scheduledDate: "2024-01-26",
    timeWindow: "10:00 AM - 1:00 PM",
    status: "scheduled",
    itemCount: 12,
    notes: "Large items - requires two person lift",
  },
  {
    id: "4",
    deliveryNumber: "DEL-004",
    orderNumber: "HOC-2024-004",
    clientName: "Emma Wilson",
    address: "23 Notting Hill Gate, London W11 3JQ",
    contactPhone: "07700 900456",
    scheduledDate: "2024-01-24",
    timeWindow: "9:00 AM - 12:00 PM",
    status: "delivered",
    itemCount: 3,
  },
  {
    id: "5",
    deliveryNumber: "DEL-005",
    orderNumber: "HOC-2024-005",
    clientName: "Michael Brown",
    address: "56 Belgravia Square, London SW1X 8PH",
    contactPhone: "020 7456 7890",
    scheduledDate: "2024-01-27",
    timeWindow: "1:00 PM - 4:00 PM",
    status: "scheduled",
    itemCount: 6,
  },
];

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string; bgColor: string }> = {
  scheduled: { label: "Scheduled", color: "text-blue-600", bgColor: "bg-blue-100" },
  confirmed: { label: "Confirmed", color: "text-green-600", bgColor: "bg-green-100" },
  out_for_delivery: { label: "Out for Delivery", color: "text-purple-600", bgColor: "bg-purple-100" },
  delivered: { label: "Delivered", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  failed: { label: "Failed", color: "text-red-600", bgColor: "bg-red-100" },
  rescheduled: { label: "Rescheduled", color: "text-orange-600", bgColor: "bg-orange-100" },
};

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const config = STATUS_CONFIG[delivery.status];
  const isToday = delivery.scheduledDate === new Date().toISOString().split("T")[0];
  const isPast = new Date(delivery.scheduledDate) < new Date() && delivery.status !== "delivered";

  return (
    <div className={`bg-white rounded-lg border p-5 hover:shadow-md transition-shadow ${
      isToday ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-medium text-gray-900">
              {delivery.deliveryNumber}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">{delivery.orderNumber}</span>
          </div>
          <h3 className="font-medium text-gray-900">{delivery.clientName}</h3>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span>{delivery.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4 text-gray-400" />
          <span>{delivery.contactPhone}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm mb-4">
        <div className={`flex items-center gap-2 ${isPast && delivery.status !== "delivered" ? "text-red-500" : "text-gray-600"}`}>
          <Calendar className="w-4 h-4" />
          <span className="font-medium">
            {isToday ? "Today" : new Date(delivery.scheduledDate).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{delivery.timeWindow}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Package className="w-4 h-4" />
        <span>{delivery.itemCount} items</span>
      </div>

      {delivery.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4">
          <p className="font-medium mb-1">Delivery Notes:</p>
          <p>{delivery.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        {delivery.status === "scheduled" && (
          <button className="flex-1 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors">
            Confirm
          </button>
        )}
        {delivery.status === "confirmed" && (
          <button className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors">
            Mark Out for Delivery
          </button>
        )}
        {delivery.status === "out_for_delivery" && (
          <>
            <button className="flex-1 px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors">
              Mark Delivered
            </button>
            <button className="px-3 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Failed
            </button>
          </>
        )}
        {(delivery.status === "delivered" || delivery.status === "failed") && (
          <button className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            View Details
          </button>
        )}
      </div>
    </div>
  );
}

export default function DeliveriesPage() {
  const [deliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Get unique dates with deliveries
  const deliveryDates = [...new Set(deliveries.map((d) => d.scheduledDate))].sort();

  // Filter deliveries for selected date or show all
  const filteredDeliveries = deliveries.filter(
    (d) => viewMode === "calendar" ? d.scheduledDate === selectedDate : true
  );

  const todayDeliveries = deliveries.filter(
    (d) => d.scheduledDate === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-500 mt-1">
            Schedule and track all deliveries
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Schedule Delivery
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {todayDeliveries.length}
          </p>
          <p className="text-sm text-gray-500">deliveries</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Confirmed</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {deliveries.filter((d) => d.status === "confirmed").length}
          </p>
          <p className="text-sm text-gray-500">ready to go</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-medium">In Transit</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {deliveries.filter((d) => d.status === "out_for_delivery").length}
          </p>
          <p className="text-sm text-gray-500">on the way</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Needs Action</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">
            {deliveries.filter((d) => d.status === "scheduled").length}
          </p>
          <p className="text-sm text-gray-500">to confirm</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            }`}
          >
            All Deliveries
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
            }`}
          >
            By Date
          </button>
        </div>

        {viewMode === "calendar" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-gray-900 min-w-[150px] text-center">
              {new Date(selectedDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No deliveries scheduled for this date</p>
        </div>
      )}
    </div>
  );
}

