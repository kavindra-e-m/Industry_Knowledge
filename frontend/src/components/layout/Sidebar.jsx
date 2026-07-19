import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Bot, Share2, FileSearch, Wrench,
  GitBranch, ShieldCheck, Package, BookOpen, Workflow,
  Settings, ChevronLeft, ChevronRight, Cpu, Zap
} from "lucide-react";

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

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden z-30"
      style={{
        background: "rgba(15, 28, 46, 0.8)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(79, 157, 255, 0.15)",
        boxShadow: "inset -1px 0 0 rgba(79, 157, 255, 0.1)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#1E3A5F] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #4F9DFF 0%, #7C5CFC 100%)",
              boxShadow: "0 0 16px rgba(79, 157, 255, 0.4)",
            }}
            whileHover={{ scale: 1.05 }}
          >
            <Cpu size={16} className="text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold text-white leading-tight font-sora whitespace-nowrap">IndustrialBrain</p>
                <p className="text-[10px] text-[#4A6080] uppercase tracking-widest whitespace-nowrap">ENTERPRISE AI</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </motion.button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <p className="ib-label px-2 mb-2">MAIN MENU</p>
        )}
        {MAIN_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? "nav-active"
                  : "text-[#8BA3C7] hover:text-[#F0F6FF] hover:bg-[#1E3A5F]/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(124, 92, 252, 0.2) 0%, rgba(79, 157, 255, 0.1) 100%)",
                      border: "1px solid rgba(124, 92, 252, 0.35)",
                      boxShadow: "0 0 12px rgba(124, 92, 252, 0.2)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon
                  size={16}
                  className={`shrink-0 relative z-10 transition-all ${
                    isActive ? "text-[#7C5CFC]" : "text-[#4A6080] group-hover:text-[#8BA3C7]"
                  }`}
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
      <div className="px-2 py-2 border-t border-[#1E3A5F] space-y-0.5 shrink-0">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? "nav-active" : "text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F]/60"
              }`
            }
          >
            <Icon size={16} className="shrink-0" />
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
          </NavLink>
        ))}

        {/* User profile */}
        <motion.div
          className="flex items-center gap-2.5 px-2.5 py-2.5 mt-1 rounded-xl hover:bg-[#1E3A5F]/60 cursor-pointer transition-all"
          whileHover={{ x: 2 }}
        >
          <motion.div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #4F9DFF, #7C5CFC)",
              boxShadow: "0 0 12px rgba(79, 157, 255, 0.3)",
            }}
          >
            A
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-[12px] font-semibold text-[#F0F6FF] whitespace-nowrap font-jakarta">Admin Shell</p>
                <div className="flex items-center gap-1">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-[10px] text-[#4A6080] whitespace-nowrap">Live</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
}
