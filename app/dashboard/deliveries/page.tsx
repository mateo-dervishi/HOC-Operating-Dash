"use client";

import { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  Package,
} from "lucide-react";

type DeliveryStatus = "scheduled" | "in_transit" | "delivered" | "failed" | "rescheduled";

interface Delivery {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  address: string;
  postcode: string;
  status: DeliveryStatus;
  scheduledDate: string;
  scheduledTime: string;
  driver?: string;
  items: string[];
  notes?: string;
  completedAt?: string;
}

const DELIVERY_STATUSES: Record<DeliveryStatus, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-white/10 text-white" },
  in_transit: { label: "In Transit", color: "bg-white/20 text-white" },
  delivered: { label: "Delivered", color: "bg-white text-black" },
  failed: { label: "Failed", color: "bg-white/10 text-white/60" },
  rescheduled: { label: "Rescheduled", color: "bg-white/10 text-white/60" },
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "1",
    orderNumber: "HOC-2024-001",
    clientName: "James Richardson",
    clientPhone: "020 7123 4567",
    address: "14 Kensington Gardens",
    postcode: "W8 4PX",
    status: "scheduled",
    scheduledDate: "2024-12-28",
    scheduledTime: "09:00 - 12:00",
    driver: "Tom Wilson",
    items: ["Clarence Sofa", "Monarch Armchair x2", "Windsor Coffee Table"],
  },
  {
    id: "2",
    orderNumber: "HOC-2024-002",
    clientName: "Sarah Mitchell",
    clientPhone: "020 8234 5678",
    address: "8 Chelsea Manor Street",
    postcode: "SW3 5RH",
    status: "scheduled",
    scheduledDate: "2024-12-28",
    scheduledTime: "14:00 - 17:00",
    driver: "Tom Wilson",
    items: ["Kensington Dining Table", "Dining Chairs x8"],
  },
  {
    id: "3",
    orderNumber: "HOC-2024-003",
    clientName: "David Thompson",
    clientPhone: "07700 900123",
    address: "23 Mayfair Lane",
    postcode: "W1K 2AB",
    status: "in_transit",
    scheduledDate: "2024-12-21",
    scheduledTime: "10:00 - 13:00",
    driver: "Mike Johnson",
    items: ["Master Bed Frame", "Bedside Tables x2"],
    notes: "Access via rear entrance, call on arrival",
  },
  {
    id: "4",
    orderNumber: "HOC-2024-004",
    clientName: "Emma Wilson",
    clientPhone: "07700 900456",
    address: "45 Notting Hill Gate",
    postcode: "W11 3JQ",
    status: "delivered",
    scheduledDate: "2024-12-20",
    scheduledTime: "09:00 - 12:00",
    driver: "Tom Wilson",
    items: ["Hampton Bookcase x2"],
    completedAt: "2024-12-20T11:32:00",
  },
  {
    id: "5",
    orderNumber: "HOC-2024-005",
    clientName: "Michael Brown",
    clientPhone: "020 7456 7890",
    address: "67 Belgravia Square",
    postcode: "SW1X 8NH",
    status: "failed",
    scheduledDate: "2024-12-19",
    scheduledTime: "14:00 - 17:00",
    driver: "Mike Johnson",
    items: ["Clarence Sofa x2", "Accent Pillows"],
    notes: "No one home - attempted delivery at 14:45",
  },
  {
    id: "6",
    orderNumber: "HOC-2024-006",
    clientName: "Lisa Anderson",
    clientPhone: "07800 123456",
    address: "12 Richmond Terrace",
    postcode: "TW10 6RN",
    status: "rescheduled",
    scheduledDate: "2024-12-30",
    scheduledTime: "10:00 - 13:00",
    items: ["Executive Desk", "Office Chair"],
    notes: "Rescheduled from Dec 22 - client request",
  },
];

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const statusInfo = DELIVERY_STATUSES[delivery.status];
  const isToday = delivery.scheduledDate === new Date().toISOString().split("T")[0];
  const isPast = new Date(delivery.scheduledDate) < new Date();

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-light ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {isToday && delivery.status !== "delivered" && (
              <span className="px-2 py-0.5 bg-white text-black rounded-full text-xs font-light">
                Today
              </span>
            )}
          </div>
          <h3 className="font-light text-white">{delivery.orderNumber}</h3>
        </div>
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <User className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="font-light text-white">{delivery.clientName}</span>
        </div>
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
          <span className="font-light text-white/60">
            {delivery.address}, {delivery.postcode}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="font-light text-white/60">{delivery.clientPhone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="font-light text-white/60">
            {delivery.scheduledDate} • {delivery.scheduledTime}
          </span>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-white/40 mb-2 font-light">Items ({delivery.items.length})</p>
        <div className="flex flex-wrap gap-1">
          {delivery.items.map((item, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/60 font-light"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {delivery.driver && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 text-sm">
          <Truck className="w-4 h-4 text-white/40" />
          <span className="text-white/60 font-light">{delivery.driver}</span>
        </div>
      )}

      {delivery.notes && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-xs text-white/60 font-light">{delivery.notes}</p>
        </div>
      )}
    </div>
  );
}

export default function DeliveriesPage() {
  const [deliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      searchQuery === "" ||
      delivery.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.postcode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || delivery.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(DELIVERY_STATUSES).reduce((acc, status) => {
    acc[status as DeliveryStatus] = deliveries.filter((d) => d.status === status).length;
    return acc;
  }, {} as Record<DeliveryStatus, number>);

  const todayDeliveries = deliveries.filter(
    (d) => d.scheduledDate === new Date().toISOString().split("T")[0]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Deliveries</h1>
          <p className="text-white/40 mt-1 font-light">
            Schedule and track deliveries • {todayDeliveries.length} today
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light">
          <Plus className="w-4 h-4" />
          Schedule Delivery
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.keys(DELIVERY_STATUSES) as DeliveryStatus[]).map((status) => {
          const info = DELIVERY_STATUSES[status];
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? "all" : status)}
              className={`p-3 rounded-lg border transition-colors text-left ${
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <p className={`text-lg font-light ${isActive ? "text-black" : "text-white"}`}>
                {statusCounts[status]}
              </p>
              <p className={`text-xs font-light ${isActive ? "text-black/60" : "text-white/40"}`}>
                {info.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search deliveries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light">
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light">
          <Calendar className="w-4 h-4" />
          Calendar View
        </button>
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliveries.map((delivery) => (
          <DeliveryCard key={delivery.id} delivery={delivery} />
        ))}
      </div>

      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Truck className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40 font-light">No deliveries found</p>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm text-white/40 font-light pt-4 border-t border-white/10">
        <span>
          <strong className="text-white">{filteredDeliveries.length}</strong> deliveries shown
        </span>
        <span>
          <strong className="text-white">{todayDeliveries.length}</strong> scheduled today
        </span>
        <span>
          <strong className="text-white">
            {deliveries.filter((d) => d.status === "delivered").length}
          </strong>{" "}
          completed this week
        </span>
      </div>
    </div>
  );
}
