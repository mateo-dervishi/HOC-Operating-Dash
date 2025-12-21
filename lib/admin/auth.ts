import { AdminUser } from "@/types/admin";

// Re-export from permissions for convenience
export {
  SECTION_PERMISSIONS,
  isAllowedEmail,
  canAccessSection,
  hasRole,
  canPerformAction,
  getRoleDisplayName,
} from "./permissions";
export type { AdminSection } from "./permissions";

// Mock admin user for development (no auth required)
const MOCK_ADMIN: AdminUser = {
  id: "mock-admin-id",
  user_id: "mock-user-id",
  email: "mateo@houseofclarence.uk",
  name: "Mateo Dervishi",
  role: "admin",
  avatar_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Returns mock admin user (auth disabled for development)
 */
export async function requireAdmin(): Promise<AdminUser> {
  return MOCK_ADMIN;
}

/**
 * Returns mock admin user (auth disabled for development)
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  return MOCK_ADMIN;
}

/**
 * Returns mock admin user (auth disabled for development)
 */
export async function requireSectionAccess(): Promise<AdminUser> {
  return MOCK_ADMIN;
}
