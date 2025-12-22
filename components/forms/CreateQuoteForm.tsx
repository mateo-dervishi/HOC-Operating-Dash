"use client";

import { useState } from "react";
import { FileText, Plus, Trash2, Save, Search, Percent } from "lucide-react";

interface CreateQuoteFormProps {
  onSubmit: (data: QuoteFormData) => void;
  onCancel: () => void;
}

interface QuoteItem {
  id: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteFormData {
  clientId: string;
  clientName: string;
  items: QuoteItem[];
  discount: number;
  discountType: "fixed" | "percentage";
  validDays: number;
  notes: string;
}

const MOCK_CLIENTS = [
  { id: "1", name: "James Richardson", email: "james@richardson.com" },
  { id: "2", name: "Sarah Mitchell", email: "sarah@mitchellhome.co.uk" },
  { id: "3", name: "David Thompson", email: "david.t@email.com" },
  { id: "6", name: "Lisa Anderson", email: "lisa@andersonarch.com" },
  { id: "8", name: "Jennifer Clark", email: "jen.clark@clarkinteriors.com" },
];

const MOCK_PRODUCTS = [
  { name: "Clarence Sofa", description: "Velvet upholstery, 3 seater", price: 8500 },
  { name: "Monarch Armchair", description: "Full grain leather", price: 3200 },
  { name: "Kensington Dining Table", description: "Solid oak, seats 8", price: 6500 },
  { name: "Kensington Dining Chair", description: "Oak frame, upholstered seat", price: 850 },
  { name: "Stone Sanctuary Bath", description: "Freestanding, natural stone", price: 4200 },
  { name: "Calacatta Marble Tile", description: "Per square metre", price: 180 },
  { name: "Brass Heritage Basin Tap", description: "Brushed brass finish", price: 450 },
  { name: "Hampton Bookcase", description: "Walnut, 5 shelves", price: 4200 },
  { name: "Executive Desk", description: "Mahogany, with drawers", price: 5500 },
  { name: "Brass Pendant Light", description: "Large, adjustable height", price: 680 },
];

export function CreateQuoteForm({ onSubmit, onCancel }: CreateQuoteFormProps) {
  const [selectedClient, setSelectedClient] = useState<typeof MOCK_CLIENTS[0] | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [validDays, setValidDays] = useState(30);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [newItem, setNewItem] = useState({
    productName: "",
    description: "",
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
      description: product.description,
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
      description: "",
      quantity: 1,
      unitPrice: 0,
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = discountType === "percentage" 
    ? Math.round(subtotal * (discount / 100))
    : discount;
  const total = subtotal - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || items.length === 0) return;
    
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSubmit({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      items,
      discount,
      discountType,
      validDays,
      notes,
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
            </div>
          )}
        </div>
      </div>

      {/* Quote Items */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Quote Items
        </h3>

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
                    {item.description} • Qty: {item.quantity} × £{item.unitPrice.toLocaleString()}
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
              placeholder="Product name..."
            />
            {showProductDropdown && newItem.productName && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                {filteredProducts.map((product, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex justify-between">
                      <span className="text-white font-light">{product.name}</span>
                      <span className="text-white/40 font-light">£{product.price.toLocaleString()}</span>
                    </div>
                    <p className="text-white/40 text-sm font-light">{product.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Description / specifications..."
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Quantity"
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

      {/* Discount & Validity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            <Percent className="w-3 h-3 inline mr-1" />
            Discount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={discount || ""}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="0"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="fixed">£</option>
              <option value="percentage">%</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            Valid For (days)
          </label>
          <input
            type="number"
            min="1"
            value={validDays}
            onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
      </div>

      {/* Quote Summary */}
      {items.length > 0 && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
          <div className="flex justify-between text-white/60 font-light">
            <span>Subtotal</span>
            <span>£{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-white/60 font-light">
              <span>Discount</span>
              <span>-£{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-white font-light text-lg pt-2 border-t border-white/10">
            <span>Total</span>
            <span>£{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          placeholder="Terms, conditions, or notes for the client..."
        />
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
              Create Quote
            </>
          )}
        </button>
      </div>
    </form>
  );
}

