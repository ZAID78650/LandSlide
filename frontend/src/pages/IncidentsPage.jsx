import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../api/client';
import { StatusChip } from '../components/UI';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '', type: '' });

  useEffect(() => {
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.severity) params.severity = filter.severity;
    if (filter.incident_type) params.incident_type = filter.incident_type;
    getIncidents(params).then(r => { setIncidents(r.data); setLoading(false); });
  }, [filter]);

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Incident Registry</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            All monitored disaster events with AI risk assessments.
          </p>
        </div>
        <Link to="/incidents/new" className="btn btn-primary">+ New Incident</Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }}
          onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="MONITORING">Monitoring</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }}
          onChange={e => setFilter(p => ({ ...p, severity: e.target.value }))}>
          <option value="">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }}
          onChange={e => setFilter(p => ({ ...p, incident_type: e.target.value }))}>
          <option value="">All Types</option>
          <option value="LANDSLIDE">Landslide</option>
          <option value="FLOOD">Flood</option>
          <option value="WILDFIRE">Wildfire</option>
          <option value="EARTHQUAKE">Earthquake</option>
        </select>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">INCIDENT REGISTRY — {incidents.length} RECORDS</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading incidents...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TITLE</th>
                <th>TYPE</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>RISK SCORE</th>
                <th>CONFIDENCE</th>
                <th>COORDINATES</th>
                <th>CREATED</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td><Link to={`/incidents/${inc.id}`} style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: 11, textDecoration: 'none' }}>INC-{inc.id.toString().padStart(4, '0')}</Link></td>
                  <td>
                    <div style={{ fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{inc.location_name}</div>
                  </td>
                  <td className="mono-cell">{inc.incident_type}</td>
                  <td><StatusChip level={inc.severity} /></td>
                  <td><StatusChip level={inc.status} /></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 48, height: 3, background: 'var(--border-subtle)', borderRadius: 2 }}>
                        <div style={{ width: `${inc.risk_score}%`, height: '100%', background: inc.risk_score >= 80 ? 'var(--red)' : inc.risk_score >= 60 ? 'var(--orange)' : 'var(--amber)', borderRadius: 2 }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11 }}>{inc.risk_score?.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="mono-cell">{(inc.confidence * 100).toFixed(0)}%</td>
                  <td className="mono-cell" style={{ fontSize: 10 }}>{inc.lat?.toFixed(2)}°N, {inc.lon?.toFixed(2)}°E</td>
                  <td className="mono-cell" style={{ fontSize: 10 }}>{new Date(inc.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
