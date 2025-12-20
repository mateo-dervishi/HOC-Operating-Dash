// Admin user types
export interface AdminUser {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: "admin" | "manager" | "sales" | "operations";
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Pipeline stages
export const PIPELINE_STAGES = {
  new_lead: { label: "New Lead", color: "bg-blue-500" },
  selection_submitted: { label: "Selection Submitted", color: "bg-indigo-500" },
  quoted: { label: "Quoted", color: "bg-purple-500" },
  negotiating: { label: "Negotiating", color: "bg-pink-500" },
  confirmed: { label: "Confirmed", color: "bg-green-500" },
  in_progress: { label: "In Progress", color: "bg-yellow-500" },
  delivered: { label: "Delivered", color: "bg-teal-500" },
  complete: { label: "Complete", color: "bg-emerald-500" },
  lost: { label: "Lost", color: "bg-gray-500" },
} as const;

export type PipelineStage = keyof typeof PIPELINE_STAGES;

// Priority levels
export const PRIORITIES = {
  low: { label: "Low", color: "bg-gray-400" },
  normal: { label: "Normal", color: "bg-blue-400" },
  high: { label: "High", color: "bg-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-500" },
} as const;

export type Priority = keyof typeof PRIORITIES;

// Order statuses
export const ORDER_STATUSES = {
  pending: { label: "Pending", color: "bg-gray-500" },
  confirmed: { label: "Confirmed", color: "bg-blue-500" },
  processing: { label: "Processing", color: "bg-indigo-500" },
  partially_ordered: { label: "Partially Ordered", color: "bg-purple-500" },
  ordered: { label: "Ordered", color: "bg-pink-500" },
  partially_received: { label: "Partially Received", color: "bg-orange-500" },
  received: { label: "Received", color: "bg-yellow-500" },
  ready_for_delivery: { label: "Ready for Delivery", color: "bg-teal-500" },
  partially_delivered: { label: "Partially Delivered", color: "bg-cyan-500" },
  delivered: { label: "Delivered", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

// Client pipeline entry
export interface ClientPipeline {
  id: string;
  client_id: string;
  stage: PipelineStage;
  assigned_to: string | null;
  priority: Priority;
  estimated_value: number | null;
  last_activity_at: string;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    account_number: string;
    phone: string | null;
  };
  assigned_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Order
export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  quote_id: string | null;
  assigned_to: string | null;
  status: OrderStatus;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  delivery_address: object | null;
  billing_address: object | null;
  delivery_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  updated_at: string;
  // Joined fields
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    account_number: string;
    email: string;
  };
  assigned_user?: {
    id: string;
    name: string;
  };
  items?: OrderItem[];
}

// Order item
export interface OrderItem {
  id: string;
  order_id: string;
  product_slug: string;
  product_name: string;
  product_image: string | null;
  colour: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  supplier_name: string | null;
  supplier_reference: string | null;
  expected_date: string | null;
  received_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  leadsThisWeek: number;
  leadsThisMonth: number;
  quotesNeedingResponse: number;
  ordersInProgress: number;
  revenueThisMonth: number;
  overdueFollowUps: number;
  totalClients: number;
  deliveriesThisWeek: number;
}

// Client with details
export interface ClientWithDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_number: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  pipeline?: ClientPipeline;
  orders?: Order[];
  notes?: ClientNote[];
  preferences?: ClientPreferences;
}

// Client note
export interface ClientNote {
  id: string;
  client_id: string;
  author_id: string | null;
  note_type: string;
  content: string;
  is_important: boolean;
  is_pinned: boolean;
  mentions: string[];
  attachments: object[];
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    name: string;
  };
}

// Client preferences
export interface ClientPreferences {
  id: string;
  client_id: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_notes: string | null;
  style_preferences: string[];
  timeline: string | null;
  timeline_notes: string | null;
  communication_preference: string | null;
  best_contact_time: string | null;
  property_type: string | null;
  project_type: string | null;
  rooms: string[];
  custom_fields: object;
  created_at: string;
  updated_at: string;
}

// Team notification
export interface TeamNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  metadata: object;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

