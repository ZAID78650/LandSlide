import React, { useEffect, useState } from 'react';
import { createAlertsWS } from '../../api/client';

export default function GlobalAlertSystem() {
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let connectTimeout = null;

    const connect = () => {
      try {
        ws = createAlertsWS();
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'new_alert' && (data.alert.level === 'CRITICAL' || data.alert.level === 'HIGH' || data.alert.level === 'RED' || data.alert.level === 'ORANGE')) {
            const newAlert = {
              id: data.alert.id || Date.now(),
              message: data.alert.message || data.alert.description,
              level: data.alert.level,
              location: data.alert.location_id
            };
            setActiveAlerts(prev => [newAlert, ...prev]);
            
            // Auto remove after 8 seconds
            setTimeout(() => {
              setActiveAlerts(prev => prev.filter(a => a.id !== newAlert.id));
            }, 8000);
          }
        };
        ws.onclose = () => {
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (e) {
        console.error("Global alert system WS failed");
      }
    };

    // Delay connection slightly to prevent React Strict Mode from aborting a CONNECTING socket and throwing warnings
    connectTimeout = setTimeout(connect, 100);

    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  if (activeAlerts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {activeAlerts.map(alert => (
        <div key={alert.id} style={{
          background: alert.level === 'CRITICAL' || alert.level === 'RED' ? 'rgba(255, 59, 92, 0.95)' : 'rgba(255, 176, 32, 0.95)',
          color: alert.level === 'CRITICAL' || alert.level === 'RED' ? '#fff' : '#000',
          padding: '16px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          borderLeft: `4px solid ${alert.level === 'CRITICAL' || alert.level === 'RED' ? '#8b0000' : '#d97706'}`,
          maxWidth: 350,
          animation: 'slideIn 0.3s ease-out forwards',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⚠️ {alert.level} ALERT DETECTED
            </strong>
            <button 
              onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.9 }}>
            {alert.message}
          </div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.7, marginTop: 4 }}>
            LOC: {alert.location || 'UNKNOWN'}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
