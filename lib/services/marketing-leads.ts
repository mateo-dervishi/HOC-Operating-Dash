/**
 * Marketing Leads Service
 * 
 * Handles data fetching for the Leads page (marketing/nurturing view)
 * Shows: registered users, browsing users, newsletter subscribers
 * Does NOT show: submitted clients (those go to Pipeline)
 */

import { createClient } from "@/lib/supabase/client";

// Types for marketing leads
export type InterestLevel = "cold" | "warm" | "hot";
export type LeadStatus = "registered" | "browsing" | "newsletter_only";
export type LeadSource = 
  | "website_signup" 
  | "website_newsletter" 
  | "coming_soon" 
  | "referral" 
  | "social" 
  | "phone" 
  | "walk_in" 
  | "other";

export interface MarketingLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  interest: InterestLevel;
  selectionCount: number;
  selectionValue: number;
  createdAt: string;
  lastActivityAt: string;
  lastOutreachAt: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  tags: string[];
  // For newsletter-only leads
  isNewsletterOnly: boolean;
  convertedToAccount: boolean;
}

export interface MarketingLeadStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  needsFollowUp: number;
  newsletterOnly: number;
  browsing: number;
  registered: number;
  bySource: Record<LeadSource, number>;
}

// Raw types from Supabase
interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  lead_source: string | null;
  interest_level: string | null;
  nurturing_status: string | null;
  created_at: string;
  updated_at: string;
}

interface SelectionRow {
  profile_id: string;
  quantity: number;
  unit_price: number | null;
}

interface SubmissionRow {
  profile_id: string;
}

interface NewsletterRow {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
  is_active: boolean;
  converted_to_account: boolean;
  profile_id: string | null;
}

interface OutreachRow {
  client_id: string;
  created_at: string;
  follow_up_date: string | null;
}

// Check if running in development mode
const isDev = process.env.NODE_ENV === "development";

/**
 * Fetch all marketing leads (not submitted)
 */
export async function fetchMarketingLeads(): Promise<MarketingLead[]> {
  // Use mock data in development if Supabase isn't set up
  if (isDev) {
    return getMockMarketingLeads();
  }

  const supabase = createClient();
  
  try {
    // 1. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, lead_source, interest_level, nurturing_status, created_at, updated_at");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return getMockMarketingLeads();
    }

    // 2. Fetch all submissions to exclude submitted clients
    const { data: submissions, error: submissionsError } = await supabase
      .from("selection_submissions")
      .select("profile_id");
    
    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // 3. Fetch all selections for counts and values
    const { data: selections, error: selectionsError } = await supabase
      .from("client_selections")
      .select("profile_id, quantity, unit_price");
    
    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError);
    }

    // 4. Fetch newsletter subscribers (unconverted only)
    const { data: newsletterSubs, error: newsletterError } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("converted_to_account", false)
      .eq("is_active", true);
    
    if (newsletterError) {
      console.error("Error fetching newsletter:", newsletterError);
    }

    // 5. Fetch latest outreach for each lead
    const { data: outreachData, error: outreachError } = await supabase
      .from("lead_outreach")
      .select("client_id, created_at, follow_up_date")
      .order("created_at", { ascending: false });
    
    if (outreachError) {
      console.error("Error fetching outreach:", outreachError);
    }

    // Create lookup maps
    const submittedProfileIds = new Set((submissions || []).map((s: SubmissionRow) => s.profile_id));
    const selectionsByProfile = groupBy(selections || [], (s: SelectionRow) => s.profile_id);
    const latestOutreachByProfile = new Map<string, OutreachRow>();
    (outreachData || []).forEach((o: OutreachRow) => {
      if (!latestOutreachByProfile.has(o.client_id)) {
        latestOutreachByProfile.set(o.client_id, o);
      }
    });

    // Build marketing leads from profiles (excluding submitted)
    const leads: MarketingLead[] = [];

    for (const profile of (profiles || []) as ProfileRow[]) {
      // Skip submitted clients - they go to Pipeline
      if (submittedProfileIds.has(profile.id)) continue;

      const profileSelections = selectionsByProfile.get(profile.id) || [];
      const selectionCount = profileSelections.length;
      const selectionValue = profileSelections.reduce(
        (sum: number, s: SelectionRow) => sum + (s.unit_price || 0) * s.quantity,
        0
      );
      const latestOutreach = latestOutreachByProfile.get(profile.id);

      leads.push({
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email.split("@")[0],
        email: profile.email,
        phone: profile.phone,
        source: normalizeSource(profile.lead_source),
        status: selectionCount > 0 ? "browsing" : "registered",
        interest: normalizeInterest(profile.interest_level),
        selectionCount,
        selectionValue,
        createdAt: profile.created_at,
        lastActivityAt: profile.updated_at,
        lastOutreachAt: latestOutreach?.created_at || null,
        nextFollowUp: latestOutreach?.follow_up_date || null,
        notes: null,
        tags: [],
        isNewsletterOnly: false,
        convertedToAccount: true,
      });
    }

    // Add newsletter-only subscribers
    for (const sub of (newsletterSubs || []) as NewsletterRow[]) {
      leads.push({
        id: sub.id,
        name: sub.email.split("@")[0],
        email: sub.email,
        phone: null,
        source: normalizeSource(sub.source),
        status: "newsletter_only",
        interest: "warm", // Default for newsletter
        selectionCount: 0,
        selectionValue: 0,
        createdAt: sub.subscribed_at,
        lastActivityAt: sub.subscribed_at,
        lastOutreachAt: null,
        nextFollowUp: null,
        notes: null,
        tags: ["newsletter"],
        isNewsletterOnly: true,
        convertedToAccount: false,
      });
    }

    return leads;
  } catch (error) {
    console.error("Error fetching marketing leads:", error);
    return getMockMarketingLeads();
  }
}

/**
 * Update lead interest level
 */
export async function updateLeadInterest(
  leadId: string, 
  interest: InterestLevel
): Promise<boolean> {
  if (isDev) return true;

  const supabase = createClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ interest_level: interest })
    .eq("id", leadId);
  
  return !error;
}

/**
 * Log outreach activity
 */
export async function logOutreach(
  leadId: string,
  type: "email" | "call" | "sms" | "meeting" | "other",
  outcome: string,
  notes?: string,
  followUpDate?: string
): Promise<boolean> {
  if (isDev) return true;

  const supabase = createClient();
  
  const { error } = await supabase
    .from("lead_outreach")
    .insert({
      client_id: leadId,
      outreach_type: type,
      outcome,
      notes,
      follow_up_date: followUpDate,
    });
  
  return !error;
}

/**
 * Get marketing lead stats
 */
export async function getMarketingLeadStats(leads: MarketingLead[]): Promise<MarketingLeadStats> {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const stats: MarketingLeadStats = {
    total: leads.length,
    hot: 0,
    warm: 0,
    cold: 0,
    needsFollowUp: 0,
    newsletterOnly: 0,
    browsing: 0,
    registered: 0,
    bySource: {
      website_signup: 0,
      website_newsletter: 0,
      coming_soon: 0,
      referral: 0,
      social: 0,
      phone: 0,
      walk_in: 0,
      other: 0,
    },
  };

  for (const lead of leads) {
    // Interest counts
    stats[lead.interest]++;
    
    // Status counts
    if (lead.status === "newsletter_only") stats.newsletterOnly++;
    else if (lead.status === "browsing") stats.browsing++;
    else stats.registered++;
    
    // Source counts
    stats.bySource[lead.source]++;
    
    // Needs follow-up (no activity in 14+ days)
    const lastActivity = new Date(lead.lastActivityAt);
    if (lastActivity < fourteenDaysAgo) {
      stats.needsFollowUp++;
    }
  }

  return stats;
}

// Helper functions
function groupBy<T>(array: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

function normalizeSource(source: string | null): LeadSource {
  if (!source) return "website_signup";
  
  const validSources: LeadSource[] = [
    "website_signup", "website_newsletter", "coming_soon", 
    "referral", "social", "phone", "walk_in", "other"
  ];
  
  if (validSources.includes(source as LeadSource)) {
    return source as LeadSource;
  }
  
  // Map old values
  if (source === "website") return "website_signup";
  
  return "other";
}

function normalizeInterest(interest: string | null): InterestLevel {
  if (interest === "cold" || interest === "warm" || interest === "hot") {
    return interest;
  }
  return "warm"; // Default
}

// Mock data for development
function getMockMarketingLeads(): MarketingLead[] {
  return [
    {
      id: "1",
      name: "James Richardson",
      email: "james@richardson.com",
      phone: "+44 7700 900123",
      source: "website_signup",
      status: "browsing",
      interest: "hot",
      selectionCount: 8,
      selectionValue: 45000,
      createdAt: "2024-12-01T10:00:00Z",
      lastActivityAt: "2024-12-20T14:30:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: ["high-value"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "2",
      name: "Sarah Mitchell",
      email: "sarah@mitchellhome.co.uk",
      phone: "+44 7700 900456",
      source: "referral",
      status: "browsing",
      interest: "warm",
      selectionCount: 3,
      selectionValue: 12500,
      createdAt: "2024-12-10T09:00:00Z",
      lastActivityAt: "2024-12-18T11:20:00Z",
      lastOutreachAt: "2024-12-15T10:00:00Z",
      nextFollowUp: "2024-12-28",
      notes: null,
      tags: [],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "3",
      name: "David Thompson",
      email: "david.t@email.com",
      phone: null,
      source: "website_signup",
      status: "registered",
      interest: "cold",
      selectionCount: 0,
      selectionValue: 0,
      createdAt: "2024-11-15T14:00:00Z",
      lastActivityAt: "2024-11-15T14:00:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: ["needs-follow-up"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "4",
      name: "emma.w",
      email: "emma.w@gmail.com",
      phone: null,
      source: "website_newsletter",
      status: "newsletter_only",
      interest: "warm",
      selectionCount: 0,
      selectionValue: 0,
      createdAt: "2024-12-05T16:00:00Z",
      lastActivityAt: "2024-12-05T16:00:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: ["newsletter"],
      isNewsletterOnly: true,
      convertedToAccount: false,
    },
    {
      id: "5",
      name: "Michael Brown",
      email: "m.brown@company.co.uk",
      phone: "+44 7700 900789",
      source: "phone",
      status: "browsing",
      interest: "hot",
      selectionCount: 5,
      selectionValue: 28000,
      createdAt: "2024-12-18T10:30:00Z",
      lastActivityAt: "2024-12-21T09:15:00Z",
      lastOutreachAt: "2024-12-19T11:00:00Z",
      nextFollowUp: null,
      notes: "Called, very interested",
      tags: ["phone-inquiry"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "6",
      name: "Sophie Clark",
      email: "sophie.clark@email.com",
      phone: null,
      source: "social",
      status: "browsing",
      interest: "warm",
      selectionCount: 2,
      selectionValue: 8500,
      createdAt: "2024-12-12T13:00:00Z",
      lastActivityAt: "2024-12-19T15:45:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: ["instagram"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "7",
      name: "oliver",
      email: "oliver@davies.net",
      phone: null,
      source: "coming_soon",
      status: "newsletter_only",
      interest: "cold",
      selectionCount: 0,
      selectionValue: 0,
      createdAt: "2024-10-20T08:00:00Z",
      lastActivityAt: "2024-10-20T08:00:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: ["coming-soon"],
      isNewsletterOnly: true,
      convertedToAccount: false,
    },
    {
      id: "8",
      name: "Charlotte Wilson",
      email: "c.wilson@business.com",
      phone: "+44 7700 900321",
      source: "walk_in",
      status: "browsing",
      interest: "hot",
      selectionCount: 12,
      selectionValue: 67000,
      createdAt: "2024-12-15T11:00:00Z",
      lastActivityAt: "2024-12-21T16:30:00Z",
      lastOutreachAt: "2024-12-20T14:00:00Z",
      nextFollowUp: "2024-12-23",
      notes: "Visited showroom, loved the collection",
      tags: ["showroom-visit", "high-value"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "9",
      name: "George Taylor",
      email: "george.t@outlook.com",
      phone: null,
      source: "website_signup",
      status: "registered",
      interest: "cold",
      selectionCount: 0,
      selectionValue: 0,
      createdAt: "2024-11-28T17:00:00Z",
      lastActivityAt: "2024-11-30T10:00:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: null,
      tags: [],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
    {
      id: "10",
      name: "Isabella Moore",
      email: "isabella.m@email.co.uk",
      phone: null,
      source: "referral",
      status: "browsing",
      interest: "warm",
      selectionCount: 4,
      selectionValue: 19500,
      createdAt: "2024-12-08T12:00:00Z",
      lastActivityAt: "2024-12-17T14:20:00Z",
      lastOutreachAt: null,
      nextFollowUp: null,
      notes: "Referred by James Richardson",
      tags: ["referral-program"],
      isNewsletterOnly: false,
      convertedToAccount: true,
    },
  ];
}

