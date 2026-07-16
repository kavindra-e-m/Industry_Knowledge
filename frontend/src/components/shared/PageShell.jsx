import Topbar from "../layout/Topbar";
import { motion } from "framer-motion";

export default function PageShell({ children, topbarPlaceholder, className = "" }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar placeholder={topbarPlaceholder} />
      <motion.div
        className={`flex-1 overflow-y-auto ${className}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
