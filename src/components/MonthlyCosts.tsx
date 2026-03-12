"use client";
import { useState, useEffect } from "react";

interface CostItem {
  name: string;
  amount: number;
}

const STORAGE_KEY = "cc-monthly-costs";

export function MonthlyCosts({ defaults }: { defaults: CostItem[] }) {
  const [items, setItems] = useState<CostItem[]>(defaults);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch {}
    }
  }, []);

  function save(next: CostItem[]) {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function startEdit(i: number) {
    setEditIdx(i);
    setEditName(items[i].name);
    setEditAmount(String(items[i].amount));
  }

  function confirmEdit() {
    if (editIdx === null) return;
    const next = [...items];
    next[editIdx] = { name: editName.trim() || next[editIdx].name, amount: parseFloat(editAmount) || 0 };
    save(next);
    setEditIdx(null);
  }

  function removeItem(i: number) {
    save(items.filter((_, idx) => idx !== i));
    setEditIdx(null);
  }

  function addItem() {
    if (!newName.trim()) return;
    save([...items, { name: newName.trim(), amount: parseFloat(newAmount) || 0 }]);
    setNewName("");
    setNewAmount("");
    setAdding(false);
  }

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Monthly Costs</span>
        <span className="mono" style={{ fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>
          ${total.toFixed(2)}
        </span>
      </div>

      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={`${item.name}-${i}`} className="editable-row">
            {editIdx === i ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  className="inline-input flex-1"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  autoFocus
                />
                <input
                  className="inline-input w-20 text-right"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                  type="number"
                  step="0.01"
                />
                <button className="edit-btn" style={{ color: "var(--green)" }} onClick={confirmEdit}>
                  save
                </button>
                <button className="edit-btn" style={{ color: "var(--red)" }} onClick={() => removeItem(i)}>
                  delete
                </button>
                <button className="edit-btn" onClick={() => setEditIdx(null)}>
                  cancel
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs" style={{ color: "var(--text-mid)" }}>{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs" style={{ color: "var(--text)" }}>${item.amount.toFixed(2)}</span>
                  <button className="edit-btn" onClick={() => startEdit(i)}>edit</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 mt-2">
          <input className="inline-input flex-1" placeholder="Service name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} autoFocus />
          <input className="inline-input w-20 text-right" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} type="number" step="0.01" />
          <button className="edit-btn" style={{ color: "var(--green)" }} onClick={addItem}>add</button>
          <button className="edit-btn" onClick={() => { setAdding(false); setNewName(""); setNewAmount(""); }}>cancel</button>
        </div>
      ) : (
        <button className="text-xs mt-2 cursor-pointer hover:underline" style={{ color: "var(--accent)", background: "none", border: "none" }} onClick={() => setAdding(true)}>
          + Add cost
        </button>
      )}

      <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>Monthly Total</span>
        <span className="mono text-sm font-bold" style={{ color: "var(--text)" }}>${total.toFixed(2)}/mo</span>
      </div>
    </div>
  );
}
