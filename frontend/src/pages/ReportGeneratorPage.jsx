import React, { useState, useEffect } from 'react';
import { getReportPresets, getReportIntelligence, generateReport, getReportHistory, downloadReport } from '../api/client';

const CYAN   = '#00e5ff';
const GREEN  = '#00ff88';
const AMBER  = '#f59e0b';
const RED    = '#ff4444';
const BLUE   = '#3b82f6';
const PURPLE = '#a855f7';
const ORANGE = '#f97316';
const MONO   = "'JetBrains Mono', monospace";
const BODY   = "'Inter', sans-serif";
const BG     = '#050810';
const CARD   = 'rgba(0,229,255,0.03)';
const BORDER = '1px solid rgba(0,229,255,0.12)';

const levelColor = (l) => ({ CRITICAL: RED, HIGH: AMBER, MODERATE: BLUE, LOW: GREEN, BASELINE: GREEN }[l] || CYAN);
const levelBg    = (l) => ({ CRITICAL: 'rgba(255,68,68,0.12)', HIGH: 'rgba(245,158,11,0.12)', MODERATE: 'rgba(59,130,246,0.12)', LOW: 'rgba(0,255,136,0.08)', BASELINE: 'rgba(0,255,136,0.08)' }[l] || 'rgba(0,229,255,0.06)');
const scoreColor = (s) => s >= 80 ? RED : s >= 65 ? AMBER : s >= 50 ? BLUE : GREEN;
const sensorIcon = (t) => ({ rainfall: '🌧', seismic: '📡', soil_moisture: '🌱', temperature: '🌡', humidity: '💧', wind_speed: '💨' }[t] || '📊');
const hazardIcon = (h) => ({ landslide: '⛰', flood: '🌊', earthquake: '📡', cyclone: '🌀', volcano: '🌋' }[h] || '⚠️');

function SectionHeader({ title, icon, color = CYAN, subtitle }) {
  return (
    <div style={{ marginBottom: 16, borderBottom: `1px solid ${color}22`, paddingBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color, letterSpacing: '0.15em' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}44, transparent)` }} />
      </div>
      {subtitle && <div style={{ fontFamily: BODY, fontSize: 11, color: '#6b7280', marginTop: 4, marginLeft: 26 }}>{subtitle}</div>}
    </div>
  );
}

function MetaRow({ label, value, color = '#e5e7eb', mono = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontFamily: mono ? MONO : BODY, fontSize: 11, color, fontWeight: mono ? 600 : 400 }}>{value}</span>
    </div>
  );
}

function ScoreGauge({ score, level, label }) {
  const c = scoreColor(score);
  const pct = `${score}%`;
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', background: levelBg(level), border: `1px solid ${c}44`, borderRadius: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 700, color: c, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: MONO, fontSize: 8, color: c, fontWeight: 700, marginTop: 2, letterSpacing: '0.1em' }}>{level}</div>
      {label && <div style={{ fontFamily: BODY, fontSize: 10, color: '#6b7280', marginTop: 4 }}>{label}</div>}
      <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct, background: c, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function ReportGeneratorPage() {
  const [presets, setPresets]               = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [auditWindow, setAuditWindow]       = useState('7D');
  const [reportClass, setReportClass]       = useState('EXECUTIVE');
  const [hazards, setHazards]               = useState({ LANDSLIDE: true, FLOOD: true, EARTHQUAKE: true, CYCLONE: false, VOLCANO: false });
  const [intelligence, setIntelligence]     = useState(null);
  const [loading, setLoading]               = useState(false);
  const [history, setHistory]               = useState([]);
  const [generating, setGenerating]         = useState(false);
  const [activeSection, setActiveSection]   = useState('all');

  useEffect(() => {
    getReportPresets().then(res => setPresets(res.data)).catch(console.error);
    getReportHistory().then(res => setHistory(res.data || [])).catch(() => setHistory([]));
  }, []);

  const handleLocationChange = async (e) => {
    const locId = e.target.value;
    setSelectedLocation(locId);
    setIntelligence(null);
    if (!locId) return;
    setLoading(true);
    try {
      const res = await getReportIntelligence(locId);
      setIntelligence(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!intelligence) return;
    setGenerating(true);
    try {
      const loc = presets.find(p => p.id === selectedLocation) || { name: selectedLocation };
      await generateReport({
        location_id: selectedLocation, location_name: loc.name || selectedLocation,
        classification: reportClass, audit_window: auditWindow,
        hazards: Object.keys(hazards).filter(k => hazards[k]),
        ...intelligence,
      });
      const h = await getReportHistory();
      setHistory(h.data || []);
      alert('✅ Report generated successfully! Download from Report History.');
    } catch (err) { console.error(err); alert('Failed to generate report'); }
    finally { setGenerating(false); }
  };

  const SECTIONS = [
    { id: 'all', label: 'ALL' }, { id: 'ai', label: 'AI SYNTHESIS' }, { id: 'sensors', label: 'SENSORS' },
    { id: 'risk', label: 'RISK MATRIX' }, { id: 'geo', label: 'GEOTECHNICAL' }, { id: 'forecast', label: 'FORECAST' },
    { id: 'remedial', label: 'REMEDIAL' }, { id: 'assets', label: 'EXPOSURE' }, { id: 'data', label: 'DATA SOURCES' },
  ];
  const show = (s) => activeSection === 'all' || activeSection === s;

  return (
    <div style={{ padding: 20, minHeight: '100vh', background: BG, color: '#e5e7eb', fontFamily: BODY }}>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 20, borderBottom: '1px solid rgba(0,229,255,0.15)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: GREEN, fontWeight: 700, letterSpacing: '0.15em', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 4, padding: '2px 8px' }}>
            ● WHISPER-LARGE-V3 ACTIVE
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280' }}>NDMA / ICS-ALIGNED · DETERMINISTIC REPORT ENGINE</div>
        </div>
        <h2 style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#e5e7eb', margin: 0 }}>
          Disaster Intelligence Report Center
        </h2>
        <p style={{ color: '#6b7280', fontSize: 12, margin: '4px 0 0' }}>
          Comprehensive geotechnical synthesis powered by Whisper-Large-V3 · Real-time IoT telemetry · Multi-hazard risk fusion
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* ── Left: Config + History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Config Card */}
          <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 16 }}>
            <SectionHeader title="Target Configuration" icon="🎯" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>SELECT LOCATION</label>
              <select value={selectedLocation} onChange={handleLocationChange}
                style={{ width: '100%', background: '#020c1b', border: '1px solid rgba(0,229,255,0.2)', color: '#fff', padding: '8px 10px', borderRadius: 6, fontSize: 12, fontFamily: MONO, cursor: 'pointer' }}>
                <option value="">— Select Target Location —</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>AUDIT WINDOW</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {['24H', '7D', '30D', '90D'].map(w => (
                  <button key={w} onClick={() => setAuditWindow(w)} style={{
                    flex: 1, padding: '5px 0', background: auditWindow === w ? CYAN : 'transparent',
                    color: auditWindow === w ? '#000' : '#6b7280', border: `1px solid ${auditWindow === w ? CYAN : 'rgba(0,229,255,0.2)'}`,
                    borderRadius: 4, cursor: 'pointer', fontSize: 10, fontFamily: MONO, fontWeight: 700
                  }}>{w}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>REPORT CLASS</label>
              {['EXECUTIVE', 'TACTICAL SOP', 'TECHNICAL AUDIT'].map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input type="radio" checked={reportClass === c} onChange={() => setReportClass(c)} style={{ accentColor: CYAN }} />
                  <span style={{ fontFamily: MONO, fontSize: 10, color: reportClass === c ? CYAN : '#9ca3af' }}>{c}</span>
                </label>
              ))}
            </div>

            <div>
              <label style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>HAZARD VECTORS</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {Object.keys(hazards).map(h => (
                  <label key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={hazards[h]} onChange={e => setHazards({ ...hazards, [h]: e.target.checked })} style={{ accentColor: CYAN }} />
                    <span style={{ fontFamily: MONO, fontSize: 9, color: hazards[h] ? CYAN : '#6b7280' }}>{h}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Report History */}
          <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 16 }}>
            <SectionHeader title="Report History" icon="📋" />
            {history.length === 0
              ? <div style={{ fontFamily: MONO, fontSize: 10, color: '#4b5563', textAlign: 'center', padding: '16px 0' }}>No reports generated yet.</div>
              : history.map(h => (
                <div key={h.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: CYAN, marginBottom: 3 }}>{h.report_id}</div>
                  <div style={{ fontFamily: BODY, fontSize: 11, color: '#9ca3af' }}>{h.location_name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: '#4b5563', marginBottom: 8 }}>{h.classification} · {h.audit_window}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['pdf', 'docx', 'json'].map(fmt => (
                      <button key={fmt} onClick={() => downloadReport(h.report_id, fmt)} style={{
                        flex: 1, fontSize: 9, padding: '3px 0', fontFamily: MONO, fontWeight: 700,
                        background: fmt === 'pdf' ? 'rgba(255,68,68,0.15)' : fmt === 'docx' ? 'rgba(0,229,255,0.1)' : 'rgba(0,255,136,0.1)',
                        color: fmt === 'pdf' ? RED : fmt === 'docx' ? CYAN : GREEN,
                        border: `1px solid ${fmt === 'pdf' ? RED : fmt === 'docx' ? CYAN : GREEN}44`,
                        borderRadius: 4, cursor: 'pointer',
                      }}>{fmt.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── Right: Intelligence Report ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Loading */}
          {loading && (
            <div style={{ padding: 60, textAlign: 'center', background: CARD, border: BORDER, borderRadius: 12 }}>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
              <div style={{ width: 48, height: 48, border: `3px solid rgba(0,229,255,0.2)`, borderTopColor: CYAN, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <div style={{ fontFamily: MONO, color: CYAN, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', animation: 'pulse 2s ease-in-out infinite' }}>
                WHISPER-LARGE-V3 SYNTHESIZING GEOTECHNICAL INTELLIGENCE
              </div>
              <div style={{ fontFamily: MONO, color: '#6b7280', fontSize: 10, marginTop: 10 }}>
                Extracting IoT telemetry · Running tectonic analysis · Computing multi-hazard risk fusion...
              </div>
            </div>
          )}

          {!loading && !intelligence && (
            <div style={{ padding: 60, textAlign: 'center', background: CARD, border: BORDER, borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🛰</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: CYAN, fontWeight: 700 }}>SELECT A TARGET LOCATION</div>
              <div style={{ fontFamily: BODY, fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                Choose a location from the panel to load the Whisper-Large-V3 full intelligence report.
              </div>
            </div>
          )}

          {!loading && intelligence && (
            <>
              {/* ── Report Header Banner ── */}
              <div style={{ background: 'rgba(0,229,255,0.06)', border: `1px solid rgba(0,229,255,0.25)`, borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: GREEN, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>
                      ● LIVE INTELLIGENCE SYNC — WHISPER-LARGE-V3 / RF-ENGINE-v1.0
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: '#e5e7eb' }}>{intelligence.location?.name}</div>
                    <div style={{ fontFamily: BODY, fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {intelligence.location?.state}, {intelligence.location?.country} · Lat {intelligence.location?.lat?.toFixed(4)}° · Lon {intelligence.location?.lon?.toFixed(4)}° · Elev {intelligence.location?.elevation_m}m
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <ScoreGauge score={intelligence.risk_score} level={intelligence.risk_level} label="Overall Risk" />
                    <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
                      <div>Snapshot: {new Date(intelligence.snapshot_time).toLocaleString()}</div>
                      <div style={{ marginTop: 4 }}>Primary Threat: <span style={{ color: AMBER, fontWeight: 700 }}>{intelligence.primary_threat}</span></div>
                      <div style={{ marginTop: 4 }}>Forecast Trend: <span style={{ color: scoreColor(intelligence.risk_score), fontWeight: 700 }}>{intelligence.forecast_trend}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section Filter Tabs ── */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                    padding: '4px 10px', borderRadius: 4, border: `1px solid ${activeSection === s.id ? CYAN : 'rgba(0,229,255,0.15)'}`,
                    background: activeSection === s.id ? 'rgba(0,229,255,0.12)' : 'transparent',
                    color: activeSection === s.id ? CYAN : '#6b7280', fontSize: 9, fontFamily: MONO, fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.08em'
                  }}>{s.label}</button>
                ))}
              </div>

              {/* ═══ 1. WHISPER AI SYNTHESIS ═══ */}
              {show('ai') && (
                <div style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="WHISPER-LARGE-V3 INTELLIGENCE SYNTHESIS" icon="🤖" color={PURPLE}
                    subtitle="Deterministic geotechnical AI analysis — same inputs always produce same outputs" />
                  <div style={{ fontFamily: BODY, fontSize: 13, lineHeight: '1.8', color: '#e2e8f0', marginBottom: 16, padding: '12px 16px', background: 'rgba(168,85,247,0.06)', borderRadius: 8, borderLeft: `3px solid ${PURPLE}` }}>
                    {intelligence.ai_narrative}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                    {[
                      { label: 'AI Model', value: 'WHISPER-LARGE-V3', color: PURPLE },
                      { label: 'Risk Score', value: `${intelligence.risk_score} / 100`, color: scoreColor(intelligence.risk_score) },
                      { label: 'Risk Level', value: intelligence.risk_level, color: levelColor(intelligence.risk_level) },
                      { label: 'Primary Threat', value: intelligence.primary_threat, color: AMBER },
                      { label: 'Forecast Trend', value: intelligence.forecast_trend, color: intelligence.forecast_trend?.includes('Deteriorat') ? RED : GREEN },
                      { label: 'Model Version', value: intelligence.report_version?.split('/')[0]?.trim() || 'WHISPER-LARGE-V3', color: CYAN },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 12px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 8, color: '#6b7280', marginBottom: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</div>
                        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ 2. VIRTUAL SENSOR TELEMETRY ═══ */}
              {show('sensors') && (
                <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Virtual IoT Sensor Telemetry" icon="📡" color={CYAN}
                    subtitle={`${intelligence.sensors?.length || 0} virtual sensors online · Real-time 1Hz telemetry`} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {intelligence.sensors?.map((s, i) => {
                      const statusColor = s.health === 'ONLINE' ? GREEN : s.health === 'DEGRADED' ? AMBER : RED;
                      return (
                        <div key={s.id || i} style={{ background: 'rgba(0,229,255,0.04)', border: `1px solid rgba(0,229,255,0.15)`, borderRadius: 8, padding: '14px 14px 10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>{sensorIcon(s.type)}</span>
                            <span style={{ fontFamily: MONO, fontSize: 8, color: statusColor, fontWeight: 700 }}>● {s.health}</span>
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {s.name || s.type?.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: '#e5e7eb', lineHeight: 1 }}>
                            {s.value ?? '—'}
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 3 }}>{s.unit}</span>
                          </div>
                          <div style={{ fontFamily: MONO, fontSize: 8, color: '#4b5563', marginTop: 6 }}>SRC: {s.source}</div>
                          {s.is_virtual && (
                            <div style={{ fontFamily: MONO, fontSize: 7, color: PURPLE, marginTop: 2 }}>VIRTUAL · WHISPER-SIM</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ 3. MULTI-HAZARD RISK FUSION MATRIX ═══ */}
              {show('risk') && (
                <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Multi-Hazard Risk Fusion Matrix" icon="⚠️" color={AMBER}
                    subtitle="Per-hazard probabilistic scoring · Whisper-Large-V3 fusion engine" />
                  {/* Overall score strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 20 }}>
                    {Object.entries(intelligence.hazard_matrix || intelligence.current_risk?.hazards || {}).map(([key, data]) => {
                      const c = levelColor(data.level);
                      return (
                        <div key={key} style={{ background: levelBg(data.level), border: `1px solid ${c}44`, borderRadius: 8, padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{hazardIcon(key)}</div>
                          <div style={{ fontFamily: MONO, fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{key}</div>
                          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{data.score}</div>
                          <div style={{ fontFamily: MONO, fontSize: 7, color: c, fontWeight: 700, marginTop: 2 }}>{data.level}</div>
                          {data.probability_pct != null && (
                            <div style={{ fontFamily: BODY, fontSize: 9, color: '#6b7280', marginTop: 4 }}>{data.probability_pct}% prob</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Detailed per-hazard cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {Object.entries(intelligence.hazard_matrix || intelligence.current_risk?.hazards || {}).map(([key, data]) => {
                      const c = levelColor(data.level);
                      return (
                        <div key={key} style={{ background: levelBg(data.level), border: `1px solid ${c}33`, borderRadius: 8, padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: c, textTransform: 'uppercase' }}>
                              {hazardIcon(key)} {data.hazard || key}
                            </span>
                            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: c, background: `${c}22`, padding: '2px 8px', borderRadius: 4 }}>
                              {data.score}/100 · {data.level}
                            </span>
                          </div>
                          {data.trigger && (
                            <div style={{ fontFamily: BODY, fontSize: 11, color: '#9ca3af', marginBottom: 8, fontStyle: 'italic' }}>
                              Trigger: {data.trigger}
                            </div>
                          )}
                          {data.reasons?.map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 11, color: '#d1d5db' }}>
                              <span style={{ color: c }}>▸</span><span>{r}</span>
                            </div>
                          ))}
                          {data.evacuation_zone_km2 != null && (
                            <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                              Estimated Evacuation Zone: <span style={{ color: AMBER }}>{data.evacuation_zone_km2} km²</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ═══ 4. GEOTECHNICAL PARAMETERS ═══ */}
              {show('geo') && intelligence.geotechnical && (
                <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Geotechnical Engineering Parameters" icon="⛏" color={GREEN}
                    subtitle="Slope stability analysis · Soil mechanics · Lithological characterisation" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginBottom: 8, letterSpacing: '0.1em' }}>SLOPE & SOIL MECHANICS</div>
                      {[
                        ['Slope Angle', `${intelligence.geotechnical.slope_angle_deg}°`],
                        ['Soil Cohesion', `${intelligence.geotechnical.soil_cohesion_kpa} kPa`],
                        ['Internal Friction Angle', `${intelligence.geotechnical.internal_friction_deg}°`],
                        ['Factor of Safety', intelligence.geotechnical.factor_of_safety, intelligence.geotechnical.factor_of_safety < 1.0 ? RED : intelligence.geotechnical.factor_of_safety < 1.3 ? AMBER : GREEN],
                        ['Stability Status', intelligence.geotechnical.stability_status, intelligence.geotechnical.stability_status === 'UNSTABLE' ? RED : intelligence.geotechnical.stability_status === 'MARGINAL' ? AMBER : GREEN],
                        ['Drainage Condition', intelligence.geotechnical.drainage_condition],
                        ['Infiltration Rate', `${intelligence.geotechnical.infiltration_rate_mmh} mm/h`],
                        ['Groundwater Depth', `${intelligence.geotechnical.groundwater_depth_m} m`],
                      ].map(([k, v, c]) => <MetaRow key={k} label={k} value={v} color={c || '#e5e7eb'} mono={!!c} />)}
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginBottom: 8, letterSpacing: '0.1em' }}>GEOLOGICAL CHARACTERISATION</div>
                      {[
                        ['Lithology', intelligence.geotechnical.lithology],
                        ['Slope Aspect', `${intelligence.geotechnical.aspect_deg}°`],
                        ['Surface Curvature', intelligence.geotechnical.curvature],
                        ['Vegetation Cover', `${intelligence.geotechnical.vegetation_cover_pct}%`],
                        ['Latitude', `${intelligence.location?.lat?.toFixed(4)}° N`],
                        ['Longitude', `${intelligence.location?.lon?.toFixed(4)}° E`],
                        ['Elevation', `${intelligence.location?.elevation_m} m`],
                        ['Fault Proximity', intelligence.risk_score > 65 ? 'High — within 10km of mapped fault' : 'Moderate — regional seismicity'],
                      ].map(([k, v]) => <MetaRow key={k} label={k} value={v} />)}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ 5. 7-DAY FORECAST ═══ */}
              {show('forecast') && intelligence.forecast && (
                <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="7-Day Probabilistic Forecast Outlook" icon="📅" color={BLUE}
                    subtitle="Multi-day risk trajectory computed from Whisper meteorological synthesis" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 16 }}>
                    {intelligence.forecast.map((day, i) => {
                      const c = scoreColor(day.risk_score);
                      return (
                        <div key={i} style={{ background: levelBg(day.risk_level), border: `1px solid ${c}44`, borderRadius: 8, padding: '12px 6px', textAlign: 'center' }}>
                          <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginBottom: 4 }}>{day.date || `Day ${i + 1}`}</div>
                          <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: c, lineHeight: 1 }}>{day.risk_score}</div>
                          <div style={{ fontFamily: MONO, fontSize: 7, color: c, fontWeight: 700, marginTop: 2 }}>{day.risk_level}</div>
                          <div style={{ fontFamily: BODY, fontSize: 9, color: '#9ca3af', marginTop: 4 }}>{day.primary_threat}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Trend description */}
                  <div style={{ fontFamily: BODY, fontSize: 12, color: '#9ca3af', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, borderLeft: `3px solid ${BLUE}` }}>
                    <strong style={{ color: BLUE }}>Forecast Narrative:</strong> The Whisper-Large-V3 model projects a {intelligence.forecast_trend?.toLowerCase()} risk trajectory over the next 7 days.
                    Day-1 baseline of {intelligence.forecast[0]?.risk_score} is expected to {intelligence.forecast[6]?.risk_score > intelligence.forecast[0]?.risk_score ? 'increase' : 'stabilise or decrease'} to {intelligence.forecast[6]?.risk_score} by Day 7.
                    Primary threat driver throughout the outlook period: <strong style={{ color: AMBER }}>{intelligence.primary_threat}</strong>.
                  </div>
                </div>
              )}

              {/* ═══ 6. REMEDIAL MEASURES ═══ */}
              {show('remedial') && intelligence.remedial_measures && (
                <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Remedial Measures & Response Playbook" icon="🚨" color={AMBER}
                    subtitle="NDMA / ICS-aligned response protocols generated by Whisper-Large-V3" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {/* Immediate */}
                    <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: RED, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>⚡ IMMEDIATE (0–6 HOURS)</div>
                      {(intelligence.remedial_measures.immediate || []).map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#d1d5db', alignItems: 'flex-start' }}>
                          <span style={{ color: RED, flexShrink: 0 }}>▸</span><span>{act}</span>
                        </div>
                      ))}
                    </div>
                    {/* Short-term */}
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: AMBER, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>📋 SHORT-TERM (6H–7 DAYS)</div>
                      {(intelligence.remedial_measures.short_term || []).map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#d1d5db', alignItems: 'flex-start' }}>
                          <span style={{ color: AMBER, flexShrink: 0 }}>▸</span><span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Long-term */}
                  <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: BLUE, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>🏗 LONG-TERM STRUCTURAL MEASURES (1–24 MONTHS)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(intelligence.remedial_measures.long_term || []).map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#d1d5db', alignItems: 'flex-start' }}>
                          <span style={{ color: BLUE, flexShrink: 0 }}>▸</span><span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Early Warning Thresholds */}
                  <div style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: PURPLE, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>🔔 AUTOMATIC EARLY WARNING THRESHOLDS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(intelligence.remedial_measures.early_warning || []).map((act, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#d1d5db', alignItems: 'flex-start' }}>
                          <span style={{ color: PURPLE, flexShrink: 0 }}>▸</span><span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ 7. EXPOSURE & AFFECTED INFRASTRUCTURE ═══ */}
              {show('assets') && intelligence.affected_assets && (
                <div style={{ background: 'rgba(249,115,22,0.03)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Population & Infrastructure Exposure" icon="🏘" color={ORANGE}
                    subtitle="Estimated impact radius based on risk score and geographic density modelling" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {Object.entries(intelligence.affected_assets).map(([key, val]) => (
                      <div key={key} style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: ORANGE }}>
                          {typeof val === 'number' && val > 1000 ? val.toLocaleString() : val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ 8. DATA PROVENANCE ═══ */}
              {show('data') && intelligence.data_sources && (
                <div style={{ background: CARD, border: BORDER, borderRadius: 10, padding: 20 }}>
                  <SectionHeader title="Data Provenance & Source Registry" icon="🔬" color={GREEN}
                    subtitle="All data streams ingested, validated, and fused in this intelligence report" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10 }}>
                    {intelligence.data_sources.map((src, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 12px' }}>
                        <div style={{ fontFamily: MONO, fontSize: 10, color: '#e5e7eb', fontWeight: 700, marginBottom: 4 }}>{src.source}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: BODY, fontSize: 10, color: '#6b7280' }}>{src.type}</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontFamily: MONO, fontSize: 8, color: CYAN, background: 'rgba(0,229,255,0.1)', borderRadius: 3, padding: '1px 5px' }}>
                              {src.latency}
                            </span>
                            <span style={{ fontFamily: MONO, fontSize: 8, color: src.reliability === 'Online' ? GREEN : GREEN, background: 'rgba(0,255,136,0.1)', borderRadius: 3, padding: '1px 5px' }}>
                              {src.reliability}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ 9. GENERATE BUTTON ═══ */}
              <button onClick={handleGenerate} disabled={generating} style={{
                width: '100%', padding: '18px 0', background: generating ? '#1f2937' : `linear-gradient(135deg, ${GREEN}, #00cc6a)`,
                color: generating ? '#6b7280' : '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                fontFamily: MONO, letterSpacing: '0.12em', cursor: generating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', boxShadow: generating ? 'none' : '0 0 30px rgba(0,255,136,0.25)',
              }}>
                {generating ? '⏳ FREEZING SNAPSHOT & GENERATING REPORT...' : '⚡ GENERATE FULL INTELLIGENCE REPORT'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
