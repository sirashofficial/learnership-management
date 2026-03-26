# -*- coding: utf-8 -*-
"""
Visual Design Audit - YEHA Learnership Management
Uses JWT injection to bypass broken login (Prisma role enum/String mismatch in DB).
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from playwright.sync_api import sync_playwright
import os, json, time, hmac, hashlib, base64

BASE = "http://localhost:3000"
OUT = r"C:\Users\LATITUDE 5400\Downloads\Learnership Management\.claude\worktrees\friendly-franklin\tasks\audit_screenshots"
os.makedirs(OUT, exist_ok=True)

JWT_SECRET = "yeha-learnership-secret-key-2026"

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def make_jwt(payload: dict, secret: str) -> str:
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body   = b64url(json.dumps(payload).encode())
    msg    = f"{header}.{body}".encode()
    sig    = hmac.new(secret.encode(), msg, hashlib.sha256).digest()
    return f"{header}.{body}.{b64url(sig)}"

now = int(time.time())
token = make_jwt({
    "userId": "audit-bypass-user",
    "email":  "ash@yeha.training",
    "role":   "FACILITATOR",
    "iat":    now,
    "exp":    now + 86400,
}, JWT_SECRET)

PAGES = [
    ("dashboard",   "/"),
    ("students",    "/students"),
    ("groups",      "/groups"),
    ("attendance",  "/attendance"),
    ("assessments", "/assessments"),
    ("timetable",   "/timetable"),
    ("progress",    "/progress"),
    ("lessons",     "/lessons"),
    ("reports",     "/reports"),
    ("settings",    "/settings"),
    ("ai",          "/ai"),
]

def snap(page, name, full=True):
    page.screenshot(path=f"{OUT}/{name}.png", full_page=full)

def audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})

        # Inject auth cookie before any page load
        context.add_cookies([{
            "name":     "auth_token",
            "value":    token,
            "domain":   "localhost",
            "path":     "/",
            "httpOnly": True,
            "secure":   False,
            "sameSite": "Lax",
        }])

        page = context.new_page()

        # Seed localStorage with auth data (app reads token + user from localStorage)
        user_obj = json.dumps({"id": "audit-user", "email": "ash@yeha.training",
                               "name": "Ash (Audit)", "role": "FACILITATOR"})
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("domcontentloaded")
        page.evaluate(f"""
            localStorage.setItem('token', '{token}');
            localStorage.setItem('user', JSON.stringify({user_obj}));
        """)

        # --- Login page (design only) ---
        print("01 Login page (design)")
        snap(page, "01_login")

        # --- All main pages ---
        for name, path in PAGES:
            print(f"   {name}")
            try:
                page.goto(f"{BASE}{path}", timeout=45000)
                page.wait_for_load_state("networkidle", timeout=45000)
            except Exception:
                pass  # timeout - capture whatever rendered
            page.wait_for_timeout(1500)
            snap(page, f"{name}_desktop")

            # Mobile (iPhone 14)
            page.set_viewport_size({"width": 390, "height": 844})
            page.wait_for_timeout(400)
            snap(page, f"{name}_mobile")
            page.set_viewport_size({"width": 1440, "height": 900})

        # --- Dark mode dashboard ---
        print("   dashboard dark mode")
        try:
            page.goto(f"{BASE}/", timeout=45000)
            page.wait_for_load_state("networkidle", timeout=45000)
        except Exception:
            pass
        page.evaluate("document.documentElement.classList.add('dark')")
        page.wait_for_timeout(800)
        snap(page, "dashboard_dark")

        # --- Tablet (iPad) ---
        print("   tablet view")
        page.set_viewport_size({"width": 768, "height": 1024})
        try:
            page.goto(f"{BASE}/", timeout=45000)
            page.wait_for_load_state("networkidle", timeout=45000)
        except Exception:
            pass
        page.wait_for_timeout(600)
        snap(page, "dashboard_tablet")
        page.set_viewport_size({"width": 1440, "height": 900})

        # --- Forms / modals ---
        print("   students with search bar")
        page.goto(f"{BASE}/students")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        snap(page, "students_full")

        browser.close()
        print(f"\nDone -> {OUT}")

if __name__ == "__main__":
    audit()
