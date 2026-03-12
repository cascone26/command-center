"use client";
import { useState, useEffect } from "react";

interface IncomeEntry {
  source: string;
  amount: number;
  type: "one-time" | "recurring";
}

const STORAGE_KEY = "cc-income";

const defaultEntries: IncomeEntry[] = [
  { source: "Scholarships Won", amount: 0, type: "one-time" },
  { source: "Freelance", amount: 0, type: "one-time" },
  { source: "LessonDraft MRR", amount: 0, type: "recurring" },
];

export function Income() {
  const [entries, setEntries] = useState<IncomeEntry[]>(defaultEntries);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"one-time" | "recurring">("one-time");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch {}
    }
  }, []);

  function save(next: IncomeEntry[]) {
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateEntry(index: number, field: string, value: string) {
    const next = [...entries];
    if (field === "amount") {
      next[index] = { ...next[index], amount: parseFloat(value) || 0 };
    } else if (field === "source") {
      next[index] = { ...next[index], source: value };
    }
    save(next);
  }

  function removeEntry(index: number) {
    save(entries.filter((_, i) => i !== index));
  }

  function addEntry() {
    if (!newSource.trim()) return;
    save([...entries, { source: newSource.trim(), amount: parseFloat(newAmount) || 0, type: newType }]);
    setNewSource("");
    setNewAmount("");
    setAdding(false);
  }

  const totalOneTime = entries.filter((e) => e.type === "one-time").reduce((s, e) => s + e.amount, 0);
  const totalRecurring = entries.filter((e) => e.type === "recurring").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Income</span>
        <span className="mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--green)" }}>
          ${(totalOneTime + totalRecurring).toFixed(0)}
        </span>
      </div>

      <div className="space-y-0">
        {entries.map((entry, i) => (
          <div key={i} className="editable-row">
            {editing === i ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  className="inline-input flex-1"
                  value={entry.source}
                  onChange={(e) => updateEntry(i, "source", e.target.value)}
                  autoFocus
                />
                <input
                  className="inline-input w-16 text-right"
                  value={entry.amount}
                  onChange={(e) => updateEntry(i, "amount", e.target.value)}
                  type="number"
                />
                <button className="edit-btn" style={{ color: "var(--red)" }} onClick={() => removeEntry(i)}>
                  x
                </button>
                <button className="edit-btn" onClick={() => setEditing(null)}>
                  done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-mid)" }}>
                    {entry.source}
                  </span>
                  <span
                    className="mono"
                    style={{
                      fontSize: "9px",
                      padding: "0 4px",
                      borderRadius: "3px",
                      background: entry.type === "recurring" ? "var(--green-dim)" : "var(--surface-3)",
                      color: entry.type === "recurring" ? "var(--green)" : "var(--text-dim)",
                    }}
                  >
                    {entry.type === "recurring" ? "MRR" : "1x"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs" style={{ color: entry.amount > 0 ? "var(--green)" : "var(--text-dim)" }}>
                    ${entry.amount.toFixed(0)}
                  </span>
                  <button className="edit-btn" onClick={() => setEditing(i)}>
                    edit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            className="inline-input flex-1"
            placeholder="Source"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEntry()}
            autoFocus
          />
          <input
            className="inline-input w-16 text-right"
            placeholder="0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            type="number"
          />
          <select
            className="inline-input"
            value={newType}
            onChange={(e) => setNewType(e.target.value as "one-time" | "recurring")}
            style={{ fontSize: "10px" }}
          >
            <option value="one-time">1x</option>
            <option value="recurring">MRR</option>
          </select>
          <button className="edit-btn" style={{ color: "var(--green)" }} onClick={addEntry}>
            add
          </button>
        </div>
      ) : (
        <button
          className="text-xs mt-2 cursor-pointer hover:underline"
          style={{ color: "var(--accent)", background: "none", border: "none" }}
          onClick={() => setAdding(true)}
        >
          + Add income
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>One-time</div>
          <div className="mono text-sm font-bold">${totalOneTime.toFixed(0)}</div>
        </div>
        <div>
          <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>Recurring</div>
          <div className="mono text-sm font-bold" style={{ color: "var(--green)" }}>
            ${totalRecurring.toFixed(0)}/mo
          </div>
        </div>
      </div>
    </div>
  );
}
