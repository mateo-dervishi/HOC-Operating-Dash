/**
 * Pipeline Service
 * 
 * Handles data fetching for the Client Pipeline page (sales view)
 * Shows: only submitted clients going through sales process
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
}

export interface PipelineStats {
  newSubmissions: number;
  activeDeals: number;
  totalPipelineValue: number;
  completedThisMonth: number;
  byStage: Record<PipelineStage, number>;
}

// Raw types from Supabase
interface PipelineRow {
  id: string;
  client_id: string;
  stage: string;
  priority: string | null;
  estimated_value: number | null;
  last_activity_at: string;
  next_follow_up: string | null;
  meeting_date: string | null;
  last_contacted_at: string | null;
  quote_id: string | null;
  order_id: string | null;
  assigned_to: string | null;
  source: string | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface SubmissionRow {
  id: string;
  profile_id: string;
  submission_number: string;
  total_items: number;
  estimated_value: number | null;
  submitted_at: string;
  notes: string | null;
}

interface SelectionRow {
  profile_id: string;
  quantity: number;
  unit_price: number | null;
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
    // 1. Fetch pipeline entries (these are clients with submissions)
    const { data: pipelineData, error: pipelineError } = await supabase
      .from("client_pipeline")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (pipelineError) {
      console.error("Error fetching pipeline:", pipelineError);
      return [];
    }

    if (!pipelineData || pipelineData.length === 0) {
      return [];
    }

    // 2. Get all client IDs from pipeline
    const clientIds = pipelineData.map((p: PipelineRow) => p.client_id);

    // 3. Fetch profiles for these clients
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone")
      .in("id", clientIds);
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // 4. Fetch submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("selection_submissions")
      .select("*")
      .in("profile_id", clientIds);
    
    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    // 5. Fetch selections for counts/values
    const { data: selections, error: selectionsError } = await supabase
      .from("client_selections")
      .select("profile_id, quantity, unit_price")
      .in("profile_id", clientIds);
    
    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError);
    }

    // 6. Fetch payments
    const { data: payments, error: paymentsError } = await supabase
      .from("client_payments")
      .select("client_id, payment_type, amount, status")
      .in("client_id", clientIds)
      .eq("status", "paid");
    
    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    // 7. Fetch admin users for assignment names
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("id, name");
    
    if (adminError) {
      console.error("Error fetching admin users:", adminError);
    }

    // 8. Fetch quotes for values
    const quoteIds = pipelineData
      .map((p: PipelineRow) => p.quote_id)
      .filter(Boolean) as string[];
    
    let quotes: QuoteRow[] = [];
    if (quoteIds.length > 0) {
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select("id, total_amount")
        .in("id", quoteIds);
      
      if (!quotesError && quotesData) {
        quotes = quotesData;
      }
    }

    // Create lookup maps
    const profileMap = new Map((profiles || []).map((p: ProfileRow) => [p.id, p]));
    const submissionMap = new Map((submissions || []).map((s: SubmissionRow) => [s.profile_id, s]));
    const adminMap = new Map((adminUsers || []).map((a: AdminUserRow) => [a.id, a.name]));
    const quoteMap = new Map(quotes.map((q: QuoteRow) => [q.id, q.total_amount]));
    
    // Group selections and payments by profile
    const selectionsByProfile = groupBy(selections || [], (s: SelectionRow) => s.profile_id);
    const paymentsByProfile = groupBy(payments || [], (p: PaymentRow) => p.client_id);

    // Build pipeline clients
    const clients: PipelineClient[] = [];

    for (const pipeline of pipelineData as PipelineRow[]) {
      const profile = profileMap.get(pipeline.client_id);
      if (!profile) continue;

      const submission = submissionMap.get(pipeline.client_id);
      const profileSelections = selectionsByProfile.get(pipeline.client_id) || [];
      const profilePayments = paymentsByProfile.get(pipeline.client_id) || [];

      // Calculate selection value
      const selectionValue = profileSelections.reduce(
        (sum: number, s: SelectionRow) => sum + (s.unit_price || 0) * s.quantity,
        0
      );

      // Calculate payments
      let depositPaid = 0;
      let productionPaid = 0;
      let finalPaid = 0;

      for (const payment of profilePayments) {
        if (payment.payment_type === "deposit") depositPaid += payment.amount;
        else if (payment.payment_type === "production") productionPaid += payment.amount;
        else if (payment.payment_type === "delivery") finalPaid += payment.amount;
      }

      const totalPaid = depositPaid + productionPaid + finalPaid;
      const quoteValue = pipeline.quote_id ? quoteMap.get(pipeline.quote_id) : null;
      const totalDue = (quoteValue || selectionValue) - totalPaid;

      clients.push({
        id: pipeline.id,
        profileId: pipeline.client_id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email.split("@")[0],
        email: profile.email,
        phone: profile.phone,
        stage: normalizeStage(pipeline.stage),
        priority: normalizePriority(pipeline.priority),
        source: pipeline.source || "website_signup",
        selectionCount: profileSelections.length,
        selectionValue,
        submittedAt: submission?.submitted_at || pipeline.created_at,
        lastContactedAt: pipeline.last_contacted_at,
        meetingDate: pipeline.meeting_date,
        quoteId: pipeline.quote_id,
        quoteValue: quoteValue || null,
        orderId: pipeline.order_id,
        depositPaid: depositPaid || null,
        productionPaid: productionPaid || null,
        finalPaid: finalPaid || null,
        totalPaid,
        totalDue,
        assignedTo: pipeline.assigned_to,
        assignedToName: pipeline.assigned_to ? adminMap.get(pipeline.assigned_to) || null : null,
        notes: submission?.notes || null,
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
 */
export async function updatePipelineStage(
  pipelineId: string,
  newStage: PipelineStage
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await (supabase as any)
    .from("client_pipeline")
    .update({ 
      stage: newStage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pipelineId);
  
  return !error;
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

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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

    // Completed this month (rough check)
    if (client.stage === "completed") {
      stats.completedThisMonth++;
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

function normalizePriority(priority: string | null): Priority {
  if (priority === "normal" || priority === "high" || priority === "urgent") {
    return priority;
  }
  return "normal";
}


