"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Search,
  Phone,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  Package,
  Users,
  RefreshCw,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  fetchPipelineClients,
  getPipelineStats,
  updatePipelineStage,
  type PipelineClient,
  type PipelineStage,
  type PipelineStats,
  type Priority,
} from "@/lib/services/pipeline";

// Stage display info
const STAGE_INFO: Record<PipelineStage, { label: string; color: string; bgColor: string }> = {
  submitted: { label: "New Submission", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  contacted: { label: "Contacted", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  meeting_scheduled: { label: "Meeting Scheduled", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  quoted: { label: "Quote Sent", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  deposit_paid: { label: "Deposit Paid", color: "text-green-400", bgColor: "bg-green-500/20" },
  in_production: { label: "In Production", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  ready_delivery: { label: "Ready for Delivery", color: "text-pink-400", bgColor: "bg-pink-500/20" },
  completed: { label: "Completed", color: "text-white/60", bgColor: "bg-white/10" },
  lost: { label: "Lost", color: "text-red-400", bgColor: "bg-red-500/20" },
};

const PRIORITY_INFO: Record<Priority, { color: string; label: string }> = {
  normal: { color: "border-white/10", label: "Normal" },
  high: { color: "border-yellow-500/50", label: "High" },
  urgent: { color: "border-red-500/50", label: "Urgent" },
};

// Helper functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatCurrency(value: number): string {
  return `£${value.toLocaleString()}`;
}

function calculatePaymentPercentage(client: PipelineClient): number {
  const total = client.quoteValue || client.selectionValue;
  if (total === 0) return 0;
  return Math.round((client.totalPaid / total) * 100);
}

// Components
function PipelineStatsComponent({ stats, isLoading }: { stats: PipelineStats | null; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-20 mb-2" />
            <div className="h-8 bg-white/10 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
          <AlertCircle className="w-4 h-4" />
          New Submissions
        </div>
        <p className="text-2xl font-light text-white">{stats.newSubmissions}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
          <Users className="w-4 h-4" />
          Active Deals
        </div>
        <p className="text-2xl font-light text-white">{stats.activeDeals}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
          <DollarSign className="w-4 h-4" />
          Pipeline Value
        </div>
        <p className="text-2xl font-light text-white">{formatCurrency(stats.totalPipelineValue)}</p>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
          <CheckCircle2 className="w-4 h-4" />
          Completed
        </div>
        <p className="text-2xl font-light text-white">{stats.completedThisMonth}</p>
      </div>
    </div>
  );
}

// Sortable Client Card
function SortableClientCard({
  client,
  onClick,
}: {
  client: PipelineClient;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const paymentPercentage = calculatePaymentPercentage(client);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white/5 border ${PRIORITY_INFO[client.priority].color} rounded-lg p-4 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors ${isDragging ? "shadow-lg shadow-white/10 ring-2 ring-white/20" : ""}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1" onClick={onClick}>
          {/* Priority indicator */}
          {client.priority !== "normal" && (
            <div className={`text-xs mb-2 ${client.priority === "urgent" ? "text-red-400" : "text-yellow-400"}`}>
              {client.priority === "urgent" ? "⚡ Urgent" : "⭐ High Priority"}
            </div>
          )}

          {/* Name & Contact */}
          <div className="mb-3">
            <h3 className="font-light text-white">{client.name}</h3>
            <p className="text-sm text-white/40">{client.email}</p>
          </div>

          {/* Selection Info */}
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-white/60">{client.selectionCount} items</span>
            <span className="text-white">{formatCurrency(client.quoteValue || client.selectionValue)}</span>
          </div>

          {/* Payment Progress (if applicable) */}
          {client.totalPaid > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                <span>Payment</span>
                <span>{paymentPercentage}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Assigned & Date */}
          <div className="flex items-center justify-between text-xs text-white/40">
            {client.assignedToName && <span>{client.assignedToName}</span>}
            <span>{formatDate(client.submittedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Drag Overlay Card (what you see while dragging)
function DragOverlayCard({ client }: { client: PipelineClient }) {
  const paymentPercentage = calculatePaymentPercentage(client);

  return (
    <div
      className={`bg-white/10 border ${PRIORITY_INFO[client.priority].color} rounded-lg p-4 shadow-2xl shadow-black/50 ring-2 ring-white/30 w-72`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1 text-white/60">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1">
          {client.priority !== "normal" && (
            <div className={`text-xs mb-2 ${client.priority === "urgent" ? "text-red-400" : "text-yellow-400"}`}>
              {client.priority === "urgent" ? "⚡ Urgent" : "⭐ High Priority"}
            </div>
          )}

          <div className="mb-3">
            <h3 className="font-light text-white">{client.name}</h3>
            <p className="text-sm text-white/40">{client.email}</p>
          </div>

          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-white/60">{client.selectionCount} items</span>
            <span className="text-white">{formatCurrency(client.quoteValue || client.selectionValue)}</span>
          </div>

          {client.totalPaid > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                <span>Payment</span>
                <span>{paymentPercentage}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-white/40">
            {client.assignedToName && <span>{client.assignedToName}</span>}
            <span>{formatDate(client.submittedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Droppable Kanban Column
function KanbanColumn({
  stage,
  clients,
  onClientClick,
  isOver,
}: {
  stage: PipelineStage;
  clients: PipelineClient[];
  onClientClick: (client: PipelineClient) => void;
  isOver?: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stage });
  const stageInfo = STAGE_INFO[stage];

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stageInfo.bgColor}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${stageInfo.color}`}>{stageInfo.label}</span>
          <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
            {clients.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`bg-white/5 border border-white/10 border-t-0 rounded-b-lg p-3 min-h-[400px] space-y-3 transition-colors ${
          isOver ? "bg-white/10 ring-2 ring-white/20 ring-inset" : ""
        }`}
      >
        <SortableContext items={clients.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map((client) => (
            <SortableClientCard
              key={client.id}
              client={client}
              onClick={() => onClientClick(client)}
            />
          ))}
        </SortableContext>
        {clients.length === 0 && (
          <div className={`text-center py-8 text-sm transition-colors ${isOver ? "text-white/60" : "text-white/30"}`}>
            {isOver ? "Drop here" : "No clients"}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientDetailPanel({
  client,
  onClose,
  onStageChange,
}: {
  client: PipelineClient;
  onClose: () => void;
  onStageChange: (clientId: string, newStage: PipelineStage) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "notes">("overview");
  const paymentPercentage = calculatePaymentPercentage(client);
  const stageInfo = STAGE_INFO[client.stage];

  // Calculate payment milestones
  const quoteValue = client.quoteValue || client.selectionValue;
  const deposit20 = Math.round(quoteValue * 0.2);
  const production70 = Math.round(quoteValue * 0.7);
  const final10 = Math.round(quoteValue * 0.1);

  // Get next stage
  const stageOrder: PipelineStage[] = [
    "submitted",
    "contacted",
    "meeting_scheduled",
    "quoted",
    "deposit_paid",
    "in_production",
    "ready_delivery",
    "completed",
  ];
  const currentIndex = stageOrder.indexOf(client.stage);
  const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-black border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${stageInfo.bgColor} ${stageInfo.color}`}>
                {stageInfo.label}
              </span>
              {client.priority !== "normal" && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  client.priority === "urgent" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {client.priority === "urgent" ? "Urgent" : "High Priority"}
                </span>
              )}
            </div>
            <h2 className="text-xl font-light text-white">{client.name}</h2>
            <p className="text-white/40">{client.email}</p>
            {client.phone && <p className="text-white/40 text-sm">{client.phone}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <Phone className="w-5 h-5 text-white/60" />
            <span className="text-xs text-white/60">Call</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <Mail className="w-5 h-5 text-white/60" />
            <span className="text-xs text-white/60">Email</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <Calendar className="w-5 h-5 text-white/60" />
            <span className="text-xs text-white/60">Meeting</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <FileText className="w-5 h-5 text-white/60" />
            <span className="text-xs text-white/60">Quote</span>
          </button>
        </div>

        {/* Move to Next Stage */}
        {nextStage && client.stage !== "lost" && (
          <button
            onClick={() => onStageChange(client.id, nextStage)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors mb-6"
          >
            Move to {STAGE_INFO[nextStage].label}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {(["overview", "payments", "notes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize ${
                activeTab === tab
                  ? "text-white border-b-2 border-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Selection Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm text-white/40 mb-3">Selection Summary</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-light text-white">{client.selectionCount} items</p>
                  <p className="text-white/60">{formatCurrency(client.selectionValue)} total value</p>
                  {client.quoteValue && client.quoteValue !== client.selectionValue && (
                    <p className="text-sm text-green-400">Quoted: {formatCurrency(client.quoteValue)}</p>
                  )}
                </div>
                <Package className="w-8 h-8 text-white/20" />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm text-white/40 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm text-white">Submitted</p>
                    <p className="text-xs text-white/40">{formatDate(client.submittedAt)}</p>
                  </div>
                </div>
                {client.lastContactedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm text-white">Last Contacted</p>
                      <p className="text-xs text-white/40">{formatDate(client.lastContactedAt)}</p>
                    </div>
                  </div>
                )}
                {client.meetingDate && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm text-white">Meeting</p>
                      <p className="text-xs text-white/40">{formatDate(client.meetingDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned To */}
            {client.assignedToName && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-white/40 mb-1">Assigned To</p>
                <p className="text-white">{client.assignedToName}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Payment Progress */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-white/40">Payment Progress</h3>
                <span className="text-white font-light">
                  {formatCurrency(client.totalPaid)} / {formatCurrency(quoteValue)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
              <p className="text-right text-sm text-white/40">{paymentPercentage}% paid</p>
            </div>

            {/* Payment Milestones */}
            <div className="space-y-3">
              {/* Deposit */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                client.depositPaid ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center gap-3">
                  {client.depositPaid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/40" />
                  )}
                  <div>
                    <p className="text-sm text-white">20% Deposit</p>
                    <p className="text-xs text-white/40">{formatCurrency(deposit20)}</p>
                  </div>
                </div>
                {client.depositPaid && (
                  <span className="text-sm text-green-400">{formatCurrency(client.depositPaid)}</span>
                )}
              </div>

              {/* Production */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                client.productionPaid ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center gap-3">
                  {client.productionPaid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/40" />
                  )}
                  <div>
                    <p className="text-sm text-white">70% Production</p>
                    <p className="text-xs text-white/40">{formatCurrency(production70)}</p>
                  </div>
                </div>
                {client.productionPaid && (
                  <span className="text-sm text-green-400">{formatCurrency(client.productionPaid)}</span>
                )}
              </div>

              {/* Final */}
              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                client.finalPaid ? "bg-green-500/10 border-green-500/20" : "bg-white/5 border-white/10"
              }`}>
                <div className="flex items-center gap-3">
                  {client.finalPaid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/40" />
                  )}
                  <div>
                    <p className="text-sm text-white">10% Delivery</p>
                    <p className="text-xs text-white/40">{formatCurrency(final10)}</p>
                  </div>
                </div>
                {client.finalPaid && (
                  <span className="text-sm text-green-400">{formatCurrency(client.finalPaid)}</span>
                )}
              </div>
            </div>

            {/* Record Payment Button */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors">
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            {client.notes && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/80 font-light">{client.notes}</p>
                <p className="text-xs text-white/40 mt-2">Initial note</p>
              </div>
            )}
            <textarea
              placeholder="Add a note..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light text-sm focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
              rows={4}
            />
            <button className="px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-white/90 transition-colors">
              Save Note
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Page
export default function ClientPipelinePage() {
  const [clients, setClients] = useState<PipelineClient[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<PipelineClient | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Fetch data on mount
  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    setIsLoading(true);
    try {
      const fetchedClients = await fetchPipelineClients();
      setClients(fetchedClients);
      
      const fetchedStats = getPipelineStats(fetchedClients);
      setStats(fetchedStats);
    } catch (error) {
      console.error("Error loading pipeline data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique assignees
  const assignees = useMemo(() => {
    const unique = new Set(clients.map((c) => c.assignedToName).filter(Boolean));
    return Array.from(unique) as string[];
  }, [clients]);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !client.name.toLowerCase().includes(query) &&
          !client.email.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (assigneeFilter !== "all" && client.assignedToName !== assigneeFilter) {
        return false;
      }
      return true;
    });
  }, [clients, searchQuery, assigneeFilter]);

  // Pipeline stages in order
  const stages: PipelineStage[] = [
    "submitted",
    "contacted",
    "meeting_scheduled",
    "quoted",
    "deposit_paid",
    "in_production",
    "ready_delivery",
    "completed",
  ];

  // Group by stage
  const clientsByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = filteredClients.filter((c) => c.stage === stage);
      return acc;
    }, {} as Record<PipelineStage, PipelineClient[]>);
  }, [filteredClients]);

  // Get the active client being dragged
  const activeClient = useMemo(() => {
    if (!activeId) return null;
    return clients.find((c) => c.id === activeId) || null;
  }, [activeId, clients]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Check if over is a stage (column)
      if (stages.includes(over.id as PipelineStage)) {
        setOverId(over.id as string);
      } else {
        // It's over another card, find which stage that card belongs to
        const overClient = clients.find((c) => c.id === over.id);
        if (overClient) {
          setOverId(overClient.stage);
        }
      }
    } else {
      setOverId(null);
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeClientId = active.id as string;
    let newStage: PipelineStage | null = null;

    // Check if dropped on a column
    if (stages.includes(over.id as PipelineStage)) {
      newStage = over.id as PipelineStage;
    } else {
      // Dropped on a card - find which stage that card belongs to
      const overClient = clients.find((c) => c.id === over.id);
      if (overClient) {
        newStage = overClient.stage;
      }
    }

    if (!newStage) return;

    // Find the active client
    const activeClientData = clients.find((c) => c.id === activeClientId);
    if (!activeClientData || activeClientData.stage === newStage) return;

    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === activeClientId ? { ...c, stage: newStage! } : c))
    );

    // Update stats
    const updatedClients = clients.map((c) =>
      c.id === activeClientId ? { ...c, stage: newStage! } : c
    );
    setStats(getPipelineStats(updatedClients));

    // Persist to database
    await updatePipelineStage(activeClientId, newStage);
  };

  // Handle stage change from detail panel
  const handleStageChange = async (clientId: string, newStage: PipelineStage) => {
    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
    );
    
    // Update selected client if it's the one being changed
    setSelectedClient((prev) =>
      prev?.id === clientId ? { ...prev, stage: newStage } : prev
    );
    
    // Update in database
    await updatePipelineStage(clientId, newStage);
    
    // Recalculate stats
    const updatedStats = getPipelineStats(
      clients.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
    );
    setStats(updatedStats);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Client Pipeline</h1>
          <p className="text-white/40">Manage clients who have submitted selections</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadPipelineData}
            disabled={isLoading}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="/dashboard/leads"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Users className="w-4 h-4" />
            View All Leads
          </a>
        </div>
      </div>

      {/* Stats */}
      <PipelineStatsComponent stats={stats} isLoading={isLoading} />

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none"
        >
          <option value="all">All Assignees</option>
          {assignees.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>
      </div>

      {/* Drag hint */}
      <p className="text-xs text-white/30">💡 Drag cards between columns to update stage</p>

      {/* Kanban Board with DnD */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  clients={clientsByStage[stage]}
                  onClientClick={setSelectedClient}
                  isOver={overId === stage}
                />
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeClient ? <DragOverlayCard client={activeClient} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Client Detail Panel */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedClient(null)}
            />
            <ClientDetailPanel
              client={selectedClient}
              onClose={() => setSelectedClient(null)}
              onStageChange={handleStageChange}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
