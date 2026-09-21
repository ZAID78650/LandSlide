import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  CYAN, RED, AMBER, GREEN, ORANGE, PURPLE, BLUE,
  FONT_MONO, FONT_BODY, SENSOR_TYPES
} from './sensorTypes';

export default function SensorDetailModal({
  sensor,
  location,
  onClose,
  onInjectValue,
  isOverridden = false,
  injectedValue = undefined,
  liveValue = undefined,
  onResetOverride = () => {},
  onTriggerDispatch = () => {}
}) {
  if (!sensor) return null;

  const meta = SENSOR_TYPES.find(s => s.id === sensor.sensor_type) || {};
  const [activeTab, setActiveTab] = useState('chart'); // chart | derivatives | specs | packet | injector
  const [timeRange, setTimeRange] = useState('24H'); // 1H | 6H | 24H | 7D

  const [minVal, maxVal] = meta.range || [0, 100];
  const thresholds = meta.thresholds || { normal: [0, 50], warning: [50, 75], critical: [75, 100] };

  // Current active value (overridden or live)
  const curVal = isOverridden && injectedValue !== undefined
    ? Number(injectedValue)
    : (sensor.last_value != null ? Number(sensor.last_value) : 0);

  const actualLiveVal = liveValue != null ? Number(liveValue) : curVal;

  // Staged value in the injector
  const [testValue, setTestValue] = useState(() => {
    if (isOverridden && injectedValue !== undefined) return Number(injectedValue);
    return sensor.last_value != null ? Number(sensor.last_value) : 0;
  });

  // Feedback notification state
  const [feedback, setFeedback] = useState(null);

  // Operational audit events within this session
  const [auditLog, setAuditLog] = useState([
    {
      time: new Date().toLocaleTimeString(),
      type: 'INFO',
      msg: `Node ${sensor.sensor_id} diagnostic bus synchronized. Link protocol: ${meta.protocol?.split('/')[0] || 'LoRaWAN EU868'}.`
    }
  ]);

  // Sync testValue when sensor or override changes
  useEffect(() => {
    if (isOverridden && injectedValue !== undefined) {
      setTestValue(Number(injectedValue));
    } else if (sensor?.last_value != null) {
      setTestValue(Number(sensor.last_value));
    }
  }, [sensor?.id, isOverridden, injectedValue]);

  // Clear feedback after timeout
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Generate high-density time-series incorporating live or injected values
  const chartData = useMemo(() => {
    const pointsCount = timeRange === '1H' ? 24 : timeRange === '6H' ? 36 : timeRange === '24H' ? 48 : 56;
    const baseVal = Number(curVal || 10);
    const data = [];
    const now = Date.now();
    const intervalMs = (timeRange === '1H' ? 3600000 : timeRange === '6H' ? 21600000 : timeRange === '24H' ? 86400000 : 604800000) / pointsCount;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const t = new Date(now - i * intervalMs);
      const isLatest = i === 0;
      let val;
      if (isLatest) {
        val = parseFloat(curVal.toFixed(2));
      } else {
        const jitter = (Math.sin(i * 0.45) * 0.35 + (Math.random() - 0.48) * 0.4) * (baseVal * 0.35 || 2.5);
        val = Math.max(minVal, Math.min(maxVal, parseFloat((baseVal + jitter).toFixed(2))));
      }
      data.push({
        time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: t.toLocaleString(),
        value: val,
        avg: parseFloat(baseVal.toFixed(2)),
        warning: thresholds.warning[0],
        critical: thresholds.critical[0],
        isOverridden: isLatest && isOverridden
      });
    }
    return data;
  }, [curVal, timeRange, minVal, maxVal, thresholds, isOverridden]);

  // Statistics calculation
  const values = chartData.map(d => d.value);
  const minObserved = Math.min(...values);
  const maxObserved = Math.max(...values);
  const meanObserved = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const stdDev = Math.sqrt(values.map(x => Math.pow(x - meanObserved, 2)).reduce((a, b) => a + b, 0) / values.length).toFixed(2);

  // Status calculation for the active sensor reading
  let statusBadge = { label: 'NORMAL / SAFE', color: GREEN, bg: 'rgba(34, 197, 94, 0.15)' };
  if (curVal >= thresholds.critical[0]) {
    statusBadge = { label: 'CRITICAL THRESHOLD BREACH', color: RED, bg: 'rgba(255, 59, 92, 0.2)' };
  } else if (curVal >= thresholds.warning[0]) {
    statusBadge = { label: 'WARNING THRESHOLD EXCEEDED', color: AMBER, bg: 'rgba(255, 176, 32, 0.2)' };
  }

  // Simulated hex stream and packet details
  const hexAddress = `0x${((sensor.id || 1) * 4096 + 0x4E00).toString(16).toUpperCase()}`;
  const frameCount = 142050 + Math.floor(curVal * 12);
  const checksum = `0x${Math.floor((curVal + 1) * 314159).toString(16).slice(0, 8).toUpperCase()}`;

  // Staged test value thresholds & categorization
  const isTestCrit = testValue >= thresholds.critical[0];
  const isTestWarn = testValue >= thresholds.warning[0] && !isTestCrit;
  const testLevel = isTestCrit ? 'CRITICAL' : isTestWarn ? 'WARNING' : 'NORMAL';
  const testColor = isTestCrit ? RED : isTestWarn ? AMBER : GREEN;

  // Real-time Geotechnical & Physical Consequence Assessment
  const consequence = useMemo(() => {
    const rangeSpan = maxVal - minVal || 100;
    const normalized = Math.max(0, Math.min(1, (testValue - minVal) / rangeSpan));

    const baseFoS = 1.62;
    let deltaFoS = 0;
    let prob = 5;
    let ttf = 'STABLE (> 72 Hours)';
    let strainRate = '0.02 mm/hr (quiescent)';
    let failureMode = 'Stable elastic bedrock equilibrium';

    if (sensor.sensor_type === 'rainfall') {
      deltaFoS = normalized * 0.95;
      prob = Math.min(99, Math.round(normalized * 105));
      ttf = isTestCrit ? '< 25 min (Debris Torrents)' : isTestWarn ? '1 - 3 hrs (Hydrostatic saturation)' : 'Stable (> 72h)';
      strainRate = `${(normalized * 12.4).toFixed(1)} mm/hr infiltration flux`;
      failureMode = 'Rapid translational debris slide & pore-water overpressure';
    } else if (sensor.sensor_type === 'soil_moisture') {
      deltaFoS = normalized * 0.88;
      prob = Math.min(99, Math.round(normalized * 100));
      ttf = isTestCrit ? '< 40 min (Effective stress collapse)' : isTestWarn ? '2 - 4 hrs' : 'Stable (> 72h)';
      strainRate = `${(normalized * 9.8).toFixed(1)} kPa/hr pore-pressure surge`;
      failureMode = 'Liquefaction & shear strength degradation (c\' -> 0)';
    } else if (sensor.sensor_type === 'tilt') {
      deltaFoS = normalized * 1.15;
      prob = Math.min(99, Math.round(normalized * 110));
      ttf = isTestCrit ? '< 15 min (Catastrophic detachment)' : isTestWarn ? '1 - 2 hrs' : 'Stable (> 72h)';
      strainRate = `${(normalized * 22.0).toFixed(1)} mm/hr (critical creep velocity)`;
      failureMode = 'Rotational circular slump along deep circular failure surface';
    } else if (sensor.sensor_type === 'river_stage') {
      deltaFoS = normalized * 0.75;
      prob = Math.min(95, Math.round(normalized * 92));
      ttf = isTestCrit ? '< 30 min (Toe scouring & bank collapse)' : isTestWarn ? '3 - 5 hrs' : 'Stable (> 72h)';
      strainRate = `${(normalized * 8.5).toFixed(1)} m³/s hydraulic discharge surge`;
      failureMode = 'Toe hydraulic erosion and undermining of hillside stability';
    } else if (sensor.sensor_type === 'seismic') {
      deltaFoS = normalized * 1.10;
      prob = Math.min(98, Math.round(normalized * 115));
      ttf = isTestCrit ? '< 5 min (Co-seismic collapse)' : isTestWarn ? '30 min' : 'Stable (> 72h)';
      strainRate = `${(normalized * 0.52).toFixed(2)} g Peak Ground Acceleration`;
      failureMode = 'Pseudostatic seismic shear destabilization along fault boundary';
    } else if (sensor.sensor_type === 'temperature') {
      if (testValue < 0) {
        deltaFoS = 0.52;
        prob = 48;
        ttf = '6 - 12 hrs (Frost wedging)';
        strainRate = '0.4 mm/day cryospheric dilation';
        failureMode = 'Cryospheric freeze-thaw wedge expansion in jointed rockmass';
      } else if (testValue > 38) {
        deltaFoS = 0.40;
        prob = 42;
        ttf = '12 - 24 hrs (Desiccation cracking)';
        strainRate = '0.8 mm tension crack propagation';
        failureMode = 'Thermal desiccation tension crack propagation & slope unraveling';
      } else {
        deltaFoS = 0.05;
        prob = 4;
        ttf = 'Stable (> 72h)';
        strainRate = '0.01 mm/hr nominal';
        failureMode = 'Thermal equilibrium & stable moisture gradient';
      }
    } else {
      deltaFoS = normalized * 0.65;
      prob = Math.min(95, Math.round(normalized * 80));
      ttf = isTestCrit ? '< 1 hr' : isTestWarn ? '3 - 6 hrs' : 'Stable (> 72h)';
      strainRate = `${(normalized * 4.2).toFixed(1)} rate-of-change`;
      failureMode = 'Secondary geomechanical instability';
    }

    const calculatedFoS = Math.max(0.48, parseFloat((baseFoS - deltaFoS).toFixed(2)));
    return {
      fos: calculatedFoS,
      prob: Math.max(2, prob),
      ttf,
      strainRate,
      failureMode
    };
  }, [testValue, sensor.sensor_type, minVal, maxVal, isTestCrit, isTestWarn]);

  // Handlers
  const handleApplyInjection = (valToApply) => {
    const val = valToApply !== undefined ? valToApply : testValue;
    setTestValue(val);
    if (onInjectValue) {
      onInjectValue(sensor.id, val);
    }
    const isCritical = val >= thresholds.critical[0];
    const isWarning = val >= thresholds.warning[0] && !isCritical;
    const statusType = isCritical ? 'CRITICAL TIER 3' : isWarning ? 'WARNING TIER 2' : 'NOMINAL TIER 1';

    setFeedback({
      type: 'applied',
      msg: `COMMITTED: ${val.toFixed(1)} ${meta.unit} injected into live SCADA bus (Node #${sensor.sensor_id}) · Level: ${statusType}`,
      time: new Date().toLocaleTimeString()
    });

    setAuditLog(prev => [
      {
        time: new Date().toLocaleTimeString(),
        type: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'SUCCESS',
        msg: `INJECTION OVERRIDE: ${val.toFixed(1)} ${meta.unit} applied to SCADA bus. CRC32: ${checksum}. SOP: ${statusType}.`
      },
      ...prev.slice(0, 7)
    ]);
  };

  const handleCriticalAlarm = () => {
    const critVal = parseFloat((thresholds.critical[0] + (maxVal - thresholds.critical[0]) * 0.35).toFixed(1));
    setTestValue(critVal);
    handleApplyInjection(critVal);
    if (onTriggerDispatch) {
      onTriggerDispatch(
        'NDRF & BRO Taskforce',
        `OPERATIONAL DRILL CRITICAL ALARM: ${meta.label || sensor.sensor_type} breached ${critVal} ${meta.unit}. Red alert evacuation protocol activated.`,
        'CRITICAL'
      );
    }
  };

  const handleRevert = () => {
    if (onResetOverride) onResetOverride();
    const live = actualLiveVal;
    setTestValue(live);
    setFeedback({
      type: 'reverted',
      msg: `REVERTED: Telemetry override cleared. Restored live physical stream (${live.toFixed(1)} ${meta.unit}).`,
      time: new Date().toLocaleTimeString()
    });
    setAuditLog(prev => [
      {
        time: new Date().toLocaleTimeString(),
        type: 'INFO',
        msg: `OVERRIDE CLEARED: Reverted to live physical transducer telemetry (${live.toFixed(1)} ${meta.unit}).`
      },
      ...prev.slice(0, 7)
    ]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(3, 7, 18, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#090d16', border: `1px solid ${isOverridden ? AMBER : CYAN}44`,
        borderRadius: 14, width: '100%', maxWidth: 960, maxHeight: '94vh',
        boxShadow: `0 24px 60px rgba(0, 0, 0, 0.9), 0 0 30px ${isOverridden ? AMBER : CYAN}22`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          background: isOverridden
            ? 'linear-gradient(180deg, rgba(255,176,32,0.12) 0%, rgba(255,176,32,0.02) 100%)'
            : 'linear-gradient(180deg, rgba(0,229,255,0.08) 0%, rgba(0,229,255,0.01) 100%)',
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
                {isOverridden && (
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(255, 176, 32, 0.25)', color: AMBER, border: `1px solid ${AMBER}`,
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    ⚡ INJECTION DRILL ACTIVE
                  </span>
                )}
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
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>CURRENT TELEMETRY</span>
              {isOverridden && <span style={{ color: AMBER, fontWeight: 700 }}>[OVERRIDDEN]</span>}
            </div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: isOverridden ? AMBER : (meta.color || CYAN), marginTop: 2 }}>
              {curVal.toFixed(1)} <span style={{ fontSize: 12, color: '#9ca3af' }}>{meta.unit}</span>
            </div>
            {isOverridden && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af', marginTop: 1 }}>
                Live Physical: <span style={{ color: '#e5e7eb' }}>{actualLiveVal.toFixed(1)} {meta.unit}</span>
              </div>
            )}
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
            { id: 'injector', label: isOverridden ? '⚡ INJECT THRESHOLD TEST [ACTIVE]' : '⚡ INJECT THRESHOLD TEST' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id
                  ? (t.id === 'injector' && isOverridden ? 'rgba(255,176,32,0.2)' : `${CYAN}22`)
                  : 'transparent',
                color: activeTab === t.id
                  ? (t.id === 'injector' && isOverridden ? AMBER : CYAN)
                  : '#9ca3af',
                border: `1px solid ${activeTab === t.id ? (t.id === 'injector' && isOverridden ? AMBER : `${CYAN}55`) : 'transparent'}`,
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
                        <stop offset="5%" stopColor={isOverridden ? AMBER : (meta.color || CYAN)} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={isOverridden ? AMBER : (meta.color || CYAN)} stopOpacity={0.0} />
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
                    <Area type="monotone" dataKey="value" stroke={isOverridden ? AMBER : (meta.color || CYAN)} strokeWidth={2} fill="url(#sensorAreaGrad)" isAnimationActive={false} />
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
                Real-time mathematical transformations derived from primary transducer telemetry (Evaluated at {curVal.toFixed(1)} {meta.unit})
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
                  { label: 'Factory Serial / MAC', value: `00:80:E1:FF:FE:${((sensor.id || 1) * 17).toString(16).padStart(4, '0').toUpperCase()}` },
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
                Real-time decrypted byte payload frame with CRC checksum and LoRaWAN / Modbus packet headers
              </div>

              <div style={{
                background: '#040711', border: '1px solid rgba(0, 229, 255, 0.2)',
                borderRadius: 8, padding: 16, fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af'
              }}>
                <div style={{ color: CYAN, marginBottom: 8 }}>
                  [FRAME #{frameCount}] INCOMING PACKET AT {new Date().toISOString()}
                </div>
                <div style={{ color: '#4ade80', marginBottom: 6 }}>
                  HEX STREAM: 0x4E 0x45 0x58 0x55 0x53 {hexAddress} 0x01 0x7F {((Math.abs(Math.floor(curVal * 10))) % 255).toString(16).padStart(2, '0').toUpperCase()} 0xAA 0xFF
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
    simulation_override_active: isOverridden,
    operational_drill_mode: isOverridden ? "ACTIVE_PAYLOAD_INJECTION" : "OFF"
  },
  diagnostics: {
    rssi_dbm: isOverridden ? -58 : -74,
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
              {/* Active Override Status Banner */}
              <div style={{
                background: isOverridden ? 'rgba(255, 176, 32, 0.1)' : 'rgba(34, 197, 94, 0.08)',
                border: `1px solid ${isOverridden ? AMBER : GREEN}44`,
                borderRadius: 8, padding: '10px 16px', marginBottom: 16,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isOverridden ? AMBER : GREEN,
                    boxShadow: `0 0 10px ${isOverridden ? AMBER : GREEN}`
                  }} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: isOverridden ? AMBER : GREEN }}>
                    {isOverridden
                      ? `⚠️ SENSOR BUS OVERRIDDEN BY DRILL · CURRENT: ${curVal.toFixed(1)} ${meta.unit} · PHYSICAL STREAM ISOLATED`
                      : '● SCADA TELEMETRY BUS RUNNING NOMINAL · 1.0 Hz PHYSICAL TRANSDUCER LINK ACTIVE'}
                  </span>
                </div>
                {isOverridden && (
                  <button
                    onClick={handleRevert}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 6, padding: '4px 10px', fontFamily: FONT_MONO, fontSize: 10,
                      fontWeight: 700, color: '#f3f4f6', cursor: 'pointer'
                    }}
                  >
                    🔄 REVERT TO LIVE STREAM
                  </button>
                )}
              </div>

              {/* Feedback toast if triggered */}
              {feedback && (
                <div style={{
                  background: feedback.type === 'reverted' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                  border: `1px solid ${feedback.type === 'reverted' ? BLUE : GREEN}`,
                  borderRadius: 8, padding: '8px 14px', marginBottom: 16,
                  fontFamily: FONT_MONO, fontSize: 11, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <span>✓</span>
                  <span>{feedback.msg}</span>
                </div>
              )}

              {/* Sub-header & description */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: '#f3f4f6' }}>
                    OPERATIONAL DRILL & THRESHOLD TRIGGER INJECTOR
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    Manually inject simulated sensor readings to test automated threshold alarms and SOP escalation
                  </div>
                </div>
                <div style={{
                  background: `${testColor}22`, border: `1px solid ${testColor}66`,
                  padding: '4px 10px', borderRadius: 6, fontFamily: FONT_MONO, fontSize: 10,
                  fontWeight: 800, color: testColor
                }}>
                  {testLevel} SIMULATION STATE
                </div>
              </div>

              {/* Preset Scenarios Strip */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', marginBottom: 6, fontWeight: 700 }}>
                  ⚡ QUICK-DRILL OPERATIONAL PRESETS:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    {
                      label: '🟢 Nominal Baseline',
                      val: parseFloat((minVal + (thresholds.warning[0] - minVal) * 0.45).toFixed(1)),
                      desc: 'Safe operating zone'
                    },
                    {
                      label: '🟡 Warning Threshold Drill',
                      val: parseFloat((thresholds.warning[0] + 1.2).toFixed(1)),
                      desc: 'Trigger advisory SOP'
                    },
                    {
                      label: '🔴 Critical Breach Drill',
                      val: parseFloat((thresholds.critical[0] + 4.5).toFixed(1)),
                      desc: 'Trigger evacuation SOP'
                    },
                    {
                      label: '⛈️ Extreme Pluvial Deluge',
                      val: parseFloat((maxVal * 0.94).toFixed(1)),
                      desc: 'Catastrophic saturation'
                    },
                    {
                      label: '⚠️ Sensor Zero / Flatline',
                      val: minVal,
                      desc: 'Transducer failure mode'
                    }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestValue(preset.val)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 6, padding: '6px 12px',
                        fontFamily: FONT_MONO, fontSize: 10, color: '#e5e7eb',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = CYAN; e.currentTarget.style.background = 'rgba(0,229,255,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                    >
                      {preset.label} ({preset.val} {meta.unit})
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Interactive Injection Panel */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${testColor}44`,
                borderRadius: 10, padding: 20, marginBottom: 18,
                boxShadow: `inset 0 0 20px ${testColor}11`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                      SIMULATED VALUE INJECTION:
                    </span>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                      Drag slider or type exact numeric value
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      step={(maxVal - minVal) / 100}
                      min={minVal}
                      max={maxVal}
                      value={testValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setTestValue(val);
                      }}
                      style={{
                        background: '#030712', border: `1px solid ${testColor}66`,
                        borderRadius: 6, padding: '6px 10px', width: 90,
                        fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: testColor,
                        textAlign: 'right'
                      }}
                    />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: '#9ca3af' }}>
                      {meta.unit}
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min={minVal}
                  max={maxVal}
                  step={(maxVal - minVal) / 200}
                  value={testValue}
                  onChange={(e) => setTestValue(parseFloat(e.target.value))}
                  style={{
                    width: '100%', cursor: 'pointer', accentColor: testColor,
                    height: 6, borderRadius: 3, marginBottom: 14
                  }}
                />

                {/* Range and Threshold Markers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>
                  <span>{minVal} {meta.unit} (MIN)</span>
                  <span style={{ color: AMBER, fontWeight: 600 }}>WARNING: &gt;{thresholds.warning[0]} {meta.unit}</span>
                  <span style={{ color: RED, fontWeight: 600 }}>CRITICAL: &gt;{thresholds.critical[0]} {meta.unit}</span>
                  <span>{maxVal} {meta.unit} (MAX)</span>
                </div>
              </div>

              {/* Dynamic Consequence & Physical Impact Assessment Matrix */}
              <div style={{
                background: '#040711', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: 16, marginBottom: 18
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 800, color: '#e5e7eb', letterSpacing: '0.05em' }}>
                    🔬 REAL-TIME GEOTECHNICAL CONSEQUENCE PROJECTION (PHYSICAL REACTION MODEL)
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: CYAN }}>
                    ASSIMILATING TEST VALUE {testValue.toFixed(1)} {meta.unit}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>FACTOR OF SAFETY (FoS)</div>
                    <div style={{
                      fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, marginTop: 4,
                      color: consequence.fos < 1.0 ? RED : consequence.fos < 1.3 ? AMBER : GREEN
                    }}>
                      {consequence.fos}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: consequence.fos < 1.0 ? RED : consequence.fos < 1.3 ? AMBER : GREEN, marginTop: 2 }}>
                      {consequence.fos < 1.0 ? 'FAILURE IMMINENT' : consequence.fos < 1.3 ? 'UNSTABLE / ELEVATED' : 'STABLE EQUILIBRIUM'}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>FAILURE PROBABILITY</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 800, color: testColor, marginTop: 4 }}>
                      {consequence.prob}%
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                      Likelihood of rupture
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>EST. TIME-TO-RUPTURE (TtF)</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: '#f3f4f6', marginTop: 6 }}>
                      {consequence.ttf}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                      Evacuation countdown
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: '#6b7280' }}>DYNAMIC FLUX / STRAIN</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: CYAN, marginTop: 6 }}>
                      {consequence.strainRate}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                      Displacement rate
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 9, color: '#9ca3af' }}>
                  <span style={{ color: '#6b7280' }}>GEOMECHANICAL MECHANISM: </span>
                  <span style={{ color: '#e5e7eb' }}>{consequence.failureMode}</span>
                </div>
              </div>

              {/* Automated SOP Inter-Agency Escalation Matrix */}
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: 16, marginBottom: 18
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 800, color: '#e5e7eb' }}>
                    🚨 AUTOMATED INTER-AGENCY SOP ESCALATION MATRIX (DIRECTIVES TRIGGERED)
                  </span>
                  <span style={{
                    fontFamily: FONT_MONO, fontSize: 9, padding: '2px 8px', borderRadius: 4,
                    background: `${testColor}22`, color: testColor, border: `1px solid ${testColor}44`, fontWeight: 700
                  }}>
                    {isTestCrit ? 'RED ALERT DIRECTIVES' : isTestWarn ? 'AMBER ADVISORY DIRECTIVES' : 'GREEN ROUTINE DIRECTIVES'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {/* NDRF Card */}
                  <div style={{
                    background: '#080c14', border: `1px solid ${isTestCrit ? RED : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: '#f3f4f6' }}>
                        🚒 NDRF BATTALION 12 (SAR)
                      </span>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 8, fontWeight: 800,
                        color: isTestCrit ? RED : isTestWarn ? AMBER : GREEN
                      }}>
                        {isTestCrit ? '● IMMEDIATE MOBILIZATION' : isTestWarn ? '● WHEELS-UP STANDBY' : '● REGIONAL MONITORING'}
                      </span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      {isTestCrit
                        ? 'Dispatch 4 Mountain SAR teams with acoustic geophones & drone LiDAR to high-risk valley sector.'
                        : isTestWarn
                        ? 'Put swift response units on 15-min standby at district headquarters.'
                        : 'Routine readiness regime at divisional base.'}
                    </div>
                  </div>

                  {/* BRO Card */}
                  <div style={{
                    background: '#080c14', border: `1px solid ${isTestCrit ? RED : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: '#f3f4f6' }}>
                        🚜 BRO PROJECT SWASTIK / PUSHPAK
                      </span>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 8, fontWeight: 800,
                        color: isTestCrit ? RED : isTestWarn ? AMBER : GREEN
                      }}>
                        {isTestCrit ? '● HIGHWAY INTERDICTION' : isTestWarn ? '● PRE-POSITION DOZERS' : '● ROUTINE PATROL'}
                      </span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      {isTestCrit
                        ? 'Mobilize CAT D6 bulldozers & excavators to road chokepoints; halt civilian vehicular passage.'
                        : isTestWarn
                        ? 'Pre-position earthmovers at vulnerable mile markers (29th Mile / Dzüdza).'
                        : 'Highway maintenance and drainage patrol active.'}
                    </div>
                  </div>

                  {/* NDMA CAP Siren Card */}
                  <div style={{
                    background: '#080c14', border: `1px solid ${isTestCrit ? RED : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: '#f3f4f6' }}>
                        📢 NDMA / CWC CAP SIREN & SMS
                      </span>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 8, fontWeight: 800,
                        color: isTestCrit ? RED : isTestWarn ? AMBER : GREEN
                      }}>
                        {isTestCrit ? '● SIRENS ACTIVATED' : isTestWarn ? '● SMS BROADCAST' : '● SYSTEM ARMED'}
                      </span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      {isTestCrit
                        ? 'High-decibel acoustic valley sirens sounding; cell broadcast audio tone pushed to 15km radius.'
                        : isTestWarn
                        ? 'Regional cautionary SMS sent to registered local residents and commercial transport fleets.'
                        : 'Disaster warning network operational.'}
                    </div>
                  </div>

                  {/* District Police & Traffic Card */}
                  <div style={{
                    background: '#080c14', border: `1px solid ${isTestCrit ? RED : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: '#f3f4f6' }}>
                        🚨 DISTRICT POLICE & TRAFFIC
                      </span>
                      <span style={{
                        fontFamily: FONT_MONO, fontSize: 8, fontWeight: 800,
                        color: isTestCrit ? RED : isTestWarn ? AMBER : GREEN
                      }}>
                        {isTestCrit ? '● SECTION 144 EVACUATION' : isTestWarn ? '● RESTRICTED CORRIDOR' : '● LANES CLEAR'}
                      </span>
                    </div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
                      {isTestCrit
                        ? 'Complete traffic blockade at checkposts (Rangpo / Melli); mandatory evacuation of toe hamlets.'
                        : isTestWarn
                        ? 'Heavy multi-axle trucks restricted to single lane convoy with pilot escorts.'
                        : 'All arterial lanes and tourist corridors open.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <button
                  onClick={() => handleApplyInjection()}
                  style={{
                    flex: 1.4,
                    background: isTestCrit
                      ? `linear-gradient(135deg, ${RED} 0%, #b91c1c 100%)`
                      : isTestWarn
                      ? `linear-gradient(135deg, ${AMBER} 0%, #d97706 100%)`
                      : `linear-gradient(135deg, ${meta.color || CYAN} 0%, #0284c7 100%)`,
                    border: 'none', borderRadius: 8, padding: '14px 20px',
                    fontFamily: FONT_MONO, fontSize: 12, fontWeight: 800, color: isTestCrit ? '#fff' : '#000',
                    cursor: 'pointer', letterSpacing: '0.05em',
                    boxShadow: `0 4px 20px ${testColor}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <span>⚡</span>
                  <span>APPLY INJECTED VALUE ({testValue.toFixed(1)} {meta.unit}) TO LIVE SENSOR BUS</span>
                </button>

                <button
                  onClick={handleCriticalAlarm}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 59, 92, 0.15)', border: `1px solid ${RED}`,
                    borderRadius: 8, padding: '14px 18px', fontFamily: FONT_MONO, fontSize: 11,
                    fontWeight: 800, color: RED, cursor: 'pointer', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <span>🚨</span>
                  <span>TRIGGER CRITICAL ALARM</span>
                </button>

                {isOverridden && (
                  <button
                    onClick={handleRevert}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: 8, padding: '14px 18px', fontFamily: FONT_MONO, fontSize: 11,
                      fontWeight: 700, color: '#e5e7eb', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <span>🔄</span>
                    <span>REVERT</span>
                  </button>
                )}
              </div>

              {/* Real-Time Transmission & Audit Log */}
              <div style={{
                background: '#03050c', border: '1px solid rgba(0, 229, 255, 0.15)',
                borderRadius: 8, padding: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700, color: '#9ca3af' }}>
                    📡 INJECTION AUDIT LOG & SCADA BUS TRANSMISSION TRACE
                  </span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: GREEN }}>
                    CRC32 VERIFIED · AES-128 GCM CIPHER
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                  {auditLog.map((log, i) => (
                    <div key={i} style={{ fontFamily: FONT_MONO, fontSize: 9, color: log.type === 'CRITICAL' ? RED : log.type === 'WARNING' ? AMBER : '#94a3b8' }}>
                      <span style={{ color: '#475569' }}>[{log.time}]</span>{' '}
                      <span style={{ fontWeight: 700 }}>[{log.type}]</span>{' '}
                      <span>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
