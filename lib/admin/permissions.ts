import { AdminUser } from "@/types/admin";

// Company email domain - only these emails can access admin
export const ALLOWED_DOMAIN = "houseofclarence.uk";

// Define which roles can access which sections
export const SECTION_PERMISSIONS = {
  dashboard: ["admin", "manager", "sales", "operations"],
  clients: ["admin", "manager", "sales"],
  clients_edit: ["admin", "manager", "sales"],
  quotes: ["admin", "manager", "sales"],
  quotes_edit: ["admin", "manager", "sales"],
  orders: ["admin", "manager", "operations"],
  orders_edit: ["admin", "manager", "operations"],
  deliveries: ["admin", "manager", "operations"],
  deliveries_edit: ["admin", "manager", "operations"],
  team: ["admin", "manager"],
  settings: ["admin"],
  notifications: ["admin", "manager", "sales", "operations"],
} as const;

export type AdminSection = keyof typeof SECTION_PERMISSIONS;

/**
 * Check if an email belongs to the allowed domain.
 */
export function isAllowedEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Check if the current admin has access to a specific section.
 */
export function canAccessSection(
  adminUser: AdminUser,
  section: AdminSection
): boolean {
  const allowedRoles = SECTION_PERMISSIONS[section] as readonly string[];
  return allowedRoles.includes(adminUser.role);
}

/**
 * Check if the current admin has a specific role or higher.
 */
export function hasRole(
  adminUser: AdminUser,
  requiredRoles: AdminUser["role"][]
): boolean {
  return requiredRoles.includes(adminUser.role);
}

/**
 * Check if admin can perform a specific action.
 */
export function canPerformAction(adminUser: AdminUser, action: string): boolean {
  const rolePermissions: Record<AdminUser["role"], string[]> = {
    admin: ["*"], // Admin can do everything
    manager: [
      "view_clients",
      "edit_clients",
      "delete_clients",
      "view_orders",
      "edit_orders",
      "create_orders",
      "view_quotes",
      "edit_quotes",
      "create_quotes",
      "send_quotes",
      "view_reports",
      "manage_team",
      "view_settings",
      "manage_deliveries",
    ],
    sales: [
      "view_clients",
      "edit_clients",
      "view_orders",
      "view_quotes",
      "edit_quotes",
      "create_quotes",
      "send_quotes",
    ],
    operations: [
      "view_clients",
      "view_orders",
      "edit_orders",
      "view_quotes",
      "manage_deliveries",
      "edit_deliveries",
    ],
  };

  const permissions = rolePermissions[adminUser.role];
  return permissions.includes("*") || permissions.includes(action);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: AdminUser["role"]): string {
  const names: Record<AdminUser["role"], string> = {
    admin: "Administrator",
    manager: "Manager",
    sales: "Sales",
    operations: "Operations",
  };
  return names[role];
}

