"use client";
import { useState, useEffect } from "react";

interface Goal {
  id: number;
  text: string;
  deadline?: string;
  done: boolean;
  createdAt: string;
}

const STORAGE_KEY = "cc-goals";

export function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setGoals(JSON.parse(stored));
      } catch {}
    }
  }, []);

  function save(next: Goal[]) {
    setGoals(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addGoal() {
    if (!newText.trim()) return;
    save([
      ...goals,
      {
        id: Date.now(),
        text: newText.trim(),
        deadline: newDeadline || undefined,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewText("");
    setNewDeadline("");
    setAdding(false);
  }

  function toggleGoal(id: number) {
    save(goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
  }

  function removeGoal(id: number) {
    save(goals.filter((g) => g.id !== id));
  }

  const active = goals.filter((g) => !g.done);
  const completed = goals.filter((g) => g.done);

  return (
    <div className="panel fade-up">
      <div className="panel-header">
        <span className="panel-title">Goals</span>
        <span className="stat-pill" style={{ background: "var(--surface-3)", color: "var(--text-dim)" }}>
          {active.length} active
        </span>
      </div>

      <div className="space-y-1">
        {active.map((goal) => (
          <div
            key={goal.id}
            className="flex items-start gap-2 py-1.5 px-2 rounded text-xs"
            style={{ background: "var(--surface-2)" }}
          >
            <input
              type="checkbox"
              className="goal-check mt-0.5"
              checked={false}
              onChange={() => toggleGoal(goal.id)}
            />
            <div className="flex-1 min-w-0">
              <span>{goal.text}</span>
              {goal.deadline && (
                <span className="mono ml-2" style={{ color: "var(--text-dim)", fontSize: "10px" }}>
                  by {goal.deadline}
                </span>
              )}
            </div>
            <button className="edit-btn" style={{ color: "var(--red)" }} onClick={() => removeGoal(goal.id)}>
              x
            </button>
          </div>
        ))}

        {completed.length > 0 && (
          <div className="mt-2">
            <div style={{ fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px" }}>COMPLETED</div>
            {completed.slice(0, 5).map((goal) => (
              <div
                key={goal.id}
                className="flex items-center gap-2 py-1 px-2 rounded text-xs mb-0.5"
                style={{ background: "var(--surface-2)", opacity: 0.6 }}
              >
                <input
                  type="checkbox"
                  className="goal-check mt-0"
                  checked={true}
                  onChange={() => toggleGoal(goal.id)}
                />
                <span style={{ textDecoration: "line-through" }}>{goal.text}</span>
                <button
                  className="edit-btn ml-auto"
                  style={{ color: "var(--red)" }}
                  onClick={() => removeGoal(goal.id)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding ? (
        <div className="mt-2 space-y-1.5">
          <input
            className="inline-input w-full"
            placeholder="What's the goal?"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGoal()}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              className="inline-input flex-1"
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              style={{ fontSize: "11px" }}
            />
            <button className="edit-btn" style={{ color: "var(--green)" }} onClick={addGoal}>
              add
            </button>
            <button className="edit-btn" onClick={() => setAdding(false)}>
              cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="text-xs mt-2 cursor-pointer hover:underline"
          style={{ color: "var(--accent)", background: "none", border: "none" }}
          onClick={() => setAdding(true)}
        >
          + Add goal
        </button>
      )}
    </div>
  );
}
