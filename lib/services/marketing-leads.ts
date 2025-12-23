/**
 * Marketing Leads Service
 * 
 * Handles data fetching for the Leads page (marketing/nurturing view)
 * Shows: registered users, browsing users, newsletter subscribers
 * Does NOT show: submitted clients (those go to Pipeline)
 * 
 * SCHEMA NOTE: Main site uses:
 * - client_selections: { user_id, items (JSON), labels (JSON) }
 * - selection_submissions: { user_id, items (JSON), total_items, status }
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
  accountNumber: string | null;
  accountType: string | null;
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

// Raw types from Supabase (matching main site schema)
interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  account_type: string | null;
  account_number: string | null;
  lead_source: string | null;
  interest_level: string | null;
  created_at: string;
  updated_at: string;
}

// Main site's client_selections schema (JSON items)
interface SelectionRow {
  user_id: string;
  items: SelectionItem[] | null;
  labels: SelectionLabel[] | null;
  updated_at: string;
}

interface SelectionItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  colour?: string;
  notes?: string;
}

interface SelectionLabel {
  id: string;
  name: string;
  color: string;
}

// Main site's selection_submissions schema
interface SubmissionRow {
  user_id: string;
  items: SelectionItem[] | null;
  total_items: number;
  status: string;
  created_at: string;
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

/**
 * Fetch all marketing leads (not submitted)
 */
export async function fetchMarketingLeads(): Promise<MarketingLead[]> {
  const supabase = createClient();
  
  try {
    // 1. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, account_type, account_number, lead_source, interest_level, created_at, updated_at");
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return [];
    }

    // 2. Fetch all submissions to exclude submitted clients
    // Main site uses user_id, not profile_id
    const { data: submissions, error: submissionsError } = await supabase
      .from("selection_submissions")
      .select("user_id");
    
    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // 3. Fetch all selections (JSON items format from main site)
    // Main site uses user_id, not profile_id
    const { data: selections, error: selectionsError } = await supabase
      .from("client_selections")
      .select("user_id, items, updated_at");
    
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
    // Handle both user_id and profile_id for backwards compatibility
    const submittedUserIds = new Set(
      (submissions || []).map((s: any) => s.user_id || s.profile_id)
    );
    
    const selectionsByUser = new Map<string, SelectionRow>();
    (selections || []).forEach((s: SelectionRow) => {
      selectionsByUser.set(s.user_id, s);
    });
    
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
      if (submittedUserIds.has(profile.id)) continue;

      // Get selection data (JSON format from main site)
      const userSelection = selectionsByUser.get(profile.id);
      const items = userSelection?.items || [];
      
      // Calculate counts and values from JSON items
      const selectionCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const selectionValue = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );
      
      const latestOutreach = latestOutreachByProfile.get(profile.id);

      leads.push({
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email.split("@")[0],
        email: profile.email,
        phone: profile.phone,
        source: normalizeSource(profile.lead_source),
        status: items.length > 0 ? "browsing" : "registered",
        interest: normalizeInterest(profile.interest_level),
        selectionCount,
        selectionValue,
        createdAt: profile.created_at,
        lastActivityAt: userSelection?.updated_at || profile.updated_at,
        lastOutreachAt: latestOutreach?.created_at || null,
        nextFollowUp: latestOutreach?.follow_up_date || null,
        notes: null,
        tags: [],
        accountNumber: profile.account_number,
        accountType: profile.account_type,
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
        accountNumber: null,
        accountType: null,
        isNewsletterOnly: true,
        convertedToAccount: false,
      });
    }

    return leads;
  } catch (error) {
    console.error("Error fetching marketing leads:", error);
    return [];
  }
}

/**
 * Update lead interest level
 */
export async function updateLeadInterest(
  leadId: string, 
  interest: InterestLevel
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await (supabase as any)
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
  const supabase = createClient();
  
  const { error } = await (supabase as any)
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
