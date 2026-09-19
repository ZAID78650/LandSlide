import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../api/client';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs().then(r => { setLogs(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const actionColor = (action) => {
    if (action.includes('DELETE') || action.includes('DANGER')) return 'var(--red)';
    if (action.includes('UPDATE') || action.includes('ESCALAT')) return 'var(--amber)';
    if (action.includes('LOGIN')) return 'var(--cyan)';
    if (action.includes('MODEL')) return 'var(--blue)';
    return 'var(--text-secondary)';
  };

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 4 }}>Audit Logs</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Immutable audit trail of all platform actions and system events.
        </p>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">AUDIT TRAIL — {logs.length} ENTRIES</span>
          <span className="chip chip-cyan">IMMUTABLE LOG</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading audit logs...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>TIMESTAMP (UTC)</th>
                <th>ACTION</th>
                <th>USER</th>
                <th>RESOURCE</th>
                <th>DETAIL</th>
                <th>IP ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono-cell" style={{ fontSize: 10, whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toUTCString().slice(4, 22)}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: actionColor(log.action), letterSpacing: '0.05em' }}>
                      {log.action}
                    </span>
                  </td>
                  <td className="mono-cell" style={{ fontSize: 11 }}>{log.user_id ? `User #${log.user_id}` : 'SYSTEM'}</td>
                  <td className="mono-cell" style={{ fontSize: 11 }}>{log.resource || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300 }} className="truncate">{log.detail || '—'}</td>
                  <td className="mono-cell" style={{ fontSize: 10 }}>{log.ip_address || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
