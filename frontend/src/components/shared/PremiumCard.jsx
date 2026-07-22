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
      className={`ib-card ${className}`}
      whileHover={
        hover
          ? {
              y: -2,
            }
          : {}
      }
      transition={{ duration: 0.2 }}
      {...props}
    >
      {/* Gradient border overlay on hover */}
      {gradient && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(124, 58, 237, 0.15))",
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
