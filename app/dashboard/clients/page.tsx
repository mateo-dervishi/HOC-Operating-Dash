"use client";

import { useState } from "react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PIPELINE_STAGES, PipelineStage, PRIORITIES } from "@/types/admin";

// Mock data for development
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  stage: PipelineStage;
  priority: "low" | "normal" | "high" | "urgent";
  estimatedValue: number;
  lastActivity: string;
  nextFollowUp?: string;
  assignedTo: string;
}

const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "James Richardson",
    email: "james@richardson.com",
    phone: "020 7123 4567",
    company: "Richardson Interiors",
    stage: "new_lead",
    priority: "high",
    estimatedValue: 45000,
    lastActivity: "2 hours ago",
    nextFollowUp: "Today",
    assignedTo: "Mateo",
  },
  {
    id: "2",
    name: "Sarah Mitchell",
    email: "sarah@mitchellhome.co.uk",
    phone: "020 8234 5678",
    stage: "selection_submitted",
    priority: "normal",
    estimatedValue: 32000,
    lastActivity: "1 day ago",
    assignedTo: "Mateo",
  },
  {
    id: "3",
    name: "David Thompson",
    email: "david.t@email.com",
    phone: "07700 900123",
    company: "Thompson & Partners",
    stage: "quoted",
    priority: "urgent",
    estimatedValue: 78000,
    lastActivity: "3 hours ago",
    nextFollowUp: "Tomorrow",
    assignedTo: "Mateo",
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@gmail.com",
    phone: "07700 900456",
    stage: "negotiating",
    priority: "high",
    estimatedValue: 25000,
    lastActivity: "5 hours ago",
    assignedTo: "Mateo",
  },
  {
    id: "5",
    name: "Michael Brown",
    email: "m.brown@browndesign.com",
    phone: "020 7456 7890",
    company: "Brown Design Studio",
    stage: "confirmed",
    priority: "normal",
    estimatedValue: 56000,
    lastActivity: "2 days ago",
    assignedTo: "Mateo",
  },
  {
    id: "6",
    name: "Lisa Anderson",
    email: "lisa@andersonarch.com",
    phone: "07800 123456",
    company: "Anderson Architecture",
    stage: "in_progress",
    priority: "normal",
    estimatedValue: 89000,
    lastActivity: "1 day ago",
    assignedTo: "Mateo",
  },
  {
    id: "7",
    name: "Robert Taylor",
    email: "r.taylor@email.co.uk",
    phone: "020 8567 8901",
    stage: "new_lead",
    priority: "low",
    estimatedValue: 15000,
    lastActivity: "4 days ago",
    assignedTo: "Mateo",
  },
  {
    id: "8",
    name: "Jennifer Clark",
    email: "jen.clark@clarkinteriors.com",
    phone: "07900 234567",
    company: "Clark Interiors",
    stage: "quoted",
    priority: "normal",
    estimatedValue: 42000,
    lastActivity: "6 hours ago",
    nextFollowUp: "In 2 days",
    assignedTo: "Mateo",
  },
];

// Client Card Component
function ClientCard({ client, isDragging }: { client: Client; isDragging?: boolean }) {
  const priorityColors = {
    low: "bg-gray-100 text-gray-600",
    normal: "bg-blue-100 text-blue-600",
    high: "bg-orange-100 text-orange-600",
    urgent: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab ${
        isDragging ? "shadow-lg ring-2 ring-blue-500 opacity-90" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{client.name}</h4>
          {client.company && (
            <p className="text-sm text-gray-500 truncate">{client.company}</p>
          )}
        </div>
        <button className="p-1 hover:bg-gray-100 rounded">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-3.5 h-3.5" />
          <span className="truncate">{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Phone className="w-3.5 h-3.5" />
          <span>{client.phone}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[client.priority]}`}
        >
          {PRIORITIES[client.priority].label}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <DollarSign className="w-3 h-3" />
          £{client.estimatedValue.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {client.lastActivity}
        </span>
        {client.nextFollowUp && (
          <span className="flex items-center gap-1 text-orange-500">
            <Calendar className="w-3 h-3" />
            {client.nextFollowUp}
          </span>
        )}
      </div>
    </div>
  );
}

// Sortable Client Card
function SortableClientCard({ client }: { client: Client }) {
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
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ClientCard client={client} isDragging={isDragging} />
    </div>
  );
}

// Pipeline Column Component
function PipelineColumn({
  stage,
  clients,
}: {
  stage: PipelineStage;
  clients: Client[];
}) {
  const stageInfo = PIPELINE_STAGES[stage];
  const totalValue = clients.reduce((sum, c) => sum + c.estimatedValue, 0);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-xl">
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stageInfo.color}`} />
            <h3 className="font-semibold text-gray-900">{stageInfo.label}</h3>
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {clients.length}
            </span>
          </div>
          <button className="p-1 hover:bg-gray-200 rounded">
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500">
          £{totalValue.toLocaleString()} total value
        </p>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-320px)] overflow-y-auto">
        <SortableContext
          items={clients.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {clients.map((client) => (
            <SortableClientCard key={client.id} client={client} />
          ))}
        </SortableContext>
        {clients.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No clients in this stage</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group clients by stage
  const clientsByStage = Object.keys(PIPELINE_STAGES).reduce((acc, stage) => {
    acc[stage as PipelineStage] = clients.filter(
      (c) =>
        c.stage === stage &&
        (searchQuery === "" ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return acc;
  }, {} as Record<PipelineStage, Client[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const client = clients.find((c) => c.id === event.active.id);
    if (client) setActiveClient(client);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);

    if (!over) return;

    const activeClient = clients.find((c) => c.id === active.id);
    if (!activeClient) return;

    // Find which column was dropped into
    const overClient = clients.find((c) => c.id === over.id);
    if (overClient && activeClient.stage !== overClient.stage) {
      // Move to the same stage as the client we dropped over
      setClients((prev) =>
        prev.map((c) =>
          c.id === active.id ? { ...c, stage: overClient.stage } : c
        )
      );
    }
  };

  // Visible stages (excluding lost/complete for main view)
  const visibleStages: PipelineStage[] = [
    "new_lead",
    "selection_submitted",
    "quoted",
    "negotiating",
    "confirmed",
    "in_progress",
    "delivered",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Pipeline</h1>
          <p className="text-gray-500 mt-1">
            Manage your clients through the sales pipeline
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Users className="w-4 h-4" />
          Assigned to me
        </button>
      </div>

      {/* Pipeline Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {visibleStages.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              clients={clientsByStage[stage]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeClient ? <ClientCard client={activeClient} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
        <span>
          <strong className="text-gray-900">{clients.length}</strong> total
          clients
        </span>
        <span>
          <strong className="text-gray-900">
            £{clients.reduce((sum, c) => sum + c.estimatedValue, 0).toLocaleString()}
          </strong>{" "}
          pipeline value
        </span>
        <span>
          <strong className="text-gray-900">
            {clients.filter((c) => c.priority === "urgent" || c.priority === "high").length}
          </strong>{" "}
          high priority
        </span>
      </div>
    </div>
  );
}

