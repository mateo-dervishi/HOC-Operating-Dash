"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  MoreHorizontal,
  ChevronDown,
  Calendar,
  Users,
  AlertCircle,
  Flame,
  Snowflake,
  Thermometer,
  Download,
  Eye,
  ArrowRight,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { AddClientForm, ClientFormData } from "@/components/forms/AddClientForm";
import {
  fetchMarketingLeads,
  getMarketingLeadStats,
  updateLeadInterest,
  logOutreach,
  type MarketingLead,
  type MarketingLeadStats,
  type InterestLevel,
  type LeadStatus,
  type LeadSource,
} from "@/lib/services/marketing-leads";

// Display info
const SOURCE_INFO: Record<LeadSource, { label: string; color: string }> = {
  website_signup: { label: "Website", color: "bg-white/20" },
  website_newsletter: { label: "Newsletter", color: "bg-blue-500/20" },
  coming_soon: { label: "Coming Soon", color: "bg-purple-500/20" },
  referral: { label: "Referral", color: "bg-green-500/20" },
  social: { label: "Social", color: "bg-pink-500/20" },
  phone: { label: "Phone", color: "bg-yellow-500/20" },
  walk_in: { label: "Walk-in", color: "bg-orange-500/20" },
  other: { label: "Other", color: "bg-white/10" },
};

const STATUS_INFO: Record<LeadStatus, { label: string; color: string }> = {
  registered: { label: "Registered", color: "text-white/60" },
  browsing: { label: "Browsing", color: "text-blue-400" },
  newsletter_only: { label: "Newsletter Only", color: "text-purple-400" },
};

const INTEREST_INFO: Record<InterestLevel, { label: string; icon: typeof Flame; color: string }> = {
  cold: { label: "Cold", icon: Snowflake, color: "text-blue-400" },
  warm: { label: "Warm", icon: Thermometer, color: "text-yellow-400" },
  hot: { label: "Hot", icon: Flame, color: "text-orange-400" },
};

// Helper functions
function getDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Components
function QuickStats({ stats, isLoading }: { stats: MarketingLeadStats | null; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-20 mb-2" />
            <div className="h-8 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
          <Users className="w-4 h-4" />
          Total Leads
        </div>
        <p className="text-2xl font-light text-white">{stats.total}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-orange-400 text-sm mb-1">
          <Flame className="w-4 h-4" />
          Hot Leads
        </div>
        <p className="text-2xl font-light text-white">{stats.hot}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
          <AlertCircle className="w-4 h-4" />
          Need Follow-up
        </div>
        <p className="text-2xl font-light text-white">{stats.needsFollowUp}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
          <Mail className="w-4 h-4" />
          Newsletter Only
        </div>
        <p className="text-2xl font-light text-white">{stats.newsletterOnly}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
          <Eye className="w-4 h-4" />
          Browsing
        </div>
        <p className="text-2xl font-light text-white">{stats.browsing}</p>
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  onInterestChange,
  onLogActivity,
  onViewDetails,
}: {
  lead: MarketingLead;
  onInterestChange: (id: string, interest: InterestLevel) => void;
  onLogActivity: (id: string, type: "email" | "call" | "note") => void;
  onViewDetails: (lead: MarketingLead) => void;
}) {
  const [showInterestMenu, setShowInterestMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const daysSinceActivity = getDaysSince(lead.lastActivityAt);
  const isStale = daysSinceActivity > 14;
  const InterestIcon = INTEREST_INFO[lead.interest].icon;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-white/5 hover:bg-white/5 transition-colors"
    >
      {/* Name & Email */}
      <td className="py-4 px-4">
        <div>
          <p className="font-light text-white">{lead.name}</p>
          <p className="text-sm text-white/40">{lead.email}</p>
        </div>
      </td>

      {/* Source */}
      <td className="py-4 px-4">
        <span className={`text-xs px-2 py-1 rounded-full ${SOURCE_INFO[lead.source].color} text-white/80`}>
          {SOURCE_INFO[lead.source].label}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <span className={`text-sm ${STATUS_INFO[lead.status].color}`}>
          {STATUS_INFO[lead.status].label}
        </span>
      </td>

      {/* Interest Level */}
      <td className="py-4 px-4">
        <div className="relative">
          <button
            onClick={() => setShowInterestMenu(!showInterestMenu)}
            className={`flex items-center gap-1.5 text-sm ${INTEREST_INFO[lead.interest].color} hover:opacity-80 transition-opacity`}
          >
            <InterestIcon className="w-4 h-4" />
            {INTEREST_INFO[lead.interest].label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showInterestMenu && (
            <div className="absolute top-full left-0 mt-1 bg-black/90 border border-white/20 rounded-lg py-1 z-10">
              {(Object.keys(INTEREST_INFO) as InterestLevel[]).map((level) => {
                const Icon = INTEREST_INFO[level].icon;
                return (
                  <button
                    key={level}
                    onClick={() => {
                      onInterestChange(lead.id, level);
                      setShowInterestMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 w-full hover:bg-white/10 ${INTEREST_INFO[level].color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {INTEREST_INFO[level].label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>

      {/* Selection */}
      <td className="py-4 px-4">
        {lead.selectionCount > 0 ? (
          <div>
            <p className="text-sm text-white">{lead.selectionCount} items</p>
            <p className="text-xs text-white/40">£{lead.selectionValue.toLocaleString()}</p>
          </div>
        ) : (
          <span className="text-sm text-white/30">—</span>
        )}
      </td>

      {/* Last Activity */}
      <td className="py-4 px-4">
        <div className={isStale ? "text-red-400" : "text-white/60"}>
          <p className="text-sm">{formatDate(lead.lastActivityAt)}</p>
          <p className="text-xs">
            {daysSinceActivity === 0 ? "Today" : `${daysSinceActivity}d ago`}
          </p>
        </div>
      </td>

      {/* Quick Actions */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onLogActivity(lead.id, "email")}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Log Email"
          >
            <Mail className="w-4 h-4" />
          </button>
          <button
            onClick={() => onLogActivity(lead.id, "call")}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Log Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => onLogActivity(lead.id, "note")}
            className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="Add Note"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showActionsMenu && (
              <div className="absolute top-full right-0 mt-1 bg-black/90 border border-white/20 rounded-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={() => {
                    onViewDetails(lead);
                    setShowActionsMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-white/10 text-white/80 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => setShowActionsMenu(false)}
                  className="flex items-center gap-2 px-3 py-1.5 w-full hover:bg-white/10 text-white/80 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Follow-up
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function LeadDetailPanel({
  lead,
  onClose,
  onLogActivity,
}: {
  lead: MarketingLead;
  onClose: () => void;
  onLogActivity: (id: string, type: "email" | "call" | "note", content?: string) => void;
}) {
  const [noteContent, setNoteContent] = useState("");
  const InterestIcon = INTEREST_INFO[lead.interest].icon;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-light text-white">{lead.name}</h2>
            <p className="text-white/40">{lead.email}</p>
            {lead.phone && <p className="text-white/40 text-sm">{lead.phone}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`text-xs px-2 py-1 rounded-full ${SOURCE_INFO[lead.source].color} text-white/80`}>
            {SOURCE_INFO[lead.source].label}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${STATUS_INFO[lead.status].color}`}>
            {STATUS_INFO[lead.status].label}
          </span>
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 ${INTEREST_INFO[lead.interest].color}`}>
            <InterestIcon className="w-3 h-3" />
            {INTEREST_INFO[lead.interest].label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/40 mb-1">Selection</p>
            <p className="text-lg font-light text-white">
              {lead.selectionCount > 0 ? `${lead.selectionCount} items` : "None"}
            </p>
            {lead.selectionValue > 0 && (
              <p className="text-sm text-white/60">£{lead.selectionValue.toLocaleString()}</p>
            )}
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-xs text-white/40 mb-1">Last Activity</p>
            <p className="text-lg font-light text-white">{formatDate(lead.lastActivityAt)}</p>
            <p className="text-sm text-white/60">{getDaysSince(lead.lastActivityAt)}d ago</p>
          </div>
        </div>

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-white/40 mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-3 mb-6">
          <p className="text-xs text-white/40">Quick Actions</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onLogActivity(lead.id, "email")}
              className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Mail className="w-5 h-5 text-white/60" />
              <span className="text-xs text-white/60">Log Email</span>
            </button>
            <button
              onClick={() => onLogActivity(lead.id, "call")}
              className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5 text-white/60" />
              <span className="text-xs text-white/60">Log Call</span>
            </button>
            <button
              onClick={() => {}}
              className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Calendar className="w-5 h-5 text-white/60" />
              <span className="text-xs text-white/60">Follow-up</span>
            </button>
          </div>
        </div>

        {/* Add Note */}
        <div className="mb-6">
          <p className="text-xs text-white/40 mb-2">Add Note</p>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Type a note..."
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
            rows={3}
          />
          <button
            onClick={() => {
              if (noteContent.trim()) {
                onLogActivity(lead.id, "note", noteContent);
                setNoteContent("");
              }
            }}
            disabled={!noteContent.trim()}
            className="mt-2 px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Note
          </button>
        </div>

        {/* Notes */}
        {lead.notes && (
          <div>
            <p className="text-xs text-white/40 mb-2">Notes</p>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-white/80 font-light">{lead.notes}</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// New Submissions Alert Component
function NewSubmissionsAlert({ count, onView }: { count: number; onView: () => void }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <ArrowRight className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-white font-light">
            {count} lead{count > 1 ? "s have" : " has"} submitted their selection
          </p>
          <p className="text-sm text-white/60">Ready to move to the sales pipeline</p>
        </div>
      </div>
      <button
        onClick={onView}
        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
      >
        View Pipeline
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Main Page Component
export default function LeadsPage() {
  const [leads, setLeads] = useState<MarketingLead[]>([]);
  const [stats, setStats] = useState<MarketingLeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [interestFilter, setInterestFilter] = useState<InterestLevel | "all">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "active" | "stale">("all");
  const [selectedLead, setSelectedLead] = useState<MarketingLead | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  // Fetch leads on mount
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const fetchedLeads = await fetchMarketingLeads();
      setLeads(fetchedLeads);
      
      const fetchedStats = await getMarketingLeadStats(fetchedLeads);
      setStats(fetchedStats);
      
      // TODO: Get actual submitted count from pipeline
      setSubmittedCount(3); // Mock for now
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !lead.name.toLowerCase().includes(query) &&
          !lead.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Source filter
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;

      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;

      // Interest filter
      if (interestFilter !== "all" && lead.interest !== interestFilter) return false;

      // Activity filter
      if (activityFilter !== "all") {
        const daysSince = getDaysSince(lead.lastActivityAt);
        if (activityFilter === "active" && daysSince > 7) return false;
        if (activityFilter === "stale" && daysSince <= 14) return false;
      }

      return true;
    });
  }, [leads, searchQuery, sourceFilter, statusFilter, interestFilter, activityFilter]);

  // Handlers
  const handleInterestChange = async (id: string, interest: InterestLevel) => {
    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, interest } : lead))
    );
    
    // Update in database
    await updateLeadInterest(id, interest);
    
    // Recalculate stats
    const updatedStats = await getMarketingLeadStats(
      leads.map((lead) => (lead.id === id ? { ...lead, interest } : lead))
    );
    setStats(updatedStats);
  };

  const handleLogActivity = async (id: string, type: "email" | "call" | "note", content?: string) => {
    console.log(`Logged ${type} for lead ${id}:`, content);
    
    // Log to database - map "note" to "other" for outreach type
    const outreachType = type === "note" ? "other" : type;
    const outcome = type === "note" ? "spoke" : `${type}_sent`;
    await logOutreach(id, outreachType, outcome, content);
    
    // Update last activity
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? { ...lead, lastActivityAt: new Date().toISOString() }
          : lead
      )
    );
  };

  const handleAddLead = (data: ClientFormData) => {
    const newLead: MarketingLead = {
      id: `new-${Date.now()}`,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone || null,
      source: data.source as LeadSource,
      status: "registered",
      interest: "warm",
      selectionCount: 0,
      selectionValue: 0,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: data.notes || null,
      tags: [],
      isNewsletterOnly: false,
      convertedToAccount: true,
    };
    setLeads((prev) => [newLead, ...prev]);
    setShowAddLead(false);
  };

  const handleViewPipeline = () => {
    window.location.href = "/dashboard/clients";
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "Source", "Status", "Interest", "Selection Value", "Last Activity"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "",
      SOURCE_INFO[lead.source].label,
      STATUS_INFO[lead.status].label,
      INTEREST_INFO[lead.interest].label,
      lead.selectionValue.toString(),
      lead.lastActivityAt,
    ]);
    
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Leads</h1>
          <p className="text-white/40">All prospects and newsletter subscribers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            disabled={isLoading}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* New Submissions Alert */}
      <NewSubmissionsAlert count={submittedCount} onView={handleViewPipeline} />

      {/* Quick Stats */}
      <QuickStats stats={stats} isLoading={isLoading} />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(sourceFilter !== "all" || statusFilter !== "all" || interestFilter !== "all" || activityFilter !== "all") && (
            <span className="w-2 h-2 rounded-full bg-white" />
          )}
        </button>
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <label className="block text-xs text-white/40 mb-1">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as LeadSource | "all")}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  {Object.entries(SOURCE_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="registered">Registered</option>
                  <option value="browsing">Browsing</option>
                  <option value="newsletter_only">Newsletter Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Interest</label>
                <select
                  value={interestFilter}
                  onChange={(e) => setInterestFilter(e.target.value as InterestLevel | "all")}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="hot">🔥 Hot</option>
                  <option value="warm">🌡️ Warm</option>
                  <option value="cold">❄️ Cold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Activity</label>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as "all" | "active" | "stale")}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none"
                >
                  <option value="all">All Activity</option>
                  <option value="active">Active (7 days)</option>
                  <option value="stale">Needs Follow-up (14+ days)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leads Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Lead
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Interest
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Selection
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    No leads found matching your filters
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    onInterestChange={handleInterestChange}
                    onLogActivity={handleLogActivity}
                    onViewDetails={setSelectedLead}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Lead Detail Panel */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedLead(null)}
            />
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onLogActivity={handleLogActivity}
            />
          </>
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <Modal
        isOpen={showAddLead}
        onClose={() => setShowAddLead(false)}
        title="Add Lead"
        subtitle="Manually add a new lead"
        size="lg"
      >
        <AddClientForm
          onSubmit={handleAddLead}
          onCancel={() => setShowAddLead(false)}
        />
      </Modal>
    </div>
  );
}
