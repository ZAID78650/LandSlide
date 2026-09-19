#!/usr/bin/env python3
"""
Generate LANDSense AI — SIH Project Documentation (Word .docx)
"""
import os
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn, nsdecls
from docx.oxml import parse_xml

doc = Document()

# ─── Styles ──────────────────────────────────────────────────────────────
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)
font.color.rgb = RGBColor(0x22, 0x22, 0x22)
style.paragraph_format.space_after = Pt(6)
style.paragraph_format.line_spacing = 1.15

for level in range(1, 4):
    hs = doc.styles[f'Heading {level}']
    hs.font.name = 'Calibri'
    hs.font.bold = True
    if level == 1:
        hs.font.size = Pt(22)
        hs.font.color.rgb = RGBColor(0x00, 0x7A, 0xCC)
    elif level == 2:
        hs.font.size = Pt(16)
        hs.font.color.rgb = RGBColor(0x00, 0x5F, 0xA3)
    else:
        hs.font.size = Pt(13)
        hs.font.color.rgb = RGBColor(0x00, 0x4D, 0x80)

# ─── Helper functions ────────────────────────────────────────────────────
def add_heading(text, level=1):
    return doc.add_heading(text, level=level)

def add_para(text, bold=False, italic=False, align=None, space_after=None):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    if align:
        p.alignment = align
    if space_after is not None:
        p.paragraph_format.space_after = Pt(space_after)
    return p

def add_bullet(text, level=0):
    p = doc.add_paragraph(text, style='List Bullet')
    p.paragraph_format.left_indent = Cm(1.27 + level * 1.27)
    return p

def add_numbered(text, level=0):
    p = doc.add_paragraph(text, style='List Number')
    p.paragraph_format.left_indent = Cm(1.27 + level * 1.27)
    return p

def set_cell_shading(cell, color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def add_table_with_header(headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Light Grid Accent 1'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Header
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        set_cell_shading(cell, "007ACC")
    # Data
    for r_idx, row_data in enumerate(rows):
        for c_idx, val in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = str(val)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(10)
    doc.add_paragraph()
    return table

def add_caption(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return p

def add_hyperlink(paragraph, text, url, font_size=Pt(10)):
    """Add a clickable hyperlink to a paragraph using OOXML."""
    part = paragraph.part
    r_id = part.relate_to(
        url,
        'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
        is_external=True,
    )
    w_ns = nsdecls('w')
    r_ns = nsdecls('r')
    sz_val = str(int(font_size.pt * 2))
    xml_str = (
        '<w:hyperlink ' + w_ns + ' r:id="' + r_id + '" ' + r_ns + '>'
        '  <w:r>'
        '    <w:rPr>'
        '      <w:rStyle w:val="Hyperlink"/>'
        '      <w:color w:val="0563C1"/>'
        '      <w:u w:val="single"/>'
        '      <w:sz w:val="' + sz_val + '"/>'
        '      <w:szCs w:val="' + sz_val + '"/>'
        '    </w:rPr>'
        '    <w:t>' + text + '</w:t>'
        '  </w:r>'
        '</w:hyperlink>'
    )
    hyperlink = parse_xml(xml_str)
    paragraph._p.append(hyperlink)
    return hyperlink

def add_reference_with_link(ref_num, title, source, url):
    """Add a reference with a clickable URL link."""
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15

    # Reference number and title (bold)
    run_num = p.add_run(f"[{ref_num}] ")
    run_num.bold = True
    run_num.font.size = Pt(10)

    run_title = p.add_run(f"{title}, ")
    run_title.italic = True
    run_title.font.size = Pt(10)

    run_source = p.add_run(f"{source}. ")
    run_source.font.size = Pt(10)

    run_avail = p.add_run("Available: ")
    run_avail.font.size = Pt(10)
    run_avail.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    # Clickable hyperlink
    add_hyperlink(p, url, url, Pt(9))

    return p

# ══════════════════════════════════════════════════════════════════════════
# COVER PAGE
# ══════════════════════════════════════════════════════════════════════════
for _ in range(6):
    doc.add_paragraph()

title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = title_p.add_run("LANDSense AI")
run.bold = True
run.font.size = Pt(36)
run.font.color.rgb = RGBColor(0x00, 0x7A, 0xCC)

subtitle_p = doc.add_paragraph()
subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = subtitle_p.add_run("AI-Based Early Warning & Landslide Risk Monitoring System\nfor the North Eastern Region of India")
run.font.size = Pt(16)
run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

doc.add_paragraph()

details = [
    ("Competition", "Smart India Hackathon (SIH)"),
    ("Problem Statement", "AI-Based Early Warning & Landslide Risk Monitoring System for NER India"),
    ("Domain", "Disaster Management · Artificial Intelligence · GIS · Remote Sensing"),
    ("Version", "1.0"),
    ("Date", "September 2026"),
]
for label, value in details:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(f"{label}: ")
    run.bold = True
    run.font.size = Pt(11)
    run2 = p.add_run(value)
    run2.font.size = Pt(11)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════
# TABLE OF CONTENTS (placeholder)
# ══════════════════════════════════════════════════════════════════════════
add_heading("Table of Contents", level=1)
toc_items = [
    "1. Introduction & Background",
    "2. Problem Statement",
    "3. Proposed Solution — LANDSense AI",
    "4. System Architecture",
    "5. Landslide4Sense Dataset",
    "6. AI/ML Model Pipeline",
    "7. Platform Features & Dashboard",
    "8. 3D GIS Risk Mapping",
    "9. Location Intelligence Scanner",
    "10. Agentic AI Command Center",
    "11. Early Warning & Alert System",
    "12. Emergency Response & Evacuation",
    "13. IoT Sensor Monitoring",
    "14. Satellite Intelligence",
    "15. Role-Based Access Control",
    "16. Audit Trail & Data Provenance",
    "17. Technology Stack",
    "18. What's New — Novel Integrations",
    "19. Conclusion",
    "20. Future Scope",
    "21. References",
]
for item in toc_items:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(4)
    p.runs[0].font.size = Pt(11)

doc.add_page_break()

# ══════════════════════════════════════════════════════════════════════════
# 1. INTRODUCTION & BACKGROUND
# ══════════════════════════════════════════════════════════════════════════
add_heading("1. Introduction & Background", level=1)

add_para(
    "The North Eastern Region (NER) of India, comprising eight states — Assam, Arunachal Pradesh, "
    "Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim — is one of the most disaster-prone "
    "regions in the world. Its unique geo-climatic conditions, characterized by steep terrain, fragile "
    "geological formations, heavy monsoon rainfall (often exceeding 2,000 mm annually), and dense river "
    "networks, make it highly susceptible to landslides, flash floods, slope failures, and related hazards."
)

add_para(
    "According to the National Centre for Seismology and the Geological Survey of India, the NER "
    "witnesses hundreds of landslide events annually, resulting in significant loss of life, displacement "
    "of communities, destruction of critical infrastructure (roads, bridges, railways), and prolonged "
    "disruption of connectivity to remote villages. The 2023 Sikkim flash flood, the recurring Assam "
    "floods, and numerous Manipur and Meghalaya landslide events underscore the urgency of this problem."
)

add_para(
    "Currently, monitoring of vulnerable zones in the NER is predominantly reactive and dependent on "
    "manual reporting by local authorities and communities. There is limited deployment of real-time "
    "predictive systems capable of identifying high-risk zones and issuing timely early warnings to "
    "authorities and local populations. This reactive approach results in delayed responses, increased "
    "casualties, and higher economic losses."
)

add_para(
    "With increasing climate variability and the intensification of extreme weather events, there is an "
    "urgent need for an AI-enabled, real-time monitoring and prediction system that can help authorities "
    "take preventive action before disasters occur. LANDSense AI is designed to address exactly this "
    "critical gap."
)

# ══════════════════════════════════════════════════════════════════════════
# 2. PROBLEM STATEMENT
# ══════════════════════════════════════════════════════════════════════════
add_heading("2. Problem Statement", level=1)

add_para(
    "The North Eastern Region frequently faces landslides, flash floods, road blockages, and slope "
    "failures due to heavy rainfall, fragile terrain, and unplanned hill cutting. These incidents often "
    "disrupt connectivity, damage infrastructure, delay emergency response, and isolate remote villages "
    "for days."
)

add_heading("Key Challenges Identified:", level=2)

challenges = [
    "Reactive disaster management: Current monitoring is largely post-event, relying on manual reports rather than predictive analytics.",
    "Limited real-time data integration: Disparate data sources (weather, sensors, satellite, terrain) are not fused into a unified intelligence platform.",
    "Absence of AI-driven early warning: No automated system exists to detect early signs of landslides and issue timely, location-specific warnings.",
    "Poor coordination: Emergency responders lack a centralized command center for real-time situational awareness and resource dispatch.",
    "Infrastructure vulnerability: Critical roads, bridges, and communication networks in hilly terrain remain unmonitored and unprepared.",
    "Data opacity: Existing systems lack explainability — decision-makers cannot understand why an AI system flagged a particular area as high-risk.",
    "No GIS-based 3D terrain visualization: Flat 2D maps fail to capture the complexity of slope, elevation, and terrain dynamics critical for landslide analysis.",
]
for c in challenges:
    add_bullet(c)

# ══════════════════════════════════════════════════════════════════════════
# 3. PROPOSED SOLUTION
# ══════════════════════════════════════════════════════════════════════════
add_heading("3. Proposed Solution — LANDSense AI", level=1)

add_para(
    "LANDSense AI is a comprehensive, AI-powered disaster intelligence platform designed specifically "
    "for landslide risk monitoring and early warning in the North Eastern Region of India. The platform "
    "integrates multi-source satellite data, real-time IoT sensor feeds, terrain analysis, deep learning "
    "models, and agentic AI systems into a unified command center for disaster management authorities."
)

add_heading("Core Capabilities:", level=2)

capabilities = [
    "AI-Powered Landslide Detection: Uses the Landslide4Sense benchmark dataset with ResU-Net/DeepLabV3+ models for pixel-level landslide segmentation from Sentinel-2 multispectral imagery.",
    "3D GIS Risk Mapping: Interactive 3D terrain visualization of all eight NER states with risk overlays, elevation data, slope analysis, and real-time incident markers.",
    "Latitude/Longitude Intelligence Scanner: Coordinate-based terrain, risk, and infrastructure analysis with animated scanning workflow.",
    "Agentic AI Multi-Agent System: Multiple autonomous AI agents (Weather Agent, Sensor Agent, Satellite Agent, Landslide Agent, Risk Agent, Investigation Agent, Impact Agent, Response Agent, Alert Agent) collaborating through a tool registry with authorization and audit.",
    "Real-Time Early Warning: Evidence-based alert system with risk escalation, multi-channel notification (Web, Push, SMS, Email, Emergency Broadcast), and human approval workflow.",
    "Multi-Source Data Fusion: Combines rainfall, soil moisture, slope, DEM, ground movement, satellite imagery, historical landslides, and Landslide4Sense model output into evidence-based risk assessment.",
    "Emergency Response & Evacuation Intelligence: Automated evacuation planning, safe route calculation, resource dispatch, and protocol activation.",
    "Satellite Change Detection: Before/after comparison for detecting ground movement, vegetation loss, and terrain changes.",
    "Role-Based Access Control (RBAC): Six user roles (State Administrator, District Officer, Emergency Responder, PWD Officer, Field Officer, Citizen) with permission inheritance and geographic scope restrictions.",
    "Explainable & Auditable AI: Every AI prediction includes confidence scores, contributing factors, data sources, and complete audit trail.",
]
for c in capabilities:
    add_bullet(c)

# ══════════════════════════════════════════════════════════════════════════
# 4. SYSTEM ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════
add_heading("4. System Architecture", level=1)

add_para(
    "LANDSense AI follows a layered, microservice-oriented architecture designed for scalability, "
    "security, and real-time performance. The system is organized into the following major layers:"
)

add_heading("4.1 Authentication & Authorization Layer", level=2)
add_para(
    "The platform implements Google OAuth 2.0 Sign-In alongside email/password authentication. "
    "After authentication, the user's identity is verified, role is looked up, permissions are resolved "
    "through the inheritance chain, and geographic scope is applied before granting access to the dashboard."
)
add_para("Permission Inheritance Formula:", bold=True)
add_para(
    "Effective Permission = Role Permissions + Inherited Permissions + Explicit Permissions "
    "− Explicit Denials + Scope Restrictions",
    italic=True
)

add_heading("4.2 Data Platform Layer", level=2)
add_para("The data platform integrates three primary data categories:")
add_bullet("Landslide4Sense Dataset: HDF5 files containing 14-band Sentinel-2 multispectral data, DEM, and slope information from 3,799 image patches worldwide.")
add_bullet("Live Data Sources: Weather APIs (rainfall, temperature, humidity), IoT sensor network (seismic, rain gauge, soil moisture, camera, GPS), and satellite data feeds.")
add_bullet("GIS Data: Terrain elevation models, road networks, administrative boundaries, village locations, hospital/evacuation center locations.")

add_heading("4.3 Data Quality & Fusion Engine", level=2)
add_para(
    "Every data source undergoes quality validation (freshness, completeness, accuracy status) before "
    "entering the fusion engine. The Data Fusion Engine combines all available evidence to produce "
    "evidence-based risk assessments with confidence scores that reflect data availability."
)

add_heading("4.4 Agentic AI Orchestrator", level=2)
add_para(
    "The AI system is implemented as a multi-agent architecture with specialized agents collaborating "
    "through a secure tool registry. Agents cannot directly access databases or external systems — all "
    "tool calls pass through authentication, role verification, geographic scope checking, and audit logging."
)

add_heading("4.5 Presentation Layer", level=2)
add_para(
    "The frontend is a React-based single-page application featuring a 3D terrain map (Three.js/React Three Fiber), "
    "interactive dashboards, real-time WebSocket sensor feeds, and responsive design supporting both "
    "desktop command-center and mobile field-officer interfaces."
)

# ══════════════════════════════════════════════════════════════════════════
# 5. LANDSLIDE4SENSE DATASET
# ══════════════════════════════════════════════════════════════════════════
add_heading("5. Landslide4Sense Dataset", level=1)

add_heading("5.1 Dataset Overview", level=2)
add_para(
    "The Landslide4Sense dataset is a specialized multi-source satellite remote sensing benchmark "
    "dataset released by the Institute for Advanced Research in AI (IARAI) in 2022. It was created "
    "to advance research in automatic landslide detection using deep learning."
)

add_table_with_header(
    ["Property", "Details"],
    [
        ["Full Name", "Landslide4Sense: Reference Benchmark Data and Deep Learning Models for Landslide Detection"],
        ["Source", "IARAI (Institute for Advanced Research in AI)"],
        ["Kaggle URL", "https://www.kaggle.com/datasets/tekbahadurkshetri/landslide4sense"],
        ["Total Patches", "3,799 image patches (128×128 pixels each)"],
        ["Data Split", "TrainData / ValidData / TestData"],
        ["File Format", "HDF5 (.h5) — Hierarchical Data Format"],
        ["Spectral Bands", "14 bands (12 Sentinel-2 multispectral + DEM + Slope)"],
        ["Spatial Resolution", "10 meters (Sentinel-2 MSI)"],
        ["Temporal Coverage", "2015–2021"],
        ["Geographic Scope", "Global landslide-affected areas"],
        ["Ground Truth", "Binary landslide/no-landslide masks"],
        ["Annotation", "Pixel-level binary segmentation masks"],
    ]
)

add_heading("5.2 Band Composition", level=2)
add_para("Each HDF5 file contains 14 bands of information:")

add_table_with_header(
    ["Band #", "Name", "Source", "Wavelength / Info", "Resolution"],
    [
        ["B1", "Coastal Aerosol", "Sentinel-2", "443 nm", "60 m"],
        ["B2", "Blue", "Sentinel-2", "490 nm", "10 m"],
        ["B3", "Green", "Sentinel-2", "560 nm", "10 m"],
        ["B4", "Red", "Sentinel-2", "665 nm", "10 m"],
        ["B5", "Vegetation Red Edge", "Sentinel-2", "705 nm", "20 m"],
        ["B6", "Vegetation Red Edge", "Sentinel-2", "740 nm", "20 m"],
        ["B7", "Vegetation Red Edge", "Sentinel-2", "783 nm", "20 m"],
        ["B8", "NIR", "Sentinel-2", "842 nm", "10 m"],
        ["B8A", "Narrow NIR", "Sentinel-2", "865 nm", "20 m"],
        ["B9", "Water Vapour", "Sentinel-2", "945 nm", "60 m"],
        ["B10", "SWIR Cirrus", "Sentinel-2", "1375 nm", "60 m"],
        ["B11", "SWIR", "Sentinel-2", "1610 nm", "20 m"],
        ["B12", "SWIR", "Sentinel-2", "2190 nm", "20 m"],
        ["B13", "DEM", "ALOS PALSAR", "Elevation (m)", "12.5 m"],
        ["B14", "Slope", "Derived from DEM", "Slope angle (°)", "12.5 m"],
    ]
)

add_heading("5.3 Dataset Integration in LANDSense AI", level=2)
add_para(
    "LANDSense AI directly reads HDF5 files from the configured Landslide4Sense folder using h5py. "
    "The platform's Landslide4Sense Intelligence page provides a sample viewer that allows users to "
    "browse actual dataset samples, view individual bands, inspect ground truth masks, and run AI "
    "inference on selected samples."
)
add_para("File Structure:", bold=True)
add_para(
    "Landslide4Sense/\n"
    "├── TrainData/\n"
    "│   ├── img/    (image_*.h5 files)\n"
    "│   └── mask/   (corresponding ground truth masks)\n"
    "├── ValidData/\n"
    "│   ├── img/\n"
    "│   └── mask/\n"
    "└── TestData/\n"
    "    └── img/",
    italic=True
)

# ══════════════════════════════════════════════════════════════════════════
# 6. AI/ML MODEL PIPELINE
# ══════════════════════════════════════════════════════════════════════════
add_heading("6. AI/ML Model Pipeline", level=1)

add_heading("6.1 Landslide4Sense Processing Pipeline", level=2)
add_para("The complete inference pipeline for landslide detection:")
pipeline_steps = [
    "HDF5 File Reading: Load 14-band multispectral data from .h5 files using h5py.",
    "Data Validation: Verify band integrity, check for missing/corrupted data, validate spatial dimensions.",
    "Preprocessing: Normalize spectral bands, apply band-specific scaling, handle nodata values.",
    "ML Model Inference: Feed preprocessed data through ResU-Net or DeepLabV3+ segmentation model.",
    "Pixel-Level Segmentation: Generate binary landslide/no-landslide mask at pixel level.",
    "Landslide Mask Generation: Apply thresholding and morphological operations to clean predictions.",
    "Confidence Map: Produce per-pixel confidence scores for model predictions.",
    "Risk Analysis: Combine prediction with terrain features (slope, DEM) for area-level risk assessment.",
]
for i, step in enumerate(pipeline_steps, 1):
    add_numbered(f"{step}")

add_heading("6.2 Model Architecture", level=2)
add_para(
    "LANDSense AI supports multiple deep learning architectures for landslide segmentation. "
    "The primary models are:"
)
add_bullet("ResU-Net: Residual-enhanced U-Net with skip connections for improved gradient flow in deep segmentation networks.")
add_bullet("DeepLabV3+: Atrous spatial pyramid pooling (ASPP) combined with encoder-decoder structure for multi-scale context capture.")
add_bullet("U-Net: Classic encoder-decoder architecture with symmetric skip connections — well-established for biomedical and geospatial segmentation.")

add_heading("6.3 Model Performance Metrics", level=2)
add_para("The platform tracks actual model performance metrics:")
add_table_with_header(
    ["Metric", "Description", "Type"],
    [
        ["IoU (Intersection over Union)", "Overlap between predicted and ground truth landslide areas", "Segmentation"],
        ["Dice Coefficient", "Harmonic mean of precision and recall for segmentation", "Segmentation"],
        ["Precision", "Proportion of predicted landslide pixels that are actually landslides", "Classification"],
        ["Recall", "Proportion of actual landslide pixels correctly identified", "Classification"],
        ["F1 Score", "Harmonic mean of precision and recall", "Classification"],
        ["Pixel Accuracy", "Overall pixel-level classification accuracy", "Classification"],
        ["Confusion Matrix", "True/False Positive/Negative breakdown", "Evaluation"],
        ["Validation Loss", "Cross-entropy loss on held-out validation set", "Training"],
    ]
)
add_para(
    "Note: All displayed metrics are derived from actual model evaluation runs on the Landslide4Sense "
    "validation/test splits. No metrics are fabricated or estimated.",
    italic=True
)

# ══════════════════════════════════════════════════════════════════════════
# 7. PLATFORM FEATURES & DASHBOARD
# ══════════════════════════════════════════════════════════════════════════
add_heading("7. Platform Features & Dashboard", level=1)

add_para(
    "LANDSense AI provides a professional, mission-critical command center interface designed for "
    "government disaster management authorities. The platform features a dark-mode command-center "
    "aesthetic with real-time data visualization."
)

add_heading("7.1 Command Center Dashboard", level=2)
add_para(
    "The main dashboard (accessible at /dashboard) serves as the primary operational interface, "
    "providing an at-a-glance view of all critical metrics and system status."
)

add_para("Screenshot Reference:", bold=True)
add_para(
    "The dashboard can be viewed live at: http://localhost:5173/dashboard",
    italic=True
)

add_para("Dashboard Layout:", bold=True)
add_bullet("Header Bar: Platform name (NEXUS-LAND / LANDSense AI), system status indicator, active incident count, sensor count, notification bell, UTC clock, and user profile with role badge.")
add_bullet("Left Sidebar: Navigation menu with icons for Dashboard, 3D Map, Scanner, AI Agents, Sensors, Satellite, Incidents, Alerts, Emergency, Analytics, Reports, Users, Audit, and Settings.")
add_bullet("Center Panel: 3D terrain map with incident markers, live sensor overlays, and critical alert banners.")
add_bullet("Right Panel: Active incidents list (with severity indicators and risk scores), active alerts, quick action links, and AI engine status.")

add_heading("7.2 KPI Summary Cards", level=2)
add_para("Four key performance indicator cards are displayed at the top of the dashboard:")
add_table_with_header(
    ["KPI Card", "Value Source", "Example Display"],
    [
        ["ACTIVE INCIDENTS", "Incident database (count of ACTIVE status)", "8"],
        ["CRITICAL ZONES", "Incidents with severity=CRITICAL", "1"],
        ["ACTIVE ALERTS", "Alerts with resolved=false", "8"],
        ["SENSORS ONLINE", "Sensor network status", "7/12"],
    ]
)

add_heading("7.3 Active Incidents Panel", level=2)
add_para(
    "The right panel displays active incidents with color-coded severity diamonds (Red=Critical, "
    "Orange=High, Amber=Medium, Green=Low), incident title, type, and risk score. Each incident "
    "links to a detailed view."
)

add_heading("7.4 Active Alerts Panel", level=2)
add_para(
    "Real-time alerts with severity color-coding, source attribution, and timestamp. Alert levels "
    "follow India's four-tier color coding system: RED (critical), ORANGE (high), AMBER (medium), "
    "GREEN (low)."
)

add_heading("7.5 AI Engine Status", level=2)
add_para("The dashboard displays live AI model status with accuracy metrics:")
add_table_with_header(
    ["Model", "Type", "Status"],
    [
        ["LandslideNet v3.2", "Landslide Prediction", "ACTIVE"],
        ["FloodCast Ensemble", "Flood Forecast", "ACTIVE"],
        ["SeismicAlert Transformer", "Seismic Event Alert", "ACTIVE"],
    ]
)

add_heading("7.6 Other Platform Pages", level=2)
add_table_with_header(
    ["Page", "Route", "Description"],
    [
        ["Alert Center", "/alerts", "Triage, acknowledge, and resolve hazard alerts with filtering by severity level."],
        ["Incidents", "/incidents", "Full incident management with creation, status updates, and timeline tracking."],
        ["Risk Intelligence", "/risk", "AI-generated zone-level risk scores with geographic coordinates and severity badges."],
        ["AI Copilot", "/ai-copilot", "Conversational AI assistant with agent status panel and suggested queries."],
        ["Model Operations", "/models", "AI model management — view accuracy, F1 score, run inference on demand."],
        ["Data Sources", "/data-sources", "IoT sensor network viewer with real-time readings and 24-hour historical charts."],
        ["Response Center", "/response", "Response protocols (ALPHA-7, BRAVO-3, CHARLIE-1) and resource dispatch."],
        ["Forecasts & Analytics", "/forecasts", "Predictive analytics with probability trends for landslide, flood, and wildfire."],
        ["System Health", "/system", "Platform infrastructure monitoring — service status, uptime, latency, CPU/memory."],
        ["Audit Log", "/audit", "Immutable audit trail of all user and system actions with timestamps."],
        ["Admin", "/admin", "User management, role assignment, and platform configuration."],
    ]
)

# ══════════════════════════════════════════════════════════════════════════
# 8. 3D GIS RISK MAPPING
# ══════════════════════════════════════════════════════════════════════════
add_heading("8. 3D GIS Risk Mapping", level=1)

add_para(
    "The centerpiece of LANDSense AI is its interactive 3D terrain visualization, implemented using "
    "Three.js and React Three Fiber. The 3D map provides a realistic terrain mesh with procedural "
    "height generation simulating the complex topography of the NER region."
)

add_heading("8.1 3D Terrain Features:", level=2)
add_bullet("Procedural terrain generation with multi-octave noise simulating mountains, valleys, and slopes.")
add_bullet("Custom GLSL shaders for terrain coloring (elevation-based gradient), animated scan lines, and contour visualization.")
add_bullet("Interactive controls: Orbit (rotate), Pan, Zoom, Reset View, and auto-rotation.")
add_bullet("Incident markers displayed as rotating diamond shapes with color-coded severity and animated pulse rings.")
add_bullet("Vertical beams connecting markers to terrain for spatial context.")
add_bullet("Star field background and atmospheric fog for visual depth.")
add_bullet("HUD overlays showing terrain intelligence info and severity legend.")

add_heading("8.2 GIS Layer Control:", level=2)
add_para("Supported visualization layers include:")
layers = ["Risk Zones", "Landslide Detections", "Terrain", "Elevation", "Slope", "DEM",
          "Rainfall", "IoT Sensors", "Roads", "Bridges", "Villages", "Hospitals",
          "Schools", "Evacuation Centers", "Satellite Imagery", "Administrative Boundaries"]
for layer in layers:
    add_bullet(layer)

add_heading("8.3 Risk Visualization:", level=2)
add_para("Four severity levels with distinct color coding:")
add_table_with_header(
    ["Level", "Color", "Meaning"],
    [
        ["CRITICAL", "Red (#ff3b5c)", "Immediate threat — active landslide or imminent failure"],
        ["HIGH", "Orange (#ff6b35)", "Significant risk — elevated monitoring required"],
        ["MEDIUM", "Amber (#ffb020)", "Moderate risk — watch and prepare"],
        ["LOW / NOMINAL", "Green (#22c55e)", "Baseline — normal monitoring"],
    ]
)

# ══════════════════════════════════════════════════════════════════════════
# 9. LOCATION INTELLIGENCE SCANNER
# ══════════════════════════════════════════════════════════════════════════
add_heading("9. Location Intelligence Scanner", level=1)

add_para(
    "The Location Intelligence Scanner is a dedicated tool for analyzing any coordinate in the NER region. "
    "Users can enter latitude/longitude values, use GPS positioning, or select a point on the 3D map."
)

add_heading("9.1 Scan Workflow:", level=2)
scan_steps = [
    "Coordinate Input: User enters latitude and longitude (or uses GPS/map selection).",
    "Coordinate Validation: System verifies coordinates fall within the NER region.",
    "GIS Lookup: Retrieves administrative boundaries (state, district, village).",
    "Terrain Lookup: Fetches elevation data from DEM and calculates slope angle.",
    "Nearest Infrastructure Search: Identifies nearest roads, bridges, hospitals, schools.",
    "Sensor Search: Finds nearest IoT sensors within a configurable radius.",
    "Rainfall Lookup: Retrieves current and recent rainfall data for the location.",
    "Historical Landslide Search: Checks historical landslide database for the area.",
    "Landslide4Sense / AI Analysis: Runs ML model inference on the satellite tile covering the location.",
    "Risk Calculation: Combines all evidence sources into a composite risk score.",
    "Location Intelligence Report: Generates a comprehensive report with all findings.",
]
for step in scan_steps:
    add_numbered(step)

add_heading("9.2 Output Display:", level=2)
add_para("After scanning, the system displays:")
scan_outputs = [
    "Coordinates (Latitude, Longitude)",
    "Elevation (meters above sea level)",
    "Slope angle (degrees)",
    "Terrain classification",
    "Nearest village and distance",
    "District and State",
    "Nearest road and distance",
    "Nearest sensor and reading",
    "Landslide risk level (LOW / MODERATE / HIGH / CRITICAL)",
    "AI confidence score",
]
for item in scan_outputs:
    add_bullet(item)

# ══════════════════════════════════════════════════════════════════════════
# 10. AGENTIC AI COMMAND CENTER
# ══════════════════════════════════════════════════════════════════════════
add_heading("10. Agentic AI Command Center", level=1)

add_para(
    "LANDSense AI implements a multi-agent AI system where specialized agents collaborate to "
    "observe, analyze, reason, plan, recommend, and execute authorized actions. This is not a "
    "simple chatbot — it is a full agentic AI orchestrator with tool access, authorization checks, "
    "and human approval workflows."
)

add_heading("10.1 Agent Pipeline:", level=2)
agent_pipeline = [
    "OBSERVE → Collect data from sensors, satellite, weather, and model outputs.",
    "ANALYZE → Process and correlate multi-source data streams.",
    "REASON → Apply domain knowledge and pattern recognition.",
    "PLAN → Formulate response strategies and alert recommendations.",
    "RECOMMEND → Present actionable recommendations to human operators.",
    "REQUEST APPROVAL → Route consequential actions through authorization.",
    "EXECUTE AUTHORIZED ACTION → Implement approved actions via tool registry.",
    "VERIFY → Confirm action outcomes and update system state.",
    "LEARN → Store results in agent memory for future reference.",
]
for step in agent_pipeline:
    add_numbered(step)

add_heading("10.2 Specialized AI Agents:", level=2)
add_table_with_header(
    ["Agent", "Role", "Data Sources"],
    [
        ["Weather Agent", "Monitors rainfall, temperature, humidity, and weather forecasts", "Weather API, rain gauges"],
        ["Sensor Agent", "Processes IoT sensor signals for anomalies", "Seismic, soil moisture, tilt, vibration sensors"],
        ["Satellite Agent", "Analyzes satellite imagery for terrain changes", "Sentinel-2, SAR data"],
        ["Landslide Detection Agent", "Runs Landslide4Sense model for landslide segmentation", "HDF5 dataset, ML model"],
        ["Risk Prediction Agent", "Combines all evidence for composite risk scoring", "All fused data sources"],
        ["Investigation Agent", "Investigates suspicious events and anomalies", "Historical data, sensor logs"],
        ["Impact Agent", "Identifies affected population, infrastructure, and area", "GIS data, census, infrastructure maps"],
        ["Response Agent", "Creates response plans and resource allocation", "Protocol database, resource registry"],
        ["Alert Agent", "Generates and distributes warnings across channels", "Notification services, EAS"],
        ["Verification Agent", "Validates actions and confirms outcomes", "System logs, field reports"],
    ]
)

add_heading("10.3 Tool Registry & Security:", level=2)
add_para(
    "AI agents never directly access databases or external systems. All operations go through a "
    "secure tool registry that enforces:"
)
add_bullet("Authentication verification (user identity)")
add_bullet("Role-based access control (permission level)")
add_bullet("Inherited permission resolution")
add_bullet("Geographic scope restriction")
add_bullet("Resource scope restriction")
add_bullet("Risk-level-based approval requirements")
add_bullet("Human approval for consequential actions")
add_bullet("Post-execution verification")
add_bullet("Complete audit logging")

# ══════════════════════════════════════════════════════════════════════════
# 11. EARLY WARNING & ALERT SYSTEM
# ══════════════════════════════════════════════════════════════════════════
add_heading("11. Early Warning & Alert System", level=1)

add_heading("11.1 Alert Workflow:", level=2)
alert_workflow = [
    "AI Detection → Model identifies potential landslide or hazard event.",
    "Risk Assessment → Risk Agent evaluates severity and confidence.",
    "Investigation Agent → Reviews historical context and sensor data.",
    "Impact Assessment → Estimates affected population and infrastructure.",
    "AI Recommendation → Suggests alert level and recommended actions.",
    "Human Approval → Authorized operator reviews and approves alert.",
    "Notification → Alert broadcast via Web, Push, SMS, Email, Emergency Broadcast.",
    "Verification → Post-alert verification of delivery and acknowledgment.",
]
for step in alert_workflow:
    add_numbered(step)

add_heading("11.2 Alert Severity Levels:", level=2)
add_table_with_header(
    ["Level", "Color", "Description", "Approval Required"],
    [
        ["RED", "Red", "Immediate danger — life-threatening situation", "Predefined emergency policy or human approval"],
        ["ORANGE", "Orange", "High risk — significant danger to population", "Human approval required"],
        ["AMBER", "Amber", "Moderate risk — elevated threat", "Human approval required"],
        ["GREEN", "Green", "Low risk — informational", "Auto-approved"],
    ]
)

add_heading("11.3 Alert Information Displayed:", level=2)
alert_info = [
    "Alert ID and Timestamp",
    "Location (coordinates, district, state)",
    "Risk level and confidence score",
    "Affected area and potential population at risk",
    "Recommended actions",
    "Issuing authority and approval status",
    "Expiry time and verification status",
]
for item in alert_info:
    add_bullet(item)

# ══════════════════════════════════════════════════════════════════════════
# 12. EMERGENCY RESPONSE & EVACUATION
# ══════════════════════════════════════════════════════════════════════════
add_heading("12. Emergency Response & Evacuation", level=1)

add_heading("12.1 Response Protocols:", level=2)
add_para("LANDSense AI includes pre-configured response protocols:")
add_table_with_header(
    ["Protocol Code", "Name", "Key Steps"],
    [
        ["ALPHA-7", "Critical Landslide Response",
         "Activate district EOC → Deploy recon team → Pre-position SAR → Issue evacuation advisory → Coordinate NDRF → Establish triage"],
        ["BRAVO-3", "Flood Inundation Response",
         "Activate river monitoring → Pre-position boats → Coordinate dam release → Issue flood watch → Activate shelters"],
        ["CHARLIE-1", "Earthquake Rapid Assessment",
         "Enhanced seismic monitoring → Structural assessment → NDRF urban SAR → Medical surge → Public advisory"],
    ]
)

add_heading("12.2 Evacuation Planning:", level=2)
add_para("The evacuation planner follows this workflow:")
evac_steps = [
    "Identify danger zone (from AI detection or manual input).",
    "Calculate affected population using GIS and census data.",
    "Identify safe zones and evacuation centers.",
    "Analyze road network and check for blockages.",
    "Calculate alternative routes if primary roads are blocked.",
    "Determine nearest evacuation center with capacity.",
    "Generate optimized evacuation plan with route visualization on 3D map.",
]
for step in evac_steps:
    add_numbered(step)

add_heading("12.3 Resource Tracking:", level=2)
add_para("The Response Center tracks deployed resources including:")
add_bullet("NDRF (National Disaster Response Force) battalions")
add_bullet("Air rescue squadrons (helicopters)")
add_bullet("Medical response units")
add_bullet("Engineering corps for infrastructure repair")
add_bullet("Each resource tracked by name, type, location, availability status, and personnel count")

# ══════════════════════════════════════════════════════════════════════════
# 13. IoT SENSOR MONITORING
# ══════════════════════════════════════════════════════════════════════════
add_heading("13. IoT Sensor Monitoring", level=1)

add_para(
    "LANDSense AI integrates with IoT sensor networks deployed across the NER region. "
    "The Data Sources page provides a comprehensive sensor management interface."
)

add_heading("13.1 Sensor Types:", level=2)
add_table_with_header(
    ["Sensor Type", "Icon", "Measures", "Unit"],
    [
        ["Seismic", "〰", "Ground vibration / acceleration", "gal"],
        ["Rain Gauge", "💧", "Rainfall intensity", "mm/day"],
        ["Soil Moisture", "◈", "Soil water content", "%"],
        ["Camera", "◉", "Visual monitoring", "fps"],
        ["GPS", "◎", "Ground displacement", "mm"],
    ]
)

add_heading("13.2 Real-Time Features:", level=2)
add_bullet("WebSocket-based live sensor feed with real-time value updates on the dashboard.")
add_bullet("24-hour historical reading charts using Recharts (LineChart with responsive container).")
add_bullet("Sensor status tracking: ONLINE, OFFLINE, DEGRADED, MAINTENANCE.")
add_bullet("Current reading display with unit labels and last-seen timestamp.")
add_bullet("Sensor detail panel with coordinate display and type classification.")

# ══════════════════════════════════════════════════════════════════════════
# 14. SATELLITE INTELLIGENCE
# ══════════════════════════════════════════════════════════════════════════
add_heading("14. Satellite Intelligence", level=1)

add_heading("14.1 Satellite Change Detection:", level=2)
add_para(
    "The platform supports before/after satellite imagery comparison for detecting terrain changes "
    "associated with landslide activity:"
)
add_bullet("Ground movement detection")
add_bullet("Vegetation loss identification")
add_bullet("Soil exposure analysis")
add_bullet("Terrain deformation measurement")
add_bullet("Landslide scar identification")

add_heading("14.2 Data Sources:", level=2)
add_bullet("Sentinel-2 MSI (Multi-Spectral Instrument): 10m resolution optical imagery.")
add_bullet("Sentinel-1 SAR (Synthetic Aperture Radar): All-weather terrain deformation monitoring.")
add_bullet("ALOS PALSAR: DEM and slope data at 12.5m resolution.")
add_bullet("Landslide4Sense Dataset: Pre-processed multispectral tiles for ML inference.")

# ══════════════════════════════════════════════════════════════════════════
# 15. ROLE-BASED ACCESS CONTROL
# ══════════════════════════════════════════════════════════════════════════
add_heading("15. Role-Based Access Control (RBAC)", level=1)

add_heading("15.1 User Roles:", level=2)
add_table_with_header(
    ["Role", "Access Level", "Key Permissions"],
    [
        ["State Administrator", "Full NER access", "All features — manage users, roles, permissions, AI config, alerts, sensors, reports, audit logs"],
        ["District Officer", "District-level", "Monitor district risk, investigate incidents, manage alerts/evacuation, assign field teams"],
        ["Emergency Responder", "Event-based", "View emergencies, accept assignments, view evacuation routes, update field status"],
        ["PWD Officer", "Infrastructure", "Monitor roads/bridges/infrastructure, report damage, restrict roads"],
        ["Field Officer", "Assigned region", "Scan locations, submit incident reports, upload media, monitor assigned sensors"],
        ["Citizen", "Public view", "View public risk map, warnings, weather, find evacuation centers, submit incidents"],
    ]
)

add_heading("15.2 Permission Levels:", level=2)
perms = ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "ASSIGN", "EXPORT", "BROADCAST", "MANAGE", "EXECUTE"]
for p in perms:
    add_bullet(p)

add_heading("15.3 Permission Inheritance:", level=2)
add_para(
    "Effective Permission = Role Permissions + Inherited Permissions + Explicit Permissions "
    "− Explicit Denials + Scope Restrictions"
)
add_para(
    "The system implements least privilege and default deny — users receive only the minimum "
    "permissions necessary for their role and geographic scope."
)

add_heading("15.4 Access Control (403):", level=2)
add_para(
    "When a user attempts to access a restricted resource, the platform displays a professional "
    "access-restricted page showing the user's current role, the required permission, and a return "
    "navigation option. No restricted information is exposed."
)

# ══════════════════════════════════════════════════════════════════════════
# 16. AUDIT TRAIL & DATA PROVENANCE
# ══════════════════════════════════════════════════════════════════════════
add_heading("16. Audit Trail & Data Provenance", level=1)

add_heading("16.1 Audit Log:", level=2)
add_para("Every significant action in the platform is recorded in an immutable-style audit log:")
add_table_with_header(
    ["Field", "Description"],
    [
        ["Timestamp", "UTC timestamp of the action"],
        ["User", "User who performed the action"],
        ["Role", "Role of the user at time of action"],
        ["Action", "Description of the action performed"],
        ["Resource", "Target resource (incident, alert, sensor, etc.)"],
        ["Resource ID", "Unique identifier of the target"],
        ["Detail", "Additional context or description"],
        ["IP Address", "Source IP or session reference"],
    ]
)

add_heading("16.2 Data Provenance:", level=2)
add_para(
    "Every major visualization includes data provenance information showing the source of data, "
    "last update timestamp, data quality metrics, model version used, and confidence scores. "
    "This ensures full transparency and traceability of all displayed information."
)

# ══════════════════════════════════════════════════════════════════════════
# 17. TECHNOLOGY STACK
# ══════════════════════════════════════════════════════════════════════════
add_heading("17. Technology Stack", level=1)

add_table_with_header(
    ["Layer", "Technology", "Purpose"],
    [
        ["Frontend", "React 18 + Vite", "Modern SPA with fast builds and HMR"],
        ["3D Visualization", "Three.js + React Three Fiber + Drei", "Interactive 3D terrain map with shaders"],
        ["Charts", "Recharts", "Responsive data visualizations"],
        ["State Management", "Zustand", "Lightweight React state management"],
        ["Routing", "React Router v6", "Client-side routing with protected routes"],
        ["Backend", "FastAPI (Python)", "High-performance async API server"],
        ["Database", "SQLite (dev) / PostgreSQL (prod)", "Relational data storage"],
        ["ORM", "SQLAlchemy", "Python SQL toolkit and ORM"],
        ["Authentication", "JWT + OAuth 2.0", "Secure token-based authentication"],
        ["AI/ML", "PyTorch / TensorFlow", "Deep learning model training and inference"],
        ["Geospatial", "h5py + GDAL + Rasterio", "HDF5 reading and geospatial processing"],
        ["Real-Time", "WebSockets", "Live sensor feed and updates"],
        ["Dataset", "Landslide4Sense (IARAI)", "3,799 multispectral patches with ground truth"],
    ]
)

# ══════════════════════════════════════════════════════════════════════════
# 18. WHAT'S NEW — NOVEL INTEGRATIONS
# ══════════════════════════════════════════════════════════════════════════
add_heading("18. What's New — Novel Integrations", level=1)

add_para(
    "LANDSense AI introduces several innovations beyond existing disaster management platforms:"
)

novelties = [
    ("Real Landslide4Sense Integration", "Unlike most platforms that use synthetic or mock data, LANDSense AI directly reads and processes actual HDF5 files from the Landslide4Sense benchmark dataset, providing pixel-level landslide segmentation from real Sentinel-2 multispectral imagery."),
    ("Agentic AI Architecture", "The multi-agent system with specialized agents (Weather, Sensor, Satellite, Landslide Detection, Risk, Investigation, Impact, Response, Alert, Verification) collaborating through a secure tool registry with full authorization and audit is a novel approach to disaster intelligence."),
    ("3D Terrain Visualization with GLSL Shaders", "Custom shader-based terrain rendering with animated scan lines, contour visualization, elevation-based coloring, and incident markers — going far beyond standard 2D map dashboards."),
    ("Coordinate-Based Intelligence Scanner", "The ability to enter any latitude/longitude in the NER region and receive a comprehensive intelligence report combining terrain data, infrastructure proximity, sensor readings, historical events, and AI risk assessment is a unique feature."),
    ("Explainable AI with Full Audit Trail", "Every AI prediction includes confidence scores, contributing factors, data sources, and a complete audit log — ensuring decisions are transparent and accountable."),
    ("Human-in-the-Loop Approval Workflow", "High-impact actions (emergency broadcasts, evacuation orders, road closures) require explicit human approval, with the AI system providing recommendations but never bypassing authorized decision-makers."),
    ("Multi-Source Data Fusion", "Integration of weather, IoT sensors, terrain (DEM/slope), satellite imagery, historical data, and Landslide4Sense model output into a unified risk assessment framework."),
    ("Offline Field Mode", "Field officers can capture GPS, photos, video, and incident reports offline, with automatic synchronization when connectivity returns — critical for remote NER areas with limited network coverage."),
    ("Role-Based Geographic Scope", "Beyond standard RBAC, the platform implements geographic scope restrictions so that district officers can only see data relevant to their assigned area."),
    ("India's Four-Tier Alert Color Coding", "Alerts follow India's established RED/ORANGE/AMBER/GREEN color coding system familiar to disaster management authorities."),
]

for title, desc in novelties:
    add_para(f"{title}:", bold=True)
    add_para(desc)

# ══════════════════════════════════════════════════════════════════════════
# 19. CONCLUSION
# ══════════════════════════════════════════════════════════════════════════
add_heading("19. Conclusion", level=1)

add_para(
    "LANDSense AI represents a comprehensive, technically grounded approach to addressing the critical "
    "challenge of landslide risk monitoring and early warning in India's North Eastern Region. By "
    "integrating real satellite data (Landslide4Sense dataset with Sentinel-2 multispectral imagery), "
    "deep learning segmentation models (ResU-Net/DeepLabV3+), multi-source data fusion, IoT sensor "
    "networks, and an innovative agentic AI architecture, the platform provides disaster management "
    "authorities with unprecedented situational awareness and decision-support capabilities."
)

add_para(
    "Key technical contributions of LANDSense AI include:"
)
add_bullet("Direct integration with the Landslide4Sense benchmark dataset for pixel-level landslide detection using real multispectral data, not synthetic approximations.")
add_bullet("A novel multi-agent AI system where specialized agents collaborate through a secure tool registry with full authorization, scope checking, and audit — ensuring AI actions are always accountable and within policy boundaries.")
add_bullet("An interactive 3D GIS visualization with custom GLSL shaders that provides terrain-aware risk visualization beyond conventional 2D map dashboards.")
add_bullet("A coordinate-based intelligence scanner that provides comprehensive location analysis by fusing terrain, infrastructure, sensor, and AI data for any point in the NER region.")
add_bullet("A robust RBAC system with permission inheritance, geographic scope restrictions, and a human-in-the-loop approval workflow for consequential actions.")
add_bullet("Full data provenance and audit trail for every displayed metric, prediction, and system action — essential for government-grade accountability.")

add_para(
    "The platform addresses the complete disaster management lifecycle — from continuous monitoring "
    "and AI-driven early warning, through investigation and impact assessment, to emergency response "
    "coordination and post-event audit. By maintaining strict data integrity (displaying 'DATA UNAVAILABLE' "
    "rather than fabricating data when sources are offline), LANDSense AI ensures that decision-makers "
    "can trust the information presented."
)

add_para(
    "With its professional command-center interface, real-time data architecture, and explainable AI "
    "approach, LANDSense AI is designed to serve as a practical, deployable solution for India's "
    "National Disaster Management Authority and state-level disaster response forces in the NER."
)

# ══════════════════════════════════════════════════════════════════════════
# 20. FUTURE SCOPE
# ══════════════════════════════════════════════════════════════════════════
add_heading("20. Future Scope", level=1)

future_items = [
    ("Integration with ISRO Satellite Feeds", "Direct connection to ISRO's CARTOSAT and RISAT satellite data streams for higher-resolution, India-specific imagery with more frequent revisit times."),
    ("InSAR Deformation Monitoring", "Integration of Interferometric Synthetic Aperture Radar (InSAR) data for sub-centimeter ground deformation detection — enabling prediction of landslides before they occur."),
    ("Digital Twin of NER Terrain", "A complete digital twin of the NER region combining real-time sensor data, weather forecasts, and ML predictions into a living, updating 3D model."),
    ("Mobile App Deployment", "Native Android/iOS applications for field officers with offline capability, push notifications, photo/video evidence capture, and GPS tracking."),
    ("Drone Integration", "Autonomous drone deployment for rapid damage assessment after landslide events, with AI-powered image analysis for automated severity classification."),
    ("Community Alert System", "Public-facing mobile app and SMS-based alert system for citizens in high-risk areas, with multilingual support for NER regional languages."),
    ("Federated Learning", "Privacy-preserving model training across multiple NER states without centralizing sensitive data, enabling collaborative model improvement."),
    ("Advanced Predictive Models", "Transformer-based architectures (Vision Transformers, Swin Transformers) for improved temporal and spatial landslide prediction."),
    ("Integration with National SDMA Platforms", "API integration with existing National and State Disaster Management Authority platforms for seamless data exchange and coordinated response."),
    ("Climate Change Impact Modeling", "Long-term climate scenario analysis to predict how changing rainfall patterns will affect landslide risk across the NER over the next 10-50 years."),
]

for title, desc in future_items:
    add_para(f"{title}:", bold=True)
    add_para(desc)

# ══════════════════════════════════════════════════════════════════════════
# 21. REFERENCES
# ══════════════════════════════════════════════════════════════════════════
add_heading("21. References", level=1)

add_para(
    "All references below contain clickable hyperlinks. Click on any URL to open the paper or dataset directly in your browser.",
    italic=True, space_after=8
)

# Ensure the Hyperlink character style exists
try:
    hl_style = doc.styles['Hyperlink']
except KeyError:
    hl_style = doc.styles.add_style('Hyperlink', 1)  # 1 = character style
    hl_style.font.color.rgb = RGBColor(0x05, 0x63, 0xC1)
    hl_style.font.underline = True

references_data = [
    (1, "Tek Bahadur Kshetri, 'Landslide4Sense: Reference Benchmark Data and Deep Learning Models for Landslide Detection,' arXiv preprint arXiv:2206.00515",
     "2022", "https://ar5iv.labs.arxiv.org/html/2206.00515"),

    (2, "Kaggle Dataset: 'Landslide4Sense — Multi-sensor Satellite Landslide Detection Dataset'",
     "Kaggle", "https://www.kaggle.com/datasets/tekbahadurkshetri/landslide4sense"),

    (3, "IARAI GitHub: 'Landslide4Sense-2022 — Data description and benchmark'",
     "GitHub", "https://github.com/iarai/Landslide4Sense-2022"),

    (4, "IEEE: 'Predicting Landslides with Machine Learning: A Data-Driven Approach'",
     "IEEE Conference, 2024", "https://ieeexplore.ieee.org/document/10584875/"),

    (5, "IEEE: 'Delimitation of Landslide Areas in Optical Remote Sensing Images Using Deep Learning'",
     "IEEE Access, 2024", "https://ieeexplore.ieee.org/iel8/6287639/10380310/10787013.pdf"),

    (6, "IEEE: 'A Network for Landslide Detection Combining Deformable Attention and CNN'",
     "IEEE Trans. Geoscience and Remote Sensing, 2025", "https://ieeexplore.ieee.org/iel8/4609443/11278119/11247808.pdf"),

    (7, "IEEE: 'A Transfer Learning Approach for Landslide Semantic Segmentation Using SAM'",
     "IEEE J. Selected Topics in Applied Earth Obs., 2025", "https://ieeexplore.ieee.org/iel8/4609443/10766875/10962290.pdf"),

    (8, "IEEE: 'A Multi-Input Channel U-Net Landslide Detection Method Fusing SAR, Optical, and Topographic Data'",
     "IEEE J. Selected Topics in Applied Earth Obs., 2024", "https://ieeexplore.ieee.org/iel7/4609443/10330207/10342846.pdf"),

    (9, "IEEE: 'Landslide Detection for Remote Sensing Images Using a Multilabel CNN'",
     "IEEE J. Selected Topics in Applied Earth Obs., 2024", "https://ieeexplore.ieee.org/iel7/4609443/10330207/10496925.pdf"),

    (10, "IEEE: 'Cross-modal Feature Fusion of Heterogeneous Remote Sensing for Landslide Detection'",
     "IEEE Trans. Geoscience and Remote Sensing, 2026", "https://ieeexplore.ieee.org/iel8/4609443/11278119/11455163.pdf"),

    (11, "Kaushal et al., 'A Semantic Segmentation Framework with UNet-Pyramid for Landslide Detection using Landslide4Sense Data'",
     "PeerJ Computer Science, 2024", "https://pmc.ncbi.nlm.nih.gov/articles/PMC11614895/"),

    (12, "IEEE: 'LSI-YOLOv8: An Improved Rapid and High Accuracy Landslide Detection Method'",
     "IEEE Access, 2024", "https://ieeexplore.ieee.org/iel8/6287639/10380310/10591795.pdf"),

    (13, "IEEE: 'Contrastive Self-Supervised Learning for Globally Distributed Landslide Detection'",
     "IEEE Trans. Geoscience and Remote Sensing, 2024", "https://ieeexplore.ieee.org/iel8/6287639/10380310/10646206.pdf"),

    (14, "Prakash et al., 'Mapping Landslides on EO Data: Performance of Deep Learning Models'",
     "Remote Sensing, 2020 (Cited by 318)", "https://www.research-collection.ethz.ch/bitstreams/02a4457f-7de3-478d-9622-3aa2d3f81484/download"),

    (15, "Li et al., 'A Deep-Learning-Based Algorithm for Landslide Detection Using InSAR Data'",
     "PMC/MDPI, 2024", "https://pmc.ncbi.nlm.nih.gov/articles/PMC11281128/"),
]

for ref_num, title, source, url in references_data:
    add_reference_with_link(ref_num, title, source, url)

# ══════════════════════════════════════════════════════════════════════════
# SAVE
# ══════════════════════════════════════════════════════════════════════════
output_path = "LANDSense_AI_SIH_Documentation.docx"
doc.save(output_path)
print(f"Document saved to: {output_path}")
print(f"File size: {os.path.getsize(output_path) / 1024:.1f} KB")
