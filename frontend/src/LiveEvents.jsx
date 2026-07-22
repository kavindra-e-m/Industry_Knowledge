import { useEffect, useState, useRef } from "react";

export default function LiveEvents() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("connecting...");
  const wsRef = useRef(null);

  useEffect(() => {
    const url = new URL("/api/stream/live", window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [data, ...prev].slice(0, 25));
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("error");
    };

    return () => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      } else if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      <h2>Live Event Stream</h2>
      <p>Status: {status}</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg, idx) => (
          <li key={idx} style={{ marginBottom: 12, background: "#f5f5f5", padding: 10, borderRadius: 6 }}>
            <strong>{msg.type}</strong>: <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(msg.payload, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
