"use client";

import { useState, useMemo } from "react";
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
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  ChevronDown,
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
  respondedAt?: string;
  notes?: string;
  lossReason?: string;
}

const QUOTE_STATUSES: Record<QuoteStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-white/60", bgColor: "bg-white/10" },
  sent: { label: "Sent", color: "text-white", bgColor: "bg-white/10" },
  viewed: { label: "Viewed", color: "text-white", bgColor: "bg-white/20" },
  accepted: { label: "Won", color: "text-black", bgColor: "bg-white" },
  rejected: { label: "Lost", color: "text-white/40", bgColor: "bg-white/5" },
  expired: { label: "Expired", color: "text-white/40", bgColor: "bg-white/5" },
};

const LOSS_REASONS = [
  "Price too high",
  "Went with competitor",
  "Project cancelled",
  "Budget constraints",
  "Timeline issues",
  "Changed requirements",
  "No response",
  "Other",
];

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
    respondedAt: "2024-12-05",
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
    respondedAt: "2024-12-10",
    lossReason: "Went with competitor",
  },
  {
    id: "6",
    quoteNumber: "Q-2024-006",
    clientName: "Lisa Anderson",
    clientEmail: "lisa@andersonarch.com",
    status: "accepted",
    items: [
      { name: "Brass Heritage Tap Set", description: "Full bathroom", quantity: 3, unitPrice: 450 },
      { name: "Calacatta Marble Tile", description: "Per sqm", quantity: 25, unitPrice: 180 },
    ],
    subtotal: 5850,
    discount: 0,
    total: 5850,
    validUntil: "2024-12-20",
    createdAt: "2024-12-05",
    sentAt: "2024-12-06",
    viewedAt: "2024-12-06",
    respondedAt: "2024-12-08",
  },
  {
    id: "7",
    quoteNumber: "Q-2024-007",
    clientName: "Robert Chen",
    clientEmail: "robert.chen@email.com",
    status: "rejected",
    items: [
      { name: "Stone Sanctuary Bath", description: "Freestanding", quantity: 1, unitPrice: 4200 },
    ],
    subtotal: 4200,
    discount: 0,
    total: 4200,
    validUntil: "2024-12-18",
    createdAt: "2024-12-03",
    sentAt: "2024-12-04",
    viewedAt: "2024-12-05",
    respondedAt: "2024-12-12",
    lossReason: "Price too high",
  },
  {
    id: "8",
    quoteNumber: "Q-2024-008",
    clientName: "Amanda Foster",
    clientEmail: "amanda@fosterinteriors.com",
    status: "accepted",
    items: [
      { name: "Executive Desk", description: "Mahogany", quantity: 1, unitPrice: 5500 },
      { name: "Executive Chair", description: "Leather", quantity: 1, unitPrice: 2800 },
      { name: "Hampton Bookcase", description: "Walnut", quantity: 1, unitPrice: 4200 },
    ],
    subtotal: 12500,
    discount: 500,
    total: 12000,
    validUntil: "2025-01-05",
    createdAt: "2024-12-10",
    sentAt: "2024-12-11",
    viewedAt: "2024-12-11",
    respondedAt: "2024-12-15",
  },
];

// Quote Row Component with action buttons
function QuoteRow({ 
  quote, 
  onUpdateStatus,
  onViewDetails 
}: { 
  quote: Quote;
  onUpdateStatus: (id: string, status: QuoteStatus, lossReason?: string) => void;
  onViewDetails: (quote: Quote) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showLossReasonMenu, setShowLossReasonMenu] = useState(false);
  const statusInfo = QUOTE_STATUSES[quote.status];
  const daysUntilExpiry = Math.ceil(
    (new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleMarkAsWon = () => {
    onUpdateStatus(quote.id, "accepted");
    setShowStatusMenu(false);
  };

  const handleMarkAsLost = (reason: string) => {
    onUpdateStatus(quote.id, "rejected", reason);
    setShowLossReasonMenu(false);
    setShowStatusMenu(false);
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{quote.quoteNumber}</p>
          <p className="text-sm text-white/40 font-light">
            {new Date(quote.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="font-light text-white">{quote.clientName}</p>
          <p className="text-sm text-white/40 font-light">{quote.clientEmail}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-light ${statusInfo.bgColor} ${statusInfo.color} hover:opacity-80 transition-opacity`}
          >
            {statusInfo.label}
            {(quote.status === "sent" || quote.status === "viewed") && (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          
          {/* Status update menu */}
          {showStatusMenu && (quote.status === "sent" || quote.status === "viewed") && (
            <div className="absolute top-full left-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-20 min-w-[160px]">
              <button
                onClick={handleMarkAsWon}
                className="w-full px-4 py-2.5 text-left text-sm font-light hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
              >
                <CheckCircle className="w-4 h-4 text-white" />
                Mark as Won
              </button>
              <button
                onClick={() => setShowLossReasonMenu(true)}
                className="w-full px-4 py-2.5 text-left text-sm font-light hover:bg-white/10 transition-colors flex items-center gap-2 text-white/60"
              >
                <XCircle className="w-4 h-4" />
                Mark as Lost
              </button>
            </div>
          )}
          
          {/* Loss reason submenu */}
          {showLossReasonMenu && (
            <div className="absolute top-full left-0 mt-1 bg-black border border-white/10 rounded-lg overflow-hidden z-20 min-w-[200px]">
              <p className="px-4 py-2 text-xs text-white/40 font-light border-b border-white/10">
                Select reason
              </p>
              {LOSS_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleMarkAsLost(reason)}
                  className="w-full px-4 py-2 text-left text-sm font-light hover:bg-white/10 transition-colors text-white/80"
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
        </div>
        {quote.lossReason && (
          <p className="text-xs text-white/30 font-light mt-1">{quote.lossReason}</p>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <p className="font-light text-white">£{quote.total.toLocaleString()}</p>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-light">
          {quote.status === "draft" ? (
            <span className="text-white/40">Not sent</span>
          ) : daysUntilExpiry < 0 ? (
            <span className="text-white/40">Expired</span>
          ) : daysUntilExpiry === 0 ? (
            <span className="text-white">Expires today</span>
          ) : daysUntilExpiry < 7 ? (
            <span className="text-white">{daysUntilExpiry}d left</span>
          ) : (
            <span className="text-white/60">{daysUntilExpiry}d left</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {quote.status === "draft" && (
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Send Quote">
              <Send className="w-4 h-4 text-white/40" />
            </button>
          )}
          <button 
            onClick={() => onViewDetails(quote)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors" 
            title="View Details"
          >
            <Eye className="w-4 h-4 text-white/40" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Download PDF">
            <Download className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Win/Loss Stats Component
function WinLossStats({ quotes }: { quotes: Quote[] }) {
  const stats = useMemo(() => {
    const decidedQuotes = quotes.filter(q => q.status === "accepted" || q.status === "rejected");
    const wonQuotes = quotes.filter(q => q.status === "accepted");
    const lostQuotes = quotes.filter(q => q.status === "rejected");
    
    const winRate = decidedQuotes.length > 0 
      ? Math.round((wonQuotes.length / decidedQuotes.length) * 100)
      : 0;
    
    const totalWonValue = wonQuotes.reduce((sum, q) => sum + q.total, 0);
    const totalLostValue = lostQuotes.reduce((sum, q) => sum + q.total, 0);
    const avgWonValue = wonQuotes.length > 0 ? Math.round(totalWonValue / wonQuotes.length) : 0;
    
    // Loss reasons breakdown
    const lossReasons = lostQuotes.reduce((acc, q) => {
      const reason = q.lossReason || "Not specified";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topLossReason = Object.entries(lossReasons).sort(([,a], [,b]) => b - a)[0];
    
    // Pipeline value (sent + viewed)
    const pendingQuotes = quotes.filter(q => q.status === "sent" || q.status === "viewed");
    const pipelineValue = pendingQuotes.reduce((sum, q) => sum + q.total, 0);
    
    return {
      total: quotes.length,
      won: wonQuotes.length,
      lost: lostQuotes.length,
      pending: pendingQuotes.length,
      winRate,
      totalWonValue,
      totalLostValue,
      avgWonValue,
      pipelineValue,
      topLossReason,
      lossReasons,
    };
  }, [quotes]);

  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Win Rate - Featured */}
        <div className="col-span-2 lg:col-span-1 bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-white/40 font-light">Win Rate</p>
          </div>
          <p className="text-4xl font-light text-white">{stats.winRate}%</p>
          <p className="text-xs text-white/40 font-light mt-1">
            {stats.won} won / {stats.won + stats.lost} decided
          </p>
        </div>
        
        {/* Won */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-white" />
            <p className="text-sm text-white/40 font-light">Won</p>
          </div>
          <p className="text-2xl font-light text-white">{stats.won}</p>
          <p className="text-xs text-white/40 font-light">
            £{stats.totalWonValue.toLocaleString()} value
          </p>
        </div>
        
        {/* Lost */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-white/40" />
            <p className="text-sm text-white/40 font-light">Lost</p>
          </div>
          <p className="text-2xl font-light text-white">{stats.lost}</p>
          <p className="text-xs text-white/40 font-light">
            £{stats.totalLostValue.toLocaleString()} value
          </p>
        </div>
        
        {/* In Pipeline */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white/60" />
            <p className="text-sm text-white/40 font-light">In Pipeline</p>
          </div>
          <p className="text-2xl font-light text-white">{stats.pending}</p>
          <p className="text-xs text-white/40 font-light">
            £{stats.pipelineValue.toLocaleString()} potential
          </p>
        </div>
        
        {/* Avg Deal Size */}
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/60" />
            <p className="text-sm text-white/40 font-light">Avg Won Deal</p>
          </div>
          <p className="text-2xl font-light text-white">£{stats.avgWonValue.toLocaleString()}</p>
          <p className="text-xs text-white/40 font-light">
            per quote
          </p>
        </div>
      </div>
      
      {/* Loss Reasons */}
      {stats.lost > 0 && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <h3 className="text-sm text-white/40 font-light mb-4">Loss Reasons</h3>
          <div className="space-y-3">
            {Object.entries(stats.lossReasons)
              .sort(([,a], [,b]) => b - a)
              .map(([reason, count]) => {
                const percentage = Math.round((count / stats.lost) * 100);
                return (
                  <div key={reason} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white/80 font-light">{reason}</span>
                        <span className="text-sm text-white/40 font-light">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white/30 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// Quote Detail Panel
function QuoteDetailPanel({ quote, onClose }: { quote: Quote; onClose: () => void }) {
  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-black border-l border-white/10 z-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/40 font-light text-sm">{quote.quoteNumber}</p>
            <h2 className="text-xl font-light text-white">{quote.clientName}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-white/40">✕</span>
          </button>
        </div>
        
        <div className={`px-3 py-1.5 rounded inline-block ${QUOTE_STATUSES[quote.status].bgColor}`}>
          <span className={`text-sm font-light ${QUOTE_STATUSES[quote.status].color}`}>
            {QUOTE_STATUSES[quote.status].label}
          </span>
        </div>
        
        {/* Items */}
        <div>
          <h3 className="text-sm text-white/40 font-light mb-3">Items</h3>
          <div className="space-y-2">
            {quote.items.map((item, idx) => (
              <div key={idx} className="flex justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-light">{item.name}</p>
                  <p className="text-sm text-white/40 font-light">{item.description} × {item.quantity}</p>
                </div>
                <p className="text-white font-light">£{(item.unitPrice * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Total */}
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          {quote.discount > 0 && (
            <div className="flex justify-between text-white/60 font-light mb-2">
              <span>Subtotal</span>
              <span>£{quote.subtotal.toLocaleString()}</span>
            </div>
          )}
          {quote.discount > 0 && (
            <div className="flex justify-between text-white/60 font-light mb-2">
              <span>Discount</span>
              <span>-£{quote.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-white font-light text-lg pt-2 border-t border-white/10">
            <span>Total</span>
            <span>£{quote.total.toLocaleString()}</span>
          </div>
        </div>
        
        {/* Timeline */}
        <div>
          <h3 className="text-sm text-white/40 font-light mb-3">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-white/40" />
              <span className="text-white/60 font-light">Created</span>
              <span className="text-white/40 font-light ml-auto">{quote.createdAt}</span>
            </div>
            {quote.sentAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-white/60" />
                <span className="text-white/60 font-light">Sent</span>
                <span className="text-white/40 font-light ml-auto">{quote.sentAt}</span>
              </div>
            )}
            {quote.viewedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <span className="text-white/60 font-light">Viewed by client</span>
                <span className="text-white/40 font-light ml-auto">{quote.viewedAt}</span>
              </div>
            )}
            {quote.respondedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span className="text-white/60 font-light">
                  {quote.status === "accepted" ? "Accepted" : "Declined"}
                </span>
                <span className="text-white/40 font-light ml-auto">{quote.respondedAt}</span>
              </div>
            )}
          </div>
        </div>
        
        {quote.lossReason && (
          <div>
            <h3 className="text-sm text-white/40 font-light mb-2">Loss Reason</h3>
            <p className="text-white/80 font-light">{quote.lossReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const handleCreateQuote = (data: QuoteFormData) => {
    console.log("New quote:", data);
    setShowCreateQuote(false);
  };

  const handleUpdateStatus = (id: string, status: QuoteStatus, lossReason?: string) => {
    setQuotes(quotes.map(q => 
      q.id === id 
        ? { ...q, status, lossReason, respondedAt: new Date().toISOString().split("T")[0] }
        : q
    ));
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      searchQuery === "" ||
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || quote.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = (Object.keys(QUOTE_STATUSES) as QuoteStatus[]).reduce((acc, status) => {
    acc[status] = quotes.filter((q) => q.status === status).length;
    return acc;
  }, {} as Record<QuoteStatus, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Quotes</h1>
          <p className="text-white/40 mt-1 font-light">
            Track quotes and win/loss performance
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

      {/* Win/Loss Stats */}
      <WinLossStats quotes={quotes} />

      {/* Filters */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 font-light focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-light transition-colors ${
              statusFilter === "all" 
                ? "bg-white text-black" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            All ({quotes.length})
          </button>
          {(["sent", "viewed", "accepted", "rejected"] as QuoteStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-light transition-colors ${
                statusFilter === status 
                  ? "bg-white text-black" 
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {QUOTE_STATUSES[status].label} ({statusCounts[status]})
            </button>
          ))}
        </div>
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
                <th className="px-6 py-4 font-light text-white/60 text-sm text-right">Value</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm">Expires</th>
                <th className="px-6 py-4 font-light text-white/60 text-sm w-28"></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => (
                <QuoteRow 
                  key={quote.id} 
                  quote={quote}
                  onUpdateStatus={handleUpdateStatus}
                  onViewDetails={setSelectedQuote}
                />
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

      {/* Quote Detail Panel */}
      {selectedQuote && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedQuote(null)}
          />
          <QuoteDetailPanel 
            quote={selectedQuote} 
            onClose={() => setSelectedQuote(null)} 
          />
        </>
      )}

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
