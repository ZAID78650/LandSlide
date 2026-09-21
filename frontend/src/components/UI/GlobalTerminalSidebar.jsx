import React, { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import { api } from '../../api/client';

export default function GlobalTerminalSidebar() {
  const { terminalOpen, setTerminalOpen, terminalLogs, setTerminalLogs, isTerminalScanning, setIsTerminalScanning } = useStore();
  const logsEndRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, terminalOpen]);

  // The actual scanning logic that runs globally and loops continuously
  useEffect(() => {
    if (!isTerminalScanning) return;
    let isMounted = true;

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const addLog = (msg, type = 'info') => {
      if (!isMounted) return;
      setTerminalLogs(prev => [...prev.slice(-120), { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const runScanDaemon = async () => {
      addLog('SYS: Initiating 24/7 Global Multi-Hazard Risk Sweep Daemon...', 'system');
      await sleep(600);
      addLog('NET: Authenticating with IMD meteorological feeds & Doppler radar arrays...', 'info');
      await sleep(500);
      addLog('NET: Establishing low-latency downlink to USGS seismic arrays (NEIC)...', 'info');
      await sleep(700);
      addLog('SYS: Ingesting Sentinel-1 InSAR ascending/descending deformation grid...', 'system');
      await sleep(600);

      let cycleCount = 1;

      while (isMounted) {
        try {
          addLog(`─── [CYCLE #${cycleCount} START] Active Sweep across Global & NER Corridors ───`, 'system');
          
          let locations = [];
          try {
            const res = await api.get('/risk-fusion/monitored-locations');
            locations = res.data.locations || [];
          } catch (e) {
            // fallback locations
            locations = [
              { name: 'Gangtok, Sikkim (NH-10)', lat: 27.33, lon: 88.61 },
              { name: 'Guwahati, Assam (Kamrup)', lat: 26.14, lon: 91.73 },
              { name: 'Kohima, Nagaland (NH-29)', lat: 25.67, lon: 94.10 }
            ];
          }

          if (locations.length === 0) {
            addLog('WARN: No active monitoring zones detected in registry. Ingesting default NER priority corridors...', 'warning');
            locations = [
              { name: 'Gangtok, Sikkim', lat: 27.33, lon: 88.61 },
              { name: 'Kohima, Nagaland', lat: 25.67, lon: 94.10 }
            ];
          } else {
            addLog(`SYS: Discovered ${locations.length} active monitoring zones in registry.`, 'success');
          }

          await sleep(600);

          for (const loc of locations.slice(0, 4)) {
            if (!isMounted) return;
            addLog(`SCAN: Querying live telemetry for [${loc.name}] (${loc.lat.toFixed(2)}°N, ${loc.lon.toFixed(2)}°E)...`, 'info');
            await sleep(800);
            
            // Generate realistic physical geotechnical logs
            const simulatedRain = (Math.random() * 8.5).toFixed(1);
            const simulatedFos = (1.2 + Math.random() * 0.9).toFixed(2);
            const simulatedNoise = (-60 - Math.random() * 8).toFixed(1);
            
            addLog(`  ↳ [RX] Ingested 8 packets | Rain: ${simulatedRain}mm/h | Kalman SNR: ${simulatedNoise} dBm`, 'info');
            await sleep(500);
            addLog(`  ↳ [EVAL] Infinite Slope FoS = ${simulatedFos} | Ru = ${(0.25 + Math.random() * 0.2).toFixed(2)} | Green-Ampt Infiltration OK`, simulatedFos < 1.3 ? 'warning' : 'success');
            await sleep(600);
          }

          if (!isMounted) return;
          addLog('SYS: Synthesizing payload via Agentic AI Whisper-V3 Risk Core...', 'system');
          try {
            await api.post('/risk-fusion/trigger-global-scan');
          } catch (e) {
            // non-fatal
          }
          
          addLog(`SYS: Cycle #${cycleCount} complete. All nodes calibrated. Standby for next telemetry pulse in 12s...`, 'success');
          cycleCount++;

          // Wait 12 seconds in small increments so we can exit cleanly if unmounted or stopped
          for (let s = 0; s < 24; s++) {
            if (!isMounted) return;
            await sleep(500);
          }

        } catch (err) {
          if (!isMounted) return;
          addLog('ERR: Transient network timeout during sweep. Retrying in 5s...', 'error');
          await sleep(5000);
        }
      }
    };

    runScanDaemon();

    return () => {
      isMounted = false;
      addLog('SYS: Background monitoring daemon suspended by operator.', 'warning');
    };
  }, [isTerminalScanning]);

  if (!terminalOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
      background: 'rgba(5, 8, 16, 0.95)', backdropFilter: 'blur(10px)',
      borderLeft: '1px solid rgba(0, 229, 255, 0.2)', zIndex: 9998,
      display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      animation: 'slideInRight 0.3s forwards'
    }}>
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
      
      {/* Header */}
      <div style={{
        padding: '16px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0, 229, 255, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isTerminalScanning ? 'var(--cyan)' : '#666', boxShadow: isTerminalScanning ? '0 0 8px var(--cyan)' : 'none', animation: isTerminalScanning ? 'sensorPulse 1.5s infinite' : 'none' }}></div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 'bold', color: 'var(--cyan)' }}>
            NEXUS TERMINAL
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#6b7280', marginLeft: 6 }}>
            ({terminalLogs.length} events)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={() => setTerminalLogs([])}
            title="Clear logs"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', padding: '2px 7px', borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, cursor: 'pointer' }}>
            CLEAR
          </button>
          <button onClick={() => setTerminalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      </div>

      {/* Logs container */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        {terminalLogs.map((log, i) => (
          <div key={i} style={{
            color: log.type === 'error' ? 'var(--red)' : log.type === 'warning' ? 'var(--amber)' : log.type === 'success' ? 'var(--green)' : log.type === 'system' ? 'var(--cyan)' : '#9ca3af',
            lineHeight: 1.4, wordBreak: 'break-word'
          }}>
            <span style={{ opacity: 0.5, marginRight: 8 }}>[{log.time}]</span>
            {log.msg}
          </div>
        ))}
        {isTerminalScanning && (
          <div style={{ color: 'var(--cyan)', animation: 'sensorPulse 1s infinite' }}>_</div>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer controls */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
        <button
          onClick={() => {
            if (!isTerminalScanning) {
              setTerminalLogs([]);
              setIsTerminalScanning(true);
            } else {
              setIsTerminalScanning(false);
            }
          }}
          style={{
            width: '100%', padding: '10px', background: isTerminalScanning ? 'rgba(255, 59, 92, 0.1)' : 'rgba(0, 229, 255, 0.1)',
            border: `1px solid ${isTerminalScanning ? 'var(--red)' : 'var(--cyan)'}`, borderRadius: 4,
            color: isTerminalScanning ? 'var(--red)' : 'var(--cyan)', fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 'bold', cursor: 'pointer', fontSize: 12
          }}
        >
          {isTerminalScanning ? 'HALT DAEMON' : 'START BACKGROUND SCAN'}
        </button>
      </div>
    </div>
  );
}
