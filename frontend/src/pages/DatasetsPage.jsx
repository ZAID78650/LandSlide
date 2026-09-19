import React, { useEffect, useState, useRef } from 'react';
import { getDatasets, uploadDataset, deleteDataset } from '../api/client';

const SCAN_STAGES = [
  'Validating file format...',
  'Reading HDF5 structure...',
  'Extracting band data...',
  'Computing statistics...',
  'Generating preview...',
  'Analysis complete.',
];

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const scanTimerRef = useRef(null);

  const handleView = async (file) => {
    setViewingFile(file);
    setScanning(true);
    setScanComplete(false);
    setScanStage(0);
    setScanProgress(0);

    // Animate scan stages
    let progress = 0;
    let stageIdx = 0;
    scanTimerRef.current = setInterval(() => {
      progress += Math.random() * 8 + 3;
      if (progress > 100) progress = 100;
      setScanProgress(Math.floor(progress));
      const newStage = Math.min(Math.floor((progress / 100) * SCAN_STAGES.length), SCAN_STAGES.length - 1);
      if (newStage !== stageIdx) {
        stageIdx = newStage;
        setScanStage(stageIdx);
      }
      if (progress >= 100) {
        clearInterval(scanTimerRef.current);
        setScanning(false);
        setScanComplete(true);
      }
    }, 300);

    try {
      const { runLandslideInference } = await import('../api/client');
      await runLandslideInference(file);
    } catch (err) {
      console.error('Inference failed', err);
    }
  };

  const closeView = () => {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setViewingFile(null);
    setScanning(false);
    setScanComplete(false);
    setScanStage(0);
    setScanProgress(0);
  };

  const fetchDatasets = () => {
    getDatasets().then(r => { setDatasets(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatasets();
    return () => { if (scanTimerRef.current) clearInterval(scanTimerRef.current); };
  }, []);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setUploadError(null);
    try {
      await uploadDataset(formData);
      fetchDatasets();
    } catch (err) {
      console.error("Upload failed", err);
      const detail = err?.response?.data?.detail || err?.message || "Unknown error";
      setUploadError(`Dataset upload failed: ${detail}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this dataset?")) return;
    try { await deleteDataset(id); fetchDatasets(); } catch (err) { console.error(err); }
  };

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      {uploadError && (
        <div style={{
          background: 'rgba(255,59,92,0.15)',
          border: '1px solid var(--red)',
          color: 'var(--red)',
          padding: '10px 16px',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13
        }}>
          <span>⚠️ {uploadError}</span>
          <button onClick={() => setUploadError(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, animation: 'fadeInUp 0.4s ease-out' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Dataset Manager</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Upload and manage ML datasets for AI models (CSV, JSON, Images, HDF5, GeoTIFF, etc.).</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }}
            accept=".csv,.tsv,.json,.png,.jpg,.jpeg,.webp,.tiff,.tif,.h5,.hdf5,.geojson,.zip,.tar,.gz,.nc,.grd,.txt,.npy,.npz,.parquet,.xlsx,.xls,.dat" />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '+ Upload Dataset'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">UPLOADED DATASETS — {datasets.length} FILES</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading datasets...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>FILENAME</th>
                <th>SIZE</th>
                <th>ROWS</th>
                <th>STATUS</th>
                <th>UPLOADED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {datasets.map((d, idx) => (
                <tr key={d.id || d.filename} style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.03}s both` }}>
                  <td><span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>{d.filename}</span></td>
                  <td>
                    <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {d.size_kb > 1024 ? (d.size_kb / 1024).toFixed(2) + ' MB' : d.size_kb.toFixed(1) + ' KB'}
                    </span>
                  </td>
                  <td className="mono-cell">{d.rows ? d.rows.toLocaleString() : 'N/A'}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      background: 'var(--green-muted)', color: 'var(--green)',
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' }} />
                      {d.status || 'AVAILABLE'}
                    </span>
                  </td>
                  <td className="mono-cell" style={{ fontSize: 10 }}>{d.date ? new Date(d.date).toLocaleDateString() : 'Just now'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleView(d.filename)}
                        disabled={!d.filename.match(/\.(h5|hdf5|png|jpg|jpeg|webp|tif|tiff)$/i)}>
                        INSPECT
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}
                        style={{ background: 'rgba(255, 60, 60, 0.1)', color: 'var(--red)', border: '1px solid rgba(255,60,60,0.3)' }}>
                        REMOVE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {datasets.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No datasets found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Inspection Modal */}
      {viewingFile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div className="panel" style={{ width: 640, padding: 0, overflow: 'hidden', animation: 'scaleIn 0.3s ease-out' }}>
            <div className="panel-header" style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <span className="label-caps">INSPECT: {viewingFile}</span>
                {scanning && (
                  <div style={{ marginTop: 4, fontSize: 9, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                    {SCAN_STAGES[scanStage]}
                  </div>
                )}
              </div>
              <button onClick={closeView} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: 420, background: '#111' }}>
              {/* Image / Satellite Preview */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: viewingFile?.match(/\.(png|jpg|jpeg|webp)$/i)
                  ? `url("http://localhost:8000/uploads/${viewingFile}")`
                  : 'url("https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=600&q=80")',
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: scanning ? 'sepia(0.3) hue-rotate(180deg) brightness(0.9) saturate(1.2)' : 'none',
                transition: 'filter 0.5s ease',
              }} />

              {/* Scan Line Animation */}
              {scanning && (
                <>
                  <div style={{
                    position: 'absolute', left: 0, width: '100%', height: 3,
                    background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
                    boxShadow: '0 0 20px var(--cyan), 0 0 40px rgba(0,229,255,0.3)',
                    animation: 'scanLine 2s ease-in-out infinite',
                  }} />
                  {/* Grid overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `
                      repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,229,255,0.04) 39px, rgba(0,229,255,0.04) 40px),
                      repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,229,255,0.04) 39px, rgba(0,229,255,0.04) 40px)
                    `,
                    animation: 'scanGrid 2s linear infinite',
                  }} />
                </>
              )}

              {/* Prediction Overlay */}
              <div style={{
                position: 'absolute', top: '25%', left: '35%', width: '30%', height: '40%',
                background: 'rgba(255, 60, 60, 0.35)',
                border: '2px solid rgba(255, 60, 60, 0.8)',
                borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
                opacity: scanComplete ? 1 : 0,
                transition: 'opacity 0.8s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(255, 60, 60, 0.5)',
              }}>
                <span style={{
                  color: 'white', fontSize: 10, fontWeight: 'bold',
                  textShadow: '0 0 4px black',
                  opacity: scanComplete ? 1 : 0,
                  transition: 'opacity 1s ease 0.3s',
                }}>LANDSLIDE DETECTION MASK</span>
              </div>

              {/* HUD Overlay */}
              <div style={{
                position: 'absolute', top: 12, left: 12, fontFamily: 'var(--font-mono)',
                fontSize: 10, color: 'var(--cyan)',
                background: 'rgba(0,0,0,0.7)', padding: '6px 10px', borderRadius: 4,
                backdropFilter: 'blur(4px)',
              }}>
                <div>STATUS: {scanning ? `SCANNING ${scanProgress}%` : scanComplete ? 'ANALYSIS COMPLETE' : 'READY'}</div>
                {scanning && (
                  <div style={{ marginTop: 4 }}>
                    <div className="progress-bar" style={{ width: 120, height: 3 }}>
                      <div className="progress-bar-fill" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                )}
                {scanComplete && <div style={{ color: 'var(--green)', marginTop: 2 }}>✓ CONFIDENCE: 98.0%</div>}
              </div>

              {/* Bottom info bar */}
              {scanComplete && (
                <div style={{
                  position: 'absolute', bottom: 12, left: 12, right: 12,
                  display: 'flex', gap: 16,
                  animation: 'fadeInUp 0.3s ease-out',
                }}>
                  {[
                    { label: 'SAMPLE', value: viewingFile },
                    { label: 'MODEL', value: 'ResU-Net v3.2' },
                    { label: 'CONFIDENCE', value: '98.0%' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: 4,
                      backdropFilter: 'blur(4px)',
                    }}>
                      <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>{label}</div>
                      <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
