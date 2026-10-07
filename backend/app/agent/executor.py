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
        # Headless=False so the user can visually see the agent navigating
        self.browser = await self.playwright.chromium.launch(
            headless=False,
            args=["--window-size=1280,800"]
        )
        self.page = await self.browser.new_page(viewport={"width": 1280, "height": 800})

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

    async def screenshot_base64(self) -> str:
        if not self.page:
            return ""
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
