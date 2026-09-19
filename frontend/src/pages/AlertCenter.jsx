import React, { useEffect, useState } from 'react';
import { getAlerts, acknowledgeAlert, resolveAlert, getSensorHealthAlerts, getPredictiveAlerts, createAlertsWS } from '../api/client';
import { StatusChip } from '../components/UI';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [sensorAlerts, setSensorAlerts] = useState([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedMalfunction, setSelectedMalfunction] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [expandedEvidence, setExpandedEvidence] = useState(null);

  const fetchAlerts = () => {
    setLoading(true);
    Promise.all([
      getAlerts().catch(() => ({ data: [] })),
      getSensorHealthAlerts().catch(() => ({ data: [] })),
      getPredictiveAlerts().catch(() => ({ data: [] })),
    ]).then(([resAlerts, resSensor, resPred]) => {
      setAlerts(resAlerts.data || []);
      setSensorAlerts(resSensor.data || []);
      setPredictiveAlerts(Array.isArray(resPred.data) ? resPred.data : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchAlerts(); 
    
    // Live WebSocket connection for real-time alerts
    let ws = null;
    try {
      ws = createAlertsWS();
      ws.onmessage = (event) => {
        // When we get a ping from the server, we just refetch the alerts
        // This ensures the UI is always in sync with the database in real-time
        fetchAlerts();
      };
    } catch (e) {
      console.error("Alerts WebSocket failed to connect");
    }
    
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleAck = async (id) => { await acknowledgeAlert(id); fetchAlerts(); };
  const handleResolve = async (id) => { await resolveAlert(id); fetchAlerts(); };

  const filtered = filter === 'ALL' ? alerts
    : filter === 'ACTIVE' ? alerts.filter(a => !a.resolved)
    : alerts.filter(a => a.level === filter);

  const counts = {
    RED: alerts.filter(a => a.level === 'RED' && !a.resolved).length,
    ORANGE: alerts.filter(a => a.level === 'ORANGE' && !a.resolved).length,
    AMBER: alerts.filter(a => a.level === 'AMBER' && !a.resolved).length,
  };

  const confidenceColor = (conf) => conf >= 0.85 ? 'var(--green)' : conf >= 0.65 ? 'var(--amber)' : 'var(--red)';
  const severityColor = (sev) => sev === 'CRITICAL' ? 'var(--red)' : sev === 'HIGH' ? 'var(--orange)' : sev === 'MODERATE' ? 'var(--amber)' : 'var(--cyan)';

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Alert Center</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Evidence-backed alerts with confidence scores, triage queue, and AI-predicted emerging threats.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {counts.RED > 0 && <div className="chip chip-red alert-critical-pulse"><span className="chip-dot dot-red" />{counts.RED} CRITICAL</div>}
          {counts.ORANGE > 0 && <div className="chip chip-orange">{counts.ORANGE} HIGH</div>}
          {counts.AMBER > 0 && <div className="chip chip-amber">{counts.AMBER} MEDIUM</div>}
          {predictiveAlerts.length > 0 && (
            <div style={{ background: 'rgba(41,121,255,0.15)', border: '1px solid rgba(41,121,255,0.4)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#2979ff' }}>
              {predictiveAlerts.length} PREDICTED
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
        {[['active', 'ACTIVE ALERTS', counts.RED + counts.ORANGE + counts.AMBER], ['predictive', 'AI PREDICTED', predictiveAlerts.length], ['sensors', 'SENSOR DIAGNOSTICS', sensorAlerts.length]].map(([id, label, count]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '10px 20px', background: activeTab === id ? 'rgba(0,229,255,0.08)' : 'transparent',
            border: 'none', borderBottom: '2px solid ' + (activeTab === id ? 'var(--cyan)' : 'transparent'),
            color: activeTab === id ? 'var(--cyan)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease',
          }}>
            {label} {count > 0 && <span style={{ background: activeTab === id ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1px 6px', marginLeft: 6, fontSize: 9 }}>{count}</span>}
          </button>
        ))}
      </div>

      {/* ACTIVE ALERTS TAB */}
      {activeTab === 'active' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['ALL', 'ACTIVE', 'RED', 'ORANGE', 'AMBER', 'GREEN'].map(f => (
              <button key={f} className={'btn btn-sm ' + (filter === f ? 'btn-primary' : 'btn-secondary')} onClick={() => setFilter(f)}>{f}</button>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={fetchAlerts} style={{ marginLeft: 'auto' }}>↻ Refresh</button>
          </div>
          <div className="panel">
            <div className="panel-header"><span className="label-caps">ALERT QUEUE — {filtered.length} ITEMS</span></div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filtered.map((alert) => (
                  <div key={alert.id} style={{ borderBottom: '1px solid var(--border-subtle)', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <StatusChip level={alert.level} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{alert.title}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                            {alert.confidence !== undefined && (
                              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: confidenceColor(alert.confidence), background: confidenceColor(alert.confidence) + '18', border: '1px solid ' + confidenceColor(alert.confidence) + '40', borderRadius: 3, padding: '1px 6px', fontWeight: 700 }}>
                                CONF: {Math.round((alert.confidence || 0.85) * 100)}%
                              </div>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {new Date(alert.created_at).toUTCString().slice(4, 22)}
                            </span>
                          </div>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
                          {alert.message?.slice(0, 120)}{alert.message?.length > 120 ? '...' : ''}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            SOURCE: {alert.source || 'Multi-sensor fusion'}
                          </span>
                          {alert.resolved ? <StatusChip level="RESOLVED" /> : alert.acknowledged ? <StatusChip level="MONITORING" label="ACK'D" /> : <StatusChip level="ACTIVE" />}
                          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                            {!alert.acknowledged && !alert.resolved && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleAck(alert.id)}>Acknowledge</button>
                            )}
                            {!alert.resolved && (
                              <button className="btn btn-sm" style={{ background: 'var(--green-muted)', color: 'var(--green)', border: '1px solid var(--green)' }} onClick={() => handleResolve(alert.id)}>Resolve</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No alerts match the current filter</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREDICTIVE ALERTS TAB */}
      {activeTab === 'predictive' && (
        <div>
          <div style={{ background: 'rgba(41,121,255,0.06)', border: '1px solid rgba(41,121,255,0.2)', borderRadius: 6, padding: '10px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#2979ff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ⚡ AI PREDICTIVE ENGINE — Next 24 Hours
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
              Predictions generated from multi-hazard correlation engine + historical pattern matching + sensor anomaly trends. Every prediction shows confidence and evidence sources.
            </div>
          </div>
          {predictiveAlerts.length === 0 ? (
            <div className="panel">
              <div className="panel-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
                No predictive alerts at this time. System is actively monitoring.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {predictiveAlerts.map((pred, idx) => (
                <div key={idx} className="panel" style={{ borderColor: pred.severity === 'CRITICAL' ? 'rgba(255,59,92,0.3)' : pred.severity === 'HIGH' ? 'rgba(255,107,53,0.3)' : 'rgba(255,176,32,0.2)' }}>
                  <div className="panel-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 800, color: severityColor(pred.severity), background: severityColor(pred.severity) + '18', border: '1px solid ' + severityColor(pred.severity) + '40', borderRadius: 3, padding: '1px 6px' }}>{pred.severity}</span>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#2979ff', background: 'rgba(41,121,255,0.12)', border: '1px solid rgba(41,121,255,0.3)', borderRadius: 3, padding: '1px 6px', fontWeight: 700 }}>AI PREDICTED</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>T+{pred.predicted_time_hours_from_now || (idx + 1) * 6}h</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {pred.type || pred.hazard_type || 'Multi-Hazard Alert'} — {pred.location || 'Regional'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {pred.recommended_action || 'Activate monitoring protocol and brief local emergency coordinators.'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>CONFIDENCE</div>
                        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)', color: confidenceColor(pred.confidence || 0.75), lineHeight: 1 }}>
                          {Math.round((pred.confidence || 0.75) * 100)}%
                        </div>
                      </div>
                    </div>
                    {pred.trigger_factors && pred.trigger_factors.length > 0 && (
                      <div>
                        <button onClick={() => setExpandedEvidence(expandedEvidence === idx ? null : idx)} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', padding: 0 }}>
                          {expandedEvidence === idx ? '▲ Hide Evidence' : '▼ Show Evidence (' + pred.trigger_factors.length + ' factors)'}
                        </button>
                        {expandedEvidence === idx && (
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {pred.trigger_factors.map((factor, fi) => {
                              const factorText = typeof factor === 'string'
                                ? factor
                                : (factor?.name ? `${factor.name}${factor.value != null ? `: ${factor.value}` : ''}` : (factor?.detail || factor?.factor || JSON.stringify(factor)));
                              return (
                                <div key={fi} style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ color: 'var(--cyan)', flexShrink: 0 }}>→</span>
                                  {factorText}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    {pred.data_sources && (
                      <div style={{ marginTop: 8, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        SOURCES: {Array.isArray(pred.data_sources) ? pred.data_sources.join(' · ') : pred.data_sources}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SENSOR DIAGNOSTICS TAB */}
      {activeTab === 'sensors' && sensorAlerts.length > 0 && (
        <div className="panel" style={{ borderColor: 'rgba(255,59,92,0.3)' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--red)', fontSize: 16 }}>⚠</span>
              <span className="label-caps" style={{ color: 'var(--red)' }}>SENSOR MALFUNCTION DIAGNOSTICS ({sensorAlerts.length} DETECTED)</span>
            </div>
            <span className="chip chip-red">IMMEDIATE ACTION REQUIRED</span>
          </div>
          <div className="panel-body">
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16 }}>
              The following field sensors have ceased transmitting or are operating in degraded mode. Auto-diagnosed root causes shown below.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
              {sensorAlerts.map((sa, idx) => {
                const alertInfo = sa.alert || {};
                const isSelected = selectedMalfunction === idx;
                return (
                  <div key={idx} style={{ background: 'rgba(255,59,92,0.04)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 6, padding: 14, cursor: 'pointer' }}
                    onClick={() => setSelectedMalfunction(isSelected ? null : idx)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, marginBottom: 2 }}>{sa.sensor_name || alertInfo.sensor_name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>
                          {sa.sensor_type || alertInfo.sensor_type} · {sa.location || alertInfo.sensor_location}
                        </div>
                      </div>
                      <span className="chip chip-red" style={{ fontSize: 9 }}>{alertInfo.severity || sa.status_code}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '8px 0', lineHeight: 1.5 }}>
                      {alertInfo.message || 'Sensor offline for ' + (sa.last_seen_minutes_ago || 'multiple') + ' minutes.'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>CONFIDENCE: {((alertInfo.confidence || 0.9) * 100).toFixed(0)}%</span>
                      <span style={{ color: 'var(--cyan)' }}>{isSelected ? '▲ Hide Steps' : '▼ Troubleshooting'}</span>
                    </div>
                    {isSelected && alertInfo.recommended_actions && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,59,92,0.15)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>RECOMMENDED ACTIONS:</div>
                        <ul style={{ paddingLeft: 16, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {alertInfo.recommended_actions.map((act, aIdx) => <li key={aIdx}>{act}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'sensors' && sensorAlerts.length === 0 && (
        <div className="panel">
          <div className="panel-body" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--green)' }}>✓</div>
            All sensors operating normally. No malfunction diagnostics required.
          </div>
        </div>
      )}
    </div>
  );
}
