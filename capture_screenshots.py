#!/usr/bin/env python3
"""Capture screenshots of LANDSense AI dashboard pages."""
import asyncio
from playwright.async_api import async_playwright
import os

OUTPUT_DIR = "screenshots"
os.makedirs(OUTPUT_DIR, exist_ok=True)
BASE = "http://127.0.0.1:5173"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
        )
        page = await context.new_page()
        page.set_default_timeout(60000)

        # 1. Login page
        print("Capturing login page...")
        await page.goto(f"{BASE}/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/01_login.png", full_page=True)
        print("  -> 01_login.png")

        # 2. Click Admin demo account to log in
        print("Logging in as Admin...")
        admin_btn = page.get_by_text("Admin", exact=True)
        await admin_btn.click()
        await page.wait_for_timeout(4000)
        
        # 3. Dashboard
        print("Capturing dashboard...")
        await page.goto(f"{BASE}/dashboard", wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)
        await page.screenshot(path=f"{OUTPUT_DIR}/02_dashboard.png")
        print("  -> 02_dashboard.png")

        # 4. Alert Center
        print("Capturing Alert Center...")
        await page.goto(f"{BASE}/alerts", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/03_alerts.png")
        print("  -> 03_alerts.png")

        # 5. Incidents
        print("Capturing Incidents...")
        await page.goto(f"{BASE}/incidents", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/04_incidents.png")
        print("  -> 04_incidents.png")

        # 6. Risk Intelligence
        print("Capturing Risk Intelligence...")
        await page.goto(f"{BASE}/risk", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/05_risk.png")
        print("  -> 05_risk.png")

        # 7. AI Copilot
        print("Capturing AI Copilot...")
        await page.goto(f"{BASE}/ai-copilot", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/06_ai_copilot.png")
        print("  -> 06_ai_copilot.png")

        # 8. Model Operations
        print("Capturing Model Operations...")
        await page.goto(f"{BASE}/models", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/07_models.png")
        print("  -> 07_models.png")

        # 9. Data Sources
        print("Capturing Data Sources...")
        await page.goto(f"{BASE}/data-sources", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/08_data_sources.png")
        print("  -> 08_data_sources.png")

        # 10. Response Center
        print("Capturing Response Center...")
        await page.goto(f"{BASE}/response", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/09_response.png")
        print("  -> 09_response.png")

        # 11. Forecasts & Analytics
        print("Capturing Forecasts & Analytics...")
        await page.goto(f"{BASE}/forecasts", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/10_forecasts.png")
        print("  -> 10_forecasts.png")

        # 12. System Health
        print("Capturing System Health...")
        await page.goto(f"{BASE}/system", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/11_system_health.png")
        print("  -> 11_system_health.png")

        # 13. Audit Log
        print("Capturing Audit Log...")
        await page.goto(f"{BASE}/audit", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/12_audit.png")
        print("  -> 12_audit.png")

        # 14. Admin
        print("Capturing Admin...")
        await page.goto(f"{BASE}/admin", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        await page.screenshot(path=f"{OUTPUT_DIR}/13_admin.png")
        print("  -> 13_admin.png")

        await browser.close()
        print("\nAll screenshots captured successfully!")

asyncio.run(main())
