# Fix Custom Domain Setup

## Problem

The custom domain `form.llmappliance.com` is returning a 522 error (connection timeout), which means it's not properly routing to the Worker.

## Solution

Custom domains in Cloudflare Workers need to be configured in the **Cloudflare Dashboard**, not just in `wrangler.toml`.

## Steps to Fix

1. **Go to Cloudflare Dashboard**:
   - Navigate to: Workers & Pages → `llm-appliance-form-handler`
   - Click on the Worker name

2. **Add Custom Domain**:
   - Go to: Settings → Triggers
   - Scroll to "Custom Domains" section
   - Click "Add Custom Domain"
   - Enter: `form.llmappliance.com`
   - Click "Add Custom Domain"

3. **Cloudflare will automatically**:
   - Create DNS CNAME record
   - Provision SSL certificate
   - Route traffic to your Worker

4. **Wait 2-5 minutes** for DNS/SSL to propagate

5. **Test**:
   ```powershell
   Invoke-WebRequest -Uri "https://form.llmappliance.com" -Method OPTIONS
   ```
   Should return 204 (not 522)

6. **Update script.js**:
   Once the custom domain is working, change back to:
   ```javascript
   const workerUrl = 'https://form.llmappliance.com';
   ```

## Current Status

- ✅ Worker deployed and working at: `https://llm-appliance-form-handler.rob-fauls-holdings-llc.workers.dev`
- ✅ CORS headers configured correctly
- ⏳ Custom domain needs dashboard configuration
- ✅ Frontend temporarily using workers.dev URL (works immediately)

## Why This Happens

The `routes` configuration in `wrangler.toml` is for **zone routes** (when the domain is in the same Cloudflare account and zone). For **custom domains** (subdomains or separate domains), you must add them through the dashboard.

## Alternative: Use Zone Route

If `llmappliance.com` is in your Cloudflare account, you can use a zone route instead:

1. Remove custom domain from dashboard
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "form.llmappliance.com/*", zone_name = "llmappliance.com" }
   ]
   ```
3. Redeploy: `wrangler deploy`

But the dashboard method is simpler and recommended.
