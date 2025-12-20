"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Truck,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
  Search,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { AdminUser } from "@/types/admin";
import { AdminSection, SECTION_PERMISSIONS } from "@/lib/admin/permissions";

interface SidebarProps {
  adminUser: AdminUser;
  unreadNotifications?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: AdminSection;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "dashboard" },
  { name: "Clients", href: "/dashboard/clients", icon: Users, section: "clients" },
  { name: "Quotes", href: "/dashboard/quotes", icon: FileText, section: "quotes" },
  { name: "Orders", href: "/dashboard/orders", icon: Package, section: "orders" },
  { name: "Deliveries", href: "/dashboard/deliveries", icon: Truck, section: "deliveries" },
];

const secondaryNavigation: NavItem[] = [
  { name: "Team", href: "/dashboard/team", icon: UsersRound, section: "team" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, section: "settings" },
];

function canAccess(role: AdminUser["role"], section: AdminSection): boolean {
  const allowedRoles = SECTION_PERMISSIONS[section] as readonly string[];
  return allowedRoles.includes(role);
}

function getRoleBadgeColor(role: AdminUser["role"]): string {
  switch (role) {
    case "admin":
      return "bg-red-500/20 text-red-300";
    case "manager":
      return "bg-blue-500/20 text-blue-300";
    case "sales":
      return "bg-green-500/20 text-green-300";
    case "operations":
      return "bg-orange-500/20 text-orange-300";
    default:
      return "bg-white/20 text-white/70";
  }
}

export function Sidebar({ adminUser, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter navigation based on user role
  const visibleNavigation = navigation.filter((item) =>
    canAccess(adminUser.role, item.section)
  );
  const visibleSecondaryNav = secondaryNavigation.filter((item) =>
    canAccess(adminUser.role, item.section)
  );

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <span className="text-gray-900 text-sm font-bold">HC</span>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-semibold tracking-wider text-white overflow-hidden whitespace-nowrap"
              >
                OPERATIONS
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <button
          className={`flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors ${
            isCollapsed ? "justify-center p-3" : "px-4 py-3"
          }`}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Search...
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {visibleNavigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? "bg-white text-gray-900 font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              } ${isCollapsed ? "justify-center" : ""}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="px-3 py-2 space-y-1 border-t border-white/10">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-white/70 hover:text-white hover:bg-white/10 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative flex-shrink-0">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Notifications
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {visibleSecondaryNav.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-white/70 hover:text-white hover:bg-white/10 ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {adminUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-white truncate">
                  {adminUser.name}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded ${getRoleBadgeColor(
                    adminUser.role
                  )}`}
                >
                  {adminUser.role}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-gray-900 flex flex-col z-50"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-gray-900 flex-col z-40"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

