import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import { getSummary } from '../../api/client';

export default function TopBar() {
  const { user, alerts } = useStore();
  const [time, setTime] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [, setSimState] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('nexus_theme') || 'obsidian');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('nexus_theme', newTheme);
    if (newTheme === 'obsidian') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('nexus_theme') || 'obsidian';
    if (savedTheme !== 'obsidian') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleSimChange = () => setSimState(s => s + 1);
    window.addEventListener('nexus_sim_changed', handleSimChange);
    window.addEventListener('focus', handleSimChange);
    return () => {
      window.removeEventListener('nexus_sim_changed', handleSimChange);
      window.removeEventListener('focus', handleSimChange);
    };
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000);
    getSummary().then(r => setSummary(r.data)).catch(() => {});
    return () => clearInterval(tick);
  }, []);

  const activeAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <header className="top-bar" style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 20px', height: 56,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 12, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, background: 'var(--cyan)', borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#000', fontFamily: 'var(--font-headline)',
          boxShadow: '0 0 12px rgba(0,229,255,0.3)',
        }}>N</div>
        <div>
          <span style={{
            fontFamily: 'var(--font-headline)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.12em', color: 'var(--cyan)', textTransform: 'uppercase',
          }}>LANDSense</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 8,
          }}>Disaster Intelligence</span>
        </div>
      </div>

      {/* Center Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
        {/* System Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 4,
          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--green)', boxShadow: '0 0 6px var(--green)',
          }} />
          <span style={{ fontSize: 8, color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
            SYSTEM NOMINAL
          </span>
        </div>

        {/* AI Status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 4,
          background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.12)',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)',
            animation: 'pulse-cyan 3s infinite',
          }} />
          <span style={{ fontSize: 8, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
            AI MONITORING
          </span>
        </div>

        {summary && (
          <>
            <div style={{ width: 1, height: 20, background: 'var(--border-subtle)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>INCIDENTS</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                color: summary.critical_incidents > 0 ? 'var(--red)' : 'var(--text-primary)',
              }}>
                {summary.total_incidents}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>SENSORS</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>
                {summary.sensors_online}/{summary.sensors_total}
              </span>
            </div>
            {summary.critical_incidents > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px', borderRadius: 4,
                background: 'var(--red-muted)', border: '1px solid rgba(255,59,92,0.3)',
                animation: 'pulse-red 2s infinite',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)' }} />
                <span style={{ fontSize: 8, color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {summary.critical_incidents} CRITICAL
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Sim Mode Toggle */}
        <button 
          onClick={() => {
            const isSim = localStorage.getItem('nexus_sim_mode') === 'true';
            localStorage.setItem('nexus_sim_mode', !isSim ? 'true' : 'false');
            window.dispatchEvent(new Event('nexus_sim_changed'));
          }}
          style={{
            background: localStorage.getItem('nexus_sim_mode') === 'true' ? 'var(--red)' : 'transparent',
            color: localStorage.getItem('nexus_sim_mode') === 'true' ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${localStorage.getItem('nexus_sim_mode') === 'true' ? 'var(--red)' : 'var(--border-subtle)'}`,
            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
            animation: localStorage.getItem('nexus_sim_mode') === 'true' ? 'pulse-red 2s infinite' : 'none',
            fontFamily: 'var(--font-mono)'
          }}
        >
          {localStorage.getItem('nexus_sim_mode') === 'true' ? '⚡ SIM MODE' : '⚡ SIM'}
        </button>

        {/* Search Shortcut */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 4,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}>
          <span style={{ fontSize: 12, opacity: 0.4 }}>🔍</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌘K</span>
        </div>

        {/* Alerts Bell */}
        <button className="btn-ghost btn-icon" style={{ position: 'relative' }}>
          <span style={{ fontSize: 15 }}>🔔</span>
          {activeAlerts > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--red)', border: '2px solid var(--bg-panel)',
              animation: 'pulse-red 2s infinite',
            }} />
          )}
        </button>

        {/* Theme Switcher Segmented Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          padding: 2,
        }}>
          {[
            { id: 'obsidian', label: '🌌 Obsidian', title: 'Cyber-GIS Dark Theme' },
            { id: 'navy', label: '🛡️ Navy', title: 'Defense Command Theme' },
            { id: 'emerald', label: '🌿 Emerald', title: 'Tactical Recon Theme' }
          ].map(t => {
            const isSel = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                title={t.title}
                style={{
                  background: isSel ? 'var(--cyan)' : 'transparent',
                  color: isSel ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSel ? '0 0 10px var(--cyan-muted)' : 'none'
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Simulation Mode Toggle Button */}
        <button
          onClick={() => {
            const isSim = localStorage.getItem('nexus_sim_mode') === 'true';
            localStorage.setItem('nexus_sim_mode', (!isSim).toString());
            window.dispatchEvent(new Event('nexus_sim_changed'));
          }}
          className="btn btn-sm"
          style={{
            background: localStorage.getItem('nexus_sim_mode') === 'true' ? 'rgba(255,59,92,0.2)' : 'rgba(255,255,255,0.05)',
            border: localStorage.getItem('nexus_sim_mode') === 'true' ? '1px solid var(--red)' : '1px solid var(--border-subtle)',
            color: localStorage.getItem('nexus_sim_mode') === 'true' ? 'var(--red)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            padding: '4px 10px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
          title="Toggle Simulation Mode for demonstrations"
        >
          <span>⚡</span>
          <span>{localStorage.getItem('nexus_sim_mode') === 'true' ? 'SIM MODE ON' : 'SIMULATION'}</span>
        </button>

        {/* UTC Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
            color: 'var(--cyan)', letterSpacing: '0.04em',
          }}>
            {time.toUTCString().slice(17, 25)} UTC
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>
            {time.toUTCString().slice(0, 16)}
          </div>
        </div>

        {/* User Avatar */}
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 10px 4px 4px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#000',
            }}>
              {user.full_name?.[0] || 'U'}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>{user.full_name}</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--cyan)',
                letterSpacing: '0.08em',
              }}>{user.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
