import json
from playwright.sync_api import sync_playwright
URL = "http://localhost:8098/"
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    errors, reqs = [], []
    pg.on("console", lambda m: errors.append(f"console:{m.type}:{m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror:{e}"))
    pg.on("request", lambda r: reqs.append(r.url))
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_selector(".trophy-card")
    print(json.dumps({
        "cards": pg.locator(".trophy-card").count(),
        "results": pg.inner_text("#results-count"),
        "facts": pg.inner_text(".facts"),
        "gradeCounts": [pg.inner_text(f"#count-{g}") for g in ("platinum", "gold", "silver", "bronze")],
        "redacted": pg.locator(".trophy-card .desc.redacted").count(),
        "na": pg.locator("text=/undefined|NaN|\\[object Object\\]/").count(),
        "external": [u for u in reqs if not u.startswith("http://localhost:8099/")],
        "errors": errors,
    }, indent=1))
    b.close()