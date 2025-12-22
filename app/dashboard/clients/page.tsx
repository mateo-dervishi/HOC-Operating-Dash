"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  ChevronDown,
  Building2,
  Package,
  Send,
  MessageSquare,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { 
  Lead, 
  LeadStatus, 
  LEAD_STATUS_INFO,
  PAYMENT_STAGES,
  OUTREACH_TYPE_INFO,
  OUTREACH_OUTCOME_INFO,
  NURTURING_STATUS_INFO,
  OutreachType,
  OutreachOutcome,
  NurturingStatus,
} from "@/types/leads";
import { getMockLeads, getMockLeadStats } from "@/lib/services/leads";

// Pipeline stages for Kanban view
const PIPELINE_STAGES: LeadStatus[] = [
  "registered",
  "browsing", 
  "submitted",
  "contacted",
  "meeting_scheduled",
  "quoted",
  "deposit_paid",
  "in_production",
];

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const statusInfo = LEAD_STATUS_INFO[lead.status];
  const name = `${lead.profile.first_name || ""} ${lead.profile.last_name || ""}`.trim() || lead.profile.email;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const paymentProgress = lead.selectionValue > 0 
    ? Math.round((lead.totalPaid / lead.selectionValue) * 100) 
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-light">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-light text-white truncate">{name}</h4>
            {lead.profile.company && (
              <p className="text-xs text-white/40 font-light flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {lead.profile.company}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
        >
          <MoreHorizontal className="w-4 h-4 text-white/40" />
        </button>
      </div>

      {lead.selectionCount > 0 && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Package className="w-3.5 h-3.5 text-white/40" />
          <span className="text-white/60 font-light">
            {lead.selectionCount} items • £{lead.selectionValue.toLocaleString()}
          </span>
        </div>
      )}

      {lead.submission && (
        <div className="mb-3 px-2 py-1.5 bg-white/5 rounded text-xs font-light">
          <span className="text-white/40">Ref:</span>{" "}
          <span className="text-white/60">{lead.submission.submission_number}</span>
        </div>
      )}

      {lead.totalPaid > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-white/40 font-light">Payment Progress</span>
            <span className="text-white/60 font-light">{paymentProgress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/60 rounded-full transition-all"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-white/30 font-light pt-2 border-t border-white/10">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(lead.createdAt).toLocaleDateString("en-GB", { 
            day: "numeric", 
            month: "short" 
          })}
        </span>
        {lead.nextFollowUp && (
          <span className="flex items-center gap-1 text-white/50">
            <Calendar className="w-3 h-3" />
            Follow-up: {lead.nextFollowUp}
          </span>
        )}
      </div>
    </div>
  );
}

function LeadRow({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const statusInfo = LEAD_STATUS_INFO[lead.status];
  const name = `${lead.profile.first_name || ""} ${lead.profile.last_name || ""}`.trim() || lead.profile.email;

  return (
    <tr 
      onClick={onClick}
      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-light">
            {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-light text-white">{name}</p>
            <p className="text-sm text-white/40 font-light">{lead.profile.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {lead.profile.company && (
          <p className="font-light text-white/60">{lead.profile.company}</p>
        )}
        {lead.profile.phone && (
          <p className="text-sm text-white/40 font-light">{lead.profile.phone}</p>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-light ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="font-light text-white">{lead.selectionCount} items</p>
        {lead.selectionValue > 0 && (
          <p className="text-sm text-white/40 font-light">
            £{lead.selectionValue.toLocaleString()}
          </p>
        )}
      </td>
      <td className="px-6 py-4">
        {lead.submission ? (
          <span className="text-white/60 font-light">{lead.submission.submission_number}</span>
        ) : (
          <span className="text-white/30 font-light">-</span>
        )}
      </td>
      <td className="px-6 py-4">
        <p className="text-white/60 font-light">
          {new Date(lead.createdAt).toLocaleDateString("en-GB")}
        </p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Call"
          >
            <Phone className="w-4 h-4 text-white/40" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Email"
          >
            <Mail className="w-4 h-4 text-white/40" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PipelineColumn({ 
  status, 
  leads,
  onLeadClick,
}: { 
  status: LeadStatus; 
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  const statusInfo = LEAD_STATUS_INFO[status];
  const totalValue = leads.reduce((sum, l) => sum + l.selectionValue, 0);

  return (
    <div className="flex-shrink-0 w-72 bg-white/5 rounded-xl border border-white/10">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-light text-white text-sm">{statusInfo.label}</h3>
            <span className="bg-white/10 text-white/60 text-xs font-light px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-white/40 font-light">
          £{totalValue.toLocaleString()} value
        </p>
      </div>

      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-380px)] overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard 
            key={lead.id} 
            lead={lead} 
            onClick={() => onLeadClick(lead)}
          />
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-white/20 font-light">
            <p className="text-xs">No leads</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadDetailPanel({ 
  lead, 
  onClose 
}: { 
  lead: Lead; 
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "selection" | "outreach" | "payments" | "notes">("overview");
  const [showOutreachForm, setShowOutreachForm] = useState(false);
  const [outreachType, setOutreachType] = useState<OutreachType>("call");
  const [outreachOutcome, setOutreachOutcome] = useState<OutreachOutcome>("spoke");
  const [outreachNotes, setOutreachNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const statusInfo = LEAD_STATUS_INFO[lead.status];
  const name = `${lead.profile.first_name || ""} ${lead.profile.last_name || ""}`.trim() || lead.profile.email;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-black border-l border-white/10 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-black border-b border-white/10 p-4 flex items-center justify-between">
        <h2 className="text-lg font-light text-white">{name}</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-white/40" />
        </button>
      </div>

      {/* Status Badge */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-light ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-white/40 font-light text-sm">{statusInfo.description}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-white/10 flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 font-light text-sm">
          <Phone className="w-4 h-4" />
          Call
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 font-light text-sm">
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 font-light text-sm">
          <Send className="w-4 h-4" />
          Quote
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {(["overview", "selection", "outreach", "payments", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-light transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "outreach" && lead.outreach.totalOutreachCount > 0 && (
                <span className="ml-1 text-xs text-white/40">({lead.outreach.totalOutreachCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-light text-white/40 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-white/40" />
                  <span className="text-white/80 font-light">{lead.profile.email}</span>
                </div>
                {lead.profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-white/40" />
                    <span className="text-white/80 font-light">{lead.profile.phone}</span>
                  </div>
                )}
                {lead.profile.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-white/40" />
                    <span className="text-white/80 font-light">{lead.profile.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {lead.profile.address_line_1 && (
              <div>
                <h3 className="text-sm font-light text-white/40 mb-3">Address</h3>
                <p className="text-white/80 font-light">
                  {lead.profile.address_line_1}
                  {lead.profile.address_line_2 && <>, {lead.profile.address_line_2}</>}
                  <br />
                  {lead.profile.city}, {lead.profile.postcode}
                  <br />
                  {lead.profile.country}
                </p>
              </div>
            )}

            {/* Submission Info */}
            {lead.submission && (
              <div>
                <h3 className="text-sm font-light text-white/40 mb-3">Submission</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-light">{lead.submission.submission_number}</span>
                    <span className="text-white/60 font-light text-sm">
                      {new Date(lead.submission.submitted_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  {lead.submission.notes && (
                    <p className="text-white/60 font-light text-sm">{lead.submission.notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-light text-white/40 mb-3">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40 font-light">Registered</span>
                  <span className="text-white/60 font-light">
                    {new Date(lead.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                {lead.lastContactedAt && (
                  <div className="flex justify-between">
                    <span className="text-white/40 font-light">Last Contacted</span>
                    <span className="text-white/60 font-light">
                      {new Date(lead.lastContactedAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                )}
                {lead.meetingScheduledAt && (
                  <div className="flex justify-between">
                    <span className="text-white/40 font-light">Meeting</span>
                    <span className="text-white/60 font-light">
                      {new Date(lead.meetingScheduledAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                )}
                {lead.nextFollowUp && (
                  <div className="flex justify-between">
                    <span className="text-white/40 font-light">Next Follow-up</span>
                    <span className="text-white font-light">{lead.nextFollowUp}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "selection" && (
          <div className="space-y-4">
            {lead.selectionItems.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-white/40 font-light text-sm">
                    {lead.selectionCount} items selected
                  </span>
                  <span className="text-white font-light">
                    £{lead.selectionValue.toLocaleString()}
                  </span>
                </div>
                {lead.selectionItems.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-white font-light">{item.product_name}</span>
                      <span className="text-white/60 font-light">
                        £{((item.unit_price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/40 font-light">
                      {item.product_category && <span>{item.product_category}</span>}
                      {item.colour && <span>• {item.colour}</span>}
                      <span>• Qty: {item.quantity}</span>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-white/40 font-light mt-2 italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-white/30 font-light">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No items selected yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="space-y-6">
            {/* Nurturing Status */}
            <div>
              <h3 className="text-sm font-light text-white/40 mb-3">Nurturing Status</h3>
              <div className="flex gap-2">
                {(Object.keys(NURTURING_STATUS_INFO) as NurturingStatus[]).map((status) => {
                  const info = NURTURING_STATUS_INFO[status];
                  const isActive = lead.outreach.nurturingStatus === status;
                  return (
                    <button
                      key={status}
                      className={`px-3 py-1.5 rounded-lg text-sm font-light transition-colors ${
                        isActive
                          ? "bg-white text-black"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outreach Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/40 font-light text-sm mb-1">Total Outreach</p>
                <p className="text-2xl font-light text-white">
                  {lead.outreach.totalOutreachCount}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/40 font-light text-sm mb-1">Last Contact</p>
                <p className="text-lg font-light text-white">
                  {lead.outreach.lastOutreachAt 
                    ? new Date(lead.outreach.lastOutreachAt).toLocaleDateString("en-GB")
                    : "Never"
                  }
                </p>
              </div>
            </div>

            {/* Next Follow-up */}
            {lead.outreach.nextFollowUpAt && (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-light">Next Follow-up</p>
                    <p className="text-white/60 font-light text-sm">
                      {new Date(lead.outreach.nextFollowUpAt).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-white/40" />
                </div>
              </div>
            )}

            {/* Log New Outreach */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-light text-white/40">Log Outreach</h3>
                <button
                  onClick={() => setShowOutreachForm(!showOutreachForm)}
                  className="text-sm text-white/60 hover:text-white font-light"
                >
                  {showOutreachForm ? "Cancel" : "+ Add"}
                </button>
              </div>

              {showOutreachForm && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-4">
                  <div>
                    <label className="block text-sm text-white/40 font-light mb-2">Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(OUTREACH_TYPE_INFO) as OutreachType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setOutreachType(type)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-light transition-colors ${
                            outreachType === type
                              ? "bg-white text-black"
                              : "bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          {OUTREACH_TYPE_INFO[type].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/40 font-light mb-2">Outcome</label>
                    <select
                      value={outreachOutcome}
                      onChange={(e) => setOutreachOutcome(e.target.value as OutreachOutcome)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
                    >
                      {(Object.keys(OUTREACH_OUTCOME_INFO) as OutreachOutcome[]).map((outcome) => (
                        <option key={outcome} value={outcome}>
                          {OUTREACH_OUTCOME_INFO[outcome].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/40 font-light mb-2">Notes</label>
                    <textarea
                      value={outreachNotes}
                      onChange={(e) => setOutreachNotes(e.target.value)}
                      placeholder="What was discussed..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/40 font-light mb-2">Schedule Follow-up</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                  </div>

                  <button className="w-full py-2 bg-white text-black rounded-lg font-light hover:bg-white/90 transition-colors">
                    Log Outreach
                  </button>
                </div>
              )}
            </div>

            {/* Outreach History */}
            <div>
              <h3 className="text-sm font-light text-white/40 mb-3">Outreach History</h3>
              {lead.outreach.outreachHistory.length > 0 ? (
                <div className="space-y-3">
                  {lead.outreach.outreachHistory.map((record) => (
                    <div 
                      key={record.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-light ${
                            OUTREACH_OUTCOME_INFO[record.outcome].color
                          }`}>
                            {OUTREACH_OUTCOME_INFO[record.outcome].label}
                          </span>
                          <span className="text-white/40 text-xs font-light">
                            via {OUTREACH_TYPE_INFO[record.type].label}
                          </span>
                        </div>
                        <span className="text-white/40 text-xs font-light">
                          {new Date(record.createdAt).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      {record.notes && (
                        <p className="text-white/60 font-light text-sm">{record.notes}</p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <span className="text-white/30 text-xs font-light">
                          by {record.createdByName}
                        </span>
                        {record.followUpDate && (
                          <span className="text-white/40 text-xs font-light flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Follow-up: {record.followUpDate}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/30 font-light">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No outreach recorded yet</p>
                  <p className="text-sm mt-1">Log your first contact above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/40 font-light text-sm mb-1">Total Value</p>
                <p className="text-2xl font-light text-white">
                  £{lead.selectionValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/40 font-light text-sm mb-1">Amount Paid</p>
                <p className="text-2xl font-light text-white">
                  £{lead.totalPaid.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Payment Stages */}
            <div>
              <h3 className="text-sm font-light text-white/40 mb-3">Payment Schedule</h3>
              <div className="space-y-3">
                {(["deposit", "production", "delivery"] as const).map((stage) => {
                  const stageInfo = PAYMENT_STAGES[stage];
                  const payment = lead.payments.find((p) => p.type === stage);
                  const amount = Math.round(lead.selectionValue * (stageInfo.percentage / 100));
                  
                  return (
                    <div 
                      key={stage}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-light">{stageInfo.label}</span>
                          <span className="text-white/40 font-light text-sm ml-2">
                            ({stageInfo.percentage}%)
                          </span>
                        </div>
                        <span className="text-white font-light">
                          £{amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/40 font-light text-sm">
                          {stageInfo.description}
                        </span>
                        {payment?.status === "paid" ? (
                          <span className="px-2 py-0.5 bg-white text-black rounded text-xs font-light">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded text-xs font-light">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment History */}
            {lead.payments.length > 0 && (
              <div>
                <h3 className="text-sm font-light text-white/40 mb-3">Payment History</h3>
                <div className="space-y-2">
                  {lead.payments.map((payment) => (
                    <div 
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b border-white/5"
                    >
                      <div>
                        <p className="text-white font-light text-sm">{payment.reference}</p>
                        <p className="text-white/40 font-light text-xs">
                          {payment.paidAt && new Date(payment.paidAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <span className="text-white font-light">
                        £{payment.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            {/* Add Note */}
            <div>
              <textarea
                placeholder="Add a note..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button className="px-4 py-2 bg-white text-black rounded-lg font-light text-sm hover:bg-white/90 transition-colors">
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            {lead.notes.length > 0 ? (
              <div className="space-y-3">
                {lead.notes.map((note) => (
                  <div 
                    key={note.id}
                    className={`bg-white/5 rounded-lg p-4 border ${
                      note.isPinned ? "border-white/30" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 font-light text-sm">{note.authorName}</span>
                      <span className="text-white/40 font-light text-xs">
                        {new Date(note.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <p className="text-white/80 font-light text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/30 font-light">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notes yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Use mock data for now
  const leads = getMockLeads();
  const stats = getMockLeadStats();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const name = `${lead.profile.first_name || ""} ${lead.profile.last_name || ""}`.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        name.includes(searchQuery.toLowerCase()) ||
        lead.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.profile.company?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const leadsByStatus = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, status) => {
      acc[status] = filteredLeads.filter((l) => l.status === status);
      return acc;
    }, {} as Record<LeadStatus, Lead[]>);
  }, [filteredLeads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Lead Management</h1>
          <p className="text-white/40 mt-1 font-light">
            {stats.total} leads • £{stats.totalPipelineValue.toLocaleString()} pipeline value
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{stats.newThisWeek}</p>
              <p className="text-xs text-white/40 font-light">New This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{stats.byStatus.submitted || 0}</p>
              <p className="text-xs text-white/40 font-light">Awaiting Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">{stats.byStatus.meeting_scheduled || 0}</p>
              <p className="text-xs text-white/40 font-light">Meetings Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-white/40" />
            <div>
              <p className="text-lg font-light text-white">
                £{Math.round(stats.avgSelectionValue).toLocaleString()}
              </p>
              <p className="text-xs text-white/40 font-light">Avg Selection Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "all")}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 font-light focus:outline-none focus:ring-1 focus:ring-white/30"
        >
          <option value="all">All Statuses</option>
          {Object.entries(LEAD_STATUS_INFO).map(([status, info]) => (
            <option key={status} value={status}>
              {info.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setViewMode("pipeline")}
            className={`px-4 py-1.5 rounded-md text-sm font-light transition-colors ${
              viewMode === "pipeline"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-1.5 rounded-md text-sm font-light transition-colors ${
              viewMode === "list"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "pipeline" ? (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {PIPELINE_STAGES.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              leads={leadsByStatus[status] || []}
              onLeadClick={setSelectedLead}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Contact</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Company</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Status</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Selection</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Reference</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm">Created</th>
                  <th className="px-6 py-4 font-light text-white/60 text-sm w-32"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <LeadRow 
                    key={lead.id} 
                    lead={lead} 
                    onClick={() => setSelectedLead(lead)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-white/40 font-light">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No leads found</p>
            </div>
          )}
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
          />
        </>
      )}
    </div>
  );
}
