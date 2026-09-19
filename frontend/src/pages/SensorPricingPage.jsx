import React, { useState, useEffect } from 'react';

const INITIAL_PRICES = [
  { id: 1, name: 'Soil Moisture Sensor', purpose: 'Subsurface moisture tracking', model: 'SHT20 / VH400', price_inr: 4500, price_usd: 54, accuracy: '±2%', interface: 'I2C/Analog', required: true, category: 'SEISMIC' },
  { id: 2, name: 'Rain Gauge', purpose: 'Precipitation measurement', model: 'Tipping Bucket', price_inr: 8500, price_usd: 102, accuracy: '0.2mm', interface: 'Digital Pulse', required: true, category: 'WEATHER' },
  { id: 3, name: 'Tiltmeter / Accelerometer', purpose: 'Slope movement detection', model: 'MPU6050 / ADXL345', price_inr: 1200, price_usd: 14, accuracy: '±0.1°', interface: 'I2C/SPI', required: true, category: 'SEISMIC' },
  { id: 4, name: 'Microcontroller Node', purpose: 'Data processing & transmission', model: 'ESP32 / LoRaWAN', price_inr: 2500, price_usd: 30, accuracy: '-', interface: 'WiFi/LoRa', required: true, category: 'COMPUTING' },
  { id: 5, name: 'Solar Panel + Battery', purpose: 'Off-grid power supply', model: '20W Panel + 12V 10Ah', price_inr: 5500, price_usd: 66, accuracy: '-', interface: 'DC', required: true, category: 'POWER' },
  { id: 6, name: 'Weather Station (All-in-one)', purpose: 'Wind, Temp, Humidity', model: 'Davis Vantage Pro2', price_inr: 45000, price_usd: 540, accuracy: 'High', interface: 'Wireless', required: false, category: 'WEATHER' },
];

export default function SensorPricingPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [editMode, setEditMode] = useState(false);
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_sensor_prices');
    if (saved) setItems(JSON.parse(saved));
    else setItems(INITIAL_PRICES);
  }, []);

  const savePrices = (newItems) => {
    setItems(newItems);
    localStorage.setItem('nexus_sensor_prices', JSON.stringify(newItems));
  };

  const handlePriceChange = (id, newPriceInr) => {
    const val = parseFloat(newPriceInr) || 0;
    const newItems = items.map(item => item.id === id ? { ...item, price_inr: val, price_usd: Math.round(val / 83.5) } : item);
    savePrices(newItems);
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  const filteredItems = items.filter(item => filter === 'ALL' || item.category === filter).sort((a, b) => {
    if (!sortCol) return 0;
    if (a[sortCol] < b[sortCol]) return sortAsc ? -1 : 1;
    if (a[sortCol] > b[sortCol]) return sortAsc ? 1 : -1;
    return 0;
  });

  const reqTotalInr = items.filter(i => i.required).reduce((s, i) => s + i.price_inr, 0);
  const reqTotalUsd = items.filter(i => i.required).reduce((s, i) => s + i.price_usd, 0);
  const optTotalInr = items.filter(i => !i.required).reduce((s, i) => s + i.price_inr, 0);

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 56px)', overflow: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '4px' }}>Sensor & Hardware Cost Intelligence</h2>
      </div>

      <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--green)', padding: '12px', borderRadius: '6px', marginBottom: '24px', fontSize: '13px' }}>
        📋 ESTIMATED MARKET PRICES — September 2026. Prices are indicative and may vary by supplier, quantity, and region. All INR prices include GST estimate.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'WEATHER', 'SEISMIC', 'COMMUNICATION', 'COMPUTING', 'POWER'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`btn ${filter === cat ? 'btn-primary' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className={`btn ${editMode ? 'btn-primary' : ''}`} onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Save Prices' : 'Edit Prices'}
        </button>
      </div>

      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{cursor:'pointer'}}>#</th>
                <th onClick={() => handleSort('name')} style={{cursor:'pointer'}}>Sensor/Component</th>
                <th onClick={() => handleSort('purpose')} style={{cursor:'pointer'}}>Purpose</th>
                <th onClick={() => handleSort('model')} style={{cursor:'pointer'}}>Model</th>
                <th onClick={() => handleSort('price_inr')} style={{cursor:'pointer'}}>Est. Price (₹)</th>
                <th onClick={() => handleSort('price_usd')} style={{cursor:'pointer'}}>Est. Price ($)</th>
                <th onClick={() => handleSort('accuracy')} style={{cursor:'pointer'}}>Accuracy</th>
                <th onClick={() => handleSort('interface')} style={{cursor:'pointer'}}>Interface</th>
                <th onClick={() => handleSort('required')} style={{cursor:'pointer'}}>Required</th>
                <th onClick={() => handleSort('category')} style={{cursor:'pointer'}}>Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                  <td>{item.purpose}</td>
                  <td>{item.model}</td>
                  <td>
                    {editMode ? (
                      <input 
                        type="number" 
                        value={item.price_inr} 
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="input-field" 
                        style={{ width: '80px', padding: '4px' }} 
                      />
                    ) : `₹${item.price_inr.toLocaleString()}`}
                  </td>
                  <td>${item.price_usd}</td>
                  <td>{item.accuracy}</td>
                  <td>{item.interface}</td>
                  <td><span className={`chip ${item.required ? 'chip-red' : 'chip-green'}`}>{item.required ? 'YES' : 'NO'}</span></td>
                  <td>{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ maxWidth: '400px' }}>
        <div className="panel-header"><span className="label-caps">BOM SUMMARY</span></div>
        <div className="panel-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ color: 'var(--text-muted)' }}>Total Components</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{items.length}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Required Components</div>
            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{items.filter(i => i.required).length}</div>
            
            <div style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>Req. Cost (INR)</div>
            <div style={{ textAlign: 'right', color: 'var(--cyan)', fontWeight: 'bold' }}>₹{reqTotalInr.toLocaleString()}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Req. Cost (USD)</div>
            <div style={{ textAlign: 'right' }}>${reqTotalUsd.toLocaleString()}</div>
            
            <div style={{ color: 'var(--text-muted)' }}>Optional Add-ons</div>
            <div style={{ textAlign: 'right' }}>₹{optTotalInr.toLocaleString()}</div>
          </div>
          <hr style={{ borderColor: 'var(--border-default)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
            <span>Grand Total</span>
            <span style={{ color: 'var(--red)' }}>₹{(reqTotalInr + optTotalInr).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '16px', fontFamily: 'var(--font-mono)' }}>
            Prices sourced from Amazon India, Robu.in, and component distributor catalogs (September 2026 estimates).
          </div>
        </div>
      </div>
    </div>
  );
}
