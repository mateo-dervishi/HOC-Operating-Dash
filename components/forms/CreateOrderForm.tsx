"use client";

import { useState } from "react";
import { Package, Plus, Trash2, Save, Search } from "lucide-react";

interface CreateOrderFormProps {
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  productName: string;
  colour: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderFormData {
  clientId: string;
  clientName: string;
  items: OrderItem[];
  deliveryNotes: string;
  internalNotes: string;
}

const MOCK_CLIENTS = [
  { id: "1", name: "James Richardson", email: "james@richardson.com" },
  { id: "2", name: "Sarah Mitchell", email: "sarah@mitchellhome.co.uk" },
  { id: "3", name: "David Thompson", email: "david.t@email.com" },
  { id: "6", name: "Lisa Anderson", email: "lisa@andersonarch.com" },
  { id: "8", name: "Jennifer Clark", email: "jen.clark@clarkinteriors.com" },
];

const MOCK_PRODUCTS = [
  { name: "Clarence Sofa - Velvet Navy", price: 8500, category: "Furniture" },
  { name: "Monarch Armchair - Leather Tan", price: 3200, category: "Furniture" },
  { name: "Kensington Dining Table - Oak", price: 6500, category: "Furniture" },
  { name: "Kensington Dining Chair", price: 850, category: "Furniture" },
  { name: "Stone Sanctuary Freestanding Bath", price: 4200, category: "Bathroom" },
  { name: "Calacatta Marble Tile (per sqm)", price: 180, category: "Tiling" },
  { name: "Brass Heritage Basin Tap", price: 450, category: "Bathroom" },
  { name: "Hampton Bookcase - Walnut", price: 4200, category: "Furniture" },
  { name: "Executive Desk - Mahogany", price: 5500, category: "Furniture" },
  { name: "Brass Pendant Light - Large", price: 680, category: "Lighting" },
];

export function CreateOrderForm({ onSubmit, onCancel }: CreateOrderFormProps) {
  const [selectedClient, setSelectedClient] = useState<typeof MOCK_CLIENTS[0] | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // New item form
  const [newItem, setNewItem] = useState({
    productName: "",
    colour: "",
    quantity: 1,
    unitPrice: 0,
  });
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const filteredClients = MOCK_CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(newItem.productName.toLowerCase())
  );

  const selectClient = (client: typeof MOCK_CLIENTS[0]) => {
    setSelectedClient(client);
    setClientSearch(client.name);
    setShowClientDropdown(false);
  };

  const selectProduct = (product: typeof MOCK_PRODUCTS[0]) => {
    setNewItem({
      ...newItem,
      productName: product.name,
      unitPrice: product.price,
    });
    setShowProductDropdown(false);
  };

  const addItem = () => {
    if (!newItem.productName || newItem.quantity < 1) return;
    
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        ...newItem,
      },
    ]);
    setNewItem({
      productName: "",
      colour: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vat = Math.round(subtotal * 0.2);
  const total = subtotal + vat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) return;
    
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSubmit({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      items,
      deliveryNotes,
      internalNotes,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Select Client *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
              if (!e.target.value) setSelectedClient(null);
            }}
            onFocus={() => setShowClientDropdown(true)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Search clients..."
          />
          {showClientDropdown && clientSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => selectClient(client)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                >
                  <p className="text-white font-light">{client.name}</p>
                  <p className="text-white/40 text-sm font-light">{client.email}</p>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="px-4 py-3 text-white/40 font-light">No clients found</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Order Items
        </h3>

        {/* Existing Items */}
        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex-1">
                  <p className="text-white font-light">{item.productName}</p>
                  <p className="text-white/40 text-sm font-light">
                    {item.colour && `${item.colour} • `}
                    Qty: {item.quantity} × £{item.unitPrice.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-light">
                    £{(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Item */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
          <div className="relative">
            <input
              type="text"
              value={newItem.productName}
              onChange={(e) => {
                setNewItem({ ...newItem, productName: e.target.value });
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Search or enter product name..."
            />
            {showProductDropdown && newItem.productName && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                {filteredProducts.map((product, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors flex justify-between"
                  >
                    <span className="text-white font-light">{product.name}</span>
                    <span className="text-white/40 font-light">£{product.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={newItem.colour}
              onChange={(e) => setNewItem({ ...newItem, colour: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Colour"
            />
            <input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Qty"
            />
            <input
              type="number"
              min="0"
              value={newItem.unitPrice || ""}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Unit Price (£)"
            />
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={!newItem.productName}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-white/20 rounded-lg text-white/60 font-light hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
          <div className="flex justify-between text-white/60 font-light">
            <span>Subtotal</span>
            <span>£{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white/60 font-light">
            <span>VAT (20%)</span>
            <span>£{vat.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white font-light text-lg pt-2 border-t border-white/10">
            <span>Total</span>
            <span>£{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            Delivery Notes
          </label>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            placeholder="Access instructions, etc..."
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            Internal Notes
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            placeholder="Notes for the team..."
          />
        </div>
      </div>

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
          disabled={loading || !selectedClient || items.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Create Order
            </>
          )}
        </button>
      </div>
    </form>
  );
}

