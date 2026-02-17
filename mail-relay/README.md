# SMTP Relay for LLM Appliance Contact Form

HTTP-to-SMTP relay for the LLM Appliance website contact form.
Deploy on internal network behind Cloudflare Zero Trust.

## Quick Setup (Debian/Ubuntu LXC)

```bash
# 1. Install dependencies
apt update && apt install -y python3 python3-venv python3-pip

# 2. Create application directory
mkdir -p /opt/mail-relay
cd /opt/mail-relay

# 3. Copy files (from this directory)
# Copy: app.py, requirements.txt

# 4. Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Configure environment
# Edit /etc/systemd/system/mail-relay.service with your settings:
# - API_SECRET: Generate a secure random string
# - SMTP_USER/SMTP_PASS: If your PMG requires authentication

# 6. Install systemd service
cp mail-relay.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable mail-relay
systemctl start mail-relay

# 7. Check status
systemctl status mail-relay
journalctl -u mail-relay -f
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | mail.flatironnetworks.com | SMTP server hostname |
| `SMTP_PORT` | 587 | SMTP port |
| `SMTP_USE_TLS` | true | Use STARTTLS |
| `SMTP_USER` | (empty) | SMTP username (if required) |
| `SMTP_PASS` | (empty) | SMTP password (if required) |
| `DEFAULT_TO` | contact@llmappliance.com | Default recipient |
| `DEFAULT_FROM` | noreply@llmappliance.com | Default sender |
| `API_SECRET` | (empty) | Shared secret for auth |

## API Endpoints

### POST /send

Send an email.

**Headers:**
- `Content-Type: application/json`
- `X-API-Secret: <your-secret>` (if API_SECRET is configured)

**Body:**
```json
{
  "subject": "Email Subject",
  "html": "<p>HTML content</p>",
  "reply_to": "user@example.com",
  "reply_to_name": "User Name"
}
```

### GET /health

Health check endpoint. Returns `{"status": "ok"}`.

## Cloudflare Zero Trust Setup

1. Create a Cloudflare Tunnel to this container
2. Create an Access Application for `smtp-relay.llmappliance.net`
3. Add a Service Token policy (for the Worker to authenticate)
4. Configure the Worker with Service Token credentials

## Testing

```bash
# Test locally
curl -X POST http://localhost:5000/send \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: your-secret" \
  -d '{"subject":"Test","html":"<p>Test email</p>"}'

# Test health
curl http://localhost:5000/health
```
