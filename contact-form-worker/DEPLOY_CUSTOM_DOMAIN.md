# Deploy Worker with Custom Domain

## Setup Complete

The Worker is configured to use `form.llmappliance.com` as the custom domain.

## Deployment Steps

1. **Deploy the Worker**:
   ```powershell
   cd worker
   wrangler deploy
   ```

2. **Wrangler will automatically**:
   - Create the DNS CNAME record for `form.llmappliance.com`
   - Configure the route
   - Set up SSL/TLS certificate
   - Make the domain live

3. **Verify DNS** (after deployment):
   - Go to Cloudflare Dashboard → **DNS** → **Records**
   - You should see a CNAME record:
     - Type: `CNAME`
     - Name: `form`
     - Target: `llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev`
     - Proxy: Proxied (orange cloud)

4. **Test the Domain**:
   ```powershell
   curl https://form.llmappliance.com
   ```
   Should return "Method not allowed" (expected for GET request)

5. **Test the Form**:
   - Visit your website
   - Submit the contact form
   - It should now use `https://form.llmappliance.com`

## Troubleshooting

### "Host header not configured"
- Wait a few minutes after deployment
- Verify the route appears in Worker → Settings → Triggers → Custom Domains

### SSL Certificate Issues
- Cloudflare automatically provisions SSL certificates
- Wait 2-5 minutes after first deployment
- Check SSL/TLS settings in Cloudflare Dashboard

### DNS Not Resolving
- Verify CNAME record exists in DNS
- Ensure proxy is enabled (orange cloud)
- DNS propagation is usually instant with Cloudflare

## Current Configuration

- **Worker Name**: `llm-appliance-form-handler`
- **Custom Domain**: `form.llmappliance.com`
- **Frontend URL**: Updated in `script.js` to use `https://form.llmappliance.com`

## After Deployment

The form will automatically use the new domain. No changes needed to the frontend code (already updated in `script.js`).
