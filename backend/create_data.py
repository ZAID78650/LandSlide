import os
import json

base_dir = "/Users/zaidshaikhmohammad/Desktop/LandSlide--main/backend"
data_dir = os.path.join(base_dir, "data")
os.makedirs(data_dir, exist_ok=True)

# 1. volcano_db.json
volcanoes = [
    {"id": 1, "name": "Kilauea", "country": "USA", "lat": 19.421, "lon": -155.287, "elevation_m": 1247, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Shield", "region": "Hawaii"},
    {"id": 2, "name": "Mauna Loa", "country": "USA", "lat": 19.475, "lon": -155.608, "elevation_m": 4169, "status": "ACTIVE", "last_eruption": "2022", "volcano_type": "Shield", "region": "Hawaii"},
    {"id": 3, "name": "Krakatoa", "country": "Indonesia", "lat": -6.102, "lon": 105.423, "elevation_m": 813, "status": "ACTIVE", "last_eruption": "2022", "volcano_type": "Caldera", "region": "Sunda Strait"},
    {"id": 4, "name": "Merapi", "country": "Indonesia", "lat": -7.54, "lon": 110.446, "elevation_m": 2910, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Java"},
    {"id": 5, "name": "Agung", "country": "Indonesia", "lat": -8.343, "lon": 115.508, "elevation_m": 3142, "status": "ACTIVE", "last_eruption": "2019", "volcano_type": "Stratovolcano", "region": "Bali"},
    {"id": 6, "name": "Sakurajima", "country": "Japan", "lat": 31.585, "lon": 130.657, "elevation_m": 1117, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Kyushu"},
    {"id": 7, "name": "Fuji", "country": "Japan", "lat": 35.361, "lon": 138.727, "elevation_m": 3776, "status": "DORMANT", "last_eruption": "1707", "volcano_type": "Stratovolcano", "region": "Honshu"},
    {"id": 8, "name": "Mayon", "country": "Philippines", "lat": 13.257, "lon": 123.685, "elevation_m": 2462, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Luzon"},
    {"id": 9, "name": "Taal", "country": "Philippines", "lat": 14.002, "lon": 120.993, "elevation_m": 311, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Caldera", "region": "Luzon"},
    {"id": 10, "name": "Etna", "country": "Italy", "lat": 37.748, "lon": 14.999, "elevation_m": 3326, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Sicily"},
    {"id": 11, "name": "Stromboli", "country": "Italy", "lat": 38.789, "lon": 15.213, "elevation_m": 924, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Aeolian Islands"},
    {"id": 12, "name": "Hekla", "country": "Iceland", "lat": 63.992, "lon": -19.666, "elevation_m": 1491, "status": "DORMANT", "last_eruption": "2000", "volcano_type": "Stratovolcano", "region": "South Iceland"},
    {"id": 13, "name": "Eyjafjallajokull", "country": "Iceland", "lat": 63.633, "lon": -19.633, "elevation_m": 1651, "status": "DORMANT", "last_eruption": "2010", "volcano_type": "Stratovolcano", "region": "South Iceland"},
    {"id": 14, "name": "Barren Island", "country": "India", "lat": 12.278, "lon": 93.858, "elevation_m": 353, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Andaman Islands"},
    {"id": 15, "name": "Cotopaxi", "country": "Ecuador", "lat": -0.677, "lon": -78.436, "elevation_m": 5897, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 16, "name": "Villarrica", "country": "Chile", "lat": -39.42, "lon": -71.93, "elevation_m": 2847, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 17, "name": "Fuego", "country": "Guatemala", "lat": 14.473, "lon": -90.88, "elevation_m": 3763, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 18, "name": "Arenal", "country": "Costa Rica", "lat": 10.463, "lon": -84.703, "elevation_m": 1670, "status": "DORMANT", "last_eruption": "2010", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 19, "name": "Popocatepetl", "country": "Mexico", "lat": 19.023, "lon": -98.622, "elevation_m": 5426, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 20, "name": "Colima", "country": "Mexico", "lat": 19.514, "lon": -103.62, "elevation_m": 3850, "status": "ACTIVE", "last_eruption": "2019", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 21, "name": "Santa Maria", "country": "Guatemala", "lat": 14.756, "lon": -91.552, "elevation_m": 3772, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 22, "name": "Pacaya", "country": "Guatemala", "lat": 14.381, "lon": -90.601, "elevation_m": 2552, "status": "ACTIVE", "last_eruption": "2021", "volcano_type": "Complex", "region": "Central America"},
    {"id": 23, "name": "Telica", "country": "Nicaragua", "lat": 12.602, "lon": -86.845, "elevation_m": 1061, "status": "ACTIVE", "last_eruption": "2022", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 24, "name": "Masaya", "country": "Nicaragua", "lat": 11.984, "lon": -86.161, "elevation_m": 635, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Caldera", "region": "Central America"},
    {"id": 25, "name": "Turrialba", "country": "Costa Rica", "lat": 10.025, "lon": -83.767, "elevation_m": 3340, "status": "ACTIVE", "last_eruption": "2021", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 26, "name": "Poas", "country": "Costa Rica", "lat": 10.2, "lon": -84.233, "elevation_m": 2708, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 27, "name": "Irazu", "country": "Costa Rica", "lat": 9.979, "lon": -83.852, "elevation_m": 3432, "status": "DORMANT", "last_eruption": "1994", "volcano_type": "Stratovolcano", "region": "Central America"},
    {"id": 28, "name": "Nevado del Ruiz", "country": "Colombia", "lat": 4.895, "lon": -75.322, "elevation_m": 5321, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 29, "name": "Galeras", "country": "Colombia", "lat": 1.22, "lon": -77.37, "elevation_m": 4276, "status": "ACTIVE", "last_eruption": "2014", "volcano_type": "Complex", "region": "Andes"},
    {"id": 30, "name": "Sangay", "country": "Ecuador", "lat": -2.002, "lon": -78.341, "elevation_m": 5230, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 31, "name": "Tungurahua", "country": "Ecuador", "lat": -1.467, "lon": -78.442, "elevation_m": 5023, "status": "DORMANT", "last_eruption": "2016", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 32, "name": "Reventador", "country": "Ecuador", "lat": -0.077, "lon": -77.656, "elevation_m": 3562, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 33, "name": "Ubinas", "country": "Peru", "lat": -16.355, "lon": -70.903, "elevation_m": 5672, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 34, "name": "Sabancaya", "country": "Peru", "lat": -15.78, "lon": -71.85, "elevation_m": 5967, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 35, "name": "Lascar", "country": "Chile", "lat": -23.37, "lon": -67.73, "elevation_m": 5592, "status": "ACTIVE", "last_eruption": "2023", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 36, "name": "Copahue", "country": "Chile/Argentina", "lat": -37.85, "lon": -71.17, "elevation_m": 2997, "status": "ACTIVE", "last_eruption": "2021", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 37, "name": "Calbuco", "country": "Chile", "lat": -41.326, "lon": -72.614, "elevation_m": 2003, "status": "DORMANT", "last_eruption": "2015", "volcano_type": "Stratovolcano", "region": "Andes"},
    {"id": 38, "name": "Chaiten", "country": "Chile", "lat": -42.833, "lon": -72.646, "elevation_m": 1122, "status": "DORMANT", "last_eruption": "2011", "volcano_type": "Caldera", "region": "Andes"},
    {"id": 39, "name": "Yasur", "country": "Vanuatu", "lat": -19.53, "lon": 169.44, "elevation_m": 361, "status": "ACTIVE", "last_eruption": "2024", "volcano_type": "Stratovolcano", "region": "Pacific"},
    {"id": 40, "name": "Ambae", "country": "Vanuatu", "lat": -15.389, "lon": 167.835, "elevation_m": 1496, "status": "ACTIVE", "last_eruption": "2022", "volcano_type": "Shield", "region": "Pacific"},
    {"id": 41, "name": "Hunga Tonga", "country": "Tonga", "lat": -20.536, "lon": -175.382, "elevation_m": 114, "status": "DORMANT", "last_eruption": "2022", "volcano_type": "Submarine", "region": "Pacific"}
]
with open(os.path.join(data_dir, "volcano_db.json"), "w") as f:
    json.dump(volcanoes, f)

# 2. sensor_prices.json
sensors = [
    {"id": 1, "name": "Rain Gauge Sensor", "model": "MISOL WH-SP-RG", "purpose": "Measures precipitation rate and cumulative rainfall", "price_inr": 2800, "price_usd": 34, "accuracy": "±0.3 mm", "category": "WEATHER", "required": True, "interface": "Digital", "supplier": "Amazon/Robu.in"},
    {"id": 2, "name": "Temperature Sensor", "model": "DS18B20", "purpose": "Waterproof ambient temperature reading", "price_inr": 150, "price_usd": 2, "accuracy": "±0.5°C", "category": "WEATHER", "required": True, "interface": "1-Wire", "supplier": "Robu.in"},
    {"id": 3, "name": "Humidity Sensor", "model": "DHT22", "purpose": "Measures relative humidity", "price_inr": 350, "price_usd": 4, "accuracy": "±2%", "category": "WEATHER", "required": True, "interface": "Digital", "supplier": "Robu.in"},
    {"id": 4, "name": "Barometric Pressure", "model": "BME280", "purpose": "Atmospheric pressure and altitude", "price_inr": 450, "price_usd": 5.5, "accuracy": "±1 hPa", "category": "WEATHER", "required": True, "interface": "I2C", "supplier": "Robu.in"},
    {"id": 5, "name": "Gas Sensor", "model": "MQ-2", "purpose": "Detects flammable gas and smoke", "price_inr": 120, "price_usd": 1.5, "accuracy": "Variable", "category": "ENVIRONMENT", "required": False, "interface": "Analog", "supplier": "Robu.in"},
    {"id": 6, "name": "Seismic Sensor", "model": "Geophone SM-24", "purpose": "Detects ground vibrations and earthquakes", "price_inr": 4500, "price_usd": 55, "accuracy": "High", "category": "SEISMIC", "required": True, "interface": "Analog", "supplier": "Geo Space"},
    {"id": 7, "name": "GPS Module", "model": "NEO-8M", "purpose": "Location and precise timing", "price_inr": 800, "price_usd": 10, "accuracy": "2.5m", "category": "SYSTEM", "required": True, "interface": "UART", "supplier": "Robu.in"},
    {"id": 8, "name": "Accelerometer", "model": "ADXL345", "purpose": "Detects tilt and structural vibration", "price_inr": 250, "price_usd": 3, "accuracy": "High", "category": "STRUCTURAL", "required": False, "interface": "I2C/SPI", "supplier": "Robu.in"},
    {"id": 9, "name": "Wind Speed Anemometer", "model": "WH-SP-WS01", "purpose": "Measures wind speed", "price_inr": 1800, "price_usd": 22, "accuracy": "±1 m/s", "category": "WEATHER", "required": True, "interface": "Digital", "supplier": "Robu.in"},
    {"id": 10, "name": "Water Level Sensor", "model": "JSN-SR04T", "purpose": "Ultrasonic distance for water level monitoring", "price_inr": 600, "price_usd": 7.5, "accuracy": "±1 cm", "category": "HYDROLOGY", "required": True, "interface": "Digital", "supplier": "Robu.in"},
    {"id": 11, "name": "Soil Moisture Sensor", "model": "Capacitive V1.2", "purpose": "Measures soil water content", "price_inr": 150, "price_usd": 2, "accuracy": "Moderate", "category": "HYDROLOGY", "required": False, "interface": "Analog", "supplier": "Robu.in"},
    {"id": 12, "name": "Vibration Sensor", "model": "SW-420", "purpose": "Basic vibration detection", "price_inr": 50, "price_usd": 0.6, "accuracy": "Low", "category": "SEISMIC", "required": False, "interface": "Digital", "supplier": "Robu.in"},
    {"id": 13, "name": "Infrared Camera Module", "model": "MLX90640", "purpose": "Thermal imaging for fire/heat detection", "price_inr": 3500, "price_usd": 42, "accuracy": "±1.5°C", "category": "ENVIRONMENT", "required": False, "interface": "I2C", "supplier": "Robu.in"},
    {"id": 14, "name": "LoRa Module", "model": "SX1278", "purpose": "Long range wireless communication", "price_inr": 450, "price_usd": 5.5, "accuracy": "N/A", "category": "COMMUNICATION", "required": True, "interface": "SPI", "supplier": "Robu.in"},
    {"id": 15, "name": "Arduino Mega", "model": "Mega 2560 R3", "purpose": "Microcontroller base board", "price_inr": 850, "price_usd": 10.5, "accuracy": "N/A", "category": "COMPUTE", "required": True, "interface": "USB", "supplier": "Robu.in"},
    {"id": 16, "name": "Raspberry Pi 4", "model": "Pi 4 4GB", "purpose": "Edge computing node", "price_inr": 5500, "price_usd": 67, "accuracy": "N/A", "category": "COMPUTE", "required": True, "interface": "USB/Eth", "supplier": "Robu.in"},
    {"id": 17, "name": "LiPo Battery", "model": "3.7V 5000mAh", "purpose": "Power supply", "price_inr": 600, "price_usd": 7.5, "accuracy": "N/A", "category": "POWER", "required": True, "interface": "2-pin", "supplier": "Robu.in"},
    {"id": 18, "name": "Solar Panel", "model": "12V 10W", "purpose": "Remote charging", "price_inr": 800, "price_usd": 10, "accuracy": "N/A", "category": "POWER", "required": True, "interface": "Wire", "supplier": "Robu.in"},
    {"id": 19, "name": "Waterproof Enclosure", "model": "IP67 200x150x100mm", "purpose": "Protects electronics", "price_inr": 450, "price_usd": 5.5, "accuracy": "N/A", "category": "HOUSING", "required": True, "interface": "N/A", "supplier": "Robu.in"}
]
with open(os.path.join(data_dir, "sensor_prices.json"), "w") as f:
    json.dump(sensors, f)

# 3. tectonic_plates.json
# Very simplified coordinates for bounding boxes representing general plate areas
plates = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature", "properties": {"name": "Pacific Plate", "type": "Oceanic", "boundary_type": "Convergent/Divergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-170, 50], [-120, 50], [-120, -50], [-170, -50], [-170, 50]]]}},
        {"type": "Feature", "properties": {"name": "North American Plate", "type": "Continental", "boundary_type": "Convergent/Transform"}, "geometry": {"type": "Polygon", "coordinates": [[[-170, 80], [-50, 80], [-50, 15], [-170, 15], [-170, 80]]]}},
        {"type": "Feature", "properties": {"name": "South American Plate", "type": "Continental", "boundary_type": "Convergent/Divergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-80, 15], [-30, 15], [-30, -55], [-80, -55], [-80, 15]]]}},
        {"type": "Feature", "properties": {"name": "Eurasian Plate", "type": "Continental", "boundary_type": "Convergent/Divergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-10, 80], [140, 80], [140, 20], [-10, 20], [-10, 80]]]}},
        {"type": "Feature", "properties": {"name": "African Plate", "type": "Continental", "boundary_type": "Divergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-20, 35], [55, 35], [55, -35], [-20, -35], [-20, 35]]]}},
        {"type": "Feature", "properties": {"name": "Indo-Australian Plate", "type": "Continental/Oceanic", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[60, 30], [150, 30], [150, -50], [60, -50], [60, 30]]]}},
        {"type": "Feature", "properties": {"name": "Antarctic Plate", "type": "Continental", "boundary_type": "Divergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-180, -60], [180, -60], [180, -90], [-180, -90], [-180, -60]]]}},
        {"type": "Feature", "properties": {"name": "Caribbean Plate", "type": "Oceanic", "boundary_type": "Transform/Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-85, 22], [-60, 22], [-60, 10], [-85, 10], [-85, 22]]]}},
        {"type": "Feature", "properties": {"name": "Philippine Plate", "type": "Oceanic", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[120, 35], [150, 35], [150, 0], [120, 0], [120, 35]]]}},
        {"type": "Feature", "properties": {"name": "Arabian Plate", "type": "Continental", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[35, 30], [60, 30], [60, 12], [35, 12], [35, 30]]]}},
        {"type": "Feature", "properties": {"name": "Cocos Plate", "type": "Oceanic", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-105, 20], [-80, 20], [-80, 0], [-105, 0], [-105, 20]]]}},
        {"type": "Feature", "properties": {"name": "Nazca Plate", "type": "Oceanic", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-110, 5], [-75, 5], [-75, -45], [-110, -45], [-110, 5]]]}},
        {"type": "Feature", "properties": {"name": "Scotia Plate", "type": "Oceanic", "boundary_type": "Transform"}, "geometry": {"type": "Polygon", "coordinates": [[[-70, -50], [-30, -50], [-30, -60], [-70, -60], [-70, -50]]]}},
        {"type": "Feature", "properties": {"name": "Juan de Fuca Plate", "type": "Oceanic", "boundary_type": "Convergent"}, "geometry": {"type": "Polygon", "coordinates": [[[-130, 50], [-120, 50], [-120, 40], [-130, 40], [-130, 50]]]}}
    ]
}
with open(os.path.join(data_dir, "tectonic_plates.json"), "w") as f:
    json.dump(plates, f)

print("Data files generated successfully.")
