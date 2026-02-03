# Setting Up Environment Variables (Secrets)

## ⚠️ SECURITY WARNING

**Never put actual secret values in `wrangler.toml` or commit them to git!**

Always use `wrangler secret put` to set secrets securely.

## Required Secrets

### 1. Turnstile Secret Key

```powershell
cd worker
wrangler secret put TURNSTILE_SECRET_KEY
```

When prompted, paste your Turnstile secret key (starts with `0x4AAAAAA...`).

## Email Configuration (SendGrid)

### 2. SendGrid API Key

```powershell
wrangler secret put SENDGRID_API_KEY
```

Paste your SendGrid API key when prompted (starts with `SG.`).

### 3. Notification Email

```powershell
wrangler secret put NOTIFICATION_EMAIL
```

Enter the email address where you want to receive form submissions (e.g., `rob@flatironnetworks.com`).

### 4. From Email

```powershell
wrangler secret put FROM_EMAIL
```

Enter the email address to send from (must be verified in SendGrid, e.g., `noreply@flatironnetworks.com`).

## Optional: Discord Webhook

### 5. Webhook URL

```powershell
wrangler secret put WEBHOOK_URL
```

Paste your Discord webhook URL when prompted.

## Complete Setup Script

Run all of these in order:

```powershell
cd worker

# Required: Turnstile
wrangler secret put TURNSTILE_SECRET_KEY

# Email configuration
wrangler secret put SENDGRID_API_KEY
wrangler secret put NOTIFICATION_EMAIL
wrangler secret put FROM_EMAIL

# Optional: Discord webhook
wrangler secret put WEBHOOK_URL
```

## Verify Secrets Are Set

To list all secrets (names only, not values):

```powershell
wrangler secret list
```

## Update a Secret

To update an existing secret, just run `wrangler secret put` again with the same variable name.

## Remove a Secret

```powershell
wrangler secret delete VARIABLE_NAME
```

## Notes

- Secrets are encrypted and stored securely by Cloudflare
- They are only accessible to your Worker at runtime
- Never commit secrets to git repositories
- If you accidentally committed secrets, rotate them immediately
