import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.35 + 0.08,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animated grid
      const gridSize = 52;
      ctx.strokeStyle = "rgba(79,157,255,0.028)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Slow ambient radial glow (breathing)
      const cx = canvas.width * 0.5 + Math.sin(t * 0.4) * 80;
      const cy = canvas.height * 0.38 + Math.cos(t * 0.3) * 50;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.55);
      glow.addColorStop(0, `rgba(79,157,255,${0.028 + Math.sin(t) * 0.012})`);
      glow.addColorStop(0.5, `rgba(124,92,252,${0.014 + Math.cos(t * 0.7) * 0.006})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Second ambient glow bottom-right
      const cx2 = canvas.width * 0.82 + Math.cos(t * 0.5) * 60;
      const cy2 = canvas.height * 0.75 + Math.sin(t * 0.35) * 40;
      const glow2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, canvas.width * 0.35);
      glow2.addColorStop(0, `rgba(52,211,153,${0.018 + Math.sin(t * 1.1) * 0.008})`);
      glow2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,157,255,${p.alpha})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
    />
  );
}
