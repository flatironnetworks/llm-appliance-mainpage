# Cloudflare Turnstile Setup Guide

## Overview

Cloudflare Turnstile has been integrated into the contact form to prevent spam and bot submissions.

## Setup Steps

### 1. Get Your Turnstile Site Key

1. **Go to Cloudflare Dashboard**
   - Navigate to **Security** → **Turnstile**
   - Click **Add Site**

2. **Configure Your Site**
   - **Site name**: LLM Appliance Landing Page
   - **Domain**: Your domain (e.g., `yourdomain.com`)
   - **Widget mode**: Choose "Managed" (recommended) or "Non-interactive"
   - Click **Create**

3. **Copy Your Site Key**
   - You'll see a **Site Key** and **Secret Key**
   - Copy the **Site Key** (you'll need this for the frontend)
   - Copy the **Secret Key** (you'll need this for the backend/worker)

### 2. Update the HTML

1. **Open `index.html`**
2. **Find the Turnstile widget** (around line 363):
   ```html
   <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>
   ```
3. **Replace `YOUR_TURNSTILE_SITE_KEY`** with your actual site key

### 3. Update the Cloudflare Worker

1. **Open `worker.js`**
2. **Add Turnstile verification** in the worker code
3. **Add the Secret Key** as an environment variable in Cloudflare Dashboard

#### Updated Worker Code Section:

Add this after parsing the form data (around line 40):

```javascript
// Verify Turnstile token
if (data['cf-turnstile-response']) {
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: data['cf-turnstile-response'],
            remoteip: request.headers.get('CF-Connecting-IP') || ''
        })
    });

    const turnstileResult = await turnstileResponse.json();
    
    if (!turnstileResult.success) {
        return new Response(
            JSON.stringify({ error: 'Turnstile verification failed' }), 
            { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
} else {
    return new Response(
        JSON.stringify({ error: 'Turnstile token missing' }), 
        { 
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
    );
}
```

### 4. Add Environment Variable to Worker

1. **In Cloudflare Dashboard** → Your Worker → **Settings** → **Variables**
2. **Add environment variable**:
   - **Variable name**: `TURNSTILE_SECRET_KEY`
   - **Value**: Your Turnstile Secret Key (from step 1)

### 5. Test the Integration

1. **Fill out the form** on your site
2. **Complete the Turnstile challenge** (if in managed mode)
3. **Submit the form**
4. **Verify** that:
   - Form submits successfully
   - Worker receives the Turnstile token
   - Worker verifies the token with Cloudflare

## Widget Modes

### Managed Mode (Recommended)
- Shows a challenge only when Cloudflare detects suspicious activity
- Most users won't see anything
- Best user experience

### Non-Interactive Mode
- Always shows a challenge
- More secure but less user-friendly
- Good for high-security applications

## Troubleshooting

### Turnstile widget not showing
- Verify the script is loaded: Check browser console for errors
- Verify site key is correct
- Check that the domain matches your Turnstile configuration

### Verification failing
- Verify secret key is correct in worker environment variables
- Check worker logs for specific error messages
- Ensure the token is being sent from the frontend

### CORS errors
- The worker already handles CORS, but verify the `Access-Control-Allow-Origin` header is set

## Security Notes

1. **Never expose your Secret Key** in frontend code
2. **Always verify tokens server-side** (in the worker)
3. **Use environment variables** for secret keys
4. **Monitor Turnstile analytics** in Cloudflare Dashboard for suspicious activity

## Additional Resources

- Cloudflare Turnstile Docs: https://developers.cloudflare.com/turnstile/
- Turnstile API Reference: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
