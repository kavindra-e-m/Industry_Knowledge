import { useState } from "react";
import { login } from "../services/api";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("engineer");
  const [password, setPassword] = useState("eng123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard} className="animate-slide-in">
        <div style={styles.logoContainer}>
          <div style={styles.pulseDot} className="animate-pulse-glow" />
          <h1 style={styles.title}>IndustrialBrain</h1>
        </div>
        <p style={styles.subtitle}>AI-Powered Industrial Knowledge Intelligence</p>
        <p style={styles.meta}>ET AI Hackathon 2026 — PS08</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Operator ID / Username</label>
            <select
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                // Set default password matching demo credentials
                if (e.target.value === "admin") setPassword("admin123");
                else if (e.target.value === "engineer") setPassword("eng123");
                else if (e.target.value === "technician") setPassword("tech123");
              }}
              style={styles.select}
            >
              <option value="admin">Plant Manager (admin)</option>
              <option value="engineer">Maintenance Engineer (engineer)</option>
              <option value="technician">Field Technician (technician)</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Access Code / Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Authenticating..." : "Initialize Intelligence Layer"}
          </button>
        </form>

        <div style={styles.demoCreds}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Demo Credentials:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
            <div>admin / admin123</div>
            <div>engineer / eng123</div>
            <div>technician / tech123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #090a0f 70%)",
  },
  glassCard: {
    background: "rgba(18, 20, 32, 0.75)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    textAlign: "center",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  pulseDot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    boxShadow: "0 0 12px #6366f1",
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    background: "linear-gradient(to right, #ffffff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 4,
  },
  meta: {
    color: "#475569",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: 30,
  },
  errorAlert: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    color: "#f87171",
    padding: 12,
    fontSize: 13,
    marginBottom: 20,
    textAlign: "left",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    textAlign: "left",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    "&:focus": {
      borderColor: "#6366f1",
    },
  },
  select: {
    backgroundColor: "#0d0e14",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
    "&:hover": {
      backgroundColor: "#4f46e5",
    },
  },
  demoCreds: {
    marginTop: 30,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 20,
    textAlign: "left",
    color: "#64748b",
  },
};
