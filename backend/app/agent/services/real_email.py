import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

async def send_real_email(recipient: str, subject: str, body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
    """
    Dispatches a REAL email over the internet.
    Supports:
    1. Resend API (if RESEND_API_KEY is configured)
    2. Standard SMTP (if SMTP_HOST, SMTP_USER, SMTP_PASSWORD are configured)
    3. Test / Informational fallback if credentials are not yet configured.
    """
    resend_key = os.getenv("RESEND_API_KEY", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    sender = os.getenv("EMAIL_FROM") or os.getenv("SMTP_FROM") or (f"Nexo AI Worker <{smtp_user}>" if smtp_user else "Nexo AI Worker <onboarding@resend.dev>")

    # 1. Resend API
    if resend_key and resend_key not in ("dummy", "your_resend_api_key_here"):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": sender,
                        "to": [recipient],
                        "subject": subject,
                        "text": body,
                        "html": html_body or f"<pre style='font-family: sans-serif; white-space: pre-wrap;'>{body}</pre>"
                    }
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    return {
                        "status": "SENT",
                        "provider": "Resend API",
                        "message_id": data.get("id"),
                        "recipient": recipient,
                        "subject": subject,
                        "details": f"Real email dispatched via Resend API (ID: {data.get('id')})"
                    }
                else:
                    return {
                        "status": "FAILED",
                        "provider": "Resend API",
                        "error": f"Resend API returned {resp.status_code}: {resp.text}"
                    }
        except Exception as e:
            return {
                "status": "FAILED",
                "provider": "Resend API",
                "error": str(e)
            }

    # 2. Standard SMTP (Gmail, Outlook, Brevo, SendGrid, Mailtrap)
    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender
            msg["To"] = recipient

            part1 = MIMEText(body, "plain", "utf-8")
            msg.attach(part1)

            if html_body:
                part2 = MIMEText(html_body, "html", "utf-8")
                msg.attach(part2)

            context = ssl.create_default_context()
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender, [recipient], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls(context=context)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(sender, [recipient], msg.as_string())

            return {
                "status": "SENT",
                "provider": f"SMTP ({smtp_host})",
                "recipient": recipient,
                "subject": subject,
                "details": f"Real email dispatched via SMTP server {smtp_host} to {recipient}"
            }
        except Exception as e:
            return {
                "status": "FAILED",
                "provider": f"SMTP ({smtp_host})",
                "error": str(e)
            }

    # 3. Not configured notice
    return {
        "status": "UNCONFIGURED",
        "provider": "None",
        "recipient": recipient,
        "subject": subject,
        "details": (
            "Real email dispatch is ready! To deliver to a real inbox over the internet, "
            "provide either RESEND_API_KEY (free at resend.com) or SMTP credentials (e.g. Gmail App Password) in backend/.env."
        )
    }
