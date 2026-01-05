# Cloudflare Worker Setup for Contact Form

## Overview

The contact form uses a Cloudflare Worker to handle form submissions. This guide walks you through setting it up.

## Step 1: Create the Worker

1. **Go to Cloudflare Dashboard**
   - Navigate to **Workers & Pages** → **Create** → **Worker**

2. **Name your worker**
   - Suggested name: `llm-appliance-form-handler`
   - Click **Deploy**

3. **Add the code**
   - Copy the contents of `worker.js` from this repository
   - Paste it into the worker editor
   - Click **Save and deploy**

4. **Get your Worker URL**
   - After deployment, you'll see a URL like: `https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev`
   - Copy this URL

## Step 2: Update the Frontend

1. **Open `script.js`** in your project
2. **Find the fetch URL** (around line 77)
3. **Replace** `https://YOUR_WORKER_URL.workers.dev/contact` with your actual worker URL

```javascript
const response = await fetch('https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev/contact', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

## Step 3: Configure Environment Variables (Optional)

The worker supports several optional features via environment variables:

### Option A: Email Notifications (SendGrid)

1. **Get SendGrid API Key**
   - Sign up at https://sendgrid.com
   - Create an API key with "Mail Send" permissions

2. **Add to Worker**
   - In Cloudflare Dashboard → Your Worker → Settings → Variables
   - Add environment variable:
     - **Variable name**: `SENDGRID_API_KEY`
     - **Value**: Your SendGrid API key
   - Add another variable:
     - **Variable name**: `NOTIFICATION_EMAIL`
     - **Value**: Email address to receive notifications
   - Add another variable:
     - **Variable name**: `FROM_EMAIL`
     - **Value**: Email address to send from (must be verified in SendGrid)

### Option B: Database Storage (Cloudflare D1)

1. **Create D1 Database**
   - In Cloudflare Dashboard → **Workers & Pages** → **D1**
   - Click **Create database**
   - Name it (e.g., `llm-appliance-contacts`)

2. **Create table** (run this SQL in D1):
```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT,
    message TEXT NOT NULL,
    submitted_at TEXT NOT NULL
);
```

3. **Bind database to Worker**
   - In Worker settings → **Variables** → **D1 Database Bindings**
   - Click **Add binding**
   - **Variable name**: `DB`
   - **Database**: Select your database

### Option C: Webhook Notifications (Slack, Discord, etc.)

1. **Get webhook URL**
   - For Slack: Create an Incoming Webhook in your workspace
   - For Discord: Create a webhook in your server settings

2. **Add to Worker**
   - In Worker settings → **Variables**
   - Add environment variable:
     - **Variable name**: `WEBHOOK_URL`
     - **Value**: Your webhook URL

## Step 4: Test the Form

1. **Deploy your updated frontend** to Cloudflare Pages
2. **Fill out the form** on your live site
3. **Check**:
   - Form shows success message
   - Email received (if SendGrid configured)
   - Database entry created (if D1 configured)
   - Webhook notification sent (if webhook configured)

## Troubleshooting

### Form shows error message
- Check browser console for errors
- Verify Worker URL is correct in `script.js`
- Check Worker logs in Cloudflare Dashboard → Workers → Your Worker → Logs

### No email received
- Verify SendGrid API key is correct
- Check SendGrid activity logs
- Verify `NOTIFICATION_EMAIL` and `FROM_EMAIL` are set correctly

### CORS errors
- The worker already handles CORS, but if you see errors:
  - Verify the worker is deployed and accessible
  - Check that the fetch URL matches exactly

### Database errors
- Verify D1 database is created and bound to worker
- Check that table exists with correct schema
- Review Worker logs for specific error messages

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent spam
   - Use Cloudflare's built-in rate limiting
   - Or implement custom rate limiting in the worker

2. **Input Validation**: The worker validates:
   - Required fields
   - Email format
   - You can add more validation as needed

3. **Environment Variables**: Never commit API keys or secrets to your repository
   - Always use Cloudflare's environment variables
   - Use different keys for production vs. development

## Advanced: Custom Domain

You can use a custom domain for your worker:

1. **Add Custom Domain** in Worker settings
2. **Update DNS** to point to your worker
3. **Update the fetch URL** in `script.js` to use your custom domain

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- SendGrid API Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
