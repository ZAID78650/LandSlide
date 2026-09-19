import React, { useState } from 'react';
import RiskLevelBadge from './RiskLevelBadge';

export default function LocationInfoTable({ rows, loading }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  if (loading) {
    return <div className="loading-ring" style={{ margin: '20px auto', display: 'block' }}></div>;
  }

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  const sortedRows = [...(rows || [])].sort((a, b) => {
    if (!sortCol) return 0;
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const exportCsv = () => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'location_info.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button className="btn" onClick={exportCsv}>⬇ Export CSV</button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('pin_label')} style={{ cursor: 'pointer' }}>Pin Point</th>
            <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>Location</th>
            <th onClick={() => handleSort('locality')} style={{ cursor: 'pointer' }}>Locality</th>
            <th onClick={() => handleSort('lat')} style={{ cursor: 'pointer' }}>Latitude</th>
            <th onClick={() => handleSort('lon')} style={{ cursor: 'pointer' }}>Longitude</th>
            <th onClick={() => handleSort('timezone')} style={{ cursor: 'pointer' }}>Timezone</th>
            <th onClick={() => handleSort('local_time')} style={{ cursor: 'pointer' }}>Local Time</th>
            <th onClick={() => handleSort('disaster_type')} style={{ cursor: 'pointer' }}>Disaster Type</th>
            <th onClick={() => handleSort('risk_level')} style={{ cursor: 'pointer' }}>Risk Level</th>
            <th onClick={() => handleSort('last_updated')} style={{ cursor: 'pointer' }}>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={i}>
              <td>{typeof row.pin_label === 'object' ? (row.pin_label?.label || 'Pin') : String(row.pin_label || '-')}</td>
              <td>{typeof row.location === 'object' ? (row.location?.displayName || row.location?.locality || 'Location') : String(row.location || '-')}</td>
              <td>{typeof row.locality === 'object' ? (row.locality?.locality || 'Locality') : String(row.locality || '-')}</td>
              <td>{typeof row.lat === 'object' ? String(row.lat?.lat || '-') : String(row.lat || '-')}</td>
              <td>{typeof row.lon === 'object' ? String(row.lon?.lon || '-') : String(row.lon || '-')}</td>
              <td>{typeof row.timezone === 'object' ? (row.timezone?.timeZone || row.timezone?.timezone || 'Asia/Kolkata') : String(row.timezone || 'Asia/Kolkata')}</td>
              <td>{typeof row.local_time === 'object' ? String(row.local_time?.time || '') : String(row.local_time || '-')}</td>
              <td>{typeof row.disaster_type === 'object' ? String(row.disaster_type?.type || 'Hazard') : String(row.disaster_type || '-')}</td>
              <td><RiskLevelBadge level={typeof row.risk_level === 'string' ? row.risk_level : 'MODERATE'} /></td>
              <td>{typeof row.last_updated === 'object' ? String(row.last_updated?.time || '') : String(row.last_updated || '-')}</td>
            </tr>
          ))}
          {(!sortedRows || sortedRows.length === 0) && (
            <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
