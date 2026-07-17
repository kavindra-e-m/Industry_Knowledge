import Topbar from "../layout/Topbar";
import { motion } from "framer-motion";

export default function PageShell({ children, topbarPlaceholder, className = "" }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar placeholder={topbarPlaceholder} />
      <motion.div
        className={`flex-1 overflow-y-auto ${className}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
