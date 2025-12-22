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

interface SidebarProps {
  adminUser: AdminUser;
  unreadNotifications?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Quotes", href: "/dashboard/quotes", icon: FileText },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Deliveries", href: "/dashboard/deliveries", icon: Truck },
];

const secondaryNavigation: NavItem[] = [
  { name: "Team", href: "/dashboard/team", icon: UsersRound },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function getRoleBadgeColor(role: AdminUser["role"]): string {
  switch (role) {
    case "admin":
      return "bg-white/10 text-white/90";
    case "manager":
      return "bg-white/10 text-white/90";
    case "sales":
      return "bg-white/10 text-white/90";
    case "operations":
      return "bg-white/10 text-white/90";
    default:
      return "bg-white/10 text-white/70";
  }
}

export function Sidebar({ adminUser, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between min-h-[80px] px-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-[13px] font-light tracking-[0.25em] text-white leading-tight">
                  HOUSE OF
                </h1>
                <h1 className="text-[13px] font-light tracking-[0.25em] text-white leading-tight">
                  CLARENCE
                </h1>
                <p className="text-[10px] font-light tracking-[0.15em] text-white/50 mt-1">
                  INTERNAL OPERATIONS
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 bg-white flex items-center justify-center"
              >
                <span className="text-black text-sm font-light">HC</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 text-white/40 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <button
          className={`flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 rounded-lg transition-colors ${
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
                className="text-sm font-light"
              >
                Search...
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all ${
                active
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all text-white/60 hover:text-white hover:bg-white/5 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative flex-shrink-0">
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[10px] font-medium rounded-full flex items-center justify-center">
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

        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-light transition-all text-white/60 hover:text-white hover:bg-white/5 ${
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
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-light flex-shrink-0">
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
                <p className="text-sm font-light text-white truncate">
                  {adminUser.name}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-light uppercase tracking-wider rounded ${getRoleBadgeColor(
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
                <button
                  className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-black border border-white/10 text-white rounded-lg"
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
            className="lg:hidden fixed inset-0 bg-black/80 z-40"
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
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-black border-r border-white/10 flex flex-col z-50"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-black border-r border-white/10 flex-col z-40"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
