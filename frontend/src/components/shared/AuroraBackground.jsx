import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const animate = () => {
      time += 0.0003;

      // Clear with base color
      ctx.fillStyle = "#07111F";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Aurora gradients
      const auroraColors = [
        { x: 0.2, y: 0.3, color: "rgba(79, 157, 255, 0.08)" },
        { x: 0.5, y: 0.5, color: "rgba(124, 92, 252, 0.06)" },
        { x: 0.8, y: 0.2, color: "rgba(56, 189, 248, 0.05)" },
      ];

      auroraColors.forEach((aurora, i) => {
        const x = canvas.width * (aurora.x + Math.sin(time + i) * 0.05);
        const y = canvas.height * (aurora.y + Math.cos(time + i * 0.7) * 0.05);
        const radius = Math.max(canvas.width, canvas.height) * (0.3 + Math.sin(time * 0.5 + i) * 0.1);

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, aurora.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      // Subtle grid
      ctx.strokeStyle = "rgba(30, 58, 95, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
