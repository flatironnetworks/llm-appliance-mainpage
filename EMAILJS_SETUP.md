# EmailJS Setup Guide

## Overview

The contact form now uses **EmailJS** to send emails directly from the browser, eliminating the need for a Cloudflare Worker or backend server.

## Why EmailJS?

- ✅ Works directly from the browser (no CORS issues)
- ✅ No backend server required
- ✅ Free tier available (200 emails/month)
- ✅ Easy setup and configuration
- ✅ Supports email templates

## Setup Steps

### 1. Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email address

### 2. Create Email Service

1. Go to **Email Services** in the dashboard
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for quick setup)
   - **Outlook**
   - **Custom SMTP** (for SendGrid, Mailgun, etc.)
4. Follow the setup wizard to connect your email account
5. **Copy the Service ID** (you'll need this)

### 3. Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template:

**Template Name:** LLM Appliance Contact Form

**Subject:** New POC Request from {{from_name}}

**Content:**
```
New LLM Appliance POC Request

Name: {{from_name}}
Email: {{from_email}}
Company: {{company}}
Role: {{role}}

Message:
{{message}}

---
This email was sent from the LLM Appliance contact form.
```

4. **Copy the Template ID** (you'll need this)

### 4. Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. **Copy the Public Key** (you'll need this)

### 5. Update script.js

Open `script.js` and replace these placeholders:

```javascript
// Line ~70: Initialize EmailJS
emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your EmailJS public key

// Line ~95: Send email
const emailjsResponse = await emailjs.send(
    'YOUR_SERVICE_ID',  // Replace with your EmailJS service ID
    'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
    emailParams
);
```

**Replace:**
- `YOUR_PUBLIC_KEY` → Your EmailJS public key
- `YOUR_SERVICE_ID` → Your EmailJS service ID
- `YOUR_TEMPLATE_ID` → Your EmailJS template ID

### 6. Update Notification Email (Optional)

In `script.js`, line ~88, you can change the recipient email:

```javascript
to_email: 'rob@flatironnetworks.com', // Change to your email
```

**Note:** The `to_email` parameter is only used if your email template uses it. If you configured the service to always send to a specific email, you can remove this parameter.

## Testing

1. Fill out the contact form on your website
2. Submit the form
3. Check your email inbox
4. You should receive the form submission

## Troubleshooting

### Form shows error
- Check browser console (F12) for error messages
- Verify all three IDs are correct in `script.js`
- Make sure EmailJS script is loaded (check Network tab)

### No email received
- Check EmailJS dashboard → **Logs** to see if email was sent
- Verify your email service is connected
- Check spam folder
- Verify template variables match ({{from_name}}, {{from_email}}, etc.)

### EmailJS not defined error
- Make sure EmailJS script is loaded in `index.html`
- Check that script loads before `script.js`

## Using SendGrid with EmailJS

If you want to use SendGrid as your email provider:

1. In EmailJS, choose **Custom SMTP** when creating a service
2. Use these SendGrid SMTP settings:
   - **Host:** `smtp.sendgrid.net`
   - **Port:** `587`
   - **Username:** `apikey`
   - **Password:** Your SendGrid API key
   - **From Email:** Your verified sender email
   - **From Name:** LLM Appliance

## Pricing

- **Free Tier:** 200 emails/month
- **Paid Plans:** Start at $15/month for 1,000 emails

## Security Notes

- EmailJS public keys are safe to expose in frontend code
- Service and template IDs are also safe to expose
- Your email service credentials are stored securely in EmailJS
- Consider rate limiting if you expect high traffic

## Next Steps

1. Complete the setup steps above
2. Test the form
3. Remove Worker files (optional):
   - `worker/` folder
   - `CLOUDFLARE_WORKER_SETUP.md`
   - `WORKER_URL_SETUP.md`
   - Other Worker-related documentation
