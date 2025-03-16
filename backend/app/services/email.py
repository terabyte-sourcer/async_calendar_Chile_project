import logging
from pathlib import Path
from typing import Any, Dict, Optional

import aiosmtplib
from fastapi import BackgroundTasks
from fastapi.templating import Jinja2Templates
from pydantic import EmailStr

from app.core.config import settings

templates = Jinja2Templates(directory=str(Path(__file__).parent / "email_templates"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def send_email(
    email_to: EmailStr,
    subject_template: str = "",
    html_template: str = "",
    environment: Dict[str, Any] = {},
) -> None:
    """
    Send an email using the SMTP server
    """
    if not settings.SMTP_HOST or not settings.SMTP_PORT:
        logger.warning("SMTP settings not configured, email not sent")
        return

    message = {
        "From": settings.EMAILS_FROM_EMAIL,
        "To": email_to,
        "Subject": subject_template,
        "Content-Type": "text/html",
    }

    try:
        smtp = aiosmtplib.SMTP(
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            use_tls=settings.SMTP_TLS,
        )
        await smtp.connect()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        await smtp.send_message(message)
        await smtp.quit()
    except Exception as e:
        logger.error(f"Error sending email: {e}")


def send_verification_email(email_to: str, token: str) -> None:
    """
    Send a verification email to a user
    """
    verification_url = f"{settings.SERVER_HOST}/api/auth/verify-email/{token}"
    subject = "Verify your email address"
    
    # In a real implementation, you would use a template
    html_content = f"""
    <html>
        <body>
            <p>Hi,</p>
            <p>Please verify your email address by clicking on the link below:</p>
            <p><a href="{verification_url}">{verification_url}</a></p>
            <p>If you didn't request this, you can ignore this email.</p>
        </body>
    </html>
    """
    
    # Send the email in the background
    background_tasks = BackgroundTasks()
    background_tasks.add_task(
        send_email,
        email_to=email_to,
        subject_template=subject,
        html_template=html_content,
    ) 