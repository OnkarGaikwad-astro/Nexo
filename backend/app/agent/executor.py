import os
import sys
from playwright.async_api import async_playwright
import asyncio
import base64

class BrowserTool:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.page = None

    async def start(self):
        self.playwright = await async_playwright().start()

        # Headless Configuration:
        # 1. Explicit env var HEADLESS (true/false)
        # 2. Auto-detect: if on Linux without a display server or in cloud container, run headless
        headless_env = os.getenv("HEADLESS", "").strip().lower()
        if headless_env in ("true", "1", "yes"):
            headless = True
        elif headless_env in ("false", "0", "no"):
            headless = False
        else:
            is_linux = sys.platform.startswith("linux")
            has_display = bool(os.getenv("DISPLAY"))
            is_cloud = bool(
                os.getenv("RENDER")
                or os.getenv("RAILWAY_ENVIRONMENT")
                or os.getenv("FLY_APP_NAME")
                or os.path.exists("/.dockerenv")
            )
            headless = (is_linux and not has_display) or is_cloud

        # Launch arguments robust across Windows, Mac, and Linux/Docker cloud containers
        args = [
            "--window-size=1024,680",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ]

        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=args
        )
        self.page = await self.browser.new_page(viewport={"width": 1000, "height": 620})

    async def navigate(self, url: str):
        if not self.page:
            await self.start()
        try:
            await self.page.goto(url, wait_until="domcontentloaded", timeout=12000)
        except Exception:
            try:
                await self.page.goto(url, wait_until="load", timeout=8000)
            except Exception:
                pass
        return f"Navigated to {url}"

    async def extract_text(self):
        if not self.page:
            return "Error: Browser not started."
        text = await self.page.evaluate("document.body.innerText")
        return text

    async def click(self, selector: str):
        if not self.page:
            return "Error: Browser not started."
        await self.page.wait_for_selector(selector, timeout=5000)
        await self.page.click(selector)
        return f"Clicked on {selector}"

    async def type(self, selector: str, text: str, delay: int = 40):
        if not self.page:
            return "Error: Browser not started."
        await self.page.wait_for_selector(selector, timeout=5000)
        await self.page.fill(selector, "")
        # Human-like typing so the user can watch the inputs being filled in
        await self.page.type(selector, text, delay=delay)
        return f"Typed '{text}' into {selector}"

    async def get_element_text(self, selector: str):
        if not self.page:
            return ""
        try:
            elem = await self.page.wait_for_selector(selector, timeout=3000)
            if elem:
                return await elem.inner_text()
        except Exception:
            return ""
        return ""

    async def evaluate(self, script: str):
        if not self.page:
            return None
        try:
            return await self.page.evaluate(script)
        except Exception:
            return None

    async def click_matching_text(self, selector: str, text: str) -> bool:
        if not self.page:
            return False
        try:
            elements = await self.page.query_selector_all(selector)
            for el in elements:
                t = await el.inner_text()
                if text.lower() in t.lower():
                    await el.click()
                    return True
        except Exception:
            pass
        return False

    async def get_interactive_elements(self):
        """Scans active DOM for interactive elements (buttons, inputs, links, rows) with selectors."""
        if not self.page:
            return []
        try:
            return await self.page.evaluate(r"""
                () => {
                    const items = [];
                    const elements = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], tr[id], [data-invoice]');
                    elements.forEach((el, idx) => {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none') {
                            const tag = el.tagName.toLowerCase();
                            let selector = '';
                            if (el.id) {
                                selector = '#' + el.id;
                            } else if (el.name) {
                                selector = `${tag}[name="${el.name}"]`;
                            } else if (el.getAttribute('data-invoice')) {
                                selector = `tr[data-invoice="${el.getAttribute('data-invoice')}"]`;
                            } else {
                                selector = `${tag}:nth-of-type(${idx + 1})`;
                            }
                            
                            const text = (el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.value || '').trim().replace(/\s+/g, ' ').substring(0, 50);
                            items.push({
                                tag,
                                type: el.getAttribute('type') || tag,
                                selector,
                                text,
                                value: el.value || ''
                            });
                        }
                    });
                    return items.slice(0, 40);
                }
            """)
        except Exception:
            return []

    async def screenshot_base64(self) -> str:
        if not self.page:
            return ""
        try:
            # Dynamically adapt screenshot height to content bounds instead of full empty desktop
            content_bottom = await self.page.evaluate(r"""
                () => {
                    let maxBottom = 260;
                    const contentNodes = document.querySelectorAll('table, form, tr, .bg-white, main > * > *');
                    contentNodes.forEach(el => {
                        const r = el.getBoundingClientRect();
                        if (r.height > 10 && r.bottom > maxBottom && r.bottom < 1500) {
                            maxBottom = r.bottom;
                        }
                    });
                    return Math.ceil(maxBottom);
                }
            """)
            viewport_w = self.page.viewport_size["width"] if self.page.viewport_size else 1000
            viewport_h = self.page.viewport_size["height"] if self.page.viewport_size else 620
            
            # Clip between min 340px and viewport_h with 16px bottom padding
            target_h = max(340, min(int(content_bottom or viewport_h) + 16, viewport_h))
            
            screenshot_bytes = await self.page.screenshot(
                type="jpeg",
                quality=75,
                clip={"x": 0, "y": 0, "width": viewport_w, "height": target_h}
            )
            return base64.b64encode(screenshot_bytes).decode("utf-8")
        except Exception:
            try:
                screenshot_bytes = await self.page.screenshot(type="jpeg", quality=60)
                return base64.b64encode(screenshot_bytes).decode("utf-8")
            except Exception:
                return ""

    async def close(self):
        if self.page:
            try:
                await self.page.close()
            except Exception:
                pass
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass
        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass
