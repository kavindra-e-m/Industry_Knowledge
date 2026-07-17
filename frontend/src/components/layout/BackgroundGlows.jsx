import { motion } from "framer-motion";

export default function BackgroundGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Right Purple Glow */}
      <motion.div
        className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(124,92,252,0.1) 0%, rgba(124,92,252,0) 70%)",
          filter: "blur(60px)",
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
      {/* Bottom Left Blue Glow */}
      <motion.div
        className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(79,157,255,0.08) 0%, rgba(79,157,255,0) 70%)",
          filter: "blur(70px)",
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
      {/* Center Cyan Glow */}
      <motion.div
        className="absolute top-[30%] left-[25%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, rgba(56,189,248,0) 70%)",
          filter: "blur(50px)",
        }}
        animate={{
          scale: [0.9, 1.1, 0.9],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
