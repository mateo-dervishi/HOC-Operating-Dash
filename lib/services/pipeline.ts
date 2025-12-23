/**
 * Pipeline Service
 * 
 * Handles data fetching for the Client Pipeline page (sales view)
 * Shows: only submitted clients going through sales process
 * 
 * SCHEMA NOTE: Main site uses:
 * - selection_submissions: { user_id, items (JSON), total_items, status, filename }
 * - client_selections: { user_id, items (JSON), labels (JSON) }
 * - profiles: { id, email, first_name, last_name, phone, account_number, account_type }
 */

import { createClient } from "@/lib/supabase/client";

// Pipeline stages
export type PipelineStage =
  | "submitted"        // Selection submitted, needs review
  | "contacted"        // Initial contact made
  | "meeting_scheduled" // Meeting booked
  | "quoted"           // Quote sent
  | "deposit_paid"     // 20% deposit received
  | "in_production"    // 70% paid, production started
  | "ready_delivery"   // Ready for delivery, awaiting final 10%
  | "completed"        // Fully paid and delivered
  | "lost";            // Did not convert

export type Priority = "normal" | "high" | "urgent";

export interface PipelineClient {
  id: string;
  profileId: string;
  name: string;
  email: string;
  phone: string | null;
  stage: PipelineStage;
  priority: Priority;
  source: string;
  accountNumber: string | null;
  
  // Selection data
  selectionCount: number;
  selectionValue: number;
  
  // Dates
  submittedAt: string;
  lastContactedAt: string | null;
  meetingDate: string | null;
  
  // Quote & Order
  quoteId: string | null;
  quoteValue: number | null;
  orderId: string | null;
  
  // Payments
  depositPaid: number | null;
  productionPaid: number | null;
  finalPaid: number | null;
  totalPaid: number;
  totalDue: number;
  
  // Assignment
  assignedTo: string | null;
  assignedToName: string | null;
  
  // Notes
  notes: string | null;
  filename: string | null;
}

export interface PipelineStats {
  newSubmissions: number;
  activeDeals: number;
  totalPipelineValue: number;
  completedThisMonth: number;
  byStage: Record<PipelineStage, number>;
}

// Types from main site schema
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

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  account_number: string | null;
  account_type: string | null;
}

// Main site's selection_submissions schema
interface SubmissionRow {
  id: string;
  user_id: string;
  items: SelectionItem[] | null;
  labels?: any[];
  total_items: number;
  total_rooms?: number;
  filename: string | null;
  status: string;
  created_at: string;
}

// Pipeline tracking (may or may not exist)
interface PipelineRow {
  id: string;
  client_id: string;
  stage: string;
  priority: string | null;
  estimated_value: number | null;
  meeting_date: string | null;
  last_contacted_at: string | null;
  quote_id: string | null;
  order_id: string | null;
  assigned_to: string | null;
  source: string | null;
  created_at: string;
}

interface PaymentRow {
  client_id: string;
  payment_type: string;
  amount: number;
  status: string;
}

interface AdminUserRow {
  id: string;
  name: string;
}

interface QuoteRow {
  id: string;
  total_amount: number;
}

/**
 * Fetch all pipeline clients (submitted only)
 */
export async function fetchPipelineClients(): Promise<PipelineClient[]> {
  const supabase = createClient();
  
  try {
    // 1. Fetch all submissions (this is the source of truth)
    // Main site uses user_id, not profile_id
    const { data: submissions, error: submissionsError } = await supabase
      .from("selection_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      return [];
    }

    // 2. Get all user IDs from submissions
    const userIds = submissions.map((s: SubmissionRow) => s.user_id);

    // 3. Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, account_number, account_type")
      .in("id", userIds);
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // 4. Try to fetch pipeline entries (may not exist yet)
    const { data: pipelineData, error: pipelineError } = await supabase
      .from("client_pipeline")
      .select("*")
      .in("client_id", userIds);
    
    if (pipelineError) {
      console.error("Error fetching pipeline (may not exist):", pipelineError);
    }

    // 5. Fetch payments
    const { data: payments, error: paymentsError } = await supabase
      .from("client_payments")
      .select("client_id, payment_type, amount, status")
      .in("client_id", userIds)
      .eq("status", "paid");
    
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    // 6. Fetch admin users for assignment names
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("id, name");
    
    if (adminError) {
      console.error("Error fetching admin users:", adminError);
    }

    // 7. Fetch quotes
    const pipelineQuoteIds = (pipelineData || [])
      .map((p: PipelineRow) => p.quote_id)
      .filter(Boolean) as string[];
    
    let quotes: QuoteRow[] = [];
    if (pipelineQuoteIds.length > 0) {
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select("id, total_amount")
        .in("id", pipelineQuoteIds);
      
      if (!quotesError && quotesData) {
        quotes = quotesData;
      }
    }

    // Create lookup maps
    const profileMap = new Map((profiles || []).map((p: ProfileRow) => [p.id, p]));
    const pipelineMap = new Map((pipelineData || []).map((p: PipelineRow) => [p.client_id, p]));
    const adminMap = new Map((adminUsers || []).map((a: AdminUserRow) => [a.id, a.name]));
    const quoteMap = new Map(quotes.map((q: QuoteRow) => [q.id, q.total_amount]));
    
    // Group payments by user
    const paymentsByUser = new Map<string, PaymentRow[]>();
    (payments || []).forEach((p: PaymentRow) => {
      const existing = paymentsByUser.get(p.client_id) || [];
      existing.push(p);
      paymentsByUser.set(p.client_id, existing);
    });

    // Build pipeline clients from submissions
    const clients: PipelineClient[] = [];

    for (const submission of submissions as SubmissionRow[]) {
      const profile = profileMap.get(submission.user_id);
      if (!profile) continue;

      // Get pipeline tracking data if it exists
      const pipeline = pipelineMap.get(submission.user_id);
      const userPayments = paymentsByUser.get(submission.user_id) || [];

      // Calculate selection value from items JSON
      const items = submission.items || [];
      const selectionCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const selectionValue = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

      // Calculate payments
      let depositPaid = 0;
      let productionPaid = 0;
      let finalPaid = 0;

      for (const payment of userPayments) {
        if (payment.payment_type === "deposit") depositPaid += payment.amount;
        else if (payment.payment_type === "production") productionPaid += payment.amount;
        else if (payment.payment_type === "delivery") finalPaid += payment.amount;
      }

      const totalPaid = depositPaid + productionPaid + finalPaid;
      const quoteValue = pipeline?.quote_id ? quoteMap.get(pipeline.quote_id) : null;
      const totalDue = (quoteValue || selectionValue) - totalPaid;

      // Determine stage from pipeline or submission status
      let stage: PipelineStage = "submitted";
      if (pipeline?.stage) {
        stage = normalizeStage(pipeline.stage);
      } else if (submission.status === "confirmed") {
        stage = "deposit_paid";
      }

      clients.push({
        id: pipeline?.id || submission.id,
        profileId: submission.user_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email.split("@")[0],
        email: profile.email,
        phone: profile.phone,
        stage,
        priority: normalizePriority(pipeline?.priority),
        source: pipeline?.source || "website_signup",
        accountNumber: profile.account_number,
        selectionCount,
        selectionValue,
        submittedAt: submission.created_at,
        lastContactedAt: pipeline?.last_contacted_at || null,
        meetingDate: pipeline?.meeting_date || null,
        quoteId: pipeline?.quote_id || null,
        quoteValue: quoteValue || null,
        orderId: pipeline?.order_id || null,
        depositPaid: depositPaid || null,
        productionPaid: productionPaid || null,
        finalPaid: finalPaid || null,
        totalPaid,
        totalDue,
        assignedTo: pipeline?.assigned_to || null,
        assignedToName: pipeline?.assigned_to ? adminMap.get(pipeline.assigned_to) || null : null,
        notes: null,
        filename: submission.filename,
      });
    }

    return clients;
  } catch (error) {
    console.error("Error fetching pipeline clients:", error);
    return [];
  }
}

/**
 * Update pipeline stage
 * Creates pipeline entry if it doesn't exist
 */
export async function updatePipelineStage(
  pipelineId: string,
  newStage: PipelineStage,
  clientId?: string
): Promise<boolean> {
  const supabase = createClient();
  
  // Try to update existing pipeline entry
  const { error: updateError } = await (supabase as any)
    .from("client_pipeline")
    .update({ 
      stage: newStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pipelineId);
  
  // If update failed and we have a clientId, try to create the entry
  if (updateError && clientId) {
    const { error: insertError } = await (supabase as any)
      .from("client_pipeline")
      .insert({
        client_id: clientId,
        stage: newStage,
        priority: "normal",
        source: "website_signup",
      });
    
    return !insertError;
  }
  
  return !updateError;
}

/**
 * Update pipeline priority
 */
export async function updatePipelinePriority(
  pipelineId: string,
  priority: Priority
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await (supabase as any)
    .from("client_pipeline")
    .update({ priority })
    .eq("id", pipelineId);
  
  return !error;
}

/**
 * Record a payment
 */
export async function recordPayment(
  clientId: string,
  pipelineId: string,
  paymentType: "deposit" | "production" | "delivery",
  amount: number,
  reference?: string
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await (supabase as any)
    .from("client_payments")
    .insert({
      client_id: clientId,
      pipeline_id: pipelineId,
      payment_type: paymentType,
      amount,
      status: "paid",
      paid_at: new Date().toISOString(),
      reference,
    });
  
  return !error;
}

/**
 * Get pipeline stats
 */
export function getPipelineStats(clients: PipelineClient[]): PipelineStats {
  const stats: PipelineStats = {
    newSubmissions: 0,
    activeDeals: 0,
    totalPipelineValue: 0,
    completedThisMonth: 0,
    byStage: {
      submitted: 0,
      contacted: 0,
      meeting_scheduled: 0,
      quoted: 0,
      deposit_paid: 0,
      in_production: 0,
      ready_delivery: 0,
      completed: 0,
      lost: 0,
    },
  };

  for (const client of clients) {
    // Count by stage
    stats.byStage[client.stage]++;

    // New submissions
    if (client.stage === "submitted") {
      stats.newSubmissions++;
    }

    // Active deals (not completed or lost)
    if (client.stage !== "completed" && client.stage !== "lost") {
      stats.activeDeals++;
      stats.totalPipelineValue += client.quoteValue || client.selectionValue;
    }

    // Completed this month
    if (client.stage === "completed") {
      stats.completedThisMonth++;
    }
  }

  return stats;
}

// Helper functions
function normalizeStage(stage: string | null): PipelineStage {
  const validStages: PipelineStage[] = [
    "submitted", "contacted", "meeting_scheduled", "quoted",
    "deposit_paid", "in_production", "ready_delivery", "completed", "lost"
  ];
  
  if (stage && validStages.includes(stage as PipelineStage)) {
    return stage as PipelineStage;
  }
  
  return "submitted";
}

function normalizePriority(priority: string | null | undefined): Priority {
  if (priority === "normal" || priority === "high" || priority === "urgent") {
    return priority;
  }
  return "normal";
}
