# URGENT: Deploy Worker to Fix CORS

## The Problem

You're getting CORS errors because the Worker hasn't been deployed with the CORS fixes yet.

## Quick Fix - Deploy Now

1. **Open PowerShell**:
   ```powershell
   cd D:\Git\llm-appliance-mainpage\worker
   ```

2. **Deploy the Worker**:
   ```powershell
   wrangler deploy
   ```

This will:
- Deploy the updated Worker with CORS fixes
- Set up the custom domain `form.llmappliance.com`
- Create DNS records automatically
- Fix the CORS errors

## What Gets Deployed

The Worker code includes:
- ✅ Proper CORS headers on all responses
- ✅ Status 204 for OPTIONS preflight requests
- ✅ Custom domain route for `form.llmappliance.com`
- ✅ All environment variables from `wrangler.toml`

## After Deployment

1. Wait 2-5 minutes for DNS/SSL to propagate
2. Test: `curl https://form.llmappliance.com` (should return "Method not allowed")
3. Test the form on your website - CORS errors should be gone

## Verify Deployment

Check Cloudflare Dashboard:
- Workers & Pages → Your Worker → Should show `form.llmappliance.com` in Custom Domains
- DNS → Records → Should see CNAME for `form` subdomain
