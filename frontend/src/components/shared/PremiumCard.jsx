import { motion } from "framer-motion";

export function PremiumCard({
  children,
  className = "",
  hover = true,
  glow = false,
  gradient = false,
  ...props
}) {
  return (
    <motion.div
      className={`rounded-xl overflow-hidden transition-all ${className}`}
      style={{
        background: "rgba(22, 38, 61, 0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(79, 157, 255, 0.15)",
        boxShadow: glow ? "0 0 20px rgba(79, 157, 255, 0.1)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
      whileHover={
        hover
          ? {
              y: -2,
              boxShadow: glow
                ? "0 0 30px rgba(79, 157, 255, 0.2)"
                : "0 8px 24px rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(79, 157, 255, 0.25)",
            }
          : {}
      }
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Gradient border on hover */}
      {gradient && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(79, 157, 255, 0.2), rgba(124, 92, 252, 0.2))",
            opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default PremiumCard;
