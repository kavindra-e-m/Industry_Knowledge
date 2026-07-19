import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Settings, User, Zap } from "lucide-react";

export default function PageShell({ children, topbarPlaceholder = "Search..." }) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar */}
      <motion.div
        className="shrink-0 h-16 border-b border-[#1E3A5F] flex items-center justify-between px-6 gap-4"
        style={{
          background: "rgba(15, 28, 46, 0.8)",
          backdropFilter: "blur(20px)",
          boxShadow: "inset 0 1px 0 rgba(79, 157, 255, 0.1)",
        }}
      >
        {/* Search */}
        <motion.div
          className="flex-1 max-w-md"
          animate={{ width: searchFocused ? "100%" : "auto" }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all"
            style={{
              background: searchFocused ? "rgba(79, 157, 255, 0.1)" : "rgba(30, 58, 95, 0.5)",
              border: searchFocused ? "1px solid rgba(79, 157, 255, 0.3)" : "1px solid rgba(79, 157, 255, 0.15)",
              backdropFilter: "blur(12px)",
            }}
            whileFocus={{ scale: 1.02 }}
          >
            <Search size={16} className="text-[#4A6080]" />
            <input
              type="text"
              placeholder={topbarPlaceholder}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 bg-transparent text-white placeholder-[#4A6080] outline-none text-sm font-jakarta"
            />
            {searchFocused && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-[#4A6080] font-mono"
              >
                ⌘K
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Live status */}
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold"
            style={{
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              backdropFilter: "blur(8px)",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-[#34D399]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[#34D399]">AI ACTIVE</span>
          </motion.div>

          {/* Notifications */}
          <motion.button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={16} />
            <motion.span
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF5C5C]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>

          {/* Settings */}
          <motion.button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#4A6080] hover:text-[#8BA3C7] hover:bg-[#1E3A5F] transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Settings size={16} />
          </motion.button>

          {/* Profile */}
          <motion.button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
            style={{
              background: "linear-gradient(135deg, #4F9DFF, #7C5CFC)",
              boxShadow: "0 0 12px rgba(79, 157, 255, 0.3)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            A
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
