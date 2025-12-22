"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { CreateQuoteForm, QuoteFormData } from "@/components/forms/CreateQuoteForm";

type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";

interface Quote {
  id: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  status: QuoteStatus;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  notes?: string;
}

const QUOTE_STATUSES: Record<QuoteStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-white/10 text-white/60" },
  sent: { label: "Sent", color: "bg-white/10 text-white" },
  viewed: { label: "Viewed", color: "bg-white/20 text-white" },
  accepted: { label: "Accepted", color: "bg-white text-black" },
  rejected: { label: "Rejected", color: "bg-white/5 text-white/40" },
  expired: { label: "Expired", color: "bg-white/5 text-white/40" },
};

const MOCK_QUOTES: Quote[] = [
  {
    id: "1",
    quoteNumber: "Q-2024-001",
    clientName: "James Richardson",
    clientEmail: "james@richardson.com",
    status: "sent",
    items: [
      { name: "Clarence Sofa", description: "Velvet Navy - 3 Seater", quantity: 1, unitPrice: 8500 },
      { name: "Monarch Armchair", description: "Leather Tan", quantity: 2, unitPrice: 3200 },
    ],
    subtotal: 14900,
    discount: 500,
    total: 14400,
    validUntil: "2025-01-15",
    createdAt: "2024-12-15",
    sentAt: "2024-12-16",
  },
  {
    id: "2",
    quoteNumber: "Q-2024-002",
    clientName: "Sarah Mitchell",
    clientEmail: "sarah@mitchellhome.co.uk",
    status: "viewed",
    items: [
      { name: "Kensington Dining Set", description: "8 Person - Oak", quantity: 1, unitPrice: 16100 },
    ],
    subtotal: 16100,
    discount: 0,
    total: 16100,
    validUntil: "2025-01-20",
    createdAt: "2024-12-18",
    sentAt: "2024-12-18",
    viewedAt: "2024-12-19",
  },
  {
    id: "3",
    quoteNumber: "Q-2024-003",
    clientName: "David Thompson",
    clientEmail: "david.t@email.com",
    status: "accepted",
    items: [
      { name: "Master Bed Frame", description: "King Size - Oak", quantity: 1, unitPrice: 12000 },
      { name: "Bedside Table", description: "Oak with Drawers", quantity: 2, unitPrice: 1800 },
    ],
    subtotal: 15600,
    discount: 0,
    total: 15600,
    validUntil: "2025-01-01",
    createdAt: "2024-12-01",
    sentAt: "2024-12-02",
    viewedAt: "2024-12-02",
  },
  {
    id: "4",
    quoteNumber: "Q-2024-004",
    clientName: "Emma Wilson",
    clientEmail: "emma.wilson@gmail.com",
    status: "draft",
    items: [
      { name: "Hampton Bookcase", description: "Large - Walnut", quantity: 2, unitPrice: 4200 },
      { name: "Reading Lamp", description: "Brass Finish", quantity: 2, unitPrice: 350 },
    ],
    subtotal: 9100,
    discount: 300,
    total: 8800,
    validUntil: "2025-01-25",
    createdAt: "2024-12-20",
  },
  {
    id: "5",
    quoteNumber: "Q-2024-005",
    clientName: "Michael Brown",
    clientEmail: "m.brown@browndesign.com",
    status: "rejected",
    items: [
      { name: "Office Desk", description: "Executive - Mahogany", quantity: 1, unitPrice: 5500 },
    ],
    subtotal: 5500,
    discount: 0,
    total: 5500,
    validUntil: "2024-12-15",
    createdAt: "2024-11-30",
    sentAt: "2024-12-01",
    notes: "Client decided to go with competitor",
  },
];

function QuoteRow({ quote }: { quote: Quote }) {
  const statusInfo = QUOTE_STATUSES[quote.status];
  const daysUntilExpiry = Math.ceil(
    (new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{quote.quoteNumber}</p>
          <p className="text-sm text-white/40 font-light">{quote.createdAt}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{quote.clientName}</p>
          <p className="text-sm text-white/40 font-light">{quote.clientEmail}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-light ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </td>
      <td className="px-6 py-4">
        <p className="font-light text-white">{quote.items.length} items</p>
        <p className="text-sm text-white/40 font-light truncate max-w-[200px]">
          {quote.items.map((i) => i.name).join(", ")}
        </p>
      </td>
      <td className="px-6 py-4 text-right">
        <p className="font-light text-white">£{quote.total.toLocaleString()}</p>
        {quote.discount > 0 && (
          <p className="text-sm text-white/40 font-light">
            -£{quote.discount.toLocaleString()} discount
          </p>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-light">
          <Calendar className="w-4 h-4 text-white/40" />
          <span className={daysUntilExpiry < 0 ? "text-white/40" : daysUntilExpiry < 7 ? "text-white" : "text-white/60"}>
            {daysUntilExpiry < 0
              ? "Expired"
              : daysUntilExpiry === 0
              ? "Expires today"
              : `${daysUntilExpiry} days left`}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {quote.status === "draft" && (
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Send">
              <Send className="w-4 h-4 text-white/40" />
            </button>
          )}
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="View">
            <Eye className="w-4 h-4 text-white/40" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Download">
            <Download className="w-4 h-4 text-white/40" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function QuotesPage() {
  const [quotes] = useState<Quote[]>(MOCK_QUOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [showCreateQuote, setShowCreateQuote] = useState(false);

  const handleCreateQuote = (data: QuoteFormData) => {
    console.log("New quote:", data);
    // TODO: Add to Supabase
    setShowCreateQuote(false);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      searchQuery === "" ||
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = Object.keys(QUOTE_STATUSES).reduce((acc, status) => {
    acc[status as QuoteStatus] = quotes.filter((q) => q.status === status).length;
    return acc;
  }, {} as Record<QuoteStatus, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Quotes</h1>
          <p className="text-white/40 mt-1 font-light">
            Create and manage client quotes
          </p>
        </div>
        <button 
          onClick={() => setShowCreateQuote(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light"
        >
          <Plus className="w-4 h-4" />
          New Quote
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(QUOTE_STATUSES) as QuoteStatus[]).map((status) => {
          const info = QUOTE_STATUSES[status];
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? "all" : status)}
              className={`p-3 rounded-lg border transition-colors text-left ${
                isActive
                  ? "bg-white text-black border-white"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <p className={`text-lg font-light ${isActive ? "text-black" : "text-white"}`}>
                {statusCounts[status]}
              </p>
              <p className={`text-xs font-light ${isActive ? "text-black/60" : "text-white/40"}`}>
                {info.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-white/60 font-light">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-4 font-light text-white/60 text-sm">Quote</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Client</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Status</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Items</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm text-right">Total</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Valid Until</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <QuoteRow key={quote.id} quote={quote} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuotes.length === 0 && (
          <div className="text-center py-12 text-white/40 font-light">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No quotes found</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6 text-sm text-white/40 font-light">
        <span>
          <strong className="text-white">{filteredQuotes.length}</strong> quotes shown
        </span>
        <span>
          <strong className="text-white">
            £{filteredQuotes.reduce((sum, q) => sum + q.total, 0).toLocaleString()}
          </strong>{" "}
          total value
        </span>
        <span>
          <strong className="text-white">
            {quotes.filter((q) => q.status === "sent" || q.status === "viewed").length}
          </strong>{" "}
          awaiting response
        </span>
      </div>

      {/* Create Quote Modal */}
      <Modal
        isOpen={showCreateQuote}
        onClose={() => setShowCreateQuote(false)}
        title="Create Quote"
        subtitle="Generate a quote for a client"
        size="lg"
      >
        <CreateQuoteForm
          onSubmit={handleCreateQuote}
          onCancel={() => setShowCreateQuote(false)}
        />
      </Modal>
    </div>
  );
}
