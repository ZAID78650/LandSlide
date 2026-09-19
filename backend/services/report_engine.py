"""
Whisper-Large-V3 Report Engine
===============================
Generates dense, professional-grade PDF, DOCX, and JSON disaster intelligence reports.
All sections pull from the rich payload returned by the /intelligence endpoint.
"""

import os, json, math
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
import docx
from docx.shared import Inches, RGBColor, Pt

REPORTS_DIR = "reports_storage"
os.makedirs(REPORTS_DIR, exist_ok=True)

# ── Colours ──────────────────────────────────────────────────────────────────
C_NAVY   = colors.HexColor('#0a1628')
C_BLUE   = colors.HexColor('#1e3a8a')
C_CYAN   = colors.HexColor('#0284c7')
C_GREEN  = colors.HexColor('#15803d')
C_AMBER  = colors.HexColor('#b45309')
C_RED    = colors.HexColor('#b91c1c')
C_LIGHT  = colors.HexColor('#f1f5f9')
C_MID    = colors.HexColor('#e2e8f0')
C_DARK   = colors.HexColor('#334155')
C_WHITE  = colors.white
C_BLACK  = colors.HexColor('#0f172a')

def _level_color(level: str):
    return {"CRITICAL": C_RED, "HIGH": C_AMBER, "MODERATE": C_CYAN, "LOW": C_GREEN, "BASELINE": C_GREEN}.get(level, C_CYAN)

def _level_bg(level: str):
    return {"CRITICAL": colors.HexColor('#fef2f2'), "HIGH": colors.HexColor('#fffbeb'),
            "MODERATE": colors.HexColor('#eff6ff'), "LOW": colors.HexColor('#f0fdf4'),
            "BASELINE": colors.HexColor('#f0fdf4')}.get(level, C_LIGHT)

def generate_report_json(report_data, report_id):
    path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    with open(path, "w") as f:
        json.dump(report_data, f, indent=2, default=str)
    return path

# ── PDF ───────────────────────────────────────────────────────────────────────

def _styles():
    s = getSampleStyleSheet()
    def P(name, **kw):
        return ParagraphStyle(name, parent=s['Normal'], **kw)
    return {
        'title':    P('T', fontName='Helvetica-Bold', fontSize=15, leading=20, textColor=C_NAVY, alignment=1, spaceAfter=2),
        'agency':   P('A', fontName='Helvetica-Bold', fontSize=10, textColor=C_CYAN, alignment=1, spaceAfter=4),
        'subtitle': P('S', fontName='Helvetica',      fontSize=9,  textColor=C_DARK, alignment=1, spaceAfter=14),
        'h1':       P('H1', fontName='Helvetica-Bold', fontSize=11, textColor=C_WHITE, spaceAfter=6, spaceBefore=14,
                       backColor=C_NAVY, borderPadding=(5,8,5,8), leading=16),
        'h2':       P('H2', fontName='Helvetica-Bold', fontSize=10, textColor=C_NAVY, spaceAfter=5, spaceBefore=10,
                       backColor=C_LIGHT, borderPadding=(4,6,4,6)),
        'h3':       P('H3', fontName='Helvetica-Bold', fontSize=9,  textColor=C_BLUE, spaceAfter=4, spaceBefore=8),
        'body':     P('B',  fontName='Helvetica',      fontSize=8.5, leading=13, spaceAfter=6, textColor=C_BLACK),
        'bodyb':    P('BB', fontName='Helvetica-Bold', fontSize=8.5, leading=13, spaceAfter=4, textColor=C_BLACK),
        'bullet':   P('BL', fontName='Helvetica',      fontSize=8.5, leading=12, leftIndent=14, spaceAfter=3, textColor=C_BLACK),
        'small':    P('SM', fontName='Helvetica',      fontSize=7.5, leading=10, textColor=C_DARK, spaceAfter=2),
        'smallb':   P('SMB', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=C_DARK, spaceAfter=2),
        'theader':  P('TH', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=C_WHITE, spaceAfter=2),
        'meta':     P('ME', fontName='Helvetica',      fontSize=8,   textColor=C_DARK, spaceAfter=2),
    }

def _tbl(data, col_widths, row_styles=None):
    """Build a styled table with alternating rows."""
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ('BACKGROUND',  (0,0), (-1,0),   C_NAVY),
        ('TEXTCOLOR',   (0,0), (-1,0),   C_WHITE),
        ('FONTNAME',    (0,0), (-1,0),   'Helvetica-Bold'),
        ('FONTSIZE',    (0,0), (-1,-1),  8),
        ('ALIGN',       (0,0), (-1,-1),  'LEFT'),
        ('VALIGN',      (0,0), (-1,-1),  'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_LIGHT]),
        ('GRID',        (0,0), (-1,-1),  0.5, C_MID),
        ('LEFTPADDING', (0,0), (-1,-1),  4),
        ('RIGHTPADDING',(0,0), (-1,-1),  4),
        ('TOPPADDING',  (0,0), (-1,-1),  4),
        ('BOTTOMPADDING',(0,0),(-1,-1),  4),
    ]
    if row_styles:
        style.extend(row_styles)
    t.setStyle(TableStyle(style))
    return t

def _bar_chart(labels, values, title, width=420, height=130):
    drawing = Drawing(width, height + 30)
    bar_h = min(18, (height - 10) // max(len(values), 1))
    colors_list = [C_RED if v >= 80 else C_AMBER if v >= 65 else C_CYAN if v >= 45 else C_GREEN for v in values]
    for i, (lbl, val, clr) in enumerate(zip(labels, values, colors_list)):
        y = height - (i + 1) * (bar_h + 6)
        bar_w = int((val / 100.0) * (width - 100))
        drawing.add(Rect(80, y, bar_w, bar_h, fillColor=clr, strokeColor=None))
        drawing.add(String(75, y + bar_h * 0.3, lbl[:12], fontName='Helvetica', fontSize=7, textAnchor='end'))
        drawing.add(String(82 + bar_w, y + bar_h * 0.3, str(val), fontName='Helvetica-Bold', fontSize=7))
    drawing.add(String(width // 2, height + 20, title, fontName='Helvetica-Bold', fontSize=9, textAnchor='middle'))
    return drawing

def _wrap(text, style):
    """Wraps text in a Paragraph so it wraps within table cells instead of overflowing."""
    return Paragraph(str(text), style)

def generate_report_pdf(report_data, report_id):
    path = os.path.join(REPORTS_DIR, f"{report_id}.pdf")
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm
    )
    st = _styles()
    E  = []    
    W  = 180*mm  # A4 is 210mm wide - 30mm margins = 180mm usable width

    def HR(c=C_MID): E.append(HRFlowable(width='100%', thickness=0.5, color=c, spaceAfter=6, spaceBefore=4))
    def SP(h=8):    E.append(Spacer(1, h))

    # ── 0. COVER HEADER ────────────────────────────────────────────────────
    loc     = report_data.get('location', {})
    loc_name= report_data.get('location_name') or loc.get('name', 'Unknown Zone')
    ts      = (report_data.get('snapshot_time') or datetime.now().isoformat())[:16].replace('T', ' ')
    cls_typ = report_data.get('classification', 'EXECUTIVE').upper()
    risk_sc = report_data.get('risk_score') or report_data.get('current_risk', {}).get('overall_score', '—')
    risk_lv = report_data.get('risk_level') or report_data.get('current_risk', {}).get('overall_level', '—')
    ai_text = report_data.get('ai_narrative', '')
    pri_thr = report_data.get('primary_threat') or report_data.get('current_risk', {}).get('primary_threat', '—')
    fct_trn = report_data.get('forecast_trend', '—')

    E.append(Paragraph("NATIONAL DISASTER INTELLIGENCE AGENCY", st['agency']))
    E.append(Paragraph("WHISPER-LARGE-V3 GEOTECHNICAL INTELLIGENCE REPORT", st['title']))
    E.append(Paragraph(f"SITUATIONAL ASSESSMENT: {cls_typ}  ·  NDMA / ICS-ALIGNED", st['subtitle']))
    HR(C_NAVY)

    # Meta summary table - Uses smallb (dark) because background is C_LIGHT / C_WHITE
    meta = [
        [_wrap('Report ID:', st['smallb']), _wrap(report_id, st['small']), _wrap('Generated:', st['smallb']), _wrap(ts, st['small'])],
        [_wrap('Target Zone:', st['smallb']), _wrap(loc_name, st['small']), _wrap('Audit Window:', st['smallb']), _wrap(report_data.get('audit_window','Real-Time'), st['small'])],
        [_wrap('Coordinates:', st['smallb']), _wrap(f"Lat {loc.get('lat','—'):.4f}° · Lon {loc.get('lon','—'):.4f}°" if isinstance(loc.get('lat'), float) else '—', st['small']),
                                                          _wrap('Elevation:', st['smallb']), _wrap(f"{loc.get('elevation_m','—')} m", st['small'])],
        [_wrap('Risk Score:', st['smallb']), _wrap(f"{risk_sc} / 100", st['small']), _wrap('Risk Level:', st['smallb']), _wrap(risk_lv, st['smallb'])],
        [_wrap('Primary Threat:', st['smallb']), _wrap(pri_thr, st['small']), _wrap('Trend:', st['smallb']), _wrap(fct_trn, st['small'])],
        [_wrap('State/Country:', st['smallb']), _wrap(f"{loc.get('state','—')}, {loc.get('country','—')}", st['small']),
                                                          _wrap('AI Model:', st['smallb']), _wrap('WHISPER-LARGE-V3', st['small'])],
    ]
    meta_tbl = Table(meta, colWidths=[W*0.18, W*0.32, W*0.18, W*0.32])
    meta_tbl.setStyle(TableStyle([
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [C_LIGHT, C_WHITE]),
        ('GRID', (0,0), (-1,-1), 0.4, C_MID),
        ('TOPPADDING',    (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
    ]))
    E.append(meta_tbl); SP()

    # ── 1. WHISPER AI SYNTHESIS ─────────────────────────────────────────────
    E.append(Paragraph("1. WHISPER-LARGE-V3 INTELLIGENCE SYNTHESIS", st['h1'])); SP(4)
    E.append(Paragraph(
        "The following geotechnical assessment was synthesised in real-time by the Whisper-Large-V3 "
        "deterministic AI pipeline, integrating live IoT telemetry, tectonic plate modelling, "
        "soil mechanics computation, and multi-hazard risk fusion.", st['body']))
    if ai_text:
        ai_block = Table([[_wrap(ai_text, st['body'])]],
                         colWidths=[W], style=TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
            ('BOX', (0,0), (-1,-1), 1.5, C_CYAN),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        E.append(ai_block); SP()

    # ── 2. OVERALL RISK SCORECARD ───────────────────────────────────────────
    E.append(Paragraph("2. OVERALL RISK SCORECARD", st['h1'])); SP(4)
    hazards  = (report_data.get('hazard_matrix') or
                report_data.get('current_risk', {}).get('hazards') or {})
    hz_items = list(hazards.items())

    # Risk Summary row - Uses theader (white text) for dark navy header background
    score_data = [[
        _wrap('Hazard', st['theader']), _wrap('Score', st['theader']), 
        _wrap('Level', st['theader']), _wrap('Prob. %', st['theader']), 
        _wrap('Trigger Mechanism', st['theader']), _wrap('Zone km²', st['theader'])
    ]]
    for haz, dat in hz_items:
        score_data.append([
            _wrap(haz.upper(), st['small']),
            _wrap(str(dat.get('score', '—')), st['small']),
            _wrap(dat.get('level', '—'), st['smallb']),
            _wrap(f"{dat.get('probability_pct', '—')}%", st['small']),
            _wrap(dat.get('trigger', '—'), st['small']),
            _wrap(str(dat.get('evacuation_zone_km2', '—')), st['small']),
        ])
    extra_styles = []
    for ri, (haz, dat) in enumerate(hz_items, start=1):
        c = _level_color(dat.get('level',''))
        extra_styles += [('TEXTCOLOR',(2,ri),(2,ri), c)]
    E.append(_tbl(score_data, [W*0.14, W*0.09, W*0.14, W*0.10, W*0.43, W*0.10], extra_styles)); SP(4)

    # Bar chart
    if hz_items:
        chart = _bar_chart(
            [h.capitalize() for h,_ in hz_items],
            [d.get('score',0) for _,d in hz_items],
            "Multi-Hazard Severity Profile (0–100 Scale)",
            width=int(W), height=max(80, len(hz_items)*26)
        )
        E.append(chart); SP()

    # ── 3. PER-HAZARD DEEP ANALYSIS ─────────────────────────────────────────
    E.append(PageBreak())
    E.append(Paragraph("3. PER-HAZARD DEEP ANALYSIS & ROOT CAUSE DRIVERS", st['h1'])); SP(4)
    E.append(Paragraph(
        "The following section provides a deterministic root-cause breakdown for each monitored "
        "hazard vector, computed from real-time sensor telemetry and Whisper-Large-V3 "
        "geophysical synthesis.", st['body']))
    SP(4)

    for haz, dat in hz_items:
        lv  = dat.get('level', 'LOW')
        clr = _level_color(lv)
        hdr = Table([[
            Paragraph(f"▸ {haz.upper()} · {dat.get('hazard', haz)}", st['bodyb']),
            Paragraph(f"{dat.get('score','—')}/100 — {lv}", ParagraphStyle('HL',
                parent=_styles()['bodyb'], textColor=clr, alignment=2))
        ]], colWidths=[W*0.65, W*0.35])
        hdr.setStyle(TableStyle([
            ('BACKGROUND', (0,0),(-1,-1), _level_bg(lv)),
            ('BOX', (0,0),(-1,-1), 0.8, clr),
            ('TOPPADDING',(0,0),(-1,-1),5), ('BOTTOMPADDING',(0,0),(-1,-1),5),
            ('LEFTPADDING',(0,0),(-1,-1),8),
        ]))
        # Keep heading and immediately following elements together
        block = [hdr, Spacer(1, 3)]
        reasons = dat.get('reasons', [])
        if reasons:
            block.append(Paragraph("Contributing Factors:", st['h3']))
            for r in reasons:
                block.append(Paragraph(f"• {r}", st['bullet']))
        if dat.get('trigger'):
            block.append(Paragraph(f"<b>Trigger Mechanism:</b> {dat['trigger']}", st['body']))
        if dat.get('probability_pct') is not None:
            block.append(Paragraph(
                f"<b>Event Probability:</b> {dat['probability_pct']}%  |  "
                f"<b>Estimated Evacuation Zone:</b> {dat.get('evacuation_zone_km2','—')} km²", st['body']))
        block.append(Spacer(1, 8))
        block.append(HRFlowable(width='100%', thickness=0.5, color=C_MID))
        block.append(Spacer(1, 8))
        E.append(KeepTogether(block))

    # ── 4. VIRTUAL SENSOR TELEMETRY ─────────────────────────────────────────
    E.append(Paragraph("4. VIRTUAL IoT SENSOR TELEMETRY", st['h1'])); SP(4)
    E.append(Paragraph(
        "Real-time physical measurements ingested from the Virtual Sensor Network. "
        "Whisper-derived parameters are computed using deterministic geophysical simulation "
        "calibrated to the target GPS coordinates.", st['body']))
    sensors = report_data.get('sensors', [])
    if sensors:
        sens_data = [[
            _wrap('Sensor Name', st['theader']), _wrap('Type', st['theader']), 
            _wrap('Recorded Value', st['theader']), _wrap('Unit', st['theader']), 
            _wrap('Health Status', st['theader']), _wrap('Data Source', st['theader'])
        ]]
        for s in sensors:
            sens_data.append([
                _wrap(s.get('name') or s.get('type','').replace('_',' ').title(), st['small']),
                _wrap(s.get('type','').replace('_',' ').title(), st['small']),
                _wrap(str(s.get('value', '—')), st['small']),
                _wrap(s.get('unit', ''), st['small']),
                _wrap(s.get('health', '—'), st['small']),
                _wrap(s.get('source','Virtual-IoT'), st['small']),
            ])
        extra = []
        for ri, s in enumerate(sensors, start=1):
            c = C_GREEN if s.get('health') == 'ONLINE' else C_AMBER
            extra += [('TEXTCOLOR',(4,ri),(4,ri),c)]
        E.append(_tbl(sens_data, [W*0.25, W*0.15, W*0.15, W*0.08, W*0.14, W*0.23], extra))
    else:
        E.append(Paragraph("No sensor telemetry recorded for this location.", st['body']))
    SP()

    # ── 5. GEOTECHNICAL PARAMETERS ──────────────────────────────────────────
    geo = report_data.get('geotechnical', {})
    if geo:
        E.append(PageBreak())
        E.append(Paragraph("5. GEOTECHNICAL ENGINEERING PARAMETERS", st['h1'])); SP(4)
        E.append(Paragraph(
            "Slope stability analysis computed using Whisper-Large-V3 deterministic geomechanics engine. "
            "Parameters are derived from real-time pore pressure, lithological data, and tectonic proximity.", st['body']))
        geo_rows = [
            [_wrap('Parameter', st['theader']), _wrap('Value', st['theader']), _wrap('Parameter', st['theader']), _wrap('Value', st['theader'])],
            [_wrap('Slope Angle', st['small']), _wrap(f"{geo.get('slope_angle_deg','—')}°", st['small']),
             _wrap('Soil Cohesion', st['small']), _wrap(f"{geo.get('soil_cohesion_kpa','—')} kPa", st['small'])],
            [_wrap('Internal Friction Ang.', st['small']), _wrap(f"{geo.get('internal_friction_deg','—')}°", st['small']),
             _wrap('Factor of Safety', st['small']), _wrap(str(geo.get('factor_of_safety','—')), st['small'])],
            [_wrap('Stability Status', st['small']), _wrap(str(geo.get('stability_status','—')), st['small']),
             _wrap('Drainage Condition', st['small']), _wrap(str(geo.get('drainage_condition','—')), st['small'])],
            [_wrap('Infiltration Rate', st['small']), _wrap(f"{geo.get('infiltration_rate_mmh','—')} mm/h", st['small']),
             _wrap('Groundwater Depth', st['small']), _wrap(f"{geo.get('groundwater_depth_m','—')} m", st['small'])],
            [_wrap('Vegetation Cover', st['small']), _wrap(f"{geo.get('vegetation_cover_pct','—')}%", st['small']),
             _wrap('Slope Curvature', st['small']), _wrap(str(geo.get('curvature','—')), st['small'])],
            [_wrap('Lithology', st['small']), _wrap(str(geo.get('lithology','—')), st['small']),
             _wrap('Slope Aspect', st['small']), _wrap(f"{geo.get('aspect_deg','—')}°", st['small'])],
        ]
        geo_tbl = Table(geo_rows, colWidths=[W*0.25, W*0.25, W*0.25, W*0.25])
        fs_val = geo.get('factor_of_safety', 99)
        fs_c = C_RED if isinstance(fs_val, (int,float)) and fs_val < 1.0 else (C_AMBER if isinstance(fs_val,(int,float)) and fs_val < 1.3 else C_GREEN)
        st_val = geo.get('stability_status','')
        st_c = C_RED if st_val == 'UNSTABLE' else (C_AMBER if st_val == 'MARGINAL' else C_GREEN)
        geo_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), C_NAVY),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [C_WHITE, C_LIGHT]),
            ('GRID',       (0,0), (-1,-1), 0.4, C_MID),
            ('TOPPADDING', (0,0), (-1,-1), 4), ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING',(0,0), (-1,-1), 6),
        ]))
        E.append(geo_tbl); SP()

    # ── 6. 7-DAY FORECAST ───────────────────────────────────────────────────
    forecast = report_data.get('forecast', [])
    if forecast:
        E.append(Paragraph("6. 7-DAY PROBABILISTIC RISK FORECAST", st['h1'])); SP(4)
        E.append(Paragraph(
            "Multi-day risk outlook computed by the Whisper-Large-V3 forecast module. "
            "Scores represent the expected composite hazard severity index for each 24-hour window.", st['body']))
        fc_data = [[
            _wrap('Day', st['theader']), _wrap('Date', st['theader']), 
            _wrap('Risk Score', st['theader']), _wrap('Risk Level', st['theader']), 
            _wrap('Primary Threat', st['theader']), _wrap('Confidence %', st['theader'])
        ]]
        for i, d in enumerate(forecast[:7]):
            fc_data.append([
                _wrap(f"D+{i}", st['small']),
                _wrap(d.get('date', '—'), st['small']),
                _wrap(str(d.get('risk_score','—')), st['smallb']),
                _wrap(d.get('risk_level') or d.get('level','—'), st['small']),
                _wrap(d.get('primary_threat','—'), st['small']),
                _wrap(f"{d.get('confidence', max(50, 95 - i*6))}%", st['small']),
            ])
        extra = []
        for ri, d in enumerate(forecast[:7], start=1):
            c = _level_color(d.get('risk_level') or d.get('level','LOW'))
            extra += [('TEXTCOLOR',(3,ri),(3,ri),c)]
        E.append(_tbl(fc_data, [W*0.07, W*0.14, W*0.12, W*0.16, W*0.39, W*0.12], extra)); SP()

    # ── 7. REMEDIAL MEASURES ────────────────────────────────────────────────
    remedial = report_data.get('remedial_measures', {})
    if not remedial:
        raw = report_data.get('current_risk', {}).get('remedial_actions', {})
        remedial = {'immediate': raw.get('immediate',[]), 'short_term': raw.get('short_term',[])}

    if remedial:
        E.append(PageBreak())
        E.append(Paragraph("7. REMEDIAL MEASURES & TACTICAL RESPONSE PLAYBOOK", st['h1'])); SP(4)
        E.append(Paragraph(
            "Response directives generated by the Whisper-Large-V3 SOP engine, aligned with NDMA "
            "Incident Command System (ICS) protocols and WHO/UN disaster preparedness guidelines.", st['body']))
        
        tier_config = [
            ('immediate',     '7.1 IMMEDIATE RESPONSE (0–6 HOURS)',   C_RED,   'rgba(255,0,0,0.05)'),
            ('short_term',    '7.2 SHORT-TERM ACTIONS (6H–7 DAYS)',   C_AMBER, None),
            ('long_term',     '7.3 LONG-TERM STRUCTURAL MEASURES',    C_CYAN,  None),
            ('early_warning', '7.4 EARLY WARNING TRIGGER THRESHOLDS', colors.HexColor('#7c3aed'), None),
        ]
        for key, label, clr, _ in tier_config:
            acts = remedial.get(key, [])
            if not acts: continue
            
            block = [Paragraph(label, st['h2']), Spacer(1, 2)]
            rem_rows = [[Paragraph(f"• {a}", st['bullet'])] for a in acts]
            rem_tbl = Table(rem_rows, colWidths=[W])
            rem_tbl.setStyle(TableStyle([
                ('ROWBACKGROUNDS', (0,0),(-1,-1), [C_WHITE, C_LIGHT]),
                ('LEFTPADDING', (0,0),(-1,-1), 10),
                ('TOPPADDING',(0,0),(-1,-1),3), ('BOTTOMPADDING',(0,0),(-1,-1),3),
                ('BOX', (0,0),(-1,-1), 0.5, clr),
            ]))
            block.append(rem_tbl)
            block.append(Spacer(1, 6))
            E.append(KeepTogether(block))

    # ── 8. INFRASTRUCTURE EXPOSURE ──────────────────────────────────────────
    assets = report_data.get('affected_assets', {})
    if assets:
        E.append(PageBreak())
        E.append(Paragraph("8. POPULATION & INFRASTRUCTURE EXPOSURE", st['h1'])); SP(4)
        E.append(Paragraph(
            "Estimated impact radius computed from Whisper-Large-V3 exposure modelling, "
            "incorporating risk score, geographic population density, and spatial hazard extent.", st['body']))
        asset_rows = [[
            _wrap('Infrastructure Category', st['theader']), _wrap('Estimated Exposure', st['theader']), 
            _wrap('Infrastructure Category', st['theader']), _wrap('Estimated Exposure', st['theader'])
        ]]
        items = list(assets.items())
        for i in range(0, len(items), 2):
            k1, v1 = items[i]
            k2, v2 = items[i+1] if i+1 < len(items) else ('', '')
            asset_rows.append([
                _wrap(k1.replace('_',' ').title(), st['small']), _wrap(str(v1) if v1 != '' else '—', st['small']),
                _wrap(k2.replace('_',' ').title() if k2 else '', st['small']), _wrap(str(v2) if v2 != '' else '—', st['small']),
            ])
        asset_tbl = Table(asset_rows, colWidths=[W*0.30, W*0.20, W*0.30, W*0.20])
        asset_tbl.setStyle(TableStyle([
            ('BACKGROUND',  (0,0),(-1,0), C_NAVY),
            ('ROWBACKGROUNDS', (0,1),(-1,-1), [C_WHITE, C_LIGHT]),
            ('GRID', (0,0),(-1,-1), 0.4, C_MID),
            ('TOPPADDING',(0,0),(-1,-1),4), ('BOTTOMPADDING',(0,0),(-1,-1),4),
            ('LEFTPADDING',(0,0),(-1,-1),6),
        ]))
        E.append(asset_tbl); SP()

    # ── 9. DATA PROVENANCE ──────────────────────────────────────────────────
    sources = report_data.get('data_sources', [])
    if sources:
        E.append(Paragraph("9. DATA PROVENANCE & SOURCE REGISTRY", st['h1'])); SP(4)
        E.append(Paragraph(
            "All data streams ingested, validated, quality-checked, and fused by the Whisper-Large-V3 "
            "pipeline to produce this report.", st['body']))
        prov_data = [[
            _wrap('Data Source', st['theader']), _wrap('Type', st['theader']), 
            _wrap('Latency', st['theader']), _wrap('Reliability', st['theader'])
        ]]
        for src in sources:
            prov_data.append([
                _wrap(src.get('source','—'), st['small']), 
                _wrap(src.get('type','—'), st['small']),
                _wrap(src.get('latency','—'), st['small']), 
                _wrap(src.get('reliability','—'), st['small'])
            ])
        E.append(_tbl(prov_data, [W*0.40, W*0.30, W*0.15, W*0.15])); SP()

    # ── 10. CLASSIFICATION FOOTER ───────────────────────────────────────────
    HR(C_NAVY)
    E.append(Paragraph(
        f"CLASSIFICATION: {cls_typ}  ·  GENERATED BY WHISPER-LARGE-V3 INTELLIGENCE PIPELINE  ·  "
        f"Report ID: {report_id}  ·  {ts} UTC  ·  NDMA-ALIGNED",
        ParagraphStyle('FTR', parent=_styles()['small'], alignment=1, textColor=C_DARK)))

    doc.build(E)
    return path


# ── DOCX ─────────────────────────────────────────────────────────────────────

def generate_report_docx(report_data, report_id):
    path = os.path.join(REPORTS_DIR, f"{report_id}.docx")
    doc  = docx.Document()

    # Page margins
    for sec in doc.sections:
        sec.left_margin  = Inches(0.9)
        sec.right_margin = Inches(0.9)
        sec.top_margin   = Inches(0.8)
        sec.bottom_margin= Inches(0.8)

    loc      = report_data.get('location', {})
    loc_name = report_data.get('location_name') or loc.get('name', 'Unknown Zone')
    ts       = (report_data.get('snapshot_time') or datetime.now().isoformat())[:16].replace('T',' ')
    cls_typ  = report_data.get('classification', 'EXECUTIVE').upper()
    risk_sc  = report_data.get('risk_score') or report_data.get('current_risk',{}).get('overall_score','—')
    risk_lv  = report_data.get('risk_level') or report_data.get('current_risk',{}).get('overall_level','—')
    ai_text  = report_data.get('ai_narrative','')
    pri_thr  = report_data.get('primary_threat') or report_data.get('current_risk',{}).get('primary_threat','—')
    fct_trn  = report_data.get('forecast_trend','—')

    # Title
    t = doc.add_heading('NATIONAL DISASTER INTELLIGENCE AGENCY', 0)
    t.alignment = 1
    doc.add_heading(f'WHISPER-LARGE-V3 INTELLIGENCE REPORT: {cls_typ}', level=1).alignment = 1
    doc.add_paragraph(f'Report ID: {report_id}  |  Generated: {ts}  |  Zone: {loc_name}').alignment = 1
    doc.add_paragraph(
        f'Risk Score: {risk_sc}/100  |  Risk Level: {risk_lv}  |  Primary Threat: {pri_thr}  |  Trend: {fct_trn}'
    ).alignment = 1
    doc.add_paragraph()

    # Section helper
    def H(text, level=1): doc.add_heading(text, level=level)
    def P(text): doc.add_paragraph(text)
    def B(text): doc.add_paragraph(text, style='List Bullet')

    # 1. AI Synthesis
    H('1. WHISPER-LARGE-V3 INTELLIGENCE SYNTHESIS')
    P('AI geotechnical synthesis from Whisper-Large-V3 deterministic pipeline:')
    if ai_text: P(ai_text)

    # 2. Risk Scorecard
    H('2. MULTI-HAZARD RISK SCORECARD')
    hazards = (report_data.get('hazard_matrix') or
               report_data.get('current_risk',{}).get('hazards') or {})
    if hazards:
        tbl = doc.add_table(rows=1, cols=6)
        tbl.style = 'Table Grid'
        for i, h in enumerate(['Hazard', 'Score', 'Level', 'Probability', 'Trigger', 'Evac Zone']):
            tbl.rows[0].cells[i].text = h
        for haz, dat in hazards.items():
            r = tbl.add_row().cells
            r[0].text = haz.upper()
            r[1].text = str(dat.get('score','—'))
            r[2].text = dat.get('level','—')
            r[3].text = f"{dat.get('probability_pct','—')}%"
            r[4].text = dat.get('trigger','—')
            r[5].text = f"{dat.get('evacuation_zone_km2','—')} km²"
    doc.add_paragraph()

    # 3. Per-hazard deep analysis
    doc.add_page_break()
    H('3. PER-HAZARD ROOT CAUSE ANALYSIS')
    for haz, dat in hazards.items():
        H(f'{haz.upper()} — Score: {dat.get("score","—")}/100 | Level: {dat.get("level","—")}', level=2)
        if dat.get('trigger'): P(f'Trigger: {dat["trigger"]}')
        if dat.get('probability_pct'): P(f'Event Probability: {dat["probability_pct"]}%  |  Evacuation Zone: {dat.get("evacuation_zone_km2","—")} km²')
        H('Contributing Factors', level=3)
        for r in dat.get('reasons',[]): B(r)

    # 4. Sensor telemetry
    H('4. VIRTUAL IoT SENSOR TELEMETRY')
    P('Real-time physical measurements from the Virtual Sensor Network:')
    sensors = report_data.get('sensors',[])
    if sensors:
        tbl = doc.add_table(rows=1, cols=5)
        tbl.style = 'Table Grid'
        for i,h in enumerate(['Sensor','Type','Value','Unit','Status']): tbl.rows[0].cells[i].text = h
        for s in sensors:
            r = tbl.add_row().cells
            r[0].text = s.get('name') or s.get('type','').replace('_',' ').title()
            r[1].text = s.get('type','').replace('_',' ').title()
            r[2].text = str(s.get('value','—'))
            r[3].text = s.get('unit','')
            r[4].text = s.get('health','—')
    doc.add_paragraph()

    # 5. Geotechnical
    doc.add_page_break()
    geo = report_data.get('geotechnical',{})
    if geo:
        H('5. GEOTECHNICAL ENGINEERING PARAMETERS')
        tbl = doc.add_table(rows=1, cols=2)
        tbl.style = 'Table Grid'
        tbl.rows[0].cells[0].text = 'Parameter'
        tbl.rows[0].cells[1].text = 'Value'
        for k,v in geo.items():
            r = tbl.add_row().cells
            r[0].text = k.replace('_',' ').title()
            r[1].text = str(v)
        doc.add_paragraph()

    # 6. Forecast
    forecast = report_data.get('forecast',[])
    if forecast:
        H('6. 7-DAY PROBABILISTIC FORECAST')
        tbl = doc.add_table(rows=1, cols=5)
        tbl.style = 'Table Grid'
        for i,h in enumerate(['Day','Date','Score','Level','Threat']): tbl.rows[0].cells[i].text=h
        for i,d in enumerate(forecast[:7]):
            r = tbl.add_row().cells
            r[0].text=f'D+{i}'; r[1].text=d.get('date','—'); r[2].text=str(d.get('risk_score','—'))
            r[3].text=d.get('risk_level') or d.get('level','—'); r[4].text=d.get('primary_threat','—')
        doc.add_paragraph()

    # 7. Remedial measures
    doc.add_page_break()
    H('7. REMEDIAL MEASURES & RESPONSE PLAYBOOK')
    remedial = report_data.get('remedial_measures',{})
    if not remedial:
        raw = report_data.get('current_risk',{}).get('remedial_actions',{})
        remedial = {'immediate': raw.get('immediate',[]), 'short_term': raw.get('short_term',[])}
    for key,label in [('immediate','IMMEDIATE (0–6H)'),('short_term','SHORT-TERM (6H–7D)'),
                       ('long_term','LONG-TERM STRUCTURAL'),('early_warning','EARLY WARNING THRESHOLDS')]:
        acts = remedial.get(key,[])
        if acts:
            H(label, level=2)
            for a in acts: B(a)

    # 8. Exposure
    assets = report_data.get('affected_assets',{})
    if assets:
        H('8. INFRASTRUCTURE & POPULATION EXPOSURE')
        tbl = doc.add_table(rows=1, cols=2)
        tbl.style = 'Table Grid'
        tbl.rows[0].cells[0].text = 'Category'
        tbl.rows[0].cells[1].text = 'Estimated Exposure'
        for k,v in assets.items():
            r = tbl.add_row().cells
            r[0].text = k.replace('_',' ').title()
            r[1].text = str(v)
        doc.add_paragraph()

    # 9. Data provenance
    sources = report_data.get('data_sources',[])
    if sources:
        H('9. DATA PROVENANCE')
        tbl = doc.add_table(rows=1, cols=4)
        tbl.style = 'Table Grid'
        for i,h in enumerate(['Source','Type','Latency','Reliability']): tbl.rows[0].cells[i].text=h
        for s in sources:
            r = tbl.add_row().cells
            r[0].text=s.get('source','—'); r[1].text=s.get('type','—')
            r[2].text=s.get('latency','—'); r[3].text=s.get('reliability','—')

    # Footer
    doc.add_paragraph()
    P(f'CLASSIFICATION: {cls_typ}  |  Report ID: {report_id}  |  {ts} UTC  |  WHISPER-LARGE-V3  |  NDMA-ALIGNED')

    doc.save(path)
    return path
