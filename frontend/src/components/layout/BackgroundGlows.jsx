import { motion } from "framer-motion";

export default function BackgroundGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Right Purple Glow */}
      <motion.div
        className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(177,0,255,0.06) 0%, rgba(177,0,255,0) 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Bottom Left Lime Glow */}
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(204,255,0,0.05) 0%, rgba(204,255,0,0) 70%)",
          filter: "blur(90px)",
        }}
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
