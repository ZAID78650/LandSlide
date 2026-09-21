import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

const NAV_GROUPS = [
  {
    title: 'CMD',
    items: [
      { to: '/globe', icon: '🌐', label: '3D Global Command Center' },
      { to: '/alerts', icon: '⚡', label: 'Alert Center', badge: 'alerts' },
      { to: '/incidents', icon: '◈', label: 'Incidents' },
      { to: '/risk', icon: '◎', label: 'Risk Intelligence' },
    ]
  },
  {
    title: 'HAZARDS',
    items: [
      { to: '/virtual-sensors', icon: '📡', label: '⭐ Virtual Sensor Network' },
      { to: '/location', icon: '◉', label: 'Location Intelligence' },
      { to: '/rainfall', icon: '🌧️', label: 'Rainfall & Floods' },
      { to: '/cyclone', icon: '🌀', label: 'Cyclone Tracker' },
      { to: '/volcanic', icon: '🌋', label: 'Volcanic & Tectonic' },
      { to: '/earthquake', icon: '〰️', label: 'Earthquake Intelligence' },
      { to: '/landslide', icon: '⛰️', label: 'Landslide Detection' },
    ]
  },
  {
    title: 'SYSTEMS',
    items: [
      { to: '/sensor-pricing', icon: '◇', label: 'Sensor Pricing BOM' },
      { to: '/simulation', icon: '⚡', label: 'Simulation Engine' },
      { to: '/reports', icon: '📋', label: 'Intelligence Reports' },
      { to: '/forecasts', icon: '◷', label: 'Forecast Analytics' },
      { to: '/ai-copilot', icon: '✦', label: 'AI Copilot' },
      { to: '/datasets', icon: '▤', label: 'Datasets' },
      { to: '/response', icon: '◉', label: 'Response Center' },
    ]
  }
];

const BOTTOM_NAV = [
  { to: '/system', icon: '◎', label: 'System Health' },
  { to: '/audit', icon: '≡', label: 'Audit Logs' },
  { to: '/admin', icon: '⊞', label: 'Administration' },
];

function NavItem({ to, icon, label, badgeCount }) {
  const [hovered, setHovered] = useState(false);

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        margin: '2px 0'
      }}
    >
      <span style={{ fontSize: 16, position: 'relative', zIndex: 1 }}>{icon}</span>
      
      {badgeCount > 0 && (
        <span style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: 'var(--red)',
          boxShadow: '0 0 8px var(--red)',
          animation: 'pulse-red 2s infinite'
        }} />
      )}

      {hovered && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 10px)',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '6px 12px',
          borderRadius: 6,
          background: 'rgba(20, 24, 34, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-cyan)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6), 0 0 12px var(--cyan-glow)',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {label}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, alerts, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeAlertCount = alerts?.filter(a => !a.resolved)?.length || 0;

  return (
    <aside className="sidebar" style={{
      width: 60,
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      overflowY: 'auto',
      overflowX: 'hidden',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      zIndex: 90
    }}>
      {/* Brand Icon */}
      <div style={{
        width: 36,
        height: 36,
        background: 'linear-gradient(135deg, var(--cyan) 0%, var(--blue) 100%)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        fontSize: 16,
        fontWeight: 800,
        marginBottom: 8,
        boxShadow: '0 0 18px rgba(0, 229, 255, 0.45)',
        flexShrink: 0,
        fontFamily: 'var(--font-headline)',
        cursor: 'pointer'
      }} onClick={() => navigate('/globe')}>
        N
      </div>

      <div style={{ width: 32, height: 1, background: 'var(--border-subtle)', margin: '4px 0 6px' }} />

      {/* Navigation Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
        {NAV_GROUPS.map((group, gIdx) => (
          <React.Fragment key={group.title}>
            {gIdx > 0 && (
              <div style={{
                width: 28,
                height: 1,
                background: 'rgba(255, 255, 255, 0.07)',
                margin: '6px 0 4px'
              }} />
            )}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              marginBottom: 2
            }}>
              {group.title}
            </span>
            {group.items.map(({ to, icon, label, badge }) => (
              <NavItem
                key={to}
                to={to}
                icon={icon}
                label={label}
                badgeCount={badge === 'alerts' ? activeAlertCount : 0}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 12 }} />

      <div style={{ width: 32, height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />

      {/* Bottom Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {BOTTOM_NAV.map(({ to, icon, label }) => (
          <NavItem key={to} to={to} icon={icon} label={label} />
        ))}
      </div>

      {/* User Logout Button */}
      <div style={{ marginTop: 8 }}>
        <button
          className="nav-item"
          onClick={handleLogout}
          title={`Logout (${user?.email || ''})`}
          style={{
            background: 'none',
            border: 'none',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#000',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
          }}>
            {user?.full_name?.[0] || 'U'}
          </div>
        </button>
      </div>
    </aside>
  );
}
