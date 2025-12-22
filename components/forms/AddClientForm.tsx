"use client";

import { useState } from "react";
import { User, Mail, Phone, Building2, MapPin, Save } from "lucide-react";

interface AddClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  source: string;
  notes: string;
}

export function AddClientForm({ onSubmit, onCancel }: AddClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
    source: "website",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSubmit(formData);
    setLoading(false);
  };

  const updateField = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Contact Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="James"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Richardson"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            <Mail className="w-3 h-3 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="james@email.com"
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 font-light mb-2">
            <Phone className="w-3 h-3 inline mr-1" />
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="020 7123 4567"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <Building2 className="w-3 h-3 inline mr-1" />
          Company
        </label>
        <input
          type="text"
          value={formData.company}
          onChange={(e) => updateField("company", e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="Richardson Interiors"
        />
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-light text-white/40 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Address
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            value={formData.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Address Line 1"
          />
          <input
            type="text"
            value={formData.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            placeholder="Address Line 2"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="City"
            />
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => updateField("postcode", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
              placeholder="Postcode"
            />
          </div>
        </div>
      </div>

      {/* Lead Source */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Lead Source
        </label>
        <select
          value={formData.source}
          onChange={(e) => updateField("source", e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="social">Social Media</option>
          <option value="phone">Phone Inquiry</option>
          <option value="walk_in">Walk-in</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          placeholder="Any additional notes about this client..."
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
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Add Client
            </>
          )}
        </button>
      </div>
    </form>
  );
}

