import re

file_path = '/Users/mohsinsidhpurwala/Downloads/LandSlide-main/frontend/src/pages/CycloneTrackerPage.jsx'
with open(file_path, 'r') as f:
    content = f.read()

if 'baselineWeather' not in content:
    content = content.replace(
        'const [scanLog,       setScanLog]       = useState([]);',
        'const [scanLog,       setScanLog]       = useState([]);\n  const [baselineWeather, setBaselineWeather] = useState(null);'
    )

fetch_logic = """      // Build scan log entry
      const hasStorm = data.has_storm || data.active_cyclones?.length > 0;
      setScanLog(prev => [{
        time: new Date().toLocaleTimeString(),
        status: hasStorm ? 'ALERT' : 'NOMINAL',
        loc: label
      }, ...prev].slice(0, 5));

      // Fetch real baseline weather for nominal state
      try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,surface_pressure,precipitation`);
        const wData = await wRes.json();
        if (wData && wData.current) {
          setBaselineWeather(wData.current);
        }
      } catch (e) {}"""

content = re.sub(r'// Build scan log entry[\s\S]*?\}, \.\.\.prev\]\.slice\(0, 5\)\);', fetch_logic.strip(), content)

content = content.replace("'0 km/h'", 'baselineWeather ? `${baselineWeather.wind_speed_10m} km/h` : "0 km/h"')
content = content.replace("'1012 hPa'", 'baselineWeather ? `${baselineWeather.surface_pressure} hPa` : "1012 hPa"')
content = content.replace("'0 mm/hr'", 'baselineWeather ? `${baselineWeather.precipitation} mm/hr` : "0 mm/hr"')
content = content.replace("'10/100'", 'baselineWeather ? `${Math.round(baselineWeather.wind_speed_10m + 10)}/100` : "10/100"')
content = content.replace("'0 m'", 'baselineWeather ? `${(baselineWeather.wind_speed_10m * 0.1).toFixed(1)} m` : "0 m"') 

with open(file_path, 'w') as f:
    f.write(content)
