import os
import re

main_path = "/Users/zaidshaikhmohammad/Desktop/LandSlide--main/backend/main.py"
with open(main_path, "r") as f:
    content = f.read()

# Add imports
imports_to_add = "from routers import location, weather_live, volcano_tectonic, sensor_health\n"
if "from routers import location" not in content:
    content = re.sub(r'(from routers import .*?\n)', r'\1' + imports_to_add, content, count=1)
    # If no routers imported yet:
    if "from routers import location" not in content:
        content = content.replace("from fastapi import", imports_to_add + "from fastapi import")

# Add router includes
includes_to_add = """
app.include_router(location.router, prefix="/api")
app.include_router(weather_live.router, prefix="/api")
app.include_router(volcano_tectonic.router, prefix="/api")
app.include_router(sensor_health.router, prefix="/api")
"""
if "location.router" not in content:
    # Find the last app.include_router
    if "app.include_router" in content:
        content = re.sub(r'(app\.include_router\(.*?\n)(?!.*app\.include_router)', r'\1' + includes_to_add, content, flags=re.DOTALL)
    else:
        # Just append it
        content += includes_to_add

with open(main_path, "w") as f:
    f.write(content)

print("main.py updated successfully.")
