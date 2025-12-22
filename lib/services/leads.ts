import { createClient } from "@/lib/supabase/client";
import { 
  Lead, 
  LeadStatus, 
  LeadStats, 
  ClientProfile, 
  ClientSelectionItem, 
  SelectionSubmission,
  LeadPayment,
  LeadNote,
  LeadActivity,
} from "@/types/leads";

// Determine lead status based on available data
function determineLeadStatus(
  profile: ClientProfile,
  selections: ClientSelectionItem[],
  submission: SelectionSubmission | null,
  pipelineData?: { status?: LeadStatus }
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
      (p: { client_id?: string }) => p.client_id === profile.id
    );
    
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

// Calculate lead statistics
export async function fetchLeadStats(): Promise<LeadStats> {
  const leads = await fetchLeads();
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const byStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  
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
  
  return {
    total,
    byStatus,
    newThisWeek,
    newThisMonth,
    conversionRate,
    avgSelectionValue,
    totalPipelineValue,
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
  const { data: existing } = await supabase
    .from("client_pipeline")
    .select("id")
    .eq("client_id", leadId)
    .single();
  
  const updateData = {
    status,
    priority: additionalData?.priority,
    assigned_to: additionalData?.assignedTo,
    next_follow_up: additionalData?.nextFollowUp,
    updated_at: new Date().toISOString(),
  };
  
  if (existing) {
    const { error } = await supabase
      .from("client_pipeline")
      .update(updateData)
      .eq("client_id", leadId);
    
    return !error;
  } else {
    const { error } = await supabase
      .from("client_pipeline")
      .insert({
        client_id: leadId,
        ...updateData,
        created_at: new Date().toISOString(),
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
  
  const { error } = await supabase
    .from("client_notes")
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
      source: "website",
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
      createdAt: "2024-12-15T10:00:00Z",
      updatedAt: "2024-12-20T14:30:00Z",
    },
    {
      id: "2",
      profile: mockProfiles[1],
      status: "meeting_scheduled",
      priority: "high",
      source: "website",
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
      createdAt: "2024-12-10T16:45:00Z",
      updatedAt: "2024-12-19T09:20:00Z",
    },
    {
      id: "4",
      profile: mockProfiles[3],
      status: "registered",
      priority: "low",
      source: "website",
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
      createdAt: "2024-12-20T08:30:00Z",
      updatedAt: "2024-12-20T08:30:00Z",
    },
    {
      id: "5",
      profile: mockProfiles[4],
      status: "in_production",
      priority: "normal",
      source: "website",
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
      createdAt: "2024-12-05T11:20:00Z",
      updatedAt: "2024-12-18T10:00:00Z",
    },
    {
      id: "7",
      profile: mockProfiles[6],
      status: "browsing",
      priority: "normal",
      source: "website",
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
      createdAt: "2024-12-22T09:00:00Z",
      updatedAt: "2024-12-22T09:15:00Z",
    },
    {
      id: "8",
      profile: mockProfiles[7],
      status: "contacted",
      priority: "normal",
      source: "website",
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
      createdAt: "2024-12-12T13:30:00Z",
      updatedAt: "2024-12-20T15:00:00Z",
    },
  ];

  return mockLeads;
}

// Get mock stats
export function getMockLeadStats(): LeadStats {
  const leads = getMockLeads();
  
  const byStatus = leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<LeadStatus, number>);
  
  return {
    total: 8,
    byStatus,
    newThisWeek: 3,
    newThisMonth: 8,
    conversionRate: 12.5,
    avgSelectionValue: 8595,
    totalPipelineValue: 51880,
  };
}

