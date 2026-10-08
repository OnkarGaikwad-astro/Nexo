import os
import re
import json
from typing import Dict, Any, Optional, List
import httpx
from bs4 import BeautifulSoup

async def real_web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """Searches the real internet via DuckDuckGo without requiring any API key."""
    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    
    # 1. If Tavily key provided
    if tavily_key and tavily_key not in ("dummy", "your_tavily_key"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.tavily.com/search",
                    json={"query": query, "api_key": tavily_key, "max_results": max_results}
                )
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "status": "SUCCESS",
                        "provider": "Tavily Search API",
                        "query": query,
                        "results": [
                            {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("content")}
                            for r in data.get("results", [])
                        ]
                    }
        except Exception:
            pass

    # 2. DuckDuckGo Free Search (No key required)
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        async with httpx.AsyncClient(headers=headers, timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(f"https://html.duckduckgo.com/html/?q={httpx.URL(query)}")
            results = []
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for link in soup.select(".result")[:max_results]:
                    title_el = link.select_one(".result__title a")
                    snippet_el = link.select_one(".result__snippet")
                    if title_el:
                        title = title_el.get_text(strip=True)
                        raw_href = title_el.get("href", "")
                        results.append({
                            "title": title,
                            "url": raw_href,
                            "snippet": snippet_el.get_text(strip=True) if snippet_el else ""
                        })
            return {
                "status": "SUCCESS",
                "provider": "DuckDuckGo (Free / No Key)",
                "query": query,
                "results": results
            }
    except Exception as e:
        return {
            "status": "FAILED",
            "provider": "DuckDuckGo",
            "query": query,
            "results": [],
            "error": str(e)
        }

async def fetch_web_page(url: str) -> Dict[str, Any]:
    """Fetches any real public URL, extracts title and clean text."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        async with httpx.AsyncClient(headers=headers, timeout=12.0, follow_redirects=True) as client:
            res = await client.get(url)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                for s in soup(["script", "style", "noscript"]):
                    s.decompose()
                title = soup.title.string.strip() if soup.title and soup.title.string else url
                text = " ".join(soup.get_text().split())
                return {
                    "status": "SUCCESS",
                    "url": url,
                    "title": title,
                    "content": text[:3000]
                }
            return {
                "status": "FAILED",
                "url": url,
                "error": f"HTTP {res.status_code}"
            }
    except Exception as e:
        return {
            "status": "FAILED",
            "url": url,
            "error": str(e)
        }

CURRENCY_MAP = {
    # Middle East
    "aed": "AED", "dirham": "AED", "dirhams": "AED", "dhs": "AED",
    "sar": "SAR", "riyal": "SAR", "riyals": "SAR", "saudi riyal": "SAR",
    "qar": "QAR", "qatari riyal": "QAR",
    "kwd": "KWD", "dinar": "KWD", "kuwaiti dinar": "KWD",
    "bhd": "BHD", "omr": "OMR",
    # Asia
    "inr": "INR", "rupee": "INR", "rupees": "INR", "rs": "INR", "inr": "INR",
    "pkr": "PKR", "pakistani rupee": "PKR",
    "bdt": "BDT", "taka": "BDT",
    "jpy": "JPY", "yen": "JPY",
    "cny": "CNY", "yuan": "CNY", "rmb": "CNY", "renminbi": "CNY",
    "sgd": "SGD", "myr": "MYR", "ringgit": "MYR",
    "thb": "THB", "baht": "THB",
    "krw": "KRW", "won": "KRW",
    # Americas
    "usd": "USD", "dollar": "USD", "dollars": "USD", "buck": "USD", "bucks": "USD", "$": "USD",
    "cad": "CAD", "canadian dollar": "CAD",
    "aud": "AUD", "australian dollar": "AUD",
    "nzd": "NZD", "new zealand dollar": "NZD",
    "brl": "BRL", "real": "BRL", "reais": "BRL",
    # Europe
    "eur": "EUR", "euro": "EUR", "euros": "EUR", "€": "EUR",
    "gbp": "GBP", "pound": "GBP", "pounds": "GBP", "sterling": "GBP", "quid": "GBP", "£": "GBP",
    "chf": "CHF", "franc": "CHF", "francs": "CHF", "swiss franc": "CHF",
    "rub": "RUB", "ruble": "RUB", "rubles": "RUB",
    "try": "TRY", "lira": "TRY",
    "zar": "ZAR", "rand": "ZAR"
}

STANDARD_ISO_CURRENCIES = {
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
    'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
    'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
    'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'FOK', 'GBP', 'GEL', 'GGP', 'GHS',
    'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF',
    'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'IRR', 'ISK', 'JEP', 'JMD', 'JOD',
    'JPY', 'KES', 'KGS', 'KHR', 'KID', 'KMF', 'KRW', 'KWD', 'KYD', 'KZT',
    'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD',
    'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN',
    'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK',
    'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR',
    'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD',
    'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY',
    'TTD', 'TVD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES',
    'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL'
}

def extract_currencies(text: str) -> List[str]:
    words = re.findall(r'[a-zA-Z]+|\$|€|£|¥', text.lower())
    found = []
    i = 0
    while i < len(words):
        w = words[i]
        # Check two-word terms like "saudi riyal" or "canadian dollar"
        if i + 1 < len(words) and f"{w} {words[i+1]}" in CURRENCY_MAP:
            curr = CURRENCY_MAP[f"{w} {words[i+1]}"]
            if not found or found[-1] != curr:
                found.append(curr)
            i += 2
            continue
        if w in CURRENCY_MAP:
            curr = CURRENCY_MAP[w]
            if not found or found[-1] != curr:
                found.append(curr)
        elif len(w) == 3 and w.upper() in STANDARD_ISO_CURRENCIES:
            curr = w.upper()
            if not found or found[-1] != curr:
                found.append(curr)
        i += 1
    return found

def is_currency_query(text: str) -> bool:
    t = text.lower()
    found = extract_currencies(t)
    if any(k in t for k in ["currency", "exchange rate", "forex", "fx rate", "live exchange"]):
        return True
    if any(k in t for k in ["convert", "exchange"]) and len(found) >= 1:
        return True
    if len(found) >= 2 and any(k in t for k in [" to ", " in ", " into ", "->"]):
        return True
    return False

def parse_currency_query(text: str):
    amt_match = re.search(r"(\d+(?:\.\d+)?)", text)
    amount = float(amt_match.group(1)) if amt_match else 1.0
    found = extract_currencies(text)
    
    if len(found) >= 2:
        from_curr = found[0]
        to_curr = found[1]
    elif len(found) == 1:
        from_curr = found[0]
        to_curr = "INR" if from_curr != "INR" else "USD"
    else:
        from_curr = "USD"
        to_curr = "INR"

    return amount, from_curr, to_curr

async def convert_currency(amount: float, from_curr: str, to_curr: str) -> Dict[str, Any]:
    """Fetches real exchange rates from open exchange API (100% free, no key required)."""
    from_c = from_curr.upper().strip()
    to_c = to_curr.upper().strip()
    
    # Try open exchange endpoint
    for url in [
        f"https://open.er-api.com/v6/latest/{from_c}",
        f"https://api.frankfurter.dev/v1/latest?amount={amount}&from={from_c}&to={to_c}"
    ]:
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    if "rates" in data and to_c in data["rates"]:
                        rate = float(data["rates"][to_c])
                        converted = round(rate * amount, 2)
                        return {
                            "status": "SUCCESS",
                            "provider": "Live Exchange Rate API (Free)",
                            "amount": amount,
                            "from": from_c,
                            "to": to_c,
                            "rate": rate,
                            "converted_amount": converted,
                            "last_updated": data.get("time_last_update_utc") or data.get("date")
                        }
        except Exception:
            continue

    return {"status": "FAILED", "error": f"Unable to fetch exchange rates for {from_c} to {to_c}"}

async def send_webhook(webhook_url: str, message: str, title: str = "Nexo AI Alert") -> Dict[str, Any]:
    """Dispatches a notification to Discord, Slack, or any HTTP webhook."""
    try:
        payload = {}
        if "discord.com" in webhook_url:
            payload = {
                "embeds": [{
                    "title": title,
                    "description": message,
                    "color": 4487836
                }]
            }
        elif "slack.com" in webhook_url:
            payload = {"text": f"*{title}*\n{message}"}
        else:
            payload = {"title": title, "message": message, "agent": "Nexo"}

        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(webhook_url, json=payload)
            return {
                "status": "SENT" if resp.status_code in (200, 204) else "FAILED",
                "status_code": resp.status_code,
                "webhook_url": webhook_url
            }
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}

async def call_custom_api(method: str, url: str, headers: Optional[Dict[str, str]] = None, json_body: Optional[Any] = None) -> Dict[str, Any]:
    """Calls any external REST API with customizable method, headers, and body."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.request(method=method.upper(), url=url, headers=headers or {}, json=json_body)
            try:
                body = resp.json()
            except Exception:
                body = resp.text[:1000]
            return {
                "status": "SUCCESS" if resp.status_code < 400 else "ERROR",
                "status_code": resp.status_code,
                "response": body
            }
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
