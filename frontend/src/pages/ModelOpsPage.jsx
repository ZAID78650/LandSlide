import React, { useEffect, useState, useRef } from 'react';
import { getModels, runModel } from '../api/client';

function StatusChip({ level, label }) {
  const colors = {
    ONLINE: { bg: 'var(--green-muted)', color: 'var(--green)' },
    ACTIVE: { bg: 'var(--green-muted)', color: 'var(--green)' },
    LOADED: { bg: 'var(--cyan-muted)', color: 'var(--cyan)' },
    DEGRADED: { bg: 'var(--amber-muted)', color: 'var(--amber)' },
    OFFLINE: { bg: 'var(--red-muted)', color: 'var(--red)' },
    READY: { bg: 'var(--cyan-muted)', color: 'var(--cyan)' },
  };
  const c = colors[level] || colors.ONLINE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: c.bg, color: c.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color }} />
      {label || level}
    </span>
  );
}

function ConfidenceBar({ value, label }) {
  const pct = (value * 100).toFixed(1);
  const cls = value >= 0.85 ? 'high' : value >= 0.65 ? 'medium' : 'low';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ fontSize: 11, color: value >= 0.85 ? 'var(--green)' : value >= 0.65 ? 'var(--amber)' : 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="confidence-bar">
        <div className={`confidence-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const INFERENCE_STAGES = [
  'Loading model weights...',
  'Initializing inference engine...',
  'Preprocessing input tensor...',
  'Running forward pass...',
  'Post-processing segmentation mask...',
  'Computing confidence map...',
  'Generating risk classification...',
  'Finalizing results...',
];

export default function ModelOpsPage() {
  const [models, setModels] = useState([]);
  const [runningId, setRunningId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [scanProgress, setScanProgress] = useState({});
  const [scanStage, setScanStage] = useState({});
  const [inferenceLog, setInferenceLog] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    getModels().then(r => setModels(r.data));
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleRun = async (id) => {
    setRunningId(id);
    setScanProgress(prev => ({ ...prev, [id]: 0 }));
    setInferenceLog([]);
    let progress = 0;
    let stageIdx = 0;

    timerRef.current = setInterval(() => {
      progress += Math.random() * 6 + 2;
      if (progress > 95) progress = 95;
      setScanProgress(prev => ({ ...prev, [id]: Math.floor(progress) }));

      const newStageIdx = Math.min(Math.floor((progress / 100) * INFERENCE_STAGES.length), INFERENCE_STAGES.length - 1);
      if (newStageIdx !== stageIdx) {
        stageIdx = newStageIdx;
        setScanStage(prev => ({ ...prev, [id]: INFERENCE_STAGES[stageIdx] }));
        setInferenceLog(prev => [...prev, {
          time: new Date().toISOString().slice(11, 19),
          msg: `✓ ${INFERENCE_STAGES[stageIdx]}`,
        }]);
      }
    }, 300);

    try {
      const res = await runModel(id);
      if (timerRef.current) clearInterval(timerRef.current);
      setScanProgress(prev => ({ ...prev, [id]: 100 }));
      setScanStage(prev => ({ ...prev, [id]: 'COMPLETE' }));
      setInferenceLog(prev => [...prev, {
        time: new Date().toISOString().slice(11, 19),
        msg: '✓ Inference complete',
      }]);
      setLastResult({ modelId: id, ...res.data });
      getModels().then(r => setModels(r.data));
    } catch (err) {
      if (timerRef.current) clearInterval(timerRef.current);
      console.error(err);
    } finally {
      setTimeout(() => setRunningId(null), 800);
    }
  };

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ marginBottom: 24, animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ marginBottom: 4 }}>Model Operations</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Monitor and trigger AI model inference pipelines for hazard prediction.
        </p>
      </div>

      {/* Last Result Banner */}
      {lastResult && (
        <div style={{
          background: 'var(--green-muted)', border: '1px solid var(--green)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'scaleIn 0.3s ease-out',
        }}>
          <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Model Inference Completed</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              Duration: {lastResult.duration_s}s · Zones: {lastResult.results?.zones_analyzed} · Alerts: {lastResult.results?.alerts_generated}
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setLastResult(null)}>DISMISS</button>
        </div>
      )}

      {/* Model Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {models.map((m, idx) => {
          const isRunning = runningId === m.id;
          const progress = scanProgress[m.id] || 0;
          return (
            <div key={m.id} className="panel" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="panel-header" style={{ background: 'rgba(0,229,255,0.02)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-headline)' }}>{m.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    v{m.version} · {m.model_type}
                  </div>
                </div>
                <StatusChip level={m.status} />
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.description}</p>

                {/* Metrics Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'ACCURACY', value: m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—', color: 'var(--cyan)' },
                    { label: 'F1 SCORE', value: m.f1_score ? m.f1_score.toFixed(3) : '—', color: 'var(--text-primary)' },
                    { label: 'LAST RUN', value: m.last_run ? new Date(m.last_run).toUTCString().slice(17, 22) + ' UTC' : 'Never', color: 'var(--text-secondary)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Accuracy Bar */}
                {m.accuracy && <ConfidenceBar value={m.accuracy} label="MODEL ACCURACY" />}

                {/* Inference Progress */}
                {isRunning && (
                  <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                        {scanStage[m.id] || 'Starting...'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{progress}%</span>
                    </div>

                    {/* Inference Log */}
                    <div style={{
                      background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: 8,
                      maxHeight: 100, overflowY: 'auto',
                      border: '1px solid rgba(0,229,255,0.06)',
                    }}>
                      {inferenceLog.map((entry, i) => (
                        <div key={i} style={{
                          fontSize: 10, fontFamily: 'var(--font-mono)',
                          color: 'var(--green)', marginBottom: 2,
                          animation: 'fadeIn 0.2s ease-out',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>[{entry.time}]</span> {entry.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isRunning && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRun(m.id)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    ▶ RUN INFERENCE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
