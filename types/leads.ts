// Lead types based on client journey

export type LeadStatus = 
  | "registered"        // Created account only
  | "browsing"          // Added items to selection but not submitted
  | "submitted"         // Submitted selection - ready for meeting
  | "contacted"         // Team has reached out
  | "meeting_scheduled" // Meeting booked
  | "quoted"            // Quote sent after meeting
  | "deposit_paid"      // 20% deposit received
  | "in_production"     // 70% paid, production started
  | "ready_delivery"    // Production complete, awaiting final payment
  | "completed"         // Fully delivered and paid
  | "lost"              // Didn't convert

// Lead sources - tracks where leads originally came from
export type LeadSource = 
  | "website_signup"      // Created full account on main website
  | "website_newsletter"  // Newsletter signup only (no account)
  | "coming_soon"         // From houseofclarence.uk coming soon page
  | "referral"            // Referred by existing client
  | "social"              // Social media
  | "phone"               // Phone inquiry
  | "walk_in"             // In-person visit
  | "other";              // Other source

// Lead source display info
export const LEAD_SOURCE_INFO: Record<LeadSource, { label: string; description: string; color: string }> = {
  website_signup: { 
    label: "Website Account", 
    description: "Created account on main website", 
    color: "bg-white/20 text-white" 
  },
  website_newsletter: { 
    label: "Newsletter", 
    description: "Newsletter signup only", 
    color: "bg-white/10 text-white/80" 
  },
  coming_soon: { 
    label: "Coming Soon", 
    description: "From houseofclarence.uk", 
    color: "bg-white/10 text-white/60" 
  },
  referral: { 
    label: "Referral", 
    description: "Referred by existing client", 
    color: "bg-white/30 text-white" 
  },
  social: { 
    label: "Social Media", 
    description: "From social channels", 
    color: "bg-white/15 text-white/70" 
  },
  phone: { 
    label: "Phone Inquiry", 
    description: "Called directly", 
    color: "bg-white/20 text-white" 
  },
  walk_in: { 
    label: "Walk-in", 
    description: "Visited in person", 
    color: "bg-white/25 text-white" 
  },
  other: { 
    label: "Other", 
    description: "Other source", 
    color: "bg-white/10 text-white/50" 
  },
};

export type LeadPriority = "low" | "normal" | "high" | "urgent";

// Newsletter subscriber (email-only lead)
export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: LeadSource;
  subscribedAt: string;
  isActive: boolean;
  convertedToAccount: boolean;
  convertedAt: string | null;
  profileId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

// Profile from main website
export interface ClientProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  lead_source: LeadSource | null;
  referral_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
}

// Selection item from client_selections
export interface ClientSelectionItem {
  id: string;
  profile_id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  colour: string | null;
  quantity: number;
  unit_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Submission from selection_submissions
export interface SelectionSubmission {
  id: string;
  profile_id: string;
  submission_number: string;
  status: "pending" | "reviewed" | "quoted" | "confirmed" | "cancelled";
  total_items: number;
  estimated_value: number | null;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

// Comprehensive lead combining all data
export interface Lead {
  id: string;
  profile: ClientProfile;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  
  // Selection data
  selectionItems: ClientSelectionItem[];
  selectionValue: number;
  selectionCount: number;
  
  // Submission data
  submission: SelectionSubmission | null;
  
  // Pipeline tracking
  assignedTo: string | null;
  lastContactedAt: string | null;
  nextFollowUp: string | null;
  meetingScheduledAt: string | null;
  
  // Payment tracking (20%, 70%, 10%)
  payments: LeadPayment[];
  totalPaid: number;
  totalDue: number;
  
  // Activity
  notes: LeadNote[];
  activities: LeadActivity[];
  
  // Outreach tracking
  outreach: LeadOutreach;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface LeadPayment {
  id: string;
  leadId: string;
  type: "deposit" | "production" | "delivery";
  percentage: number; // 20, 70, or 10
  amount: number;
  status: "pending" | "paid" | "overdue";
  dueDate: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
}

export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: "status_change" | "note_added" | "email_sent" | "call_made" | "meeting" | "payment_received" | "quote_sent";
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  createdBy: string | null;
}

// Lead statistics
export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  newThisWeek: number;
  newThisMonth: number;
  conversionRate: number;
  avgSelectionValue: number;
  totalPipelineValue: number;
  // Newsletter specific stats
  newsletterSubscribers: number;
  newsletterConversions: number;
  newsletterConversionRate: number;
}

// Source statistics for analytics
export interface SourceStats {
  source: LeadSource;
  count: number;
  converted: number;
  conversionRate: number;
  totalValue: number;
}

// Status display info
export const LEAD_STATUS_INFO: Record<LeadStatus, { label: string; description: string; color: string }> = {
  registered: { 
    label: "Registered", 
    description: "Created account, no selections", 
    color: "bg-white/10 text-white/60" 
  },
  browsing: { 
    label: "Browsing", 
    description: "Adding items to selection", 
    color: "bg-white/10 text-white" 
  },
  submitted: { 
    label: "Submitted", 
    description: "Selection submitted, needs review", 
    color: "bg-white/20 text-white" 
  },
  contacted: { 
    label: "Contacted", 
    description: "Initial outreach made", 
    color: "bg-white/20 text-white" 
  },
  meeting_scheduled: { 
    label: "Meeting Scheduled", 
    description: "Consultation booked", 
    color: "bg-white/30 text-white" 
  },
  quoted: { 
    label: "Quoted", 
    description: "Quote sent after meeting", 
    color: "bg-white/30 text-white" 
  },
  deposit_paid: { 
    label: "Deposit Paid", 
    description: "20% deposit received", 
    color: "bg-white/40 text-white" 
  },
  in_production: { 
    label: "In Production", 
    description: "70% paid, items being made", 
    color: "bg-white/50 text-white" 
  },
  ready_delivery: { 
    label: "Ready for Delivery", 
    description: "Awaiting final 10%", 
    color: "bg-white/60 text-black" 
  },
  completed: { 
    label: "Completed", 
    description: "Fully paid and delivered", 
    color: "bg-white text-black" 
  },
  lost: { 
    label: "Lost", 
    description: "Did not convert", 
    color: "bg-white/5 text-white/40" 
  },
};

// Payment stage info
export const PAYMENT_STAGES = {
  deposit: { label: "Deposit", percentage: 20, description: "Due on confirmation" },
  production: { label: "Production", percentage: 70, description: "Due when production starts" },
  delivery: { label: "Delivery", percentage: 10, description: "Due on delivery" },
} as const;

// Outreach tracking
export type OutreachType = "email" | "call" | "sms" | "meeting" | "other";
export type OutreachOutcome = "no_answer" | "voicemail" | "spoke" | "email_sent" | "meeting_booked" | "not_interested" | "follow_up_needed";
export type NurturingStatus = "active" | "nurturing" | "not_interested" | "do_not_contact";

export interface OutreachRecord {
  id: string;
  leadId: string;
  type: OutreachType;
  outcome: OutreachOutcome;
  notes: string | null;
  followUpDate: string | null;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface LeadOutreach {
  leadId: string;
  nurturingStatus: NurturingStatus;
  lastOutreachAt: string | null;
  lastOutreachType: OutreachType | null;
  nextFollowUpAt: string | null;
  totalOutreachCount: number;
  outreachHistory: OutreachRecord[];
}

export const OUTREACH_TYPE_INFO: Record<OutreachType, { label: string; icon: string }> = {
  email: { label: "Email", icon: "Mail" },
  call: { label: "Phone Call", icon: "Phone" },
  sms: { label: "SMS", icon: "MessageSquare" },
  meeting: { label: "Meeting", icon: "Calendar" },
  other: { label: "Other", icon: "MoreHorizontal" },
};

export const OUTREACH_OUTCOME_INFO: Record<OutreachOutcome, { label: string; color: string }> = {
  no_answer: { label: "No Answer", color: "bg-white/10 text-white/60" },
  voicemail: { label: "Left Voicemail", color: "bg-white/10 text-white/60" },
  spoke: { label: "Spoke with Client", color: "bg-white/20 text-white" },
  email_sent: { label: "Email Sent", color: "bg-white/20 text-white" },
  meeting_booked: { label: "Meeting Booked", color: "bg-white text-black" },
  not_interested: { label: "Not Interested", color: "bg-white/5 text-white/40" },
  follow_up_needed: { label: "Follow-up Needed", color: "bg-white/30 text-white" },
};

export const NURTURING_STATUS_INFO: Record<NurturingStatus, { label: string; description: string; color: string }> = {
  active: { label: "Active", description: "Actively pursuing", color: "bg-white/20 text-white" },
  nurturing: { label: "Nurturing", description: "Long-term follow-up", color: "bg-white/10 text-white/60" },
  not_interested: { label: "Not Interested", description: "Declined for now", color: "bg-white/5 text-white/40" },
  do_not_contact: { label: "Do Not Contact", description: "Opted out", color: "bg-white/5 text-white/30" },
};

