"use client";

import { useState } from "react";
import { Mail, Shield, User, Send } from "lucide-react";

interface InviteTeamMemberFormProps {
  onSubmit: (data: InviteFormData) => void;
  onCancel: () => void;
}

export interface InviteFormData {
  email: string;
  name: string;
  role: string;
  message: string;
}

const ROLES = [
  { 
    id: "admin", 
    label: "Admin", 
    description: "Full system access including team management and settings" 
  },
  { 
    id: "manager", 
    label: "Manager", 
    description: "Manage team, clients, orders, and view reports" 
  },
  { 
    id: "sales", 
    label: "Sales", 
    description: "Manage clients, create quotes, and track leads" 
  },
  { 
    id: "operations", 
    label: "Operations", 
    description: "Manage orders, deliveries, and inventory" 
  },
];

export function InviteTeamMemberForm({ onSubmit, onCancel }: InviteTeamMemberFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;
    
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    onSubmit({
      email,
      name,
      role,
      message,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <Mail className="w-3 h-3 inline mr-1" />
          Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="colleague@houseofclarence.uk"
        />
        <p className="text-xs text-white/40 font-light mt-1">
          An invitation email will be sent to this address
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          <User className="w-3 h-3 inline mr-1" />
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          placeholder="John Smith"
        />
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-3">
          <Shield className="w-3 h-3 inline mr-1" />
          Role *
        </label>
        <div className="space-y-2">
          {ROLES.map((r) => (
            <label
              key={r.id}
              className={`block p-4 rounded-lg border cursor-pointer transition-colors ${
                role === r.id
                  ? "bg-white/10 border-white/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="role"
                  value={r.id}
                  checked={role === r.id}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="text-white font-light">{r.label}</p>
                  <p className="text-white/40 text-sm font-light">{r.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Personal Message */}
      <div>
        <label className="block text-sm text-white/60 font-light mb-2">
          Personal Message (Optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
          placeholder="Add a personal note to the invitation..."
        />
      </div>

      {/* Preview */}
      {email && role && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-light mb-2">Invitation Preview</h4>
          <div className="space-y-1 text-sm">
            <p className="text-white/60 font-light">
              <span className="text-white/40">To:</span> {email}
            </p>
            <p className="text-white/60 font-light">
              <span className="text-white/40">Role:</span> {ROLES.find((r) => r.id === role)?.label}
            </p>
            {name && (
              <p className="text-white/60 font-light">
                <span className="text-white/40">Name:</span> {name}
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
          disabled={loading || !email || !role}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Invitation
            </>
          )}
        </button>
      </div>
    </form>
  );
}

