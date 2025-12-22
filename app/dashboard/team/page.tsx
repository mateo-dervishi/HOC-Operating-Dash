"use client";

import { useState } from "react";
import {
  UsersRound,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { InviteTeamMemberForm, InviteFormData } from "@/components/forms/InviteTeamMemberForm";

type Role = "admin" | "manager" | "sales" | "operations";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  joinedAt: string;
  lastActive: string;
  avatar?: string;
  stats: {
    leadsAssigned: number;
    ordersManaged: number;
    deliveriesCompleted: number;
  };
}

const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  admin: { label: "Admin", description: "Full system access" },
  manager: { label: "Manager", description: "Team and operations management" },
  sales: { label: "Sales", description: "Client and quote management" },
  operations: { label: "Operations", description: "Order and delivery management" },
};

const MOCK_TEAM: TeamMember[] = [
  {
    id: "1",
    name: "Mateo Dervishi",
    email: "mateo@houseofclarence.uk",
    phone: "020 7123 4567",
    role: "admin",
    isActive: true,
    joinedAt: "2024-01-15",
    lastActive: "Just now",
    stats: {
      leadsAssigned: 45,
      ordersManaged: 32,
      deliveriesCompleted: 28,
    },
  },
  {
    id: "2",
    name: "Tom Wilson",
    email: "tom@houseofclarence.uk",
    phone: "020 7234 5678",
    role: "operations",
    isActive: true,
    joinedAt: "2024-03-20",
    lastActive: "2 hours ago",
    stats: {
      leadsAssigned: 0,
      ordersManaged: 18,
      deliveriesCompleted: 45,
    },
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah@houseofclarence.uk",
    phone: "020 7345 6789",
    role: "sales",
    isActive: true,
    joinedAt: "2024-05-10",
    lastActive: "1 day ago",
    stats: {
      leadsAssigned: 38,
      ordersManaged: 12,
      deliveriesCompleted: 0,
    },
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike@houseofclarence.uk",
    phone: "020 7456 7890",
    role: "operations",
    isActive: true,
    joinedAt: "2024-06-01",
    lastActive: "5 hours ago",
    stats: {
      leadsAssigned: 0,
      ordersManaged: 24,
      deliveriesCompleted: 52,
    },
  },
  {
    id: "5",
    name: "Emily Davis",
    email: "emily@houseofclarence.uk",
    role: "manager",
    isActive: false,
    joinedAt: "2024-02-15",
    lastActive: "2 weeks ago",
    stats: {
      leadsAssigned: 22,
      ordersManaged: 8,
      deliveriesCompleted: 5,
    },
  },
];

function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-light">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-light text-white">{member.name}</h3>
              {member.isActive ? (
                <span className="w-2 h-2 rounded-full bg-green-500" title="Active" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-white/20" title="Inactive" />
              )}
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-xs font-light bg-white/10 text-white/70">
              <Shield className="w-3 h-3" />
              {ROLE_INFO[member.role].label}
            </span>
          </div>
        </div>
        <button className="p-1.5 hover:bg-white/10 rounded transition-colors">
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-white/60 font-light">
          <Mail className="w-4 h-4 text-white/40" />
          <span>{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-2 text-sm text-white/60 font-light">
            <Phone className="w-4 h-4 text-white/40" />
            <span>{member.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-white/40 font-light">
          <Calendar className="w-4 h-4" />
          <span>Joined {member.joinedAt}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-lg font-light text-white">{member.stats.leadsAssigned}</p>
          <p className="text-xs text-white/40 font-light">Leads</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-light text-white">{member.stats.ordersManaged}</p>
          <p className="text-xs text-white/40 font-light">Orders</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-light text-white">{member.stats.deliveriesCompleted}</p>
          <p className="text-xs text-white/40 font-light">Deliveries</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 font-light text-sm">
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 font-light text-sm">
          <Mail className="w-4 h-4" />
          Message
        </button>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [team] = useState<TeamMember[]>(MOCK_TEAM);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [showInactive, setShowInactive] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const handleInvite = (data: InviteFormData) => {
    console.log("New invitation:", data);
    // TODO: Send invitation via email/Supabase
    setShowInvite(false);
  };

  const filteredTeam = team.filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesActive = showInactive || member.isActive;

    return matchesSearch && matchesRole && matchesActive;
  });

  const roleCounts = Object.keys(ROLE_INFO).reduce((acc, role) => {
    acc[role as Role] = team.filter((m) => m.role === role).length;
    return acc;
  }, {} as Record<Role, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Team</h1>
          <p className="text-white/40 mt-1 font-light">
            Manage team members and permissions
          </p>
        </div>
        <button 
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Role Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(ROLE_INFO) as Role[]).map((role) => {
          const info = ROLE_INFO[role];
          const isActive = roleFilter === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(isActive ? "all" : role)}
              className={`p-4 rounded-lg border transition-colors text-left ${
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <p className={`text-lg font-light ${isActive ? "text-black" : "text-white"}`}>
                {roleCounts[role]}
              </p>
              <p className={`text-sm font-light ${isActive ? "text-black/80" : "text-white/60"}`}>
                {info.label}
              </p>
              <p className={`text-xs font-light mt-1 ${isActive ? "text-black/60" : "text-white/40"}`}>
                {info.description}
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
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/60 font-light cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded bg-white/5 border-white/10"
          />
          Show inactive
        </label>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      {filteredTeam.length === 0 && (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <UsersRound className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40 font-light">No team members found</p>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm text-white/40 font-light pt-4 border-t border-white/10">
        <span>
          <strong className="text-white">{team.length}</strong> total members
        </span>
        <span>
          <strong className="text-white">{team.filter((m) => m.isActive).length}</strong> active
        </span>
        <span>
          <strong className="text-white">{team.filter((m) => m.role === "admin").length}</strong>{" "}
          admins
        </span>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite Team Member"
        subtitle="Send an invitation to join the dashboard"
        size="md"
      >
        <InviteTeamMemberForm
          onSubmit={handleInvite}
          onCancel={() => setShowInvite(false)}
        />
      </Modal>
    </div>
  );
}

