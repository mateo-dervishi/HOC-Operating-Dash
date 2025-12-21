"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Globe,
  Database,
  Key,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";

type SettingsSection = "profile" | "notifications" | "security" | "appearance" | "email" | "integrations";

interface SettingsNav {
  id: SettingsSection;
  label: string;
  icon: typeof Settings;
  description: string;
}

const SETTINGS_NAV: SettingsNav[] = [
  { id: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences" },
  { id: "security", label: "Security", icon: Shield, description: "Password and authentication" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme and display" },
  { id: "email", label: "Email Templates", icon: Mail, description: "Customize email templates" },
  { id: "integrations", label: "Integrations", icon: Globe, description: "Connected services" },
];

function ProfileSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Profile Settings</h2>
        <p className="text-sm text-white/40 font-light">Manage your personal information</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-light">
            MD
          </div>
          <div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-light text-sm transition-colors">
              Change Photo
            </button>
            <p className="text-xs text-white/40 font-light mt-2">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="Mateo Dervishi"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">Email</label>
            <input
              type="email"
              defaultValue="mateo@houseofclarence.uk"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">Phone</label>
            <input
              type="tel"
              defaultValue="020 7123 4567"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-light focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 font-light mb-2">Role</label>
            <input
              type="text"
              defaultValue="Admin"
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/40 font-light cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-light"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Notification Preferences</h2>
        <p className="text-sm text-white/40 font-light">Choose what notifications you receive</p>
      </div>

      <div className="space-y-4">
        {[
          { label: "New Leads", description: "When a new client submits a selection", default: true },
          { label: "Quote Updates", description: "When quotes are viewed or accepted", default: true },
          { label: "Order Status", description: "Order production and delivery updates", default: true },
          { label: "Delivery Alerts", description: "Delivery completions and failures", default: true },
          { label: "Weekly Summary", description: "Weekly performance report", default: false },
          { label: "Team Updates", description: "When team members are added or removed", default: true },
        ].map((setting) => (
          <div
            key={setting.label}
            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div>
              <p className="font-light text-white">{setting.label}</p>
              <p className="text-sm text-white/40 font-light">{setting.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked={setting.default} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Security Settings</h2>
        <p className="text-sm text-white/40 font-light">Manage your account security</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Key className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-light text-white">Password</p>
                <p className="text-sm text-white/40 font-light">Last changed 30 days ago</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-light text-sm transition-colors">
              Change
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-light text-white">Two-Factor Authentication</p>
                <p className="text-sm text-white/40 font-light">Add extra security to your account</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-light text-sm transition-colors">
              Enable
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-light text-white">Active Sessions</p>
                <p className="text-sm text-white/40 font-light">2 active sessions</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-light text-sm transition-colors">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Appearance</h2>
        <p className="text-sm text-white/40 font-light">Customize the look and feel</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 font-light mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            <button className="p-4 bg-white/10 border-2 border-white rounded-lg text-center">
              <div className="w-full h-8 bg-black rounded mb-2"></div>
              <span className="text-sm text-white font-light">Dark</span>
            </button>
            <button className="p-4 bg-white/5 border border-white/10 rounded-lg text-center opacity-50 cursor-not-allowed">
              <div className="w-full h-8 bg-white rounded mb-2"></div>
              <span className="text-sm text-white/40 font-light">Light</span>
            </button>
            <button className="p-4 bg-white/5 border border-white/10 rounded-lg text-center opacity-50 cursor-not-allowed">
              <div className="w-full h-8 bg-gradient-to-r from-black to-white rounded mb-2"></div>
              <span className="text-sm text-white/40 font-light">System</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/60 font-light mb-3">Sidebar</label>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="font-light text-white">Collapsed by default</p>
              <p className="text-sm text-white/40 font-light">Start with sidebar minimized</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-white/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/30"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Email Templates</h2>
        <p className="text-sm text-white/40 font-light">Customize automated email templates</p>
      </div>

      <div className="space-y-3">
        {[
          { name: "Quote Sent", description: "Sent when a new quote is created" },
          { name: "Quote Reminder", description: "Reminder for expiring quotes" },
          { name: "Order Confirmation", description: "Sent when order is confirmed" },
          { name: "Delivery Scheduled", description: "Delivery date notification" },
          { name: "Delivery Complete", description: "Post-delivery follow-up" },
        ].map((template) => (
          <div
            key={template.name}
            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-light text-white">{template.name}</p>
                <p className="text-sm text-white/40 font-light">{template.description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-light text-white">Integrations</h2>
        <p className="text-sm text-white/40 font-light">Connect with external services</p>
      </div>

      <div className="space-y-3">
        {[
          { name: "Supabase", description: "Database and authentication", connected: true },
          { name: "Microsoft 365", description: "Email and calendar sync", connected: false },
          { name: "Stripe", description: "Payment processing", connected: false },
          { name: "Xero", description: "Accounting integration", connected: false },
        ].map((integration) => (
          <div
            key={integration.name}
            className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-white/60" />
              </div>
              <div>
                <p className="font-light text-white">{integration.name}</p>
                <p className="text-sm text-white/40 font-light">{integration.description}</p>
              </div>
            </div>
            {integration.connected ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-white/10 text-white/60 rounded-lg text-sm font-light">
                <Check className="w-4 h-4" />
                Connected
              </span>
            ) : (
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-light text-sm transition-colors">
                Connect
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "security":
        return <SecuritySettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "email":
        return <EmailSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white">Settings</h1>
        <p className="text-white/40 mt-1 font-light">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-white text-black"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div>
                  <p className="font-light">{item.label}</p>
                  <p className={`text-xs font-light ${activeSection === item.id ? "text-black/60" : "text-white/40"}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

