import { useState, useEffect, useRef } from "react";
import { askQuestion, getEquipmentList } from "../services/api";

export default function CopilotPage({ currentUser }) {
  const [query, setQuery] = useState("");
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: "Hello! I am your Industrial Intelligence Copilot. Ask me anything about plant operations, safety procedures, OISD standards, or equipment troubleshooting. Select a tag below to scope my search.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    getEquipmentList()
      .then((data) => setEquipmentList(data.equipment || []))
      .catch((err) => console.error("Failed to load equipment list:", err));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = { role: "user", content: query, tag: selectedTag };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const data = await askQuestion(userMsg.content, selectedTag || null);
      
      // Parse structured sections if returned in markdown style or render cleanly
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          agent: data.routed_to_agent || "copilot",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Error connecting to the backend. Please check if databases are seeded and API is running.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAgentColor = (agent) => {
    switch (agent) {
      case "maintenance": return "#f59e0b";
      case "compliance": return "#10b981";
      case "pid": return "#06b6d4";
      case "lessons": return "#ef4444";
      default: return "#6366f1";
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Scope Query Context</h3>
        <p style={styles.sidebarSubtitle}>Select equipment tag to inject database schema and operational telemetry.</p>
        
        <div style={styles.tagSelectorGroup}>
          <label style={styles.tagLabel}>Equipment Scoping</label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Search General Knowledge Base --</option>
            {equipmentList.map((eq) => (
              <option key={eq.tag_id} value={eq.tag_id}>
                {eq.tag_id} - {eq.name} ({eq.criticality})
              </option>
            ))}
          </select>
        </div>

        {selectedTag && (
          <div style={styles.contextBox} className="animate-slide-in">
            <h4 style={{ fontSize: 13, color: "#fff", marginBottom: 6 }}>Telemetry Context Injected</h4>
            <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 4 }}>
              <div>• Neo4j Graph Topology Schema loaded</div>
              <div>• Historical Failure History mapped</div>
              <div>• Active PM schedule synced</div>
            </div>
          </div>
        )}
      </div>

      <div style={styles.chatArea}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>Industrial Intelligence Hub</h2>
            <p style={styles.headerSubtitle}>Unified RAG reasoning engine with 6 specialist agents</p>
          </div>
          <div style={styles.badge}>
            Operator: <span style={{ color: "#fff", fontWeight: 600 }}>{currentUser.username}</span>
          </div>
        </div>

        <div style={styles.messageList} ref={scrollRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageRow,
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role !== "user" && (
                <div style={{ ...styles.avatar, backgroundColor: getAgentColor(msg.agent) }}>
                  🤖
                </div>
              )}

              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: msg.role === "user" ? "rgba(99, 102, 241, 0.15)" : "#12131c",
                  border: msg.role === "user" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                {msg.agent && (
                  <div style={{ ...styles.agentTag, color: getAgentColor(msg.agent) }}>
                    • routed to {msg.agent} agent
                  </div>
                )}
                
                {msg.tag && (
                  <div style={styles.scopedTagBadge}>
                    Context Scoped: {msg.tag}
                  </div>
                )}

                <div style={styles.bubbleContent}>{msg.content}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div style={styles.sourcesBox}>
                    <div style={styles.sourcesTitle}>VERIFIABLE CITATIONS:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {msg.sources.map((src, i) => (
                        <div key={i} style={styles.sourceCard} title={src.text_preview}>
                          📄 {src.filename} (Score: {src.relevance_score})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div style={{ ...styles.avatar, backgroundColor: "#334155" }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={styles.messageRow}>
              <div style={{ ...styles.avatar, backgroundColor: "#6366f1" }} className="animate-spin-slow">
                🔄
              </div>
              <div style={{ ...styles.bubble, backgroundColor: "#12131c" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={styles.loadingDot} />
                  <div style={styles.loadingDot} />
                  <div style={styles.loadingDot} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Agent reasoning...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={styles.inputForm}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question (e.g. 'How do I align pump P-101?' or 'What does OISD-142 say about inspections?')..."
            style={styles.input}
          />
          <button type="submit" style={styles.sendBtn}>
            Consult Agents
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "calc(100vh - 70px)",
    display: "flex",
  },
  sidebar: {
    width: 280,
    background: "#0c0d12",
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: "18px",
  },
  tagSelectorGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  tagLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
  },
  select: {
    backgroundColor: "#12131c",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 13,
    outline: "none",
    width: "100%",
  },
  contextBox: {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    border: "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: 10,
    padding: 14,
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#07080c",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: 600,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  badge: {
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "6px 12px",
    borderRadius: 20,
    color: "#94a3b8",
  },
  messageList: {
    flex: 1,
    padding: 24,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  messageRow: {
    display: "flex",
    gap: 12,
    width: "100%",
    alignItems: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  agentTag: {
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  scopedTagBadge: {
    alignSelf: "flex-start",
    fontSize: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: "3px 8px",
    borderRadius: 4,
    color: "#94a3b8",
  },
  bubbleContent: {
    color: "#f1f5f9",
    fontSize: 14,
    lineHeight: "22px",
    whiteSpace: "pre-line",
  },
  sourcesBox: {
    marginTop: 10,
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    paddingTop: 10,
  },
  sourcesTitle: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 700,
    marginBottom: 6,
  },
  sourceCard: {
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "4px 8px",
    borderRadius: 6,
    color: "#94a3b8",
    cursor: "help",
  },
  inputForm: {
    padding: 20,
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#12131c",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    backgroundColor: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "0 24px",
    fontWeight: 600,
    cursor: "pointer",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    animation: "pulseGlow 1s infinite",
  },
};
