# Complete Worker Setup Guide

## ⚠️ IMPORTANT: Security First

**Never commit secrets to git!** The `wrangler.toml` file should only contain comments, not actual secret values.

## Step 1: Set All Secrets

Run these commands in PowerShell (from the `worker` directory):

```powershell
cd worker

# Required: Turnstile Secret Key
wrangler secret put TURNSTILE_SECRET_KEY
# Paste your Turnstile secret key when prompted (starts with 0x4AAAAAA...)

# Email Configuration
wrangler secret put SENDGRID_API_KEY
# Paste your SendGrid API key when prompted (starts with SG....)

wrangler secret put NOTIFICATION_EMAIL
# Enter the email address to receive notifications (e.g., your-email@example.com)

wrangler secret put FROM_EMAIL
# Enter the email address to send from (must be verified in SendGrid)

# Optional: Discord Webhook
wrangler secret put WEBHOOK_URL
# Paste your Discord webhook URL when prompted
```

## Step 2: Verify Turnstile Site Key

The Turnstile site key is already configured in `index.html`:
- Site Key: `0x4AAAAAACKjqbiEHC-qAzbn` ✅

This is correct and doesn't need to be changed.

## Step 3: Deploy the Worker

```powershell
wrangler deploy
```

## Step 4: Update Frontend

1. **Get your Worker URL** from the deployment output
   - It will look like: `https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev`

2. **Update `script.js`** in the root directory:
   - Find: `https://YOUR_WORKER_URL.workers.dev/contact`
   - Replace with your actual Worker URL

## Step 5: Test

1. Visit your website
2. Fill out the contact form
3. Complete the Turnstile challenge
4. Submit the form
5. Check:
   - Email received at `rob@flatironnetworks.com`
   - Discord webhook notification (if configured)
   - Worker logs in Cloudflare Dashboard

## Troubleshooting

### "Turnstile verification failed"
- Verify `TURNSTILE_SECRET_KEY` is set correctly
- Check that the site key in `index.html` matches your Turnstile site

### "Email not received"
- Check spam folder
- Verify SendGrid API key is correct
- Verify `FROM_EMAIL` is verified in SendGrid
- Check worker logs for errors

### "Worker not responding"
- Verify Worker URL is correct in `script.js`
- Check worker logs in Cloudflare Dashboard
- Ensure worker is deployed and active

## Security Checklist

- [ ] All secrets set using `wrangler secret put` (not in wrangler.toml)
- [ ] `wrangler.toml` contains only comments, no actual values
- [ ] Worker URL updated in `script.js`
- [ ] Turnstile site key verified in `index.html`
- [ ] Test form submission works
- [ ] Email notifications working
- [ ] Discord webhook working (if configured)
