import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getIncident, getTimeline, updateIncident } from '../api/client';
import { StatusChip, ConfidenceBar } from '../components/UI';

export default function IncidentDetail() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getIncident(id), getTimeline(id)]).then(([incRes, tlRes]) => {
      setIncident(incRes.data);
      setTimeline(tlRes.data);
      setLoading(false);
    });
  }, [id]);

  const handleResolve = async () => {
    const res = await updateIncident(id, { status: 'RESOLVED' });
    setIncident(res.data);
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading incident...</div>;
  if (!incident) return <div style={{ padding: 40, color: 'var(--red)' }}>Incident not found</div>;

  return (
    <div style={{ padding: 20, maxWidth: 1200, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)' }}>
        <Link to="/incidents" style={{ color: 'var(--cyan)', textDecoration: 'none' }}>Incidents</Link>
        <span>›</span>
        <span>INC-{id.padStart(4, '0')}</span>
        <span>›</span>
        <span className="truncate" style={{ maxWidth: 300 }}>{incident.title}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
              INC-{id.padStart(4, '0')}
            </span>
            <StatusChip level={incident.severity} />
            <StatusChip level={incident.status} />
            <span className="chip chip-blue">{incident.incident_type}</span>
          </div>
          <h2 style={{ marginBottom: 4 }}>{incident.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{incident.location_name}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {incident.status !== 'RESOLVED' && (
            <button className="btn btn-primary" onClick={handleResolve}>✓ Mark Resolved</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Key metrics */}
        {[
          { label: 'RISK SCORE', value: `${incident.risk_score?.toFixed(1)}/100`, color: incident.risk_score >= 80 ? 'var(--red)' : 'var(--orange)' },
          { label: 'AI CONFIDENCE', value: `${(incident.confidence * 100).toFixed(0)}%`, color: 'var(--cyan)' },
          { label: 'AFFECTED POPULATION', value: incident.affected_population?.toLocaleString() || '—', color: 'var(--text-primary)' },
          { label: 'AFFECTED AREA', value: incident.affected_area_km2 != null ? `${incident.affected_area_km2.toFixed(1)} km²` : '—', color: 'var(--text-primary)' },
          { label: 'COORDINATES', value: `${incident.lat?.toFixed(3)}°N, ${incident.lon?.toFixed(3)}°E`, color: 'var(--text-secondary)', mono: true },
          { label: 'CREATED', value: new Date(incident.created_at).toLocaleString(), color: 'var(--text-secondary)', mono: true },
        ].map(({ label, value, color, mono }) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-headline)', fontSize: mono ? 13 : 22, fontWeight: 700, color, marginTop: 4 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Main detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="panel">
            <div className="panel-header"><span className="label-caps">INCIDENT DESCRIPTION</span></div>
            <div className="panel-body">
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>
                {incident.description || 'No description available.'}
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><span className="label-caps">AI RISK ASSESSMENT</span></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ConfidenceBar value={incident.confidence} label="Overall Model Confidence" />
              <ConfidenceBar value={incident.risk_score / 100} label="Risk Index" />
              <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 4, borderLeft: '3px solid var(--cyan)' }}>
                <div className="label-caps" style={{ fontSize: 9, color: 'var(--cyan)', marginBottom: 6 }}>AI ANALYSIS</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  LandslideNet v3.2 has flagged this incident with {(incident.confidence * 100).toFixed(0)}% confidence.
                  Elevated pore water pressure, recent seismic activity, and high cumulative rainfall are the primary contributing factors.
                  Recommend immediate deployment of ground assessment teams and pre-positioning of rescue equipment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="panel">
          <div className="panel-header"><span className="label-caps">EVENT TIMELINE</span></div>
          <div className="panel-body" style={{ padding: '12px 16px' }}>
            <div className="timeline">
              {timeline.map((event, i) => (
                <div key={event.id} className="timeline-item">
                  <div className="timeline-dot" style={{
                    borderColor: event.event_type === 'CREATED' || event.event_type === 'DETECTION' ? 'var(--cyan)' :
                      event.event_type === 'RESOLVED' ? 'var(--green)' : 'var(--border-default)',
                  }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{event.event_type.replace('_', ' ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                      {event.description}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(event.timestamp).toUTCString().slice(4, 22)} UTC
                    </div>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No timeline events</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
