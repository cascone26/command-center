"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "cc-notepad";

export function Notepad() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setText(stored);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, text);
      if (text) setSaved(true);
      setTimeout(() => setSaved(false), 1000);
    }, 500);
    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Scratchpad</span>
        {saved && <span style={{ fontSize: "10px", color: "var(--green)" }}>Saved</span>}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Quick notes..."
        className="w-full resize-none outline-none text-xs"
        rows={10}
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "8px",
          color: "var(--text)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          lineHeight: "1.5",
        }}
      />
      <p style={{ fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>
        Persists in browser localStorage
      </p>
    </div>
  );
}
