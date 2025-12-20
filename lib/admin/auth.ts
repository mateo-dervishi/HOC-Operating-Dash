import { createClient } from "@/lib/supabase/server";
import { AdminUser } from "@/types/admin";
import { redirect } from "next/navigation";
import { isAllowedEmail, canAccessSection, AdminSection } from "./permissions";

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

/**
 * Check if the current user is an admin and return their admin profile.
 * Only manually added users can access the admin dashboard.
 * Redirects to login if not authenticated, or to home if not authorized.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if email is from allowed domain
  if (!user.email || !isAllowedEmail(user.email)) {
    redirect("/login?error=unauthorized");
  }

  try {
    // First, try to find by user_id (already linked)
    let { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If table doesn't exist, redirect with setup error
    if (error?.code === "42P01") {
      redirect("/login?error=setup_required");
    }

    // If not found by user_id, try to find by email (added before signing up)
    if (!adminUser) {
      const { data: adminByEmail } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", user.email.toLowerCase())
        .single();

      if (adminByEmail) {
        // Link the user_id to this admin entry
        const { data: updatedAdmin } = await supabase
          .from("admin_users")
          .update({ user_id: user.id })
          .eq("id", adminByEmail.id)
          .select()
          .single();

        adminUser = updatedAdmin;
      }
    }

    // User must be manually added to admin_users table
    if (!adminUser) {
      redirect("/login?error=not_authorized");
    }

    // Check if admin is active
    if (!adminUser.is_active) {
      redirect("/login?error=account_disabled");
    }

    return adminUser as AdminUser;
  } catch (error) {
    console.error("Admin auth error:", error);
    redirect("/login?error=admin_error");
  }
}

/**
 * Check if the current user is an admin (non-redirecting version).
 * Returns null if not an admin.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !isAllowedEmail(user.email)) {
    return null;
  }

  // First, try to find by user_id
  let { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  // If not found, try by email and link
  if (!adminUser) {
    const { data: adminByEmail } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", user.email.toLowerCase())
      .eq("is_active", true)
      .single();

    if (adminByEmail) {
      // Link the user_id
      const { data: updatedAdmin } = await supabase
        .from("admin_users")
        .update({ user_id: user.id })
        .eq("id", adminByEmail.id)
        .select()
        .single();

      adminUser = updatedAdmin;
    }
  }

  return adminUser as AdminUser | null;
}

/**
 * Require access to a specific section. Redirects if not authorized.
 */
export async function requireSectionAccess(
  section: AdminSection
): Promise<AdminUser> {
  const adminUser = await requireAdmin();

  if (!canAccessSection(adminUser, section)) {
    redirect("/dashboard?error=no_permission");
  }

  return adminUser;
}

