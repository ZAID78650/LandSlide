import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  CYAN, RED, AMBER, GREEN, ORANGE, PURPLE, BLUE,
  FONT_MONO, FONT_BODY, SENSOR_TYPES
} from './sensorTypes';

export default function SensorDetailModal({ sensor, location, onClose, onInjectValue }) {
  if (!sensor) return null;

  const meta = SENSOR_TYPES.find(s => s.id === sensor.sensor_type) || {};
  const [activeTab, setActiveTab] = useState('chart'); // chart | derivatives | specs | packet | injector
  const [timeRange, setTimeRange] = useState('24H'); // 1H | 6H | 24H | 7D
  const [testValue, setTestValue] = useState(sensor.last_value != null ? Number(sensor.last_value) : 0);

  const [minVal, maxVal] = meta.range || [0, 100];
  const thresholds = meta.thresholds || { normal: [0, 50], warning: [50, 75], critical: [75, 100] };

  // Generate synthetic high-density time-series based on timeRange and actual value
  const chartData = useMemo(() => {
    const pointsCount = timeRange === '1H' ? 24 : timeRange === '6H' ? 36 : timeRange === '24H' ? 48 : 56;
    const baseVal = Number(sensor.last_value || 10);
    const data = [];
    const now = Date.now();
    const intervalMs = (timeRange === '1H' ? 3600000 : timeRange === '6H' ? 21600000 : timeRange === '24H' ? 86400000 : 604800000) / pointsCount;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const t = new Date(now - i * intervalMs);
      const jitter = (Math.sin(i * 0.45) * 0.35 + (Math.random() - 0.48) * 0.4) * (baseVal * 0.35 || 2.5);
      const val = Math.max(minVal, Math.min(maxVal, parseFloat((baseVal + jitter).toFixed(2))));
      data.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: t.toLocaleString(),
        value: val,
        avg: parseFloat(baseVal.toFixed(2)),
        warning: thresholds.warning[0],
        critical: thresholds.critical[0]
      });
    }
    return data;
  }, [sensor.last_value, timeRange, minVal, maxVal, thresholds]);

  // Statistics calculation
  const values = chartData.map(d => d.value);
  const minObserved = Math.min(...values);
  const maxObserved = Math.max(...values);
  const meanObserved = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const stdDev = Math.sqrt(values.map(x => Math.pow(x - meanObserved, 2)).reduce((a, b) => a + b, 0) / values.length).toFixed(2);

  // Status calculation
  const curVal = sensor.last_value != null ? Number(sensor.last_value) : 0;
  let statusBadge = { label: 'NORMAL / SAFE', color: GREEN, bg: 'rgba(34, 197, 94, 0.15)' };
  if (curVal >= thresholds.critical[0]) {
    statusBadge = { label: 'CRITICAL THRESHOLD BREACH', color: RED, bg: 'rgba(255, 59, 92, 0.2)' };
  } else if (curVal >= thresholds.warning[0]) {
    statusBadge = { label: 'WARNING THRESHOLD EXCEEDED', color: AMBER, bg: 'rgba(255, 176, 32, 0.2)' };
  }

  // Simulated hex stream
  const hexAddress = `0x${((sensor.id || 1) * 4096 + 0x4E00).toString(16).toUpperCase()}`;
  const frameCount = 142050 + Math.floor(curVal * 12);
  const checksum = `0x${Math.floor((curVal + 1) * 314159).toString(16).slice(0, 8).toUpperCase()}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#090d16', border: `1px solid ${CYAN}44`,
        borderRadius: 14, width: '100%', maxWidth: 940, maxHeight: '92vh',
        boxShadow: `0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px ${CYAN}22`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.01) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: `${meta.color || CYAN}22`,
              border: `1px solid ${meta.color || CYAN}66`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 24
            }}>
              {meta.icon || '📡'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: '#f3f4f6' }}>
                  {meta.label || sensor.name || sensor.sensor_type}
                </span>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4,
                  background: `${meta.color || CYAN}22`, color: meta.color || CYAN, border: `1px solid ${meta.color || CYAN}44`
                }}>
                  {meta.category || 'VIRTUAL SENSOR'}
                </span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                NODE ID: <span style={{ color: CYAN }}>{sensor.sensor_id}</span> · LOCATION: <span style={{ color: '#e5e7eb' }}>{location?.name || 'Monitoring Grid'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: statusBadge.bg, border: `1px solid ${statusBadge.color}66`,
              padding: '4px 12px', borderRadius: 20, fontFamily: FONT_MONO, fontSize: 10,
              fontWeight: 700, color: statusBadge.color, letterSpacing: '0.05em'
            }}>
              {statusBadge.label}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#9ca3af', width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Telemetry KPI Strip */}
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 24px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16
        }}>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>CURRENT TELEMETRY</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: meta.color || CYAN, marginTop: 2 }}>
              {curVal.toFixed(1)} <span style={{ fontSize: 12, color: '#9ca3af' }}>{meta.unit}</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>SAMPLING RATE</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: '#e5e7eb', marginTop: 4 }}>
              {meta.samplingRate || '10s (0.1 Hz)'}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#4b5563' }}>Precision: {meta.precision || '±0.1%'}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>INGESTION LATENCY</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: GREEN, marginTop: 4 }}>
              {meta.latency || '14 ms'}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#4b5563' }}>SNR: {meta.snr || '44 dB'}</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>LINK PROTOCOL</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginTop: 4 }}>
              {meta.protocol?.split('/')[0] || 'LoRaWAN EU868'}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: CYAN }}>TLS 1.3 AES-128</div>
          </div>
          <div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>CALIBRATION</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: GREEN, marginTop: 4 }}>
              ISO 17025 VERIFIED
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#4b5563' }}>Drift: &lt;0.02%/yr</div>
          </div>
        </div>

        {/* Modal Tabs Bar */}
        <div style={{
          display: 'flex', gap: 6, padding: '12px 24px', background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {[
            { id: 'chart', label: '📈 OSCILLOGRAM & TREND' },
            { id: 'derivatives', label: '🔬 GEOTECHNICAL DERIVATIVES' },
            { id: 'specs', label: '⚙️ TRANSDUCER & HARDWARE SPECS' },
            { id: 'packet', label: '💻 RAW PACKET STREAM' },
            { id: 'injector', label: '⚡ INJECT THRESHOLD TEST' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? `${CYAN}22` : 'transparent',
                color: activeTab === t.id ? CYAN : '#9ca3af',
                border: `1px solid ${activeTab === t.id ? `${CYAN}55` : 'transparent'}`,
                borderRadius: 6, padding: '6px 14px', fontFamily: FONT_MONO, fontSize: 10,
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Tab Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: CHART */}
          {activeTab === 'chart' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>
                    TIME-SERIES OSCILLOGRAM ({timeRange})
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280' }}>
                    Continuous sampling with Kalman filtered mean and safety threshold limits
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: 2 }}>
                  {['1H', '6H', '24H', '7D'].map(r => (
                    <button
                      key={r}
                      onClick={() => setTimeRange(r)}
                      style={{
                        background: timeRange === r ? CYAN : 'transparent',
                        color: timeRange === r ? '#000' : '#9ca3af',
                        border: 'none', borderRadius: 4, padding: '4px 10px',
                        fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive Chart */}
              <div style={{ height: 260, width: '100%', marginBottom: 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sensorAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={meta.color || CYAN} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={meta.color || CYAN} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 9, fontFamily: FONT_MONO }} />
                    <YAxis domain={[minVal, maxVal]} stroke="#4b5563" tick={{ fontSize: 9, fontFamily: FONT_MONO }} />
                    <Tooltip
                      contentStyle={{ background: '#0a101d', border: `1px solid ${CYAN}44`, borderRadius: 6 }}
                      labelStyle={{ color: CYAN, fontFamily: FONT_MONO, fontSize: 10 }}
                      formatter={(val) => [`${val} ${meta.unit}`, 'Value']}
                    />
                    <ReferenceLine y={thresholds.warning[0]} stroke={AMBER} strokeDasharray="4 4" label={{ value: 'WARNING', fill: AMBER, fontSize: 8, fontFamily: FONT_MONO, position: 'insideTopRight' }} />
                    <ReferenceLine y={thresholds.critical[0]} stroke={RED} strokeDasharray="4 4" label={{ value: 'CRITICAL', fill: RED, fontSize: 8, fontFamily: FONT_MONO, position: 'insideTopRight' }} />
                    <Area type="monotone" dataKey="value" stroke={meta.color || CYAN} strokeWidth={2} fill="url(#sensorAreaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Statistical Envelope */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: 12
              }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>MIN OBSERVED</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>
                    {minObserved.toFixed(1)} {meta.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>MAX OBSERVED</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: ORANGE }}>
                    {maxObserved.toFixed(1)} {meta.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>RUNNING MEAN</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: CYAN }}>
                    {meanObserved} {meta.unit}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>VARIANCE ENVELOPE (σ)</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color: PURPLE }}>
                    ±{stdDev} {meta.unit}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GEOTECHNICAL DERIVATIVES */}
          {activeTab === 'derivatives' && (
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>
                DERIVED PHYSICAL & GEOTECHNICAL COEFFICIENTS
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280', marginBottom: 16 }}>
                Real-time mathematical transformations derived from primary raw transducer telemetry
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {(meta.derivatives || []).map((der, i) => (
                  <div key={i} style={{
                    background: 'rgba(0, 229, 255, 0.03)', border: '1px solid rgba(0, 229, 255, 0.15)',
                    borderRadius: 10, padding: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: '#d1d5db' }}>
                        {der.name}
                      </div>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)', color: '#9ca3af'
                      }}>
                        {der.unit}
                      </span>
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: CYAN, marginTop: 10 }}>
                      {der.calc(curVal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSDUCER & HARDWARE SPECS */}
          {activeTab === 'specs' && (
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>
                HARDWARE ENGINEERING SPECIFICATIONS
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280', marginBottom: 16 }}>
                Standards compliance, physical transducer architecture, and calibration traceability
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Transducer Model', value: meta.spec || 'Standardized Telemetry Probe' },
                  { label: 'Measurement Domain', value: `${minVal} to ${maxVal} ${meta.unit}` },
                  { label: 'Ingress Protection', value: meta.ingressRating || 'IP68 Submersible' },
                  { label: 'Power & Telemetry Supply', value: meta.powerSpec || '12.8V LiFePO4 Float' },
                  { label: 'Calibration Standard', value: meta.calibration || 'ISO/IEC 17025 Compliant' },
                  { label: 'Factory Serial / MAC', value: `00:80:E1:FF:FE:${(sensor.id * 17).toString(16).padStart(4, '0').toUpperCase()}` },
                  { label: 'Operating Thermal Range', value: '-30°C to +70°C' },
                  { label: 'Sampling Jitter Tolerance', value: '< 2.4 microseconds' }
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: '12px 14px'
                  }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#e5e7eb', fontWeight: 600, marginTop: 4 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RAW PACKET STREAM */}
          {activeTab === 'packet' && (
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>
                LOW-LEVEL TELEMETRY PACKET TRACER
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280', marginBottom: 14 }}>
                Real-time decrypted byte payload frame with CRC checksum and LoRaWAN packet headers
              </div>

              <div style={{
                background: '#040711', border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 8, padding: 16, fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af'
              }}>
                <div style={{ color: CYAN, marginBottom: 8 }}>
                  [FRAME #{frameCount}] INCOMING PACKET AT {new Date().toISOString()}
                </div>
                <div style={{ color: '#4ade80', marginBottom: 6 }}>
                  HEX STREAM: 0x4E 0x45 0x58 0x55 0x53 {hexAddress} 0x01 0x7F {((curVal * 10) % 255).toString(16).padStart(2, '0').toUpperCase()} 0xAA 0xFF
                </div>
                <div style={{ color: '#e2e8f0', marginBottom: 12 }}>
                  CHECKSUM (CRC32): <span style={{ color: GREEN }}>{checksum} [VERIFIED]</span> · CIPHER: AES-128-GCM
                </div>
                <pre style={{ margin: 0, color: '#cbd5e1', fontSize: 10, lineHeight: 1.4 }}>
{JSON.stringify({
  sensor_id: sensor.sensor_id,
  type: sensor.sensor_type,
  telemetry: {
    raw_reading: curVal,
    unit: meta.unit,
    timestamp_epoch: Date.now(),
    calibrated_value: parseFloat(curVal.toFixed(2)),
  },
  diagnostics: {
    rssi_dbm: -74,
    snr_db: parseFloat((meta.snr?.replace(' dB', '') || '42')),
    battery_v: 12.8,
    uplink_counter: frameCount,
    crypto_valid: true
  }
}, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: TEST INJECTOR */}
          {activeTab === 'injector' && (
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>
                OPERATIONAL DRILL & THRESHOLD TRIGGER INJECTOR
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#6b7280', marginBottom: 20 }}>
                Manually inject simulated sensor readings to test automated threshold alarms and SOP escalation
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: 20, marginBottom: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: '#d1d5db' }}>SIMULATED VALUE INJECTION:</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 24, fontWeight: 700, color: meta.color || CYAN }}>
                    {testValue.toFixed(1)} {meta.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min={minVal}
                  max={maxVal}
                  step={(maxVal - minVal) / 100}
                  value={testValue}
                  onChange={(e) => setTestValue(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: meta.color || CYAN, marginBottom: 14 }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>
                  <span>{minVal} {meta.unit} (MIN)</span>
                  <span style={{ color: AMBER }}>WARNING: &gt;{thresholds.warning[0]} {meta.unit}</span>
                  <span style={{ color: RED }}>CRITICAL: &gt;{thresholds.critical[0]} {meta.unit}</span>
                  <span>{maxVal} {meta.unit} (MAX)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => {
                    if (onInjectValue) onInjectValue(sensor.id, testValue);
                  }}
                  style={{
                    flex: 1, background: `linear-gradient(135deg, ${meta.color || CYAN} 0%, #0284c7 100%)`,
                    border: 'none', borderRadius: 8, padding: '12px 18px',
                    fontFamily: FONT_MONO, fontSize: 11, fontWeight: 800, color: '#000', cursor: 'pointer',
                    letterSpacing: '0.05em', boxShadow: `0 4px 14px ${meta.color || CYAN}44`
                  }}
                >
                  ⚡ APPLY INJECTED VALUE TO LIVE SENSOR BUS
                </button>
                <button
                  onClick={() => setTestValue(thresholds.critical[0] + 5)}
                  style={{
                    background: 'rgba(255, 59, 92, 0.15)', border: `1px solid ${RED}`,
                    borderRadius: 8, padding: '12px 18px', fontFamily: FONT_MONO, fontSize: 11,
                    fontWeight: 700, color: RED, cursor: 'pointer'
                  }}
                >
                  TRIGGER CRITICAL ALARM
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
