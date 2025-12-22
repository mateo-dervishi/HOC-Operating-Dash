"use client";

import { useState } from "react";
import { Truck, Calendar, Clock, MapPin, User, Save, Search } from "lucide-react";

interface ScheduleDeliveryFormProps {
  onSubmit: (data: DeliveryFormData) => void;
  onCancel: () => void;
}

export interface DeliveryFormData {
  orderId: string;
  orderNumber: string;
  clientName: string;
  scheduledDate: string;
  timeSlot: string;
  driver: string;
  address: string;
  postcode: string;
  contactPhone: string;
  notes: string;
}

const MOCK_ORDERS = [
  { id: "1", orderNumber: "HOC-2024-001", clientName: "James Richardson", address: "14 Kensington Gardens", postcode: "W8 4PX", phone: "020 7123 4567" },
  { id: "2", orderNumber: "HOC-2024-002", clientName: "Sarah Mitchell", address: "8 Chelsea Manor Street", postcode: "SW3 5RH", phone: "020 8234 5678" },
  { id: "3", orderNumber: "HOC-2024-003", clientName: "David Thompson", address: "23 Mayfair Lane", postcode: "W1K 2AB", phone: "07700 900123" },
];

const DRIVERS = [
  { id: "1", name: "Tom Wilson" },
  { id: "2", name: "Mike Johnson" },
  { id: "3", name: "Steve Brown" },
];

const TIME_SLOTS = [
  "08:00 - 10:00",
  "09:00 - 11:00",
  "10:00 - 12:00",
  "11:00 - 13:00",
  "12:00 - 14:00",
  "13:00 - 15:00",
  "14:00 - 16:00",
  "15:00 - 17:00",
  "16:00 - 18:00",
];

export function ScheduleDeliveryForm({ onSubmit, onCancel }: ScheduleDeliveryFormProps) {
  const [selectedOrder, setSelectedOrder] = useState<typeof MOCK_ORDERS[0] | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [driver, setDriver] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredOrders = MOCK_ORDERS.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.clientName.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const selectOrder = (order: typeof MOCK_ORDERS[0]) => {
    setSelectedOrder(order);
    setOrderSearch(`${order.orderNumber} - ${order.clientName}`);
    setAddress(order.address);
    setPostcode(order.postcode);
    setContactPhone(order.phone);
    setShowOrderDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !scheduledDate || !timeSlot) return;
    
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSubmit({
      orderId: selectedOrder.id,
      orderNumber: selectedOrder.orderNumber,
      clientName: selectedOrder.clientName,
      scheduledDate,
      timeSlot,
      driver,
      address,
      postcode,
      contactPhone,
      notes,
    });
    setLoading(false);
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Selection */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Select Order *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => {
              setOrderSearch(e.target.value);
              setShowOrderDropdown(true);
              if (!e.target.value) setSelectedOrder(null);
            }}
            onFocus={() => setShowOrderDropdown(true)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Search by order number or client name..."
          />
          {showOrderDropdown && orderSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
              {filteredOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => selectOrder(order)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <p className="text-white font-light">{order.orderNumber}</p>
                  <p className="text-white/40 text-sm font-light">{order.clientName}</p>
                </button>
              ))}
              {filteredOrders.length === 0 && (
                <p className="px-4 py-3 text-white/40 font-light">No orders found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">
              Delivery Date *
            </label>
            <input
              type="date"
              min={minDate}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">
              <Clock className="w-3 h-3 inline mr-1" />
              Time Slot *
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="">Select time slot</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Driver */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <User className="w-3 h-3 inline mr-1" />
          Assign Driver
        </label>
        <select
          value={driver}
          onChange={(e) => setDriver(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="">Select driver (optional)</option>
          {DRIVERS.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Delivery Address */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Delivery Address
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Street address"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Postcode"
            />
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Contact phone"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Delivery Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          placeholder="Access instructions, special requirements..."
        />
      </div>

      {/* Summary */}
      {selectedOrder && scheduledDate && timeSlot && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-light mb-2">Delivery Summary</h4>
          <div className="space-y-1 text-sm">
            <p className="text-white/60 font-light">
              <span className="text-white/40">Order:</span> {selectedOrder.orderNumber}
            </p>
            <p className="text-white/60 font-light">
              <span className="text-white/40">Client:</span> {selectedOrder.clientName}
            </p>
            <p className="text-white/60 font-light">
              <span className="text-white/40">Date:</span> {new Date(scheduledDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-white/60 font-light">
              <span className="text-white/40">Time:</span> {timeSlot}
            </p>
            {driver && (
              <p className="text-white/60 font-light">
                <span className="text-white/40">Driver:</span> {driver}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-white/10 rounded-lg text-white/60 font-light hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedOrder || !scheduledDate || !timeSlot}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Truck className="w-4 h-4" />
              Schedule Delivery
            </>
          )}
        </button>
      </div>
    </form>
  );
}

