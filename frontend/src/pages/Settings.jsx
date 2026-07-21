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
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-[var(--surface-tertiary)] transition-colors" style={{ borderColor: "var(--border-primary)" }}>
      <div className="flex-1">
        <p className="text-sm font-semibold font-jakarta" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{description}</p>
      </div>
      <motion.button
        onClick={onChange}
        disabled={disabled}
        className={`ml-4 relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-[var(--accent-primary)]" : "bg-[var(--border-primary)]"
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
      className="w-full flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-[var(--surface-tertiary)] transition-colors text-left group"
      style={{ borderColor: "var(--border-primary)" }}
      whileHover={{ x: 2 }}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold font-jakarta" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{description}</p>
      </div>
      <ChevronRight size={16} style={{ color: "var(--text-tertiary)" }} className="group-hover:text-[var(--accent-primary)] transition-colors" />
    </motion.button>
  );
}

function SettingsSection({ section, onToggle }) {
  return (
    <motion.div
      className="ib-card overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 p-4 border-b transition-colors duration-250" style={{ borderColor: "var(--border-primary)", background: "var(--surface-secondary)" }}>
        <section.icon size={18} style={{ color: "var(--accent-primary)" }} />
        <h3 className="text-sm font-semibold font-jakarta" style={{ color: "var(--text-primary)" }}>{section.title}</h3>
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
              onChange={() => onToggle && onToggle(idx)}
            />
          )
        ))}
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const [sections, setSections] = useState(SETTINGS_SECTIONS);

  const toggleSetting = (sectionId, settingIdx) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const newSettings = [...section.settings];
        newSettings[settingIdx] = {
          ...newSettings[settingIdx],
          enabled: !newSettings[settingIdx].enabled
        };
        return { ...section, settings: newSettings };
      }
      return section;
    }));
  };

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
            <h1 className="text-3xl font-bold font-sora mb-2" style={{ color: "var(--text-primary)" }}>Settings</h1>
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Manage your preferences and account settings</p>
          </motion.div>

          <div className="space-y-4">
            {sections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <SettingsSection section={section} onToggle={(settingIdx) => toggleSetting(section.id, settingIdx)} />
              </motion.div>
            ))}

            {/* Danger Zone */}
            <motion.div
              className="ib-card overflow-hidden mt-8 shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: SETTINGS_SECTIONS.length * 0.08 }}
            >
              <div className="flex items-center gap-3 p-4 border-b bg-red-500/5" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}>
                <LogOut size={18} className="text-red-500" />
                <h3 className="text-sm font-semibold font-jakarta text-red-500">Danger Zone</h3>
              </div>
              <motion.button
                className="w-full p-4 text-left hover:bg-red-500/5 transition-colors group border-0 bg-transparent outline-none cursor-pointer"
                whileHover={{ x: 2 }}
              >
                <p className="text-sm font-semibold font-jakarta text-red-500">Sign Out</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>End your current session</p>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
