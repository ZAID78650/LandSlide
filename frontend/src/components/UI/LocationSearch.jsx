import React, { useState, useEffect, useRef } from 'react';

export default function LocationSearch({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasAutoLocated = useRef(false);
  const userTypedRef = useRef(false);
  const preventSearchRef = useRef(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (searchTerm) => {
    // If it's formatted as GPS or numbers, check if it's direct coordinates
    const coordMatch = searchTerm.replace(/°[NE]/gi, '').match(/([-+]?\d*\.?\d+)[,\s]+([-+]?\d*\.?\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return [{
          lat, lon,
          primaryName: `Target Point (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`,
          displayName: `Custom Coordinates: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
          locality: 'Coordinate Target',
          city: '',
          state: '',
          country: '',
          type: 'COORDINATES'
        }];
      }
    }

    // Clean search term
    const cleanTerm = searchTerm.replace(/^GPS:\s*/i, '').trim();
    if (!cleanTerm || cleanTerm.length < 2) return [];

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanTerm)}&count=10&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      lat: item.latitude,
      lon: item.longitude,
      primaryName: item.name,
      displayName: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}, ${item.country}`,
      locality: item.name,
      city: item.name,
      state: item.admin1 || '',
      country: item.country || '',
      type: item.feature_code?.startsWith('PPL') ? 'CITY' : item.feature_code?.startsWith('ADM') ? 'ADMINISTRATIVE' : 'LOCATION'
    }));
  };

  useEffect(() => {
    if (preventSearchRef.current || !userTypedRef.current) {
      preventSearchRef.current = false;
      return;
    }

    if (query.trim().length > 0 && !query.startsWith('GPS:')) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const mapped = await searchPlaces(query);
          setSuggestions(mapped);
          if (userTypedRef.current) {
            setShowDropdown(true);
          }
        } catch (err) {
          console.error('Location search error:', err);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleSelect = (place) => {
    userTypedRef.current = false;
    preventSearchRef.current = true;
    setQuery(place.primaryName || place.city || place.locality || `Lat: ${place.lat.toFixed(4)}, Lon: ${place.lon.toFixed(4)}`);
    setShowDropdown(false);
    onLocationSelect(place);
  };

  const handleGps = () => {
    userTypedRef.current = false;
    preventSearchRef.current = true;
    setShowDropdown(false);
    setLoading(true);
    setQuery('Detecting GPS location...');
    let settled = false;

    const settle = (callback) => {
      if (settled) return;
      settled = true;
      callback();
    };

    const fetchIpLocation = async () => {
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          const locName = `${data.city ? data.city + ', ' : ''}${data.region ? data.region + ', ' : ''}${data.country || ''}`;
          preventSearchRef.current = true;
          setQuery(locName || 'Detected Location');
          setShowDropdown(false);
          settle(() => onLocationSelect({
            lat: parseFloat(data.latitude), 
            lon: parseFloat(data.longitude), 
            locality: data.city || 'Detected Location', 
            city: data.city || '', 
            state: data.region || '', 
            country: data.country || '', 
            displayName: locName || 'Detected Station'
          }));
        } else {
          throw new Error('Invalid IP data');
        }
      } catch (err) {
        console.warn('IP Geolocation fallback failed:', err.message);
        preventSearchRef.current = true;
        setQuery('Gangtok, Sikkim, India');
        setShowDropdown(false);
        settle(() => onLocationSelect({
          lat: 27.3314, lon: 88.6139, locality: 'Gangtok', city: 'Gangtok', state: 'Sikkim', country: 'India', displayName: 'Gangtok, Sikkim, India'
        }));
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      const gpsDeadline = setTimeout(fetchIpLocation, 7000);
      navigator.geolocation.getCurrentPosition((pos) => {
        clearTimeout(gpsDeadline);
        setLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        preventSearchRef.current = true;
        userTypedRef.current = false;
        setQuery(`GPS: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
        setShowDropdown(false);
        settle(() => onLocationSelect({
          lat, lon, locality: 'GPS Position', city: '', state: '', country: '', displayName: `GPS: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`
        }));
      }, (err) => {
        clearTimeout(gpsDeadline);
        fetchIpLocation(); 
      }, { timeout: 6000 });
    } else {
      fetchIpLocation();
    }
  };

  // Auto-locate on mount
  useEffect(() => {
    if (!hasAutoLocated.current) {
      hasAutoLocated.current = true;
      handleGps();
    }
  }, []);

  const handleSearchClick = async () => {
    preventSearchRef.current = true;
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else {
      const parts = query.split(',').map(s => s.trim());
      if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
        onLocationSelect({
          lat: parseFloat(parts[0]), lon: parseFloat(parts[1]), locality: 'Coordinate Input', city: '', state: '', country: '', displayName: query
        });
      } else if (query.trim()) {
        // The GO button must work even if the debounced suggestion request has
        // not completed yet (for example, searching “China” and pressing GO).
        setLoading(true);
        try {
          const matches = await searchPlaces(query.trim());
          if (matches.length > 0) {
            handleSelect(matches[0]);
          } else {
            setSuggestions([]);
            setShowDropdown(true);
          }
        } catch (error) {
          console.warn('Location lookup failed', error);
          setShowDropdown(true);
        } finally {
          setLoading(false);
        }
      }
      setShowDropdown(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '650px', margin: '0 auto', marginBottom: '20px', fontFamily: 'monospace' }}>
      
      {/* Search Input Container */}
      <div style={{ 
        display: 'flex', gap: '8px', 
        background: '#040d14', 
        border: '1px solid #005a70', 
        borderRadius: '12px', 
        padding: '6px 6px 6px 16px',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <span style={{ fontSize: '18px' }}>🌍</span>
        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
          style={{ 
            flex: 1, 
            background: 'transparent', 
            border: 'none', 
            color: '#fff', 
            fontSize: '16px',
            outline: 'none',
            padding: '8px'
          }}
        />
        {query && (
          <span 
            onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); }}
            style={{ color: '#4a5568', cursor: 'pointer', padding: '0 8px', fontSize: '18px' }}
          >
            ✕
          </span>
        )}
        <button 
          onClick={handleSearchClick} 
          style={{ 
            background: 'transparent', 
            border: '1px solid #00e5ff', 
            color: '#00e5ff', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.05em'
          }}
        >
          GO ➔
        </button>
        <button 
          onClick={handleGps} 
          style={{ 
            background: '#22c55e', 
            border: 'none', 
            color: '#000', 
            padding: '9px 12px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: 800,
            marginLeft: '4px'
          }}
          title="Auto-Detect GPS"
        >
          📍
        </button>
      </div>
      
      {/* Dropdown Container */}
      {showDropdown && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
          background: '#040d14', border: '1px solid #005a70', 
          zIndex: 1000, borderRadius: '12px', 
          maxHeight: '400px', overflowY: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
        }}>
          {loading && <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10, color: '#4a5568' }}>
            <span className="loading-ring" style={{ width: 16, height: 16, borderTopColor: '#00e5ff' }} /> Scanning global coordinates...
          </div>}
          
          {!loading && suggestions.map((s, i) => {
            const parts = (s.displayName || '').split(',').map(p => p.trim());
            const primary = s.city || s.locality || parts[0] || 'Unknown Location';
            
            // Reconstruct the full address excluding the primary name
            const secondary = parts.filter(p => p !== primary).join(', ');

            return (
              <div 
                key={i} 
                onClick={() => handleSelect(s)} 
                style={{ 
                  padding: '16px 20px', cursor: 'pointer', 
                  borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid rgba(0, 90, 112, 0.4)',
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 229, 255, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: '20px' }}>📍</div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, color: '#00e5ff', fontSize: '15px', letterSpacing: '0.05em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {primary}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4a5568', marginTop: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {s.displayName}
                  </div>
                </div>

                {/* Badge */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  color: '#4a5568',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  {s.type || 'LOCATION'}
                </div>

              </div>
            );
          })}
          {!loading && suggestions.length === 0 && <div style={{ padding: '20px', color: '#4a5568', textAlign: 'center' }}>NO MATCHING COORDINATES FOUND</div>}
        </div>
      )}
    </div>
  );
}
