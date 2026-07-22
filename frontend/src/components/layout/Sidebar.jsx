import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Bot, Share2, FileSearch, Wrench,
  GitBranch, ShieldCheck, Package, BookOpen, Workflow,
  Settings, ChevronLeft, ChevronRight, Cpu, Zap, LogOut
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const MAIN_NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/copilot", label: "AI Copilot", icon: Bot },
  { to: "/knowledge-graph", label: "Knowledge Graph", icon: Share2 },
  { to: "/documents", label: "Document Intelligence", icon: FileSearch },
  { to: "/maintenance", label: "Predictive Maintenance", icon: Wrench },
  { to: "/rca", label: "Root Cause Analysis", icon: GitBranch },
  { to: "/compliance", label: "Compliance Intelligence", icon: ShieldCheck },
  { to: "/audit", label: "Audit Package", icon: Package },
  { to: "/lessons", label: "Lessons Learned", icon: BookOpen },
  { to: "/pid", label: "P&ID Explorer", icon: Workflow },
];

const BOTTOM_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  
  const initials = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden z-30 transition-colors duration-250 border-r"
      style={{
        background: "var(--surface-primary)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b shrink-0 transition-colors duration-250"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Cpu size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold leading-tight font-sora whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                  IndustrialBrain
                </p>
                <p className="text-[10px] font-mono tracking-widest whitespace-nowrap" style={{ color: "var(--accent-primary)" }}>
                  ENTERPRISE AI
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0"
          style={{ color: "var(--text-tertiary)" }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="ib-label px-2 mb-2" style={{ color: "var(--text-tertiary)" }}>MAIN MENU</p>
        )}
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? "nav-active"
                  : "hover:bg-[var(--surface-tertiary)]"
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={16}
                  className="shrink-0 relative z-10"
                  style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative z-10 whitespace-nowrap font-jakarta text-[13px]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-2 py-2 border-t space-y-1 shrink-0 transition-colors duration-250"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive ? "nav-active" : "hover:bg-[var(--surface-tertiary)]"
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className="shrink-0" style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap font-jakarta text-[13px]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {/* User profile */}
        <div className="flex items-center justify-between px-2.5 py-2.5 mt-1 rounded-xl hover:bg-[var(--surface-tertiary)] transition-all group">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}>
              {initials}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="min-w-0">
                  <p className="text-[12px] font-semibold whitespace-nowrap font-jakarta truncate" style={{ color: "var(--text-primary)" }}>{user?.full_name || "Admin Shell"}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <p className="text-[10px] whitespace-nowrap truncate" style={{ color: "var(--text-tertiary)" }}>{user?.role || "Secure Connection"}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button 
              onClick={logout}
              className="hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity p-1"
              style={{ color: "var(--text-tertiary)" }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
        </div>
      </div>
    </motion.aside>
  );
}
