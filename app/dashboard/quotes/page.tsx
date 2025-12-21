"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Copy,
  Download,
  ChevronRight,
} from "lucide-react";

type QuoteStatus = "draft" | "sent" | "viewed" | "approved" | "rejected" | "expired";

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  status: QuoteStatus;
  totalAmount: number;
  itemCount: number;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  version: number;
}

const MOCK_QUOTES: Quote[] = [
  {
    id: "1",
    quoteNumber: "QT-2024-001",
    clientName: "James Richardson",
    clientEmail: "james@richardson.com",
    status: "sent",
    totalAmount: 24500,
    itemCount: 8,
    validUntil: "2024-02-15",
    createdAt: "2024-01-15",
    sentAt: "2024-01-16",
    version: 1,
  },
  {
    id: "2",
    quoteNumber: "QT-2024-002",
    clientName: "Sarah Mitchell",
    clientEmail: "sarah@mitchellhome.co.uk",
    status: "viewed",
    totalAmount: 18900,
    itemCount: 5,
    validUntil: "2024-02-20",
    createdAt: "2024-01-18",
    sentAt: "2024-01-18",
    viewedAt: "2024-01-19",
    version: 1,
  },
  {
    id: "3",
    quoteNumber: "QT-2024-003",
    clientName: "David Thompson",
    clientEmail: "david.t@email.com",
    status: "approved",
    totalAmount: 45000,
    itemCount: 12,
    validUntil: "2024-02-10",
    createdAt: "2024-01-10",
    sentAt: "2024-01-10",
    viewedAt: "2024-01-11",
    version: 2,
  },
  {
    id: "4",
    quoteNumber: "QT-2024-004",
    clientName: "Emma Wilson",
    clientEmail: "emma.wilson@gmail.com",
    status: "draft",
    totalAmount: 12500,
    itemCount: 3,
    validUntil: "2024-02-28",
    createdAt: "2024-01-22",
    version: 1,
  },
  {
    id: "5",
    quoteNumber: "QT-2024-005",
    clientName: "Michael Brown",
    clientEmail: "m.brown@browndesign.com",
    status: "expired",
    totalAmount: 32000,
    itemCount: 6,
    validUntil: "2024-01-15",
    createdAt: "2024-01-01",
    sentAt: "2024-01-02",
    version: 1,
  },
  {
    id: "6",
    quoteNumber: "QT-2024-006",
    clientName: "Lisa Anderson",
    clientEmail: "lisa@andersonarch.com",
    status: "rejected",
    totalAmount: 89000,
    itemCount: 15,
    validUntil: "2024-02-01",
    createdAt: "2024-01-08",
    sentAt: "2024-01-08",
    viewedAt: "2024-01-09",
    version: 1,
  },
];

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; icon: typeof FileText }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-500", icon: Send },
  viewed: { label: "Viewed", color: "bg-purple-500", icon: Eye },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500", icon: XCircle },
  expired: { label: "Expired", color: "bg-orange-500", icon: Clock },
};

function QuoteCard({ quote }: { quote: Quote }) {
  const config = STATUS_CONFIG[quote.status];
  const StatusIcon = config.icon;
  const isOverdue = new Date(quote.validUntil) < new Date() && quote.status === "sent";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-medium text-gray-900">
              {quote.quoteNumber}
            </span>
            {quote.version > 1 && (
              <span className="text-xs text-gray-400">v{quote.version}</span>
            )}
          </div>
          <h3 className="font-medium text-gray-900">{quote.clientName}</h3>
          <p className="text-sm text-gray-500">{quote.clientEmail}</p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1 ${config.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <p className="text-2xl font-semibold text-gray-900">
            £{quote.totalAmount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{quote.itemCount} items</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span>
          Created: {new Date(quote.createdAt).toLocaleDateString("en-GB")}
        </span>
        {quote.sentAt && (
          <span>
            Sent: {new Date(quote.sentAt).toLocaleDateString("en-GB")}
          </span>
        )}
      </div>

      <div className={`flex items-center gap-2 text-sm ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
        <Clock className="w-4 h-4" />
        {isOverdue ? (
          <span className="font-medium">Expired - needs follow up</span>
        ) : (
          <span>
            Valid until: {new Date(quote.validUntil).toLocaleDateString("en-GB")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        <button className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          View
        </button>
        <button className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      searchQuery === "" ||
      q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = quotes.reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-500 mt-1">
            Create and manage client quotes
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" />
          Create Quote
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as QuoteStatus)}
            className={`p-4 rounded-lg border transition-all ${
              statusFilter === status
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${config.color}`} />
              <span className="text-sm font-medium text-gray-900">
                {config.label}
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {statusCounts[status] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20"
          />
        </div>
        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotes.map((quote) => (
          <QuoteCard key={quote.id} quote={quote} />
        ))}
      </div>

      {filteredQuotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No quotes found</p>
        </div>
      )}
    </div>
  );
}

