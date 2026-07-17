import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { getCurrentUser, setAuthToken } from "./services/api";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (retrieve JWT token)
    getCurrentUser()
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      })
      .catch((e) => console.error("Session restoration failed:", e))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setAuthToken("");
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} className="animate-spin-slow" />
        <span style={styles.loadingText}>Initializing Security Protocols...</span>
      </div>
    );
  }

  return currentUser ? (
    <Dashboard currentUser={currentUser} onLogout={handleLogout} />
  ) : (
    <LoginPage onLoginSuccess={handleLoginSuccess} />
  );
}

const styles = {
  loadingContainer: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0b10",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(99, 102, 241, 0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "'Space Grotesk', sans-serif",
  },
};
