import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getGeotechnicalAnalysis, getModelDiagnostics } from '../../api/client';

const CYAN = '#00e5ff';
const RED = '#ff3b5c';
const AMBER = '#ffb020';
const GREEN = '#22c55e';
const BLUE = '#2979ff';
const PURPLE = '#a855f7';

export default function GeotechnicalDebugger() {
  const [slopeAngle, setSlopeAngle] = useState(32);
  const [cohesion, setCohesion] = useState(12.5);
  const [frictionAngle, setFrictionAngle] = useState(26);
  const [waterRatio, setWaterRatio] = useState(0.65);
  const [rainfall3Day, setRainfall3Day] = useState(145);
  const [soilSat, setSoilSat] = useState(78);

  const [analysis, setAnalysis] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('GEOTECHNICAL'); // 'GEOTECHNICAL' | 'MODEL_OPTIMIZATION'

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        getGeotechnicalAnalysis({
          slope_angle: slopeAngle,
          cohesion,
          friction_angle: frictionAngle,
          water_ratio: waterRatio,
          rainfall_3day: rainfall3Day,
          soil_saturation: soilSat,
        }),
        getModelDiagnostics(),
      ]);
      setAnalysis(aRes.data);
      setDiagnostics(dRes.data);
    } catch (e) {
      console.error("Failed to load geotechnical analysis:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [slopeAngle, cohesion, frictionAngle, waterRatio, rainfall3Day, soilSat]);

  const fosData = analysis?.factor_of_safety_analysis;
  const dispData = analysis?.slope_displacement_prediction;
  const idData = analysis?.rainfall_id_threshold;

  return (
    <div style={{ background: '#0a0d14', border: '1px solid #1e2a3a', borderRadius: 12, padding: 20, color: '#e2e8f0' }}>
      
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #1e2a3a', paddingBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: CYAN, fontSize: 16 }}>⚛</span>
            <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'sans-serif', fontWeight: 700 }}>LANDSLIDE EXPERT GEOTECHNICAL & ALGORITHMIC DEBUGGER</h3>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
            Infinite Slope Stability Engine (FoS) · Himalayan I-D Rainfall Thresholds · XGBoost / U-Net Regression Diagnostics
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('GEOTECHNICAL')}
            style={{
              background: activeTab === 'GEOTECHNICAL' ? 'rgba(0,229,255,0.12)' : '#0f172a',
              border: `1px solid ${activeTab === 'GEOTECHNICAL' ? CYAN : '#1e2a3a'}`,
              color: activeTab === 'GEOTECHNICAL' ? CYAN : '#94a3b8',
              borderRadius: 6, padding: '6px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer'
            }}
          >
            PHYSICS & STABILITY ENGINE
          </button>
          <button
            onClick={() => setActiveTab('MODEL_OPTIMIZATION')}
            style={{
              background: activeTab === 'MODEL_OPTIMIZATION' ? 'rgba(168,85,247,0.12)' : '#0f172a',
              border: `1px solid ${activeTab === 'MODEL_OPTIMIZATION' ? PURPLE : '#1e2a3a'}`,
              color: activeTab === 'MODEL_OPTIMIZATION' ? PURPLE : '#94a3b8',
              borderRadius: 6, padding: '6px 14px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer'
            }}
          >
            MODEL ACCURACY & OPTIMIZATION
          </button>
        </div>
      </div>

      {activeTab === 'GEOTECHNICAL' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          
          {/* Sliders Control Panel */}
          <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: CYAN, fontWeight: 700, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
              <span>GEOTECHNICAL PARAMETER SLIDERS</span>
              <span style={{ color: '#64748b' }}>LIVE RE-CALCULATION</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Slope Angle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Slope Angle (β):</span>
                  <span style={{ color: AMBER, fontWeight: 700 }}>{slopeAngle}°</span>
                </div>
                <input type="range" min="5" max="60" value={slopeAngle} onChange={e => setSlopeAngle(parseFloat(e.target.value))} style={{ width: '100%', accentColor: AMBER }} />
              </div>

              {/* Cohesion */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Effective Soil Cohesion (c'):</span>
                  <span style={{ color: GREEN, fontWeight: 700 }}>{cohesion} kPa</span>
                </div>
                <input type="range" min="1" max="50" step="0.5" value={cohesion} onChange={e => setCohesion(parseFloat(e.target.value))} style={{ width: '100%', accentColor: GREEN }} />
              </div>

              {/* Friction Angle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Internal Friction Angle (φ'):</span>
                  <span style={{ color: CYAN, fontWeight: 700 }}>{frictionAngle}°</span>
                </div>
                <input type="range" min="10" max="45" value={frictionAngle} onChange={e => setFrictionAngle(parseFloat(e.target.value))} style={{ width: '100%', accentColor: CYAN }} />
              </div>

              {/* Water Table Ratio */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Pore Pressure Water Ratio (m):</span>
                  <span style={{ color: BLUE, fontWeight: 700 }}>{(waterRatio * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={waterRatio} onChange={e => setWaterRatio(parseFloat(e.target.value))} style={{ width: '100%', accentColor: BLUE }} />
              </div>

              {/* 3-Day Rainfall */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>3-Day Antecedent Rainfall:</span>
                  <span style={{ color: RED, fontWeight: 700 }}>{rainfall3Day} mm</span>
                </div>
                <input type="range" min="0" max="300" value={rainfall3Day} onChange={e => setRainfall3Day(parseFloat(e.target.value))} style={{ width: '100%', accentColor: RED }} />
              </div>

              {/* Soil Saturation */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Soil Moisture Saturation:</span>
                  <span style={{ color: PURPLE, fontWeight: 700 }}>{soilSat}%</span>
                </div>
                <input type="range" min="10" max="100" value={soilSat} onChange={e => setSoilSat(parseFloat(e.target.value))} style={{ width: '100%', accentColor: PURPLE }} />
              </div>
            </div>
          </div>

          {/* Real-Time Output Physics Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Factor of Safety Card */}
            {fosData && (
              <div style={{
                background: '#0f172a', border: `1px solid ${fosData.factor_of_safety < 1.0 ? RED : fosData.factor_of_safety < 1.3 ? AMBER : GREEN}`,
                borderRadius: 10, padding: 16, boxShadow: `0 0 20px ${fosData.factor_of_safety < 1.0 ? 'rgba(255,59,92,0.2)' : 'transparent'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>SLOPE FACTOR OF SAFETY (FoS)</span>
                  <span style={{
                    fontSize: 10, fontFamily: 'monospace', fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: fosData.factor_of_safety < 1.0 ? 'rgba(255,59,92,0.2)' : fosData.factor_of_safety < 1.3 ? 'rgba(255,176,32,0.2)' : 'rgba(34,197,94,0.2)',
                    color: fosData.factor_of_safety < 1.0 ? RED : fosData.factor_of_safety < 1.3 ? AMBER : GREEN
                  }}>
                    {fosData.stability_status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 36, fontFamily: 'monospace', fontWeight: 800, color: fosData.factor_of_safety < 1.0 ? RED : fosData.factor_of_safety < 1.3 ? AMBER : GREEN }}>
                    {fosData.factor_of_safety}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>
                    Failure Prob: <strong style={{ color: RED }}>{(fosData.failure_probability * 100).toFixed(1)}%</strong>
                  </span>
                </div>

                <div style={{ gridTemplateColumns: '1fr 1fr 1fr', display: 'grid', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #1e2a3a', fontSize: 10, fontFamily: 'monospace' }}>
                  <div><span style={{ color: '#64748b' }}>Shear Stress:</span> <br/><strong style={{ color: AMBER }}>{fosData.shear_stress_kpa} kPa</strong></div>
                  <div><span style={{ color: '#64748b' }}>Shear Strength:</span> <br/><strong style={{ color: GREEN }}>{fosData.shear_strength_kpa} kPa</strong></div>
                  <div><span style={{ color: '#64748b' }}>Normal Stress:</span> <br/><strong style={{ color: CYAN }}>{fosData.effective_normal_stress_kpa} kPa</strong></div>
                </div>
              </div>
            )}

            {/* Creep Displacement Rate & I-D Threshold */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {dispData && (
                <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', marginBottom: 4 }}>REGRESSION CREEP VELOCITY</div>
                  <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, color: dispData.displacement_rate_mm_day > 25 ? RED : AMBER }}>
                    {dispData.displacement_rate_mm_day} <span style={{ fontSize: 12, color: '#64748b' }}>mm/day</span>
                  </div>
                  <div style={{ fontSize: 9, color: CYAN, fontFamily: 'monospace', marginTop: 4 }}>{dispData.creep_stage}</div>
                  <div style={{ fontSize: 9, color: RED, fontFamily: 'monospace', fontWeight: 700, marginTop: 4 }}>Action: {dispData.recommended_action}</div>
                </div>
              )}

              {idData && (
                <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', marginBottom: 4 }}>HIMALAYAN I-D THRESHOLD</div>
                  <div style={{ fontSize: 22, fontFamily: 'monospace', fontWeight: 700, color: idData.alert_tier === 'RED' ? RED : AMBER }}>
                    {idData.exceedance_ratio}x <span style={{ fontSize: 12, color: '#64748b' }}>Exceedance</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>Current: {idData.current_intensity_mm_hr} mm/h</div>
                  <div style={{ fontSize: 9, color: GREEN, fontFamily: 'monospace', marginTop: 4 }}>Limit: {idData.threshold_intensity_mm_hr} mm/h</div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {activeTab === 'MODEL_OPTIMIZATION' && diagnostics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[
              { label: 'MODEL ACCURACY', val: `${(diagnostics.overall_accuracy * 100).toFixed(1)}%`, col: GREEN },
              { label: 'MEAN IOU (mIoU)', val: `${(diagnostics.mean_iou * 100).toFixed(1)}%`, col: CYAN },
              { label: 'PRECISION', val: `${(diagnostics.precision * 100).toFixed(1)}%`, col: BLUE },
              { label: 'RECALL', val: `${(diagnostics.recall * 100).toFixed(1)}%`, col: PURPLE },
              { label: 'F1-SCORE', val: `${(diagnostics.f1_score * 100).toFixed(1)}%`, col: AMBER },
              { label: 'ROC-AUC', val: `${diagnostics.auc_roc}`, col: RED },
            ].map((m, idx) => (
              <div key={idx} style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#64748b', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 20, fontFamily: 'monospace', fontWeight: 700, color: m.col }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Loss Curves & Feature Importance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            
            {/* Loss & mIoU Learning Curves */}
            <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: CYAN, fontWeight: 700, marginBottom: 12 }}>
                TRAINING LOSS & mIOU PROGRESSION BY EPOCH
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={diagnostics.loss_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="valLossGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RED} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="miouGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CYAN} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#0a0d14', border: '1px solid #1e2a3a' }} />
                  <Area type="monotone" dataKey="val_loss" name="Validation Loss" stroke={RED} fill="url(#valLossGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="mIoU" name="mIoU Score" stroke={CYAN} fill="url(#miouGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Feature Importance */}
            <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: PURPLE, fontWeight: 700, marginBottom: 12 }}>
                XGBOOST FEATURE IMPORTANCE WEIGHTS
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diagnostics.feature_importance} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis dataKey="feature" type="category" tick={{ fill: '#94a3b8', fontSize: 9 }} width={120} />
                  <Tooltip contentStyle={{ background: '#0a0d14', border: '1px solid #1e2a3a' }} />
                  <Bar dataKey="importance" fill={PURPLE} radius={[0, 4, 4, 0]}>
                    {diagnostics.feature_importance.map((entry, index) => (
                      <Cell key={index} fill={index === 0 ? AMBER : index === 1 ? RED : CYAN} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Confusion Matrix */}
          <div style={{ background: '#0f172a', border: '1px solid #1e2a3a', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: AMBER, fontWeight: 700, marginBottom: 12 }}>
              SEGMENTATION CONFUSION MATRIX (TEST SAMPLES: 14,668)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center', fontFamily: 'monospace' }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: GREEN }}>TRUE POSITIVE (Landslide Correctly Identified)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: GREEN, marginTop: 4 }}>{diagnostics.confusion_matrix.true_positive}</div>
              </div>

              <div style={{ background: 'rgba(255,176,32,0.1)', border: '1px solid #ffb020', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: AMBER }}>FALSE POSITIVE (False Alarm)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: AMBER, marginTop: 4 }}>{diagnostics.confusion_matrix.false_positive}</div>
              </div>

              <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid #ff3b5c', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: RED }}>FALSE NEGATIVE (Missed Landslide)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: RED, marginTop: 4 }}>{diagnostics.confusion_matrix.false_negative}</div>
              </div>

              <div style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid #00e5ff', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 10, color: CYAN }}>TRUE NEGATIVE (Stable Ground Correctly Identified)</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: CYAN, marginTop: 4 }}>{diagnostics.confusion_matrix.true_negative}</div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
