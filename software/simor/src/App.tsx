import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

declare global {
  interface Window {
    electronAPI?: {
      readFile: (path: string) => Promise<string>;
      selectFile: () => Promise<string | null>;
      getDataPath: () => Promise<string | null>;
      clearDataPath: () => Promise<void>;
    };
  }
}

const RR_MIN = 10;
const RR_MAX = 20;

function valueColor(value: number, min: number, max: number): string {
  if (value >= min && value <= max) return "#4ade80";
  if (value >= min - 3 && value <= max + 3) return "#facc15";
  return "#ef4444";
}

function parseTxt(text: string): number[] {
  const lines = text.trim().split("\n");
  const values: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s) continue;
    if (i === 0 && s.startsWith("--- inicio:")) continue;
    const v = parseFloat(s);
    if (!isNaN(v)) values.push(v);
  }
  return values;
}

function VitalCard({
  label,
  value,
  unit,
  limits,
  color,
}: {
  label: string;
  value: number | string;
  unit: string;
  limits?: string;
  color?: string;
}) {
  return (
    <div className="vital-card">
      <div className="vital-label">{label}</div>
      <div className="vital-value">
        <span className="vital-number" style={{ color }}>
          {value}
        </span>
        <span className="vital-unit">{unit}</span>
      </div>
      {limits && <div className="vital-limits">{limits}</div>}
    </div>
  );
}

function App() {
  const [rr, setRr] = useState(12);

  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);
  const [dataPath, setDataPath] = useState<string>("/data/waveform.txt");
  const [externalFile, setExternalFile] = useState<string | null>(null);
  const isElectron = !!window.electronAPI?.readFile;

  const lastCountRef = useRef(0);

  useEffect(() => {
    if (!window.electronAPI?.getDataPath) return;
    window.electronAPI.getDataPath().then((path) => {
      if (path) {
        setDataPath(path);
        setExternalFile(path);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        let text: string;
        if (isElectron) {
          text = await window.electronAPI!.readFile(dataPath);
        } else {
          const res = await fetch(dataPath + "?t=" + Date.now());
          if (!res.ok) return;
          text = await res.text();
        }
        if (cancelled) return;

        const values = parseTxt(text);
        const total = values.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        setRr(total / values.length);
        if (values.length === 0) return;

        if (values.length > lastCountRef.current) {
          const now = Date.now();
          const newEntries = values.map((v, i) => {
            const t = new Date(now - (values.length - 1 - i) * 5000);
            return {
              time: t.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              }),
              value: v,
            };
          });
          setChartData(newEntries.slice(-30));
          lastCountRef.current = values.length;
        }
      } catch {
        /* ignore */
      }
    }

    fetchData();
    const id = setInterval(fetchData, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dataPath, isElectron]);

  async function handleSelectFile() {
    if (!window.electronAPI?.selectFile) return;
    const path = await window.electronAPI.selectFile();
    if (path) {
      setDataPath(path);
      setExternalFile(path);
      lastCountRef.current = 0;
    }
  }

  async function handleClearFile() {
    if (!window.electronAPI?.clearDataPath) return;
    await window.electronAPI.clearDataPath();
    setExternalFile(null);
    setDataPath("/data/waveform.txt");
    lastCountRef.current = 0;
  }

  return (
    <div className="monitor">
      <header className="monitor-header">
        <div className="header-left">
          <h1 className="patient-name">Paciente
          </h1>
          <span className="patient-id">DNI: xx.xxx.xxx</span>
        </div>
        <div className="header-center">
          <span className="status-live" />
          <span className="status-live-text">LIVE</span>
          <span className="status-sensor">SENSOR CONNECTED</span>
        </div>
        <div className="header-right">
          <span className="header-time">14:02:45 | Oct 24</span>
          {isElectron && (
            <button className="exit-btn" onClick={handleSelectFile}>
              {externalFile ? "Change File" : "Select File"}
            </button>
          )}
          {isElectron && externalFile && (
            <button className="exit-btn" onClick={handleClearFile}>
              Reset
            </button>
          )}
        </div>
      </header>

      {isElectron && externalFile && (
        <div className="file-info">File: {externalFile}</div>
      )}

      <main className="monitor-body">
        <div className="vitals-row">
          <VitalCard
            label="RESPIRATION RATE"
            value={rr}
            unit="RPM"
            
            color={valueColor(rr, RR_MIN, RR_MAX)}
          />
          
        </div>

        <div className="waveform-section">
          <div className="waveform-top">
            <h2 className="waveform-title">RESPIRATORY WAVEFORM</h2>
            <span className="waveform-scale">Last 30 readings</span>
          </div>
          <div className="waveform-body">
            <div className="waveform-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis
                    dataKey="time"
                    stroke="#555"
                    tick={{
                      fill: "#555",
                      fontSize: 10,
                      fontFamily: "Consolas, monospace",
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#555"
                    tick={{
                      fill: "#555",
                      fontSize: 10,
                      fontFamily: "Consolas, monospace",
                    }}
                    domain={[0, 85]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0d0d",
                      border: "1px solid #333",
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: "Consolas, monospace",
                    }}
                    labelStyle={{ color: "#aaa" }}
                    itemStyle={{ color: "#4ade80" }}
                    formatter={(val) => [Number(val).toFixed(2), "Value"]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Bar
                    dataKey="value"
                    fill="#4ade80"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
