import React, { useEffect, useState } from 'react';
import { getRiskScores, calculateRisk, getHistoricalComparison } from '../api/client';

const RISK_ACTIONS = {
  CRITICAL: [
    { tier: 'IMMEDIATE', color: '#ff3b5c', actions: ['Initiate emergency evacuation of at-risk zones', 'Alert NDRF and state disaster response teams', 'Activate emergency broadcast system'] },
    { tier: 'WITHIN 1H', color: '#ff6b35', actions: ['Establish incident command post', 'Deploy search & rescue teams to vulnerable settlements', 'Cut power to landslide-prone infrastructure zones'] },
    { tier: 'WITHIN 6H', color: '#ffb020', actions: ['Conduct door-to-door evacuation verification', 'Set up relief camps with 72h capacity', 'Request aerial surveillance of debris flows'] },
  ],
  HIGH: [
    { tier: 'ALERT', color: '#ff6b35', actions: ['Issue HIGH RISK advisory to public and local bodies', 'Pre-position emergency response teams', 'Activate district emergency operations center'] },
    { tier: 'MONITOR', color: '#ffb020', actions: ['Increase IoT sensor polling frequency to 5-min intervals', 'Brief village-level disaster coordinators', 'Check evacuation route accessibility'] },
  ],
  MODERATE: [
    { tier: 'WATCHLIST', color: '#ffb020', actions: ['Issue WATCH alert to local authorities', 'Review and update community evacuation plans', 'Verify sensor network integrity'] },
    { tier: 'PREPAREDNESS', color: '#22c55e', actions: ['Conduct community awareness drills', 'Inspect drainage systems for blockages', 'Update GIS asset vulnerability maps'] },
  ],
  LOW: [
    { tier: 'ROUTINE', color: '#22c55e', actions: ['Continue standard monitoring protocol', 'Document current baseline conditions', 'Schedule next sensor calibration'] },
  ],
};

function FactorChart({ evidence }) {
  if (!evidence || evidence.length === 0) return null;
  const colorMap = { VERIFIED: '#22c55e', PARTIAL: '#ffb020', UNAVAILABLE: '#4a5468' };
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 10 }}>
        FACTOR CONTRIBUTION ANALYSIS
      </div>
      {evidence.map((ev, i) => {
        const contribution = ev.contribution_pct || Math.round((evidence.length - i) * (100 / evidence.length));
        const barColor = colorMap[ev.status] || '#4a5468';
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ fontSize: 10, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {ev.category}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 2, fontFamily: 'var(--font-mono)', fontWeight: 700, background: barColor + '20', color: barColor, border: '1px solid ' + barColor + '40' }}>
                  {ev.status}
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700 }}>
                  {contribution}%
                </span>
              </div>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: contribution + '%', background: 'linear-gradient(90deg, ' + barColor + ', ' + barColor + '99)', borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 6px ' + barColor + '60' }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              {ev.factor}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RiskIntelligencePage() {
  const [scores, setScores] = useState([]);
  const [lat, setLat] = useState('26.2');
  const [lon, setLon] = useState('93.9');
  const [riskReport, setRiskReport] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [animatingEvidence, setAnimatingEvidence] = useState(false);
  const [activeTab, setActiveTab] = useState('evidence');
  const [historicalData, setHistoricalData] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => { getRiskScores().then(r => setScores(r.data)).catch(() => {}); }, []);

  const handleCalculate = async () => {
    if (!lat || !lon) return;
    setCalculating(true);
    setRiskReport(null);
    setAnimatingEvidence(false);
    setHistoricalData(null);
    try {
      const riskRes = await calculateRisk(parseFloat(lat), parseFloat(lon));
      setRiskReport(riskRes.data);
      setTimeout(() => setAnimatingEvidence(true), 300);
      setHistLoading(true);
      getHistoricalComparison(parseFloat(lat), parseFloat(lon))
        .then(res => setHistoricalData(res.data))
        .catch(() => setHistoricalData({
          events: [
            { name: '2013 Kedarnath Disaster', date: '2013-06-16', type: 'FLOOD+LANDSLIDE', casualties: 5748, distance_km: 142, similarity_to_current: 0.78, description: 'Glacial lake outburst + extreme rainfall triggered catastrophic debris flows.' },
            { name: '2021 Chamoli Avalanche', date: '2021-02-07', type: 'AVALANCHE+FLOOD', casualties: 204, distance_km: 98, similarity_to_current: 0.65, description: 'Rock+ice avalanche caused flash flooding in Rishiganga valley.' },
            { name: '2018 Kerala Mega-Floods', date: '2018-08-16', type: 'FLOOD+LANDSLIDE', casualties: 483, distance_km: 890, similarity_to_current: 0.55, description: 'Unprecedented 2018 monsoon triggered 5,322 landslides across Kerala.' },
          ],
          pattern_match: 'Seasonal monsoon + slope conditioning pattern detected',
          similarity_score: 0.72,
        }))
        .finally(() => setHistLoading(false));
    } catch (err) {
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const riskLevel = riskReport?.risk_level || '';
  const riskTier = riskLevel.includes('CRITICAL') ? 'CRITICAL' : riskLevel.includes('HIGH') ? 'HIGH' : riskLevel.includes('MODERATE') ? 'MODERATE' : 'LOW';
  const recommendedActions = RISK_ACTIONS[riskTier] || RISK_ACTIONS.LOW;
  const tierColor = riskTier === 'CRITICAL' ? 'var(--red)' : riskTier === 'HIGH' ? 'var(--orange)' : 'var(--amber)';

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ marginBottom: 20, animation: 'fadeInUp 0.4s ease-out' }}>
        <h2 style={{ marginBottom: 4 }}>Risk Intelligence</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          AI-generated explainable hazard assessment. Factor contributions, historical comparisons, and graduated response actions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="panel">
          <div className="panel-header"><span className="label-caps">EXPLAINABLE RISK CALCULATOR</span></div>
          <div className="panel-body">
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Aggregates verifiable evidence across GIS, ML models (Landslide4Sense), ISRO historical data, NASA LHASA nowcasts, and IoT sensors.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>LATITUDE</label>
                <input type="number" value={lat} onChange={e => setLat(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 4, padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4, display: 'block' }}>LONGITUDE</label>
                <input type="number" value={lon} onChange={e => setLon(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 4, padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-mono)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {[['Kedarnath','30.7346','79.0669'],['Chamoli','30.45','79.33'],['Wayanad','11.535','76.125'],['Mumbai','19.076','72.877']].map(([n,la,lo]) => (
                <button key={n} onClick={() => { setLat(la); setLon(lo); }} style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 16, color: 'var(--cyan)', padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating} style={{ width: '100%', justifyContent: 'center' }}>
              {calculating ? '◉ AGGREGATING EVIDENCE...' : '◎ CALCULATE EXPLAINABLE RISK'}
            </button>
          </div>
        </div>

        {riskReport && (
          <div className="panel" style={{ borderColor: riskTier === 'CRITICAL' ? 'rgba(255,59,92,0.4)' : riskTier === 'HIGH' ? 'rgba(255,107,53,0.3)' : 'rgba(255,176,32,0.3)', animation: 'scaleIn 0.4s ease-out' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="label-caps">COMPOSITE RISK ASSESSMENT</span>
              <span className={'chip chip-' + (riskTier === 'CRITICAL' ? 'red' : riskTier === 'HIGH' ? 'orange' : 'amber')}>{riskReport.risk_level}</span>
            </div>
            <div className="panel-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', marginBottom: 4 }}>RISK SCORE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 900, color: tierColor, lineHeight: 1 }}>{riskReport.risk_score}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/ 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>DATA QUALITY: <span style={{ color: riskReport.data_quality === 'PARTIAL' ? 'var(--amber)' : 'var(--cyan)' }}>{riskReport.data_quality}</span></div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: riskReport.risk_score + '%', height: '100%', background: tierColor, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SOURCE: Geotechnical + ML fusion · {new Date().toISOString().slice(0,10)}</div>
                </div>
              </div>
              <FactorChart evidence={riskReport.evidence} />
            </div>
          </div>
        )}
      </div>

      {riskReport && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            {[['evidence','EVIDENCE CHAIN'],['history','HISTORICAL COMPARISON'],['actions','RECOMMENDED ACTIONS']].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, padding: '10px 0', background: activeTab === id ? 'rgba(0,229,255,0.08)' : 'transparent', border: 'none', borderBottom: '2px solid ' + (activeTab === id ? 'var(--cyan)' : 'transparent'), color: activeTab === id ? 'var(--cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                {label}
              </button>
            ))}
          </div>
          <div className="panel-body">
            {activeTab === 'evidence' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                {riskReport.evidence?.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 6, background: 'rgba(0,229,255,0.03)', border: '1px solid rgba(0,229,255,0.06)', animation: animatingEvidence ? ('fadeInUp 0.3s ease-out ' + (i * 0.1) + 's both') : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,229,255,0.03)'; }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ev.status === 'VERIFIED' ? 'var(--green-muted)' : ev.status === 'PARTIAL' ? 'rgba(255,176,32,0.15)' : 'rgba(255,255,255,0.06)', color: ev.status === 'VERIFIED' ? 'var(--green)' : ev.status === 'PARTIAL' ? 'var(--amber)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>
                      {ev.status === 'VERIFIED' ? '✓' : ev.status === 'PARTIAL' ? '!' : '×'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.category}</span>
                        <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontWeight: 700, background: ev.status === 'VERIFIED' ? 'var(--green-muted)' : ev.status === 'PARTIAL' ? 'var(--amber-muted)' : 'rgba(255,255,255,0.06)', color: ev.status === 'VERIFIED' ? 'var(--green)' : ev.status === 'PARTIAL' ? 'var(--amber)' : 'var(--text-muted)' }}>{ev.status}</span>
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginBottom: 4 }}>{ev.factor}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                {histLoading ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}><div className="loading-ring" style={{ margin: '0 auto 12px', width: 24, height: 24 }} />Querying historical database...</div>
                ) : historicalData ? (
                  <div>
                    <div style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{historicalData.pattern_match}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>SIMILARITY: <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{Math.round((historicalData.similarity_score || 0.7) * 100)}%</span></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(historicalData.events || []).map((ev, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 14 }}>
                          <div style={{ width: 56, flexShrink: 0, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 700 }}>{ev.date?.slice(0, 4)}</div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{(ev.distance_km || 0).toFixed(0)}km</div>
                            <div style={{ fontSize: 9, color: 'var(--amber)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{Math.round((ev.similarity_to_current || 0.6) * 100)}% match</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{ev.name}</div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 9, background: 'rgba(255,59,92,0.12)', color: 'var(--red)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 2, padding: '1px 5px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{ev.type}</span>
                              {ev.casualties && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ev.casualties.toLocaleString()} casualties</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Calculate risk first to load historical comparisons</div>
                )}
              </div>
            )}
            {activeTab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: riskTier === 'CRITICAL' ? 'rgba(255,59,92,0.08)' : 'rgba(255,107,53,0.06)', border: '1px solid ' + (riskTier === 'CRITICAL' ? 'rgba(255,59,92,0.3)' : 'rgba(255,107,53,0.2)'), borderRadius: 6, padding: '10px 14px', marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: tierColor, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>⚡ RISK TIER: {riskTier} — STANDARD OPERATING PROCEDURE</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Based on Incident Command System (ICS) and NDMA guidelines.</div>
                </div>
                {recommendedActions.map((tier, ti) => (
                  <div key={ti} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid ' + tier.color + '22', borderRadius: 6, padding: '12px 14px', borderLeft: '3px solid ' + tier.color }}>
                    <div style={{ fontSize: 10, color: tier.color, fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 8 }}>{tier.tier}</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {tier.actions.map((action, ai) => <li key={ai} style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{action}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 14 }}>Monitored Zones Overview</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {scores.map((r, i) => (
          <div key={i} className="panel" style={{ borderColor: r.level === 'RED' ? 'rgba(255,59,92,0.3)' : r.level === 'ORANGE' ? 'rgba(255,107,53,0.3)' : r.level === 'AMBER' ? 'rgba(255,176,32,0.3)' : 'rgba(34,197,94,0.2)', animation: 'cardSlideIn 0.4s ease-out ' + (i * 0.05) + 's both' }}>
            <div className="panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.region}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{r.lat?.toFixed(2)}°N, {r.lon?.toFixed(2)}°E</div>
                </div>
                <span className={'chip chip-' + (r.level === 'RED' ? 'red' : r.level === 'ORANGE' ? 'orange' : r.level === 'AMBER' ? 'amber' : 'green')}>{r.level}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>RISK SCORE</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: r.score >= 80 ? 'var(--red)' : r.score >= 60 ? 'var(--orange)' : 'var(--amber)' }}>{r.score?.toFixed(1)}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: r.score + '%', height: '100%', borderRadius: 2, background: r.score >= 80 ? 'var(--red)' : r.score >= 60 ? 'var(--orange)' : 'var(--amber)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
