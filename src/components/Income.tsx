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
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"one-time" | "recurring">("one-time");
  const [adding, setAdding] = useState(false);
  const [newSource, setNewSource] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"one-time" | "recurring">("one-time");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setEntries(JSON.parse(stored)); } catch {}
    }
  }, []);

  function save(next: IncomeEntry[]) {
    setEntries(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function startEdit(i: number) {
    setEditIdx(i);
    setEditSource(entries[i].source);
    setEditAmount(String(entries[i].amount));
    setEditType(entries[i].type);
  }

  function confirmEdit() {
    if (editIdx === null) return;
    const next = [...entries];
    next[editIdx] = { source: editSource.trim() || next[editIdx].source, amount: parseFloat(editAmount) || 0, type: editType };
    save(next);
    setEditIdx(null);
  }

  function removeEntry(i: number) {
    save(entries.filter((_, idx) => idx !== i));
    setEditIdx(null);
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
          <div key={`${entry.source}-${i}`} className="editable-row">
            {editIdx === i ? (
              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <input className="inline-input flex-1" value={editSource} onChange={(e) => setEditSource(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmEdit()} autoFocus />
                <input className="inline-input w-20 text-right" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmEdit()} type="number" />
                <select className="inline-input" value={editType} onChange={(e) => setEditType(e.target.value as "one-time" | "recurring")} style={{ fontSize: "10px" }}>
                  <option value="one-time">1x</option>
                  <option value="recurring">MRR</option>
                </select>
                <button className="edit-btn" style={{ color: "var(--green)" }} onClick={confirmEdit}>save</button>
                <button className="edit-btn" style={{ color: "var(--red)" }} onClick={() => removeEntry(i)}>delete</button>
                <button className="edit-btn" onClick={() => setEditIdx(null)}>cancel</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-mid)" }}>{entry.source}</span>
                  <span className="mono" style={{ fontSize: "9px", padding: "0 4px", borderRadius: "3px", background: entry.type === "recurring" ? "var(--green-dim)" : "var(--surface-3)", color: entry.type === "recurring" ? "var(--green)" : "var(--text-dim)" }}>
                    {entry.type === "recurring" ? "MRR" : "1x"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs" style={{ color: entry.amount > 0 ? "var(--green)" : "var(--text-dim)" }}>
                    ${entry.amount.toFixed(0)}
                  </span>
                  <button className="edit-btn" onClick={() => startEdit(i)}>edit</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <input className="inline-input flex-1" placeholder="Source" value={newSource} onChange={(e) => setNewSource(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} autoFocus />
          <input className="inline-input w-20 text-right" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} type="number" />
          <select className="inline-input" value={newType} onChange={(e) => setNewType(e.target.value as "one-time" | "recurring")} style={{ fontSize: "10px" }}>
            <option value="one-time">1x</option>
            <option value="recurring">MRR</option>
          </select>
          <button className="edit-btn" style={{ color: "var(--green)" }} onClick={addEntry}>add</button>
          <button className="edit-btn" onClick={() => { setAdding(false); setNewSource(""); setNewAmount(""); }}>cancel</button>
        </div>
      ) : (
        <button className="text-xs mt-2 cursor-pointer hover:underline" style={{ color: "var(--accent)", background: "none", border: "none" }} onClick={() => setAdding(true)}>
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
          <div className="mono text-sm font-bold" style={{ color: "var(--green)" }}>${totalRecurring.toFixed(0)}/mo</div>
        </div>
      </div>
    </div>
  );
}
