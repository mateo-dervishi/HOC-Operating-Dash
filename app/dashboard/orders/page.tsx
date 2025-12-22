"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
} from "lucide-react";
import { ORDER_STATUSES, OrderStatus } from "@/types/admin";
import { Modal } from "@/components/ui/Modal";
import { CreateOrderForm, OrderFormData } from "@/components/forms/CreateOrderForm";

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  status: OrderStatus;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  depositPaid: number;
  createdAt: string;
  estimatedDelivery?: string;
  notes?: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "HOC-2024-001",
    clientName: "James Richardson",
    clientEmail: "james@richardson.com",
    status: "processing",
    items: [
      { name: "Clarence Sofa - Velvet Navy", quantity: 1, price: 8500 },
      { name: "Monarch Armchair - Leather Tan", quantity: 2, price: 3200 },
      { name: "Windsor Coffee Table", quantity: 1, price: 2100 },
    ],
    totalAmount: 17000,
    depositPaid: 5100,
    createdAt: "2024-12-15",
    estimatedDelivery: "2025-02-10",
  },
  {
    id: "2",
    orderNumber: "HOC-2024-002",
    clientName: "Sarah Mitchell",
    clientEmail: "sarah@mitchellhome.co.uk",
    status: "confirmed",
    items: [
      { name: "Kensington Dining Table", quantity: 1, price: 6500 },
      { name: "Kensington Dining Chair", quantity: 8, price: 1200 },
    ],
    totalAmount: 16100,
    depositPaid: 4830,
    createdAt: "2024-12-18",
    estimatedDelivery: "2025-02-20",
  },
  {
    id: "3",
    orderNumber: "HOC-2024-003",
    clientName: "David Thompson",
    clientEmail: "david.t@email.com",
    status: "received",
    items: [
      { name: "Master Bed Frame - Oak", quantity: 1, price: 12000 },
      { name: "Bedside Tables", quantity: 2, price: 1800 },
    ],
    totalAmount: 15600,
    depositPaid: 15600,
    createdAt: "2024-12-01",
    estimatedDelivery: "2025-01-15",
  },
  {
    id: "4",
    orderNumber: "HOC-2024-004",
    clientName: "Emma Wilson",
    clientEmail: "emma.wilson@gmail.com",
    status: "ready_for_delivery",
    items: [
      { name: "Hampton Bookcase", quantity: 2, price: 4200 },
    ],
    totalAmount: 8400,
    depositPaid: 8400,
    createdAt: "2024-11-25",
    estimatedDelivery: "2024-12-28",
  },
  {
    id: "5",
    orderNumber: "HOC-2024-005",
    clientName: "Michael Brown",
    clientEmail: "m.brown@browndesign.com",
    status: "delivered",
    items: [
      { name: "Clarence Sofa - Velvet Emerald", quantity: 2, price: 8500 },
      { name: "Accent Pillows Set", quantity: 4, price: 450 },
    ],
    totalAmount: 18800,
    depositPaid: 18800,
    createdAt: "2024-11-10",
    estimatedDelivery: "2024-12-15",
  },
];

function OrderRow({ order }: { order: Order }) {
  const statusInfo = ORDER_STATUSES[order.status];
  const remainingBalance = order.totalAmount - order.depositPaid;

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{order.orderNumber}</p>
          <p className="text-sm text-white/40 font-light">{order.createdAt}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{order.clientName}</p>
          <p className="text-sm text-white/40 font-light">{order.clientEmail}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-light bg-white/10 text-white">
          {statusInfo.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="font-light text-white">{order.items.length} items</p>
        <p className="text-sm text-white/40 font-light truncate max-w-[200px]">
          {order.items.map((i) => i.name).join(", ")}
        </p>
      </td>
      <td className="px-6 py-4 text-right">
        <p className="font-light text-white">£{order.totalAmount.toLocaleString()}</p>
        {remainingBalance > 0 && (
          <p className="text-sm text-white/40 font-light">
            £{remainingBalance.toLocaleString()} remaining
          </p>
        )}
      </td>
      <td className="px-6 py-4">
        {order.estimatedDelivery && (
          <div className="flex items-center gap-2 text-sm text-white/40 font-light">
            <Calendar className="w-4 h-4" />
            {order.estimatedDelivery}
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Eye className="w-4 h-4 text-white/40" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function OrdersPage() {
  const [orders] = useState<Order[]>(MOCK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [showCreateOrder, setShowCreateOrder] = useState(false);

  const handleCreateOrder = (data: OrderFormData) => {
    console.log("New order:", data);
    // TODO: Add to Supabase
    setShowCreateOrder(false);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(ORDER_STATUSES).reduce((acc, status) => {
    acc[status as OrderStatus] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Orders</h1>
          <p className="text-white/40 mt-1 font-light">
            Track and manage all client orders
          </p>
        </div>
        <button 
          onClick={() => setShowCreateOrder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {(Object.keys(ORDER_STATUSES) as OrderStatus[]).map((status) => {
          const info = ORDER_STATUSES[status];
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

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-4 font-light text-white/60 text-sm">Order</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Client</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Status</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Items</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm text-right">Total</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Delivery</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-white/40 font-light">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm text-white/40 font-light">
        <span>
          <strong className="text-white">{filteredOrders.length}</strong> orders shown
        </span>
        <span>
          <strong className="text-white">
            £{filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
          </strong>{" "}
          total value
        </span>
        <span>
          <strong className="text-white">
            £{filteredOrders.reduce((sum, o) => sum + o.depositPaid, 0).toLocaleString()}
          </strong>{" "}
          collected
        </span>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        title="Create Order"
        subtitle="Create a new order for a client"
        size="lg"
      >
        <CreateOrderForm
          onSubmit={handleCreateOrder}
          onCancel={() => setShowCreateOrder(false)}
        />
      </Modal>
    </div>
  );
}
