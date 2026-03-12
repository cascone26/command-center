"use client";
import { useState, useEffect } from "react";

interface CostItem {
  name: string;
  amount: number;
}

const STORAGE_KEY = "cc-monthly-costs";

export function MonthlyCosts({ defaults }: { defaults: CostItem[] }) {
  const [items, setItems] = useState<CostItem[]>(defaults);
  const [editing, setEditing] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {}
    }
  }, []);

  function save(next: CostItem[]) {
    setItems(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function updateItem(index: number, field: "name" | "amount", value: string) {
    const next = [...items];
    if (field === "amount") {
      next[index] = { ...next[index], amount: parseFloat(value) || 0 };
    } else {
      next[index] = { ...next[index], name: value };
    }
    save(next);
  }

  function removeItem(index: number) {
    save(items.filter((_, i) => i !== index));
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
          <div key={i} className="editable-row">
            {editing === i ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  className="inline-input flex-1"
                  value={item.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  onBlur={() => setEditing(null)}
                  autoFocus
                />
                <input
                  className="inline-input w-16 text-right"
                  value={item.amount}
                  onChange={(e) => updateItem(i, "amount", e.target.value)}
                  onBlur={() => setEditing(null)}
                  type="number"
                  step="0.01"
                />
                <button className="edit-btn" style={{ color: "var(--red)" }} onClick={() => removeItem(i)}>
                  x
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs" style={{ color: "var(--text-mid)" }}>
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs" style={{ color: "var(--text)" }}>
                    ${item.amount.toFixed(2)}
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
            placeholder="Service name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            autoFocus
          />
          <input
            className="inline-input w-16 text-right"
            placeholder="0.00"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            type="number"
            step="0.01"
          />
          <button className="edit-btn" style={{ color: "var(--green)" }} onClick={addItem}>
            add
          </button>
          <button className="edit-btn" onClick={() => setAdding(false)}>
            cancel
          </button>
        </div>
      ) : (
        <button
          className="text-xs mt-2 cursor-pointer hover:underline"
          style={{ color: "var(--accent)", background: "none", border: "none" }}
          onClick={() => setAdding(true)}
        >
          + Add cost
        </button>
      )}

      <div
        className="flex items-center justify-between mt-3 pt-2"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>
          Monthly Total
        </span>
        <span className="mono text-sm font-bold" style={{ color: "var(--text)" }}>
          ${total.toFixed(2)}/mo
        </span>
      </div>
    </div>
  );
}
