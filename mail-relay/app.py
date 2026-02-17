#!/usr/bin/env python3
"""
SMTP Relay for LLM Appliance Contact Form
Receives HTTP POST requests and sends emails via SMTP

Deploy behind Cloudflare Zero Trust for security.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify
from functools import wraps

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
SMTP_HOST = os.environ.get('SMTP_HOST', 'mail.flatironnetworks.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'true').lower() == 'true'

# Shared secret for authentication (backup layer beyond Zero Trust)
API_SECRET = os.environ.get('API_SECRET', '')

# Default email settings
DEFAULT_TO = os.environ.get('DEFAULT_TO', 'contact@llmappliance.com')
DEFAULT_FROM = os.environ.get('DEFAULT_FROM', 'noreply@llmappliance.com')


def require_auth(f):
    """Decorator to require API secret authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if API_SECRET:
            auth_header = request.headers.get('X-API-Secret', '')
            if auth_header != API_SECRET:
                logger.warning(f"Unauthorized request from {request.remote_addr}")
                return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/send', methods=['POST'])
@require_auth
def send_email():
    """
    Send email endpoint

    Expected JSON body:
    {
        "to": "recipient@example.com",  // optional, uses DEFAULT_TO
        "from_email": "sender@example.com",  // optional, uses DEFAULT_FROM
        "from_name": "Sender Name",  // optional
        "reply_to": "reply@example.com",  // optional
        "reply_to_name": "Reply Name",  // optional
        "subject": "Email Subject",
        "html": "<p>HTML content</p>",  // either html or text required
        "text": "Plain text content"  // either html or text required
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Validate required fields
        if not data.get('subject'):
            return jsonify({'error': 'Subject is required'}), 400

        if not data.get('html') and not data.get('text'):
            return jsonify({'error': 'Either html or text content is required'}), 400

        # Build the email
        to_email = data.get('to', DEFAULT_TO)
        from_email = data.get('from_email', DEFAULT_FROM)
        from_name = data.get('from_name', 'LLM Appliance Contact Form')

        msg = MIMEMultipart('alternative')
        msg['Subject'] = data['subject']
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = to_email

        # Add Reply-To if provided
        if data.get('reply_to'):
            reply_to_name = data.get('reply_to_name', '')
            if reply_to_name:
                msg['Reply-To'] = f"{reply_to_name} <{data['reply_to']}>"
            else:
                msg['Reply-To'] = data['reply_to']

        # Add content
        if data.get('text'):
            msg.attach(MIMEText(data['text'], 'plain'))
        if data.get('html'):
            msg.attach(MIMEText(data['html'], 'html'))

        # Send the email
        logger.info(f"Sending email to {to_email} with subject: {data['subject']}")

        try:
            if SMTP_USE_TLS:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
                server.starttls()
            else:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)

            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)

            server.sendmail(from_email, [to_email], msg.as_string())
            server.quit()

            logger.info(f"Email sent successfully to {to_email}")
            return jsonify({'success': True, 'message': 'Email sent successfully'})

        except smtplib.SMTPException as e:
            logger.error(f"SMTP error: {str(e)}")
            return jsonify({'error': f'SMTP error: {str(e)}'}), 500

    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Only for development - use gunicorn in production
    app.run(host='0.0.0.0', port=5000, debug=False)
