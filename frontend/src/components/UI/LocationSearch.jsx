import React, { useState, useEffect, useRef } from 'react';

export default function LocationSearch({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef(null);
  const hasAutoLocated = useRef(false);
  // Add a flag to prevent search from triggering right after selecting a dropdown item
  const preventSearchRef = useRef(false);

  const searchPlaces = async (searchTerm) => {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=10&language=en&format=json`);
    if (!res.ok) throw new Error('Geocoding failed');
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
    if (preventSearchRef.current) {
      preventSearchRef.current = false;
      return;
    }

    if (query.trim().length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const mapped = await searchPlaces(query);
          if (mapped.length > 0) {
            setSuggestions(mapped);
          } else {
            setSuggestions([]);
          }
        } catch (err) {
          console.error('Location search error:', err);
          setSuggestions([]);
        } finally {
          setLoading(false);
          setShowDropdown(true);
        }
      }, 300); // 300ms debounce is fast and responsive
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [query]);

  const handleSelect = (place) => {
    preventSearchRef.current = true; // Prevent the useEffect from firing another search
    setQuery(place.primaryName || place.city || place.locality || '');
    setShowDropdown(false);
    onLocationSelect(place);
  };

  const handleGps = () => {
    setLoading(true);
    preventSearchRef.current = true;
    setQuery('Detecting location...');
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
          setQuery(locName);
          settle(() => onLocationSelect({
            lat: parseFloat(data.latitude), 
            lon: parseFloat(data.longitude), 
            locality: data.city || 'Detected Location', 
            city: data.city || '', 
            state: data.region || '', 
            country: data.country || '', 
            displayName: locName
          }));
        } else {
          throw new Error('Invalid IP data');
        }
      } catch (err) {
        console.warn('IP Geolocation fallback failed:', err.message);
        setQuery('Mumbai, Maharashtra, India');
        settle(() => onLocationSelect({
          lat: 19.0760, lon: 72.8777, locality: 'Default (Mumbai)', city: 'Mumbai', state: 'Maharashtra', country: 'India', displayName: 'Default Station: Mumbai (19.0760°N, 72.8777°E)'
        }));
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      // Some desktop browsers never invoke either geolocation callback. Use a
      // real IP-location fallback after the same bounded wait.
      const gpsDeadline = setTimeout(fetchIpLocation, 8500);
      navigator.geolocation.getCurrentPosition((pos) => {
        clearTimeout(gpsDeadline);
        setLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setQuery(`GPS: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
        settle(() => onLocationSelect({
          lat, lon, locality: 'GPS Position', city: '', state: '', country: '', displayName: `GPS: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`
        }));
      }, (err) => {
        clearTimeout(gpsDeadline);
        console.warn('Geolocation notice:', err.message);
        fetchIpLocation(); 
      }, { timeout: 8000 });
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
