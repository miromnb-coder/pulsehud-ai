// app/page.js
"use client";

import { useEffect, useMemo, useState } from "react";

const MODES = [
  { id: "running", label: "Juoksu" },
  { id: "cycling", label: "Pyörä" },
  { id: "gym", label: "Sali" }
];

export default function Home() {
  const [mode, setMode] = useState("running");
  const [heartRate, setHeartRate] = useState(152);
  const [targetLow, setTargetLow] = useState(140);
  const [targetHigh, setTargetHigh] = useState(155);
  const [hud, setHud] = useState("pidä tämä");
  const [source, setSource] = useState("local");
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(true);

  const modeLabel = useMemo(
    () => MODES.find((m) => m.id === mode)?.label ?? "Juoksu",
    [mode]
  );

  async function getCoachAdvice() {
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          heartRate: Number(heartRate),
          targetLow: Number(targetLow),
          targetHigh: Number(targetHigh)
        })
      });

      const data = await res.json();
      setHud(data.text || "pidä tämä");
      setSource(data.source || "local");
    } catch {
      setHud("virhe");
      setSource("local");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCoachAdvice();
  }, [mode]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(getCoachAdvice, 3500);
    return () => clearInterval(t);
  }, [auto, mode, heartRate, targetLow, targetHigh]);

  return (
    <main className="page">
      <div className="glass">
        <div className="topline">
          <div>
            <div className="title">PulseHUD AI</div>
            <div className="subtitle">{modeLabel} · {source}</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            <span>auto</span>
          </label>
        </div>

        <div className="hud">
          <span className="hudLabel">AI</span>
          <span className="hudText">{loading ? "..." : hud}</span>
        </div>

        <div className="modes">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={m.id === mode ? "chip active" : "chip"}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="controls">
          <label>
            Syke
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
            />
          </label>

          <label>
            Alaraja
            <input
              type="number"
              value={targetLow}
              onChange={(e) => setTargetLow(e.target.value)}
            />
          </label>

          <label>
            Yläraja
            <input
              type="number"
              value={targetHigh}
              onChange={(e) => setTargetHigh(e.target.value)}
            />
          </label>
        </div>

        <div className="actions">
          <button className="primary" onClick={getCoachAdvice}>
            Päivitä
          </button>
        </div>

        <p className="hint">
          Tämän idean voi myöhemmin kytkeä älykellon dataan. Nyt se toimii jo
          heti Groqilla tai fallback-logiikalla.
        </p>
      </div>
    </main>
  );
}
