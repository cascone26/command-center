"use client";
import { useEffect, useState } from "react";

interface GPU {
  id: string;
  name: string;
  gpu_pct: number;
  mem_pct: number;
  mem_used: number;
  mem_total: number;
  temp: number;
  power: number;
}

interface Service {
  port: number;
  up: boolean;
  data?: string;
}

interface OlympusData {
  gpus: GPU[];
  ollama: { up: boolean; models: string[] };
  services: Record<string, Service>;
  procs: { user: string; cpu: string; mem: string; cmd: string }[];
}

function GpuBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="progress-track" style={{ flexGrow: 1 }}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color, transition: "width 0.6s ease" }}
      />
    </div>
  );
}

function gpuColor(pct: number) {
  if (pct >= 85) return "var(--red)";
  if (pct >= 60) return "var(--yellow)";
  return "var(--green)";
}

const SERVICE_LABELS: Record<string, string> = {
  athena: "Athena",
  "cobo-lite": "COBO Lite",
  "3way-board": "3way Board",
  comfyui: "ComfyUI",
  "f5-voice": "F5 Voice",
  ollama: "Ollama",
};

export function OlympusPanel() {
  const [data, setData] = useState<OlympusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await fetch("/api/olympus", { cache: "no-store" });
      const j = await r.json();
      if (j.ok) {
        setData(j.data);
        setError(null);
      } else {
        setError(j.error || "unreachable");
      }
      setFetchedAt(j.fetchedAt);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="panel fade-up" style={{ gridColumn: "1 / -1" }}>
      <div className="panel-header">
        <span className="panel-title">Olympus</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {fetchedAt && (
            <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>
              {new Date(fetchedAt).toLocaleTimeString()}
            </span>
          )}
          <span
            className="stat-pill"
            style={{
              background: error ? "var(--red-dim)" : loading ? "var(--yellow-dim)" : "var(--green-dim)",
              color: error ? "var(--red)" : loading ? "var(--yellow)" : "var(--green)",
            }}
          >
            {error ? "offline" : loading ? "loading" : "live"}
          </span>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "var(--red)", padding: "4px 0 8px" }}>
          {error}
        </p>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Left col: GPUs + Ollama */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* GPUs */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-dim)", marginBottom: "8px" }}>
                GPUs ({data.gpus.length}x RTX 3090)
              </div>
              {data.gpus.map((gpu) => (
                <div key={gpu.id} style={{ marginBottom: "8px", padding: "10px", background: "var(--surface-2)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>GPU {gpu.id}</span>
                    <span className="mono" style={{ color: "var(--text-dim)" }}>
                      {gpu.temp}°C · {gpu.power.toFixed(0)}W
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-dim)", width: "28px" }}>GPU</span>
                    <GpuBar pct={gpu.gpu_pct} color={gpuColor(gpu.gpu_pct)} />
                    <span className="mono" style={{ fontSize: "11px", width: "32px", textAlign: "right", color: gpuColor(gpu.gpu_pct) }}>
                      {gpu.gpu_pct}%
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-dim)", width: "28px" }}>VRAM</span>
                    <GpuBar pct={gpu.mem_pct} color={gpuColor(gpu.mem_pct)} />
                    <span className="mono" style={{ fontSize: "11px", width: "32px", textAlign: "right", color: gpuColor(gpu.mem_pct) }}>
                      {gpu.mem_pct}%
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-dim)", marginTop: "4px", textAlign: "right" }}>
                    {Math.round(gpu.mem_used / 1024)}GB / {Math.round(gpu.mem_total / 1024)}GB
                  </div>
                </div>
              ))}
            </div>

            {/* Ollama */}
            <div style={{ padding: "10px", background: "var(--surface-2)", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: data.ollama.models.length > 0 ? "8px" : 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 600 }}>Ollama</span>
                <span style={{ fontSize: "10px", color: data.ollama.up ? "var(--green)" : "var(--red)" }}>
                  {data.ollama.up ? "UP" : "DOWN"}
                </span>
              </div>
              {data.ollama.models.length > 0 ? (
                data.ollama.models.map((m, i) => (
                  <div key={i} className="mono" style={{ fontSize: "10px", color: "var(--cyan)", marginTop: "2px" }}>
                    {m.split(/\s{2,}/)[0]}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "10px", color: "var(--text-dim)" }}>No models loaded (idle)</div>
              )}
            </div>
          </div>

          {/* Right col: Services + Processes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Services */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-dim)", marginBottom: "8px" }}>
                Services
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {Object.entries(data.services).map(([key, svc]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--surface-2)", borderRadius: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: svc.up ? "var(--green)" : "var(--red)", flexShrink: 0 }} />
                      <span style={{ fontSize: "12px" }}>{SERVICE_LABELS[key] ?? key}</span>
                    </div>
                    <span className="mono" style={{ fontSize: "10px", color: "var(--text-dim)" }}>:{svc.port}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Processes */}
            {data.procs.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-dim)", marginBottom: "8px" }}>
                  Top Processes
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {data.procs.slice(0, 6).map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", padding: "5px 8px", background: "var(--surface-2)", borderRadius: "6px", fontSize: "11px" }}>
                      <span className="mono" style={{ color: "var(--yellow)", width: "36px", flexShrink: 0 }}>{p.cpu}%</span>
                      <span style={{ color: "var(--text-dim)", flexShrink: 0, width: "32px" }}>{p.mem}%</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-mid)" }}>
                        {p.cmd.split("/").pop()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
