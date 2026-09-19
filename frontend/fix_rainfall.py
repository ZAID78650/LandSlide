import re

file_path = '/Users/mohsinsidhpurwala/Downloads/LandSlide-main/frontend/src/pages/RainfallAnalysisPage.jsx'
with open(file_path, 'r') as f:
    content = f.read()

# Remove the redundant GPS-on-mount logic in RainfallAnalysisPage since LocationSearch handles it globally now
content = re.sub(r'// ── Auto-detect real location on mount ──[\s\S]*?fetchRealLocation\(\);\n  \}, \[\]\);', '', content)

with open(file_path, 'w') as f:
    f.write(content)
