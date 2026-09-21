import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getAlerts,
  getHazardStats,
  getIncidents,
  getSummary,
  getSystemHealth,
} from '../../api/client';

const PAGE_NAMES = {
  globe: 'Global Command',
  'command-center': 'Command Center',
  alerts: 'Alert Operations',
  incidents: 'Incident Operations',
  risk: 'Risk Intelligence',
  forecasts: 'Forecast Analytics',
  'ai-copilot': 'AI Copilot',
  datasets: 'Dataset Intelligence',
  response: 'Response Center',
  location: 'Location Intelligence',
  rainfall: 'Rainfall & Floods',
  cyclone: 'Cyclone Tracker',
  volcanic: 'Volcanic & Tectonic',
  landslide: 'Landslide Detection',
  earthquake: 'Earthquake Intelligence',
  'sensor-pricing': 'Sensor Pricing',
  simulation: 'Simulation Engine',
  reports: 'Intelligence Reports',
  audit: 'Audit Logs',
  system: 'System Health',
  admin: 'Administration',
  'virtual-sensors': 'Virtual Sensor Network',
};

const numeric = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

function Metric({ label, value, tone = 'cyan', detail }) {
  return (
    <div className={`live-metric live-metric--${tone}`}>
      <span className="live-metric__label">{label}</span>
      <strong className="live-metric__value">{value}</strong>
      <span className="live-metric__detail">{detail}</span>
    </div>
  );
}

export default function LiveAnalyticsDashboard() {
  const location = useLocation();
  const [data, setData] = useState({ summary: null, alerts: [], incidents: [], hazards: null, health: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState('loading');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.allSettled([
      getSummary(),
      getAlerts({ limit: 100 }),
      getIncidents({ limit: 100 }),
      getHazardStats(),
      getSystemHealth(),
    ]);

    const values = results.map((result) => result.status === 'fulfilled' ? result.value?.data : null);
    const [summary, alerts, incidents, hazards, health] = values;
    const succeeded = values.filter(Boolean).length;
    setData({
      summary,
      alerts: Array.isArray(alerts) ? alerts : alerts?.items || [],
      incidents: Array.isArray(incidents) ? incidents : incidents?.items || [],
      hazards,
      health,
    });
    setLastUpdated(new Date());
    setStatus(succeeded ? (succeeded === values.length ? 'live' : 'degraded') : 'offline');
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const metrics = useMemo(() => {
    const unresolvedAlerts = data.alerts.filter((alert) => !alert.resolved && !alert.acknowledged).length;
    const criticalIncidents = data.summary?.critical_incidents ?? data.incidents.filter((incident) =>
      ['critical', 'severe'].includes(String(incident.severity || incident.priority || '').toLowerCase())
    ).length;
    const totalHazards = data.hazards?.total ?? data.hazards?.total_hazards ?? data.hazards?.active ?? 0;
    const sensorsOnline = data.summary?.sensors_online ?? data.health?.sensors_online ?? 0;
    const sensorsTotal = data.summary?.sensors_total ?? data.health?.sensors_total ?? 0;
    return {
      criticalIncidents: numeric(criticalIncidents),
      unresolvedAlerts: numeric(unresolvedAlerts),
      totalHazards: numeric(totalHazards),
      sensorsOnline: numeric(sensorsOnline),
      sensorsTotal: numeric(sensorsTotal),
    };
  }, [data]);

  const segment = location.pathname.split('/').filter(Boolean)[0] || 'globe';
  const pageName = PAGE_NAMES[segment] || 'Operations';
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Connecting…';

  return (
    <section className="live-dashboard" aria-label="Live analytics dashboard">
      <div className="live-dashboard__heading">
        <div>
          <p className="live-dashboard__eyebrow">LIVE ANALYTICS · {pageName.toUpperCase()}</p>
          <p className="live-dashboard__timestamp">Last sync {updatedLabel}</p>
        </div>
        <div className={`live-dashboard__status live-dashboard__status--${status}`}>
          <span aria-hidden="true" />
          {status === 'live' ? 'LIVE FEED' : status === 'degraded' ? 'PARTIAL FEED' : status === 'offline' ? 'FEED UNAVAILABLE' : 'CONNECTING'}
        </div>
      </div>

      <div className="live-dashboard__metrics">
        <Metric label="Critical incidents" value={metrics.criticalIncidents} tone={metrics.criticalIncidents ? 'red' : 'cyan'} detail="requires review" />
        <Metric label="Open alerts" value={metrics.unresolvedAlerts} tone={metrics.unresolvedAlerts ? 'amber' : 'cyan'} detail="unacknowledged" />
        <Metric label="Active hazards" value={metrics.totalHazards} detail="ingestion pipeline" />
        <Metric label="Sensor availability" value={metrics.sensorsTotal ? `${metrics.sensorsOnline}/${metrics.sensorsTotal}` : '—'} tone="green" detail="online / enrolled" />
      </div>

      <button className="live-dashboard__refresh" type="button" onClick={refresh} disabled={refreshing}>
        <span className={refreshing ? 'is-spinning' : ''} aria-hidden="true">↻</span>
        {refreshing ? 'Syncing' : 'Refresh'}
      </button>
    </section>
  );
}
