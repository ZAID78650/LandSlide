import React, { useEffect, useState } from 'react';
import { getUsers } from '../api/client';
import { StatusChip } from '../components/UI';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers().then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const roleColor = (role) => ({
    ADMIN: 'var(--red)', ANALYST: 'var(--cyan)', OFFICER: 'var(--orange)', VIEWER: 'var(--text-secondary)',
  })[role] || 'var(--text-secondary)';

  return (
    <div style={{ padding: 20, height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Administration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>User management and platform configuration.</p>
        </div>
        <button className="btn btn-primary">+ Invite User</button>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="label-caps">USER MANAGEMENT — {users.length} ACCOUNTS</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading users...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ROLE</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="mono-cell" style={{ fontSize: 10 }}>USR-{u.id.toString().padStart(4, '0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--blue), var(--cyan))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#000', flexShrink: 0,
                      }}>
                        {u.full_name?.[0] || '?'}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: roleColor(u.role), fontWeight: 700, letterSpacing: '0.08em' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <StatusChip level={u.is_active ? 'ONLINE' : 'OFFLINE'} label={u.is_active ? 'ACTIVE' : 'DISABLED'} />
                  </td>
                  <td className="mono-cell" style={{ fontSize: 10 }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                      {u.is_active && (
                        <button className="btn btn-sm" style={{ background: 'var(--red-muted)', color: 'var(--red)', border: '1px solid var(--red)' }}>
                          Disable
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
