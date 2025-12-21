"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { ORDER_STATUSES, OrderStatus } from "@/types/admin";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  items: OrderItem[];
  createdAt: string;
  expectedDelivery?: string;
  assignedTo: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "HOC-2024-001",
    clientName: "James Richardson",
    clientEmail: "james@richardson.com",
    status: "processing",
    totalAmount: 24500,
    itemCount: 8,
    items: [
      { id: "1", name: "Freestanding Bath - Victoria", quantity: 1, status: "ordered" },
      { id: "2", name: "Basin - Carrara Marble", quantity: 2, status: "in_transit" },
    ],
    createdAt: "2024-01-15",
    expectedDelivery: "2024-02-01",
    assignedTo: "Mateo",
  },
  {
    id: "2",
    orderNumber: "HOC-2024-002",
    clientName: "Sarah Mitchell",
    clientEmail: "sarah@mitchellhome.co.uk",
    status: "ordered",
    totalAmount: 18900,
    itemCount: 5,
    items: [
      { id: "3", name: "Kitchen Tap - Brushed Brass", quantity: 1, status: "ordered" },
      { id: "4", name: "Belfast Sink", quantity: 1, status: "ordered" },
    ],
    createdAt: "2024-01-18",
    expectedDelivery: "2024-02-10",
    assignedTo: "Mateo",
  },
  {
    id: "3",
    orderNumber: "HOC-2024-003",
    clientName: "David Thompson",
    clientEmail: "david.t@email.com",
    status: "received",
    totalAmount: 45000,
    itemCount: 12,
    items: [
      { id: "5", name: "Porcelain Tiles - Calacatta", quantity: 45, status: "received" },
      { id: "6", name: "Underfloor Heating System", quantity: 1, status: "received" },
    ],
    createdAt: "2024-01-10",
    assignedTo: "Mateo",
  },
  {
    id: "4",
    orderNumber: "HOC-2024-004",
    clientName: "Emma Wilson",
    clientEmail: "emma.wilson@gmail.com",
    status: "ready_for_delivery",
    totalAmount: 12500,
    itemCount: 3,
    items: [
      { id: "7", name: "Pendant Light - Crystal", quantity: 3, status: "ready" },
    ],
    createdAt: "2024-01-20",
    assignedTo: "Mateo",
  },
  {
    id: "5",
    orderNumber: "HOC-2024-005",
    clientName: "Michael Brown",
    clientEmail: "m.brown@browndesign.com",
    status: "pending",
    totalAmount: 32000,
    itemCount: 6,
    items: [
      { id: "8", name: "Dining Table - Oak", quantity: 1, status: "pending" },
      { id: "9", name: "Dining Chairs", quantity: 6, status: "pending" },
    ],
    createdAt: "2024-01-22",
    assignedTo: "Mateo",
  },
];

const STATUS_ICONS: Record<string, typeof Package> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  ordered: Truck,
  received: CheckCircle,
  ready_for_delivery: Truck,
  delivered: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
};

function OrderCard({ order }: { order: Order }) {
  const statusInfo = ORDER_STATUSES[order.status];
  const StatusIcon = STATUS_ICONS[order.status] || Package;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-gray-900">
              {order.orderNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color} text-white`}
            >
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{order.clientName}</p>
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          {order.itemCount} items
        </span>
        <span className="font-medium text-gray-900">
          £{order.totalAmount.toLocaleString()}
        </span>
      </div>

      {order.expectedDelivery && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Truck className="w-3 h-3" />
          Expected: {new Date(order.expectedDelivery).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </div>
      )}

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="w-6 h-6 bg-gray-200 rounded border-2 border-white flex items-center justify-center"
                title={item.name}
              >
                <Package className="w-3 h-3 text-gray-500" />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-6 h-6 bg-gray-100 rounded border-2 border-white flex items-center justify-center text-xs text-gray-500">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <button className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
            View Details
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderColumn({
  status,
  orders,
}: {
  status: OrderStatus;
  orders: Order[];
}) {
  const statusInfo = ORDER_STATUSES[status];
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-xl">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
            <h3 className="font-semibold text-gray-900">{statusInfo.label}</h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {orders.length}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          £{totalValue.toLocaleString()} total
        </p>
      </div>

      <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter(
    (o) =>
      searchQuery === "" ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ordersByStatus = Object.keys(ORDER_STATUSES).reduce((acc, status) => {
    acc[status as OrderStatus] = filteredOrders.filter((o) => o.status === status);
    return acc;
  }, {} as Record<OrderStatus, Order[]>);

  const visibleStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "ordered",
    "received",
    "ready_for_delivery",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">
            Track and manage all client orders
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Order Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {visibleStatuses.map((status) => (
          <OrderColumn
            key={status}
            status={status}
            orders={ordersByStatus[status]}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
        <span>
          <strong className="text-gray-900">{orders.length}</strong> total orders
        </span>
        <span>
          <strong className="text-gray-900">
            £{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
          </strong>{" "}
          total value
        </span>
        <span>
          <strong className="text-gray-900">
            {orders.filter((o) => o.status === "ready_for_delivery").length}
          </strong>{" "}
          ready to deliver
        </span>
      </div>
    </div>
  );
}

