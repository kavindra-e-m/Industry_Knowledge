import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Lock, Palette, Database, Users, LogOut, ChevronRight } from "lucide-react";
import PageShell from "../components/shared/PageShell";

const SETTINGS_SECTIONS = [
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    settings: [
      { label: "Critical Alerts", description: "Receive alerts for critical system failures", enabled: true },
      { label: "Maintenance Reminders", description: "Get notified about scheduled maintenance", enabled: true },
      { label: "Email Notifications", description: "Send notifications via email", enabled: false },
      { label: "Daily Summary", description: "Receive daily system health summary", enabled: true },
    ]
  },
  {
    id: "appearance",
    title: "Appearance",
    icon: Palette,
    settings: [
      { label: "Dark Mode", description: "Use dark theme (currently active)", enabled: true, disabled: true },
      { label: "Compact View", description: "Reduce spacing and font sizes", enabled: false },
      { label: "High Contrast", description: "Increase contrast for better visibility", enabled: false },
    ]
  },
  {
    id: "data",
    title: "Data & Privacy",
    icon: Database,
    settings: [
      { label: "Data Collection", description: "Allow analytics and usage tracking", enabled: true },
      { label: "Auto-backup", description: "Automatically backup settings and preferences", enabled: true },
    ]
  },
  {
    id: "security",
    title: "Security",
    icon: Lock,
    settings: [
      { label: "Two-Factor Authentication", description: "Add extra security to your account", enabled: false },
      { label: "Session Timeout", description: "Auto-logout after 30 minutes of inactivity", enabled: true },
    ]
  },
  {
    id: "team",
    title: "Team & Access",
    icon: Users,
    settings: [
      { label: "Manage Team Members", description: "Add or remove team members", action: true },
      { label: "Role Permissions", description: "Configure role-based access control", action: true },
    ]
  },
];

function ToggleSetting({ label, description, enabled, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#1E3A5F] last:border-b-0 hover:bg-[#0A1929]/50 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white font-jakarta">{label}</p>
        <p className="text-xs text-[#4A6080] mt-1">{description}</p>
      </div>
      <motion.button
        onClick={onChange}
        disabled={disabled}
        className={`ml-4 relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-[#4F9DFF]" : "bg-[#1E3A5F]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
    </div>
  );
}

function ActionSetting({ label, description }) {
  return (
    <motion.button
      className="w-full flex items-center justify-between p-4 border-b border-[#1E3A5F] last:border-b-0 hover:bg-[#0A1929]/50 transition-colors text-left group"
      whileHover={{ x: 2 }}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold text-white font-jakarta">{label}</p>
        <p className="text-xs text-[#4A6080] mt-1">{description}</p>
      </div>
      <ChevronRight size={16} className="text-[#4A6080] group-hover:text-[#4F9DFF] transition-colors" />
    </motion.button>
  );
}

function SettingsSection({ section }) {
  return (
    <motion.div
      className="ib-card overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 p-4 border-b border-[#1E3A5F] bg-[#0A1929]/50">
        <section.icon size={18} className="text-[#4F9DFF]" />
        <h3 className="text-sm font-semibold text-white font-jakarta">{section.title}</h3>
      </div>
      <div>
        {section.settings.map((setting, idx) => (
          setting.action ? (
            <ActionSetting key={idx} label={setting.label} description={setting.description} />
          ) : (
            <ToggleSetting
              key={idx}
              label={setting.label}
              description={setting.description}
              enabled={setting.enabled}
              disabled={setting.disabled}
              onChange={() => {}}
            />
          )
        ))}
      </div>
    </motion.div>
  );
}

export default function Settings() {
  return (
    <PageShell topbarPlaceholder="Search settings...">
      <div className="p-5 space-y-4 min-h-full" style={{ background: "transparent" }}>
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-white font-sora mb-2">Settings</h1>
            <p className="text-sm text-[#4A6080]">Manage your preferences and account settings</p>
          </motion.div>

          <div className="space-y-4">
            {SETTINGS_SECTIONS.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <SettingsSection section={section} />
              </motion.div>
            ))}

            {/* Danger Zone */}
            <motion.div
              className="ib-card overflow-hidden mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: SETTINGS_SECTIONS.length * 0.08 }}
            >
              <div className="flex items-center gap-3 p-4 border-b border-[#FF5C5C]/30 bg-[#FF5C5C]/5">
                <LogOut size={18} className="text-[#FF5C5C]" />
                <h3 className="text-sm font-semibold text-[#FF5C5C] font-jakarta">Danger Zone</h3>
              </div>
              <motion.button
                className="w-full p-4 text-left hover:bg-[#FF5C5C]/5 transition-colors group"
                whileHover={{ x: 2 }}
              >
                <p className="text-sm font-semibold text-[#FF5C5C] font-jakarta">Sign Out</p>
                <p className="text-xs text-[#4A6080] mt-1">End your current session</p>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
