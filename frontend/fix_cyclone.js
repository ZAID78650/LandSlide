const fs = require('fs');
const file = '/Users/mohsinsidhpurwala/Downloads/LandSlide-main/frontend/src/pages/CycloneTrackerPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add baselineWeather state
if (!content.includes('baselineWeather')) {
  content = content.replace('const [scanLog,       setScanLog]       = useState([]);', 'const [scanLog,       setScanLog]       = useState([]);\n  const [baselineWeather, setBaselineWeather] = useState(null);');
}

// 2. Fetch baseline weather in fetchCyclone
const fetchLogic = `
      // Build scan log entry
      const hasStorm = data.has_storm || data.active_cyclones?.length > 0;
      setScanLog(prev => [{
        time: new Date().toLocaleTimeString(),
        status: hasStorm ? 'ALERT' : 'NOMINAL',
        loc: label
      }, ...prev].slice(0, 5));

      // Fetch real baseline weather for nominal state
      try {
        const wRes = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${lat}&longitude=\${lon}&current=wind_speed_10m,surface_pressure,precipitation\`);
        const wData = await wRes.json();
        if (wData && wData.current) {
          setBaselineWeather(wData.current);
        }
      } catch (e) {}
`;

content = content.replace(/\/\/ Build scan log entry[\s\S]*?\}, \.\.\.prev\]\.slice\(0, 5\)\);/, fetchLogic.trim());

// 3. Update the Stat Cards to use baselineWeather
content = content.replace(/'0 km\/h'/g, 'baselineWeather ? `${baselineWeather.wind_speed_10m} km/h` : "0 km/h"');
content = content.replace(/'1012 hPa'/g, 'baselineWeather ? `${baselineWeather.surface_pressure} hPa` : "1012 hPa"');
content = content.replace(/'0 mm\/hr'/g, 'baselineWeather ? `${baselineWeather.precipitation} mm/hr` : "0 mm/hr"');
content = content.replace(/'10\/100'/g, 'baselineWeather ? `${Math.round(baselineWeather.wind_speed_10m + 10)}/100` : "10/100"');
content = content.replace(/'2.4 m'/g, 'baselineWeather ? `${(baselineWeather.wind_speed_10m * 0.1).toFixed(1)} m` : "0.5 m"'); // Storm surge nominal based on wind

fs.writeFileSync(file, content);
