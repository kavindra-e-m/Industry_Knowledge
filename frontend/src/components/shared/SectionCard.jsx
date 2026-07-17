import { motion } from "framer-motion";

export default function SectionCard({ title, action, children, className = "", noPad = false, glowColor }) {
  const glowStyle = glowColor
    ? { boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${glowColor}20` }
    : {};

  return (
    <motion.div
      className={`ib-card ${noPad ? "" : "p-4"} ${className}`}
      style={glowStyle}
      whileHover={{ y: -1, transition: { duration: 0.15 } }}
    >
      {(title || action) && (
        <div className={`flex items-center justify-between ${noPad ? "px-4 pt-4 pb-3" : "mb-4"}`}>
          {title && <p className="ib-label">{title}</p>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </motion.div>
  );
}
