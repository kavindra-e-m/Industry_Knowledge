import { useState } from "react";
import CopilotPage from "./CopilotPage";
import AssetHealthPage from "./AssetHealthPage";
import CompliancePage from "./CompliancePage";
import PidPage from "./PidPage";
import LiveStreamPage from "./LiveStreamPage";

export default function Dashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("copilot");

  const renderActivePage = () => {
    switch (activeTab) {
      case "copilot":
        return <CopilotPage currentUser={currentUser} />;
      case "health":
        return <AssetHealthPage />;
      case "compliance":
        return <CompliancePage />;
      case "pid":
        return <PidPage />;
      case "stream":
        return <LiveStreamPage />;
      default:
        return <CopilotPage currentUser={currentUser} />;
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoBlock}>
          <div style={styles.dot} className="animate-pulse-glow" />
          <span style={styles.brand}>IndustrialBrain</span>
          <span style={styles.versionBadge}>v1.0</span>
        </div>

        <nav style={styles.nav}>
          <button
            onClick={() => setActiveTab("copilot")}
            style={{
              ...styles.navBtn,
              color: activeTab === "copilot" ? "#fff" : "#94a3b8",
              borderBottom: activeTab === "copilot" ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            🤖 Chat Copilot
          </button>
          <button
            onClick={() => setActiveTab("health")}
            style={{
              ...styles.navBtn,
              color: activeTab === "health" ? "#fff" : "#94a3b8",
              borderBottom: activeTab === "health" ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            🔧 Asset Health
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            style={{
              ...styles.navBtn,
              color: activeTab === "compliance" ? "#fff" : "#94a3b8",
              borderBottom: activeTab === "compliance" ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            📋 Compliance
          </button>
          <button
            onClick={() => setActiveTab("pid")}
            style={{
              ...styles.navBtn,
              color: activeTab === "pid" ? "#fff" : "#94a3b8",
              borderBottom: activeTab === "pid" ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            📐 Process Flow (P&ID)
          </button>
          <button
            onClick={() => setActiveTab("stream")}
            style={{
              ...styles.navBtn,
              color: activeTab === "stream" ? "#fff" : "#94a3b8",
              borderBottom: activeTab === "stream" ? "2px solid #6366f1" : "2px solid transparent",
            }}
          >
            ⚡ Live Alerts
          </button>
        </nav>

        <div style={styles.userBlock}>
          <div style={styles.avatar}>
            {currentUser.username[0].toUpperCase()}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{currentUser.full_name}</div>
            <div style={styles.userRole}>{currentUser.role}</div>
          </div>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Exit
          </button>
        </div>
      </header>

      <main style={styles.main}>{renderActivePage()}</main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "#0a0b10",
  },
  header: {
    height: 70,
    background: "rgba(18, 19, 28, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    zIndex: 100,
  },
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    backgroundColor: "#6366f1",
  },
  brand: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#fff",
  },
  versionBadge: {
    fontSize: 9,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    padding: "2px 5px",
    borderRadius: 4,
    color: "#818cf8",
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    height: "100%",
  },
  navBtn: {
    background: "none",
    border: "none",
    padding: "0 20px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    height: "100%",
    transition: "color 0.15s, border-bottom-color 0.15s",
  },
  userBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
  },
  userRole: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
  },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: "#cbd5e1",
    padding: "6px 12px",
    fontSize: 11,
    cursor: "pointer",
    marginLeft: 10,
    transition: "all 0.15s",
    "&:hover": {
      borderColor: "#ef4444",
      color: "#ef4444",
    },
  },
  main: {
    flex: 1,
    height: "calc(100vh - 70px)",
  },
};
