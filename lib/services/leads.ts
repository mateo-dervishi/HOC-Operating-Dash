import { createClient } from "@/lib/supabase/client";
import { 
  Lead, 
  LeadStatus, 
  LeadStats, 
  ClientProfile, 
  ClientSelectionItem, 
  SelectionSubmission,
  LeadPriority,
  LeadSource,
  LeadOutreach,
  NewsletterSubscriber,
  SourceStats,
} from "@/types/leads";

// Default empty outreach for new leads
const createEmptyOutreach = (leadId: string): LeadOutreach => ({
  leadId,
  nurturingStatus: "active",
  lastOutreachAt: null,
  lastOutreachType: null,
  nextFollowUpAt: null,
  totalOutreachCount: 0,
  outreachHistory: [],
});

// Pipeline data from client_pipeline table
interface PipelineData {
  id: string;
  client_id: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  assigned_to?: string | null;
  last_contacted_at?: string | null;
  next_follow_up?: string | null;
  meeting_scheduled_at?: string | null;
}

// Raw newsletter subscriber from Supabase
interface RawNewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  subscribed_at: string;
  is_active: boolean;
  converted_to_account: boolean;
  converted_at: string | null;
  profile_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

// Determine lead status based on available data
function determineLeadStatus(
  profile: ClientProfile,
  selections: ClientSelectionItem[],
  submission: SelectionSubmission | null,
  pipelineData?: PipelineData
): LeadStatus {
  // If we have pipeline data with explicit status, use it
  if (pipelineData?.status) {
    return pipelineData.status;
  }
  
  // Otherwise, infer from data
  if (submission) {
    switch (submission.status) {
      case "confirmed":
        return "deposit_paid";
      case "quoted":
        return "quoted";
      case "reviewed":
        return "contacted";
      case "pending":
        return "submitted";
      default:
        return "submitted";
    }
  }
  
  if (selections.length > 0) {
    return "browsing";
  }
  
  return "registered";
}

// Calculate selection value
function calculateSelectionValue(selections: ClientSelectionItem[]): number {
  return selections.reduce((total, item) => {
    return total + (item.unit_price || 0) * item.quantity;
  }, 0);
}

// Fetch all leads from Supabase
export async function fetchLeads(): Promise<Lead[]> {
  const supabase = createClient();
  
  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }
  
  if (!profiles || profiles.length === 0) {
    return [];
  }
  
  // Fetch all selections
  const { data: allSelections, error: selectionsError } = await supabase
    .from("client_selections")
    .select("*");
  
  if (selectionsError) {
    console.error("Error fetching selections:", selectionsError);
  }
  
  // Fetch all submissions
  const { data: allSubmissions, error: submissionsError } = await supabase
    .from("selection_submissions")
    .select("*");
  
  if (submissionsError) {
    console.error("Error fetching submissions:", submissionsError);
  }
  
  // Fetch pipeline data if exists
  const { data: pipelineData } = await supabase
    .from("client_pipeline")
    .select("*");
  
  // Build leads array
  const leads: Lead[] = profiles.map((profile: ClientProfile) => {
    const selections = (allSelections || []).filter(
      (s: ClientSelectionItem) => s.profile_id === profile.id
    );
    
    const submission = (allSubmissions || []).find(
      (s: SelectionSubmission) => s.profile_id === profile.id
    ) || null;
    
    const pipeline = (pipelineData || []).find(
      (p: PipelineData) => p.client_id === profile.id
    ) as PipelineData | undefined;
    
    const selectionValue = calculateSelectionValue(selections);
    const status = determineLeadStatus(profile, selections, submission, pipeline);
    
    return {
      id: profile.id,
      profile,
      status,
      priority: pipeline?.priority || "normal",
      source: pipeline?.source || "website",
      selectionItems: selections,
      selectionValue,
      selectionCount: selections.length,
      submission,
      assignedTo: pipeline?.assigned_to || null,
      lastContactedAt: pipeline?.last_contacted_at || null,
      nextFollowUp: pipeline?.next_follow_up || null,
      meetingScheduledAt: pipeline?.meeting_scheduled_at || null,
      payments: [],
      totalPaid: 0,
      totalDue: selectionValue,
      notes: [],
      activities: [],
      outreach: createEmptyOutreach(profile.id),
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  });
  
  return leads;
}

// Fetch a single lead by ID
export async function fetchLeadById(id: string): Promise<Lead | null> {
  const leads = await fetchLeads();
  return leads.find((l) => l.id === id) || null;
}

// Fetch newsletter subscribers
export async function fetchNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return [];
  }
  
  return (data || []).map((row: RawNewsletterSubscriber) => ({
    id: row.id,
    email: row.email,
    source: row.source as LeadSource,
    subscribedAt: row.subscribed_at,
    isActive: row.is_active,
    convertedToAccount: row.converted_to_account,
    convertedAt: row.converted_at,
    profileId: row.profile_id,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
  }));
}

// Get lead source statistics
export async function fetchSourceStats(): Promise<SourceStats[]> {
  const leads = await fetchLeads();
  const subscribers = await fetchNewsletterSubscribers();
  
  const sourceMap = new Map<LeadSource, SourceStats>();
  
  // Initialize all sources
  const allSources: LeadSource[] = [
    "website_signup", "website_newsletter", "coming_soon", 
    "referral", "social", "phone", "walk_in", "other"
  ];
  
  allSources.forEach(source => {
    sourceMap.set(source, {
      source,
      count: 0,
      converted: 0,
      conversionRate: 0,
      totalValue: 0,
    });
  });
  
  // Count leads by source
  leads.forEach(lead => {
    const source = lead.source || "website_signup";
    const stats = sourceMap.get(source)!;
    stats.count++;
    stats.totalValue += lead.selectionValue;
    
    // Count as converted if they've submitted or beyond
    const convertedStatuses: LeadStatus[] = [
      "submitted", "contacted", "meeting_scheduled", "quoted",
      "deposit_paid", "in_production", "ready_delivery", "completed"
    ];
    if (convertedStatuses.includes(lead.status)) {
      stats.converted++;
    }
  });
  
  // Add newsletter-only subscribers
  const unconvertedSubscribers = subscribers.filter(s => !s.convertedToAccount);
  const newsletterStats = sourceMap.get("website_newsletter")!;
  newsletterStats.count += unconvertedSubscribers.length;
  
  // Calculate conversion rates
  sourceMap.forEach((stats) => {
    if (stats.count > 0) {
      stats.conversionRate = (stats.converted / stats.count) * 100;
    }
  });
  
  return Array.from(sourceMap.values()).filter(s => s.count > 0);
}

// Calculate lead statistics
export async function fetchLeadStats(): Promise<LeadStats> {
  const leads = await fetchLeads();
  const subscribers = await fetchNewsletterSubscribers();
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const byStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  
  const bySource = leads.reduce((acc, lead) => {
    const source = lead.source || "website_signup";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<LeadSource, number>);
  
  // Add newsletter-only subscribers to source count
  const unconvertedNewsletterCount = subscribers.filter(s => !s.convertedToAccount).length;
  bySource["website_newsletter"] = (bySource["website_newsletter"] || 0) + unconvertedNewsletterCount;
  
  const newThisWeek = leads.filter(
    (l) => new Date(l.createdAt) > weekAgo
  ).length;
  
  const newThisMonth = leads.filter(
    (l) => new Date(l.createdAt) > monthAgo
  ).length;
  
  const completed = byStatus.completed || 0;
  const total = leads.length;
  const conversionRate = total > 0 ? (completed / total) * 100 : 0;
  
  const leadsWithValue = leads.filter((l) => l.selectionValue > 0);
  const avgSelectionValue = leadsWithValue.length > 0
    ? leadsWithValue.reduce((sum, l) => sum + l.selectionValue, 0) / leadsWithValue.length
    : 0;
  
  const activeStatuses: LeadStatus[] = [
    "submitted", "contacted", "meeting_scheduled", "quoted", 
    "deposit_paid", "in_production", "ready_delivery"
  ];
  const pipelineLeads = leads.filter((l) => activeStatuses.includes(l.status));
  const totalPipelineValue = pipelineLeads.reduce((sum, l) => sum + l.selectionValue, 0);
  
  // Newsletter stats
  const totalSubscribers = subscribers.length;
  const convertedSubscribers = subscribers.filter(s => s.convertedToAccount).length;
  const newsletterConversionRate = totalSubscribers > 0 
    ? (convertedSubscribers / totalSubscribers) * 100 
    : 0;
  
  return {
    total,
    byStatus,
    bySource,
    newThisWeek,
    newThisMonth,
    conversionRate,
    avgSelectionValue,
    totalPipelineValue,
    newsletterSubscribers: totalSubscribers,
    newsletterConversions: convertedSubscribers,
    newsletterConversionRate,
  };
}

// Update lead status
export async function updateLeadStatus(
  leadId: string, 
  status: LeadStatus,
  additionalData?: Partial<{
    priority: string;
    assignedTo: string;
    nextFollowUp: string;
    notes: string;
  }>
): Promise<boolean> {
  const supabase = createClient();
  
  // Check if pipeline entry exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase
    .from("client_pipeline") as any)
    .select("id")
    .eq("client_id", leadId)
    .single();
  
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (additionalData?.priority) updateData.priority = additionalData.priority;
  if (additionalData?.assignedTo) updateData.assigned_to = additionalData.assignedTo;
  if (additionalData?.nextFollowUp) updateData.next_follow_up = additionalData.nextFollowUp;
  
  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from("client_pipeline") as any)
      .update(updateData)
      .eq("client_id", leadId);
    
    return !error;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase
      .from("client_pipeline") as any)
      .insert({
        client_id: leadId,
        created_at: new Date().toISOString(),
        ...updateData,
      });
    
    return !error;
  }
}

// Add note to lead
export async function addLeadNote(
  leadId: string,
  content: string,
  authorId: string,
  isPinned: boolean = false
): Promise<boolean> {
  const supabase = createClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("client_notes") as any)
    .insert({
      client_id: leadId,
      author_id: authorId,
      content,
      is_pinned: isPinned,
      note_type: "general",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  return !error;
}

// Record payment
export async function recordPayment(
  leadId: string,
  type: "deposit" | "production" | "delivery",
  amount: number,
  reference?: string
): Promise<boolean> {
  // This would integrate with your payment/orders system
  // For now, this is a placeholder
  console.log("Recording payment:", { leadId, type, amount, reference });
  return true;
}

// MOCK DATA for development (when Supabase is not connected)
export function getMockLeads(): Lead[] {
  const mockProfiles: ClientProfile[] = [
    {
      id: "1",
      email: "james.richardson@email.com",
      first_name: "James",
      last_name: "Richardson",
      phone: "020 7123 4567",
      company: "Richardson Interiors",
      address_line_1: "14 Kensington Gardens",
      address_line_2: null,
      city: "London",
      postcode: "W8 4PX",
      country: "United Kingdom",
      lead_source: "website_signup",
      referral_source: null,
      utm_source: "google",
      utm_medium: "organic",
      utm_campaign: null,
      created_at: "2024-12-15T10:00:00Z",
      updated_at: "2024-12-20T14:30:00Z",
    },
    {
      id: "2",
      email: "sarah.mitchell@gmail.com",
      first_name: "Sarah",
      last_name: "Mitchell",
      phone: "020 8234 5678",
      company: null,
      address_line_1: "8 Chelsea Manor Street",
      address_line_2: "Apt 4",
      city: "London",
      postcode: "SW3 5RH",
      country: "United Kingdom",
      lead_source: "website_newsletter",
      referral_source: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: "2024-12-18T09:15:00Z",
      updated_at: "2024-12-21T11:00:00Z",
    },
    {
      id: "3",
      email: "david.thompson@thompsonpartners.com",
      first_name: "David",
      last_name: "Thompson",
      phone: "07700 900123",
      company: "Thompson & Partners",
      address_line_1: "23 Mayfair Lane",
      address_line_2: null,
      city: "London",
      postcode: "W1K 2AB",
      country: "United Kingdom",
      lead_source: "referral",
      referral_source: "Michael Brown - existing client",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: "2024-12-10T16:45:00Z",
      updated_at: "2024-12-19T09:20:00Z",
    },
    {
      id: "4",
      email: "emma.wilson@outlook.com",
      first_name: "Emma",
      last_name: "Wilson",
      phone: "07700 900456",
      company: null,
      address_line_1: "45 Notting Hill Gate",
      address_line_2: null,
      city: "London",
      postcode: "W11 3JQ",
      country: "United Kingdom",
      lead_source: "website_signup",
      referral_source: null,
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "winter_collection",
      created_at: "2024-12-20T08:30:00Z",
      updated_at: "2024-12-20T08:30:00Z",
    },
    {
      id: "5",
      email: "michael.brown@browndesign.com",
      first_name: "Michael",
      last_name: "Brown",
      phone: "020 7456 7890",
      company: "Brown Design Studio",
      address_line_1: "67 Belgravia Square",
      address_line_2: null,
      city: "London",
      postcode: "SW1X 8NH",
      country: "United Kingdom",
      lead_source: "website_signup",
      referral_source: null,
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "office_furniture",
      created_at: "2024-11-28T14:00:00Z",
      updated_at: "2024-12-15T16:45:00Z",
    },
    {
      id: "6",
      email: "lisa.anderson@andersonarch.com",
      first_name: "Lisa",
      last_name: "Anderson",
      phone: "07800 123456",
      company: "Anderson Architecture",
      address_line_1: "12 Richmond Terrace",
      address_line_2: null,
      city: "London",
      postcode: "TW10 6RN",
      country: "United Kingdom",
      lead_source: "referral",
      referral_source: "David Thompson",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: "2024-12-05T11:20:00Z",
      updated_at: "2024-12-18T10:00:00Z",
    },
    {
      id: "7",
      email: "robert.taylor@email.co.uk",
      first_name: "Robert",
      last_name: "Taylor",
      phone: "020 8567 8901",
      company: null,
      address_line_1: "89 Hampstead High Street",
      address_line_2: null,
      city: "London",
      postcode: "NW3 1RE",
      country: "United Kingdom",
      lead_source: "social",
      referral_source: null,
      utm_source: "facebook",
      utm_medium: "paid",
      utm_campaign: "lighting_promo",
      created_at: "2024-12-22T09:00:00Z",
      updated_at: "2024-12-22T09:00:00Z",
    },
    {
      id: "8",
      email: "jennifer.clark@clarkinteriors.com",
      first_name: "Jennifer",
      last_name: "Clark",
      phone: "07900 234567",
      company: "Clark Interiors",
      address_line_1: "34 Primrose Hill Road",
      address_line_2: null,
      city: "London",
      postcode: "NW1 8YD",
      country: "United Kingdom",
      lead_source: "phone",
      referral_source: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: "2024-12-12T13:30:00Z",
      updated_at: "2024-12-20T15:00:00Z",
    },
  ];

  const mockLeads: Lead[] = [
    {
      id: "1",
      profile: mockProfiles[0],
      status: "submitted",
      priority: "high",
      source: "website_signup",
      selectionItems: [
        { id: "s1", profile_id: "1", product_slug: "clarence-sofa", product_name: "Clarence Sofa - Velvet Navy", product_image: null, product_category: "Furniture", colour: "Navy", quantity: 1, unit_price: 8500, notes: null, created_at: "2024-12-15T10:30:00Z", updated_at: "2024-12-15T10:30:00Z" },
        { id: "s2", profile_id: "1", product_slug: "monarch-armchair", product_name: "Monarch Armchair - Leather Tan", product_image: null, product_category: "Furniture", colour: "Tan", quantity: 2, unit_price: 3200, notes: null, created_at: "2024-12-15T10:35:00Z", updated_at: "2024-12-15T10:35:00Z" },
        { id: "s3", profile_id: "1", product_slug: "brass-heritage-tap", product_name: "Brass Heritage Basin Tap", product_image: null, product_category: "Bathroom", colour: "Brushed Brass", quantity: 2, unit_price: 450, notes: null, created_at: "2024-12-16T09:00:00Z", updated_at: "2024-12-16T09:00:00Z" },
      ],
      selectionValue: 15800,
      selectionCount: 3,
      submission: { id: "sub1", profile_id: "1", submission_number: "SEL-2024-001", status: "pending", total_items: 3, estimated_value: 15800, notes: "Interested in bathroom renovation + living room furniture", submitted_at: "2024-12-20T14:30:00Z", reviewed_at: null, reviewed_by: null },
      assignedTo: "Mateo",
      lastContactedAt: null,
      nextFollowUp: "2024-12-23",
      meetingScheduledAt: null,
      payments: [],
      totalPaid: 0,
      totalDue: 15800,
      notes: [],
      activities: [],
      outreach: createEmptyOutreach("1"),
      createdAt: "2024-12-15T10:00:00Z",
      updatedAt: "2024-12-20T14:30:00Z",
    },
    {
      id: "2",
      profile: mockProfiles[1],
      status: "meeting_scheduled",
      priority: "high",
      source: "website_newsletter",
      selectionItems: [
        { id: "s4", profile_id: "2", product_slug: "calacatta-marble-tile", product_name: "Calacatta Marble Tile", product_image: null, product_category: "Tiling", colour: "White/Grey", quantity: 25, unit_price: 180, notes: "For bathroom walls", created_at: "2024-12-18T09:30:00Z", updated_at: "2024-12-18T09:30:00Z" },
        { id: "s5", profile_id: "2", product_slug: "freestanding-bath", product_name: "Stone Sanctuary Freestanding Bath", product_image: null, product_category: "Bathroom", colour: "White", quantity: 1, unit_price: 4200, notes: null, created_at: "2024-12-18T09:45:00Z", updated_at: "2024-12-18T09:45:00Z" },
      ],
      selectionValue: 8700,
      selectionCount: 2,
      submission: { id: "sub2", profile_id: "2", submission_number: "SEL-2024-002", status: "reviewed", total_items: 2, estimated_value: 8700, notes: "Full bathroom renovation", submitted_at: "2024-12-19T10:00:00Z", reviewed_at: "2024-12-20T11:00:00Z", reviewed_by: "Mateo" },
      assignedTo: "Mateo",
      lastContactedAt: "2024-12-20T11:30:00Z",
      nextFollowUp: null,
      meetingScheduledAt: "2024-12-27T14:00:00Z",
      payments: [],
      totalPaid: 0,
      totalDue: 8700,
      notes: [{ id: "n1", leadId: "2", authorId: "1", authorName: "Mateo", content: "Called and scheduled consultation for Dec 27th at 2pm. Client wants to see marble samples.", isPinned: true, createdAt: "2024-12-20T11:30:00Z" }],
      activities: [],
      outreach: {
        leadId: "2",
        nurturingStatus: "active",
        lastOutreachAt: "2024-12-20T11:30:00Z",
        lastOutreachType: "call",
        nextFollowUpAt: null,
        totalOutreachCount: 2,
        outreachHistory: [
          { id: "o1", leadId: "2", type: "email", outcome: "email_sent", notes: "Sent intro email with brochure", followUpDate: "2024-12-20", createdAt: "2024-12-19T10:00:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o2", leadId: "2", type: "call", outcome: "meeting_booked", notes: "Called and scheduled consultation for Dec 27th at 2pm", followUpDate: null, createdAt: "2024-12-20T11:30:00Z", createdBy: "1", createdByName: "Mateo" },
        ],
      },
      createdAt: "2024-12-18T09:15:00Z",
      updatedAt: "2024-12-21T11:00:00Z",
    },
    {
      id: "3",
      profile: mockProfiles[2],
      status: "deposit_paid",
      priority: "normal",
      source: "referral",
      selectionItems: [
        { id: "s6", profile_id: "3", product_slug: "kensington-dining-table", product_name: "Kensington Dining Table - Oak", product_image: null, product_category: "Furniture", colour: "Oak", quantity: 1, unit_price: 6500, notes: null, created_at: "2024-12-10T17:00:00Z", updated_at: "2024-12-10T17:00:00Z" },
        { id: "s7", profile_id: "3", product_slug: "kensington-dining-chair", product_name: "Kensington Dining Chair", product_image: null, product_category: "Furniture", colour: "Oak/Cream", quantity: 8, unit_price: 850, notes: null, created_at: "2024-12-10T17:05:00Z", updated_at: "2024-12-10T17:05:00Z" },
        { id: "s8", profile_id: "3", product_slug: "pendant-light-brass", product_name: "Brass Pendant Light - Large", product_image: null, product_category: "Lighting", colour: "Brushed Brass", quantity: 3, unit_price: 680, notes: "Above dining table", created_at: "2024-12-10T17:10:00Z", updated_at: "2024-12-10T17:10:00Z" },
      ],
      selectionValue: 15340,
      selectionCount: 3,
      submission: { id: "sub3", profile_id: "3", submission_number: "SEL-2024-003", status: "confirmed", total_items: 3, estimated_value: 15340, notes: "Dining room complete set", submitted_at: "2024-12-11T09:00:00Z", reviewed_at: "2024-12-12T10:00:00Z", reviewed_by: "Mateo" },
      assignedTo: "Mateo",
      lastContactedAt: "2024-12-18T14:00:00Z",
      nextFollowUp: "2025-01-05",
      meetingScheduledAt: "2024-12-15T10:00:00Z",
      payments: [
        { id: "p1", leadId: "3", type: "deposit", percentage: 20, amount: 3068, status: "paid", dueDate: "2024-12-18", paidAt: "2024-12-18T14:30:00Z", paymentMethod: "Bank Transfer", reference: "HOC-DEP-003", notes: null },
      ],
      totalPaid: 3068,
      totalDue: 12272,
      notes: [{ id: "n2", leadId: "3", authorId: "1", authorName: "Mateo", content: "Met on Dec 15th, confirmed final selection. Deposit received.", isPinned: false, createdAt: "2024-12-18T14:30:00Z" }],
      activities: [],
      outreach: {
        leadId: "3",
        nurturingStatus: "active",
        lastOutreachAt: "2024-12-18T14:00:00Z",
        lastOutreachType: "meeting",
        nextFollowUpAt: "2025-01-05",
        totalOutreachCount: 3,
        outreachHistory: [
          { id: "o3", leadId: "3", type: "call", outcome: "spoke", notes: "Initial call, very interested", followUpDate: "2024-12-12", createdAt: "2024-12-11T09:30:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o4", leadId: "3", type: "email", outcome: "email_sent", notes: "Sent quote and meeting invite", followUpDate: "2024-12-15", createdAt: "2024-12-12T11:00:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o5", leadId: "3", type: "meeting", outcome: "meeting_booked", notes: "In-person consultation, confirmed order", followUpDate: null, createdAt: "2024-12-15T10:00:00Z", createdBy: "1", createdByName: "Mateo" },
        ],
      },
      createdAt: "2024-12-10T16:45:00Z",
      updatedAt: "2024-12-19T09:20:00Z",
    },
    {
      id: "4",
      profile: mockProfiles[3],
      status: "registered",
      priority: "low",
      source: "website_signup",
      selectionItems: [],
      selectionValue: 0,
      selectionCount: 0,
      submission: null,
      assignedTo: null,
      lastContactedAt: null,
      nextFollowUp: null,
      meetingScheduledAt: null,
      payments: [],
      totalPaid: 0,
      totalDue: 0,
      notes: [],
      activities: [],
      outreach: {
        leadId: "4",
        nurturingStatus: "active",
        lastOutreachAt: null,
        lastOutreachType: null,
        nextFollowUpAt: "2024-12-23",
        totalOutreachCount: 0,
        outreachHistory: [],
      },
      createdAt: "2024-12-20T08:30:00Z",
      updatedAt: "2024-12-20T08:30:00Z",
    },
    {
      id: "5",
      profile: mockProfiles[4],
      status: "in_production",
      priority: "normal",
      source: "website_signup",
      selectionItems: [
        { id: "s9", profile_id: "5", product_slug: "executive-desk", product_name: "Executive Desk - Mahogany", product_image: null, product_category: "Furniture", colour: "Mahogany", quantity: 1, unit_price: 5500, notes: null, created_at: "2024-11-28T14:15:00Z", updated_at: "2024-11-28T14:15:00Z" },
        { id: "s10", profile_id: "5", product_slug: "leather-office-chair", product_name: "Leather Office Chair", product_image: null, product_category: "Furniture", colour: "Black", quantity: 1, unit_price: 2200, notes: null, created_at: "2024-11-28T14:20:00Z", updated_at: "2024-11-28T14:20:00Z" },
        { id: "s11", profile_id: "5", product_slug: "bookshelf-walnut", product_name: "Hampton Bookcase - Walnut", product_image: null, product_category: "Furniture", colour: "Walnut", quantity: 2, unit_price: 4200, notes: null, created_at: "2024-11-28T14:25:00Z", updated_at: "2024-11-28T14:25:00Z" },
      ],
      selectionValue: 16100,
      selectionCount: 3,
      submission: { id: "sub5", profile_id: "5", submission_number: "SEL-2024-005", status: "confirmed", total_items: 3, estimated_value: 16100, notes: "Home office setup", submitted_at: "2024-11-29T09:00:00Z", reviewed_at: "2024-11-30T10:00:00Z", reviewed_by: "Mateo" },
      assignedTo: "Mateo",
      lastContactedAt: "2024-12-15T10:00:00Z",
      nextFollowUp: "2025-01-10",
      meetingScheduledAt: "2024-12-02T11:00:00Z",
      payments: [
        { id: "p2", leadId: "5", type: "deposit", percentage: 20, amount: 3220, status: "paid", dueDate: "2024-12-05", paidAt: "2024-12-05T09:00:00Z", paymentMethod: "Bank Transfer", reference: "HOC-DEP-005", notes: null },
        { id: "p3", leadId: "5", type: "production", percentage: 70, amount: 11270, status: "paid", dueDate: "2024-12-12", paidAt: "2024-12-12T11:00:00Z", paymentMethod: "Bank Transfer", reference: "HOC-PRD-005", notes: null },
      ],
      totalPaid: 14490,
      totalDue: 1610,
      notes: [],
      activities: [],
      outreach: {
        leadId: "5",
        nurturingStatus: "active",
        lastOutreachAt: "2024-12-15T10:00:00Z",
        lastOutreachType: "call",
        nextFollowUpAt: "2025-01-10",
        totalOutreachCount: 4,
        outreachHistory: [],
      },
      createdAt: "2024-11-28T14:00:00Z",
      updatedAt: "2024-12-15T16:45:00Z",
    },
    {
      id: "6",
      profile: mockProfiles[5],
      status: "quoted",
      priority: "high",
      source: "referral",
      selectionItems: [
        { id: "s12", profile_id: "6", product_slug: "kitchen-sink-composite", product_name: "Premium Kitchen Sink - Composite", product_image: null, product_category: "Kitchen", colour: "Black", quantity: 1, unit_price: 1200, notes: null, created_at: "2024-12-05T11:30:00Z", updated_at: "2024-12-05T11:30:00Z" },
        { id: "s13", profile_id: "6", product_slug: "kitchen-tap-brass", product_name: "Kitchen Mixer Tap - Brass", product_image: null, product_category: "Kitchen", colour: "Brushed Brass", quantity: 1, unit_price: 580, notes: null, created_at: "2024-12-05T11:35:00Z", updated_at: "2024-12-05T11:35:00Z" },
        { id: "s14", profile_id: "6", product_slug: "cabinet-handles-brass", product_name: "Cabinet Handles - Brass (Set of 20)", product_image: null, product_category: "Kitchen", colour: "Brushed Brass", quantity: 2, unit_price: 380, notes: "For all kitchen cabinets", created_at: "2024-12-05T11:40:00Z", updated_at: "2024-12-05T11:40:00Z" },
      ],
      selectionValue: 2540,
      selectionCount: 3,
      submission: { id: "sub6", profile_id: "6", submission_number: "SEL-2024-006", status: "quoted", total_items: 3, estimated_value: 2540, notes: "Kitchen hardware upgrade", submitted_at: "2024-12-06T09:00:00Z", reviewed_at: "2024-12-07T10:00:00Z", reviewed_by: "Mateo" },
      assignedTo: "Mateo",
      lastContactedAt: "2024-12-18T10:00:00Z",
      nextFollowUp: "2024-12-26",
      meetingScheduledAt: "2024-12-10T15:00:00Z",
      payments: [],
      totalPaid: 0,
      totalDue: 2540,
      notes: [{ id: "n3", leadId: "6", authorId: "1", authorName: "Mateo", content: "Quote sent on Dec 18. Following up after Christmas.", isPinned: false, createdAt: "2024-12-18T10:00:00Z" }],
      activities: [],
      outreach: {
        leadId: "6",
        nurturingStatus: "active",
        lastOutreachAt: "2024-12-18T10:00:00Z",
        lastOutreachType: "email",
        nextFollowUpAt: "2024-12-26",
        totalOutreachCount: 3,
        outreachHistory: [
          { id: "o6", leadId: "6", type: "call", outcome: "spoke", notes: "Discussed kitchen requirements", followUpDate: "2024-12-10", createdAt: "2024-12-07T14:00:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o7", leadId: "6", type: "meeting", outcome: "meeting_booked", notes: "Met at showroom, discussed options", followUpDate: "2024-12-18", createdAt: "2024-12-10T15:00:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o8", leadId: "6", type: "email", outcome: "email_sent", notes: "Sent formal quote. Following up after Christmas.", followUpDate: "2024-12-26", createdAt: "2024-12-18T10:00:00Z", createdBy: "1", createdByName: "Mateo" },
        ],
      },
      createdAt: "2024-12-05T11:20:00Z",
      updatedAt: "2024-12-18T10:00:00Z",
    },
    {
      id: "7",
      profile: mockProfiles[6],
      status: "browsing",
      priority: "normal",
      source: "social",
      selectionItems: [
        { id: "s15", profile_id: "7", product_slug: "wall-sconce-modern", product_name: "Modern Wall Sconce", product_image: null, product_category: "Lighting", colour: "Black", quantity: 4, unit_price: 220, notes: null, created_at: "2024-12-22T09:15:00Z", updated_at: "2024-12-22T09:15:00Z" },
      ],
      selectionValue: 880,
      selectionCount: 1,
      submission: null,
      assignedTo: null,
      lastContactedAt: null,
      nextFollowUp: null,
      meetingScheduledAt: null,
      payments: [],
      totalPaid: 0,
      totalDue: 880,
      notes: [],
      activities: [],
      outreach: {
        leadId: "7",
        nurturingStatus: "active",
        lastOutreachAt: null,
        lastOutreachType: null,
        nextFollowUpAt: "2024-12-24",
        totalOutreachCount: 0,
        outreachHistory: [],
      },
      createdAt: "2024-12-22T09:00:00Z",
      updatedAt: "2024-12-22T09:15:00Z",
    },
    {
      id: "8",
      profile: mockProfiles[7],
      status: "contacted",
      priority: "normal",
      source: "phone",
      selectionItems: [
        { id: "s16", profile_id: "8", product_slug: "clarence-sofa-emerald", product_name: "Clarence Sofa - Velvet Emerald", product_image: null, product_category: "Furniture", colour: "Emerald", quantity: 1, unit_price: 8500, notes: null, created_at: "2024-12-12T13:45:00Z", updated_at: "2024-12-12T13:45:00Z" },
        { id: "s17", profile_id: "8", product_slug: "accent-pillows", product_name: "Accent Pillow Set", product_image: null, product_category: "Furniture", colour: "Gold/Cream", quantity: 2, unit_price: 450, notes: null, created_at: "2024-12-12T13:50:00Z", updated_at: "2024-12-12T13:50:00Z" },
      ],
      selectionValue: 9400,
      selectionCount: 2,
      submission: { id: "sub8", profile_id: "8", submission_number: "SEL-2024-008", status: "reviewed", total_items: 2, estimated_value: 9400, notes: "Living room furniture", submitted_at: "2024-12-13T10:00:00Z", reviewed_at: "2024-12-14T09:00:00Z", reviewed_by: "Mateo" },
      assignedTo: "Mateo",
      lastContactedAt: "2024-12-20T14:00:00Z",
      nextFollowUp: "2024-12-27",
      meetingScheduledAt: null,
      payments: [],
      totalPaid: 0,
      totalDue: 9400,
      notes: [{ id: "n4", leadId: "8", authorId: "1", authorName: "Mateo", content: "Left voicemail. Will try again after Christmas.", isPinned: false, createdAt: "2024-12-20T14:00:00Z" }],
      activities: [],
      outreach: {
        leadId: "8",
        nurturingStatus: "active",
        lastOutreachAt: "2024-12-20T14:00:00Z",
        lastOutreachType: "call",
        nextFollowUpAt: "2024-12-27",
        totalOutreachCount: 2,
        outreachHistory: [
          { id: "o9", leadId: "8", type: "email", outcome: "email_sent", notes: "Sent welcome email and selection review", followUpDate: "2024-12-17", createdAt: "2024-12-14T10:00:00Z", createdBy: "1", createdByName: "Mateo" },
          { id: "o10", leadId: "8", type: "call", outcome: "voicemail", notes: "Left voicemail. Will try again after Christmas.", followUpDate: "2024-12-27", createdAt: "2024-12-20T14:00:00Z", createdBy: "1", createdByName: "Mateo" },
        ],
      },
      createdAt: "2024-12-12T13:30:00Z",
      updatedAt: "2024-12-20T15:00:00Z",
    },
  ];

  return mockLeads;
}

// Get mock newsletter subscribers
export function getMockNewsletterSubscribers(): NewsletterSubscriber[] {
  return [
    {
      id: "ns1",
      email: "alex.walker@email.com",
      source: "website_newsletter",
      subscribedAt: "2024-12-18T14:30:00Z",
      isActive: true,
      convertedToAccount: false,
      convertedAt: null,
      profileId: null,
      utmSource: "google",
      utmMedium: "organic",
      utmCampaign: null,
    },
    {
      id: "ns2",
      email: "sophie.jones@gmail.com",
      source: "website_newsletter",
      subscribedAt: "2024-12-20T09:15:00Z",
      isActive: true,
      convertedToAccount: false,
      convertedAt: null,
      profileId: null,
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "winter_launch",
    },
    {
      id: "ns3",
      email: "tom.harrison@outlook.com",
      source: "website_newsletter",
      subscribedAt: "2024-12-21T16:45:00Z",
      isActive: true,
      convertedToAccount: false,
      convertedAt: null,
      profileId: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    },
    {
      id: "ns4",
      email: "sarah.mitchell@gmail.com", // Same email as lead #2
      source: "website_newsletter",
      subscribedAt: "2024-12-10T11:00:00Z",
      isActive: true,
      convertedToAccount: true,
      convertedAt: "2024-12-18T09:15:00Z",
      profileId: "2",
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
    },
    {
      id: "ns5",
      email: "mark.davies@company.co.uk",
      source: "website_newsletter",
      subscribedAt: "2024-12-19T12:30:00Z",
      isActive: true,
      convertedToAccount: false,
      convertedAt: null,
      profileId: null,
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: "december_promo",
    },
  ];
}

// Get mock source stats
export function getMockSourceStats(): SourceStats[] {
  return [
    { source: "website_signup", count: 3, converted: 2, conversionRate: 66.7, totalValue: 42200 },
    { source: "website_newsletter", count: 4, converted: 1, conversionRate: 25.0, totalValue: 8700 },
    { source: "referral", count: 2, converted: 2, conversionRate: 100.0, totalValue: 17880 },
    { source: "social", count: 1, converted: 0, conversionRate: 0.0, totalValue: 880 },
    { source: "phone", count: 1, converted: 1, conversionRate: 100.0, totalValue: 9400 },
  ];
}

// Get mock stats
export function getMockLeadStats(): LeadStats {
  const leads = getMockLeads();
  
  const byStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  
  const bySource = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<LeadSource, number>);
  
  // Add newsletter-only subscribers
  const subscribers = getMockNewsletterSubscribers();
  const unconvertedSubscribers = subscribers.filter(s => !s.convertedToAccount);
  bySource["website_newsletter"] = (bySource["website_newsletter"] || 0) + unconvertedSubscribers.length;
  
  return {
    total: 8,
    byStatus,
    bySource,
    newThisWeek: 3,
    newThisMonth: 8,
    conversionRate: 12.5,
    avgSelectionValue: 8595,
    totalPipelineValue: 51880,
    newsletterSubscribers: subscribers.length,
    newsletterConversions: subscribers.filter(s => s.convertedToAccount).length,
    newsletterConversionRate: 20.0,
  };
}

