import { motion } from "framer-motion";
import { Loader } from "lucide-react";

export function PremiumButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  ...props
}) {
  const variants = {
    primary: {
      bg: "linear-gradient(135deg, #4F9DFF 0%, #7C5CFC 100%)",
      text: "text-white",
      hover: "hover:shadow-lg hover:shadow-[#4F9DFF]/50",
      border: "border border-[#4F9DFF]/30",
    },
    secondary: {
      bg: "bg-[#1E3A5F]",
      text: "text-[#4F9DFF]",
      hover: "hover:bg-[#2a4a6b]",
      border: "border border-[#1E3A5F]",
    },
    ghost: {
      bg: "bg-transparent",
      text: "text-[#8BA3C7]",
      hover: "hover:bg-[#1E3A5F]/60 hover:text-[#F0F6FF]",
      border: "border border-[#1E3A5F]",
    },
    critical: {
      bg: "linear-gradient(135deg, #FF5C5C 0%, #FF7B7B 100%)",
      text: "text-white",
      hover: "hover:shadow-lg hover:shadow-[#FF5C5C]/50",
      border: "border border-[#FF5C5C]/30",
    },
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${s} ${v.text} ${v.border} ${v.hover} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        background: variant === "primary" || variant === "critical" ? v.bg : undefined,
        backgroundColor: variant !== "primary" && variant !== "critical" ? v.bg : undefined,
      }}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {/* Ripple effect */}
      {!disabled && !loading && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0, scale: 0 }}
          whileTap={{ opacity: 0.2, scale: 2 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {loading && <Loader size={16} className="animate-spin" />}
        {children}
      </span>
    </motion.button>
  );
}

export default PremiumButton;
