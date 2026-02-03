# Setting Up a Custom Domain for Cloudflare Worker

## Overview

You can use a custom domain (like `api.llmappliance.com`) instead of the default `workers.dev` subdomain for your Worker.

## Prerequisites

- Your domain must be on Cloudflare (DNS managed by Cloudflare)
- Worker must be deployed

## Option 1: Using Wrangler CLI (Recommended)

### Step 1: Add Custom Domain to wrangler.toml

Edit `worker/wrangler.toml` and add:

```toml
name = "llm-appliance-form-handler"
main = "worker.js"
compatibility_date = "2024-01-01"

# Custom domain configuration
routes = [
  { pattern = "api.llmappliance.com", custom_domain = true }
]

# Or use a route pattern:
# routes = [
#   { pattern = "api.llmappliance.com/contact", custom_domain = true }
# ]
```

### Step 2: Deploy

```powershell
cd worker
wrangler deploy
```

Wrangler will automatically:
- Create the DNS record (CNAME)
- Configure the route
- Set up SSL/TLS

## Option 2: Using Cloudflare Dashboard

### Step 1: Add Custom Domain

1. Go to **Cloudflare Dashboard** → **Workers & Pages**
2. Click on your worker: `llm-appliance-form-handler`
3. Go to **Settings** → **Triggers**
4. Scroll to **Custom Domains** section
5. Click **Add Custom Domain**
6. Enter your domain (e.g., `api.llmappliance.com`)
7. Click **Add Custom Domain**

### Step 2: Verify DNS

Cloudflare will automatically create the necessary DNS records. Verify:
- Go to **DNS** → **Records**
- You should see a CNAME record for your subdomain pointing to the worker

## Option 3: Manual DNS Configuration

If you prefer to set up DNS manually:

1. **Create CNAME Record**:
   - Type: `CNAME`
   - Name: `api` (or your subdomain)
   - Target: `llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev`
   - Proxy status: Proxied (orange cloud)

2. **Add Route in Worker**:
   - Go to Worker → **Settings** → **Triggers**
   - Add route: `api.llmappliance.com/*`

## Recommended Setup

For the contact form, a good setup would be:

**Option A: API Subdomain**
- Domain: `api.llmappliance.com`
- Full URL: `https://api.llmappliance.com`

**Option B: Path on Main Domain**
- Domain: `llmappliance.com`
- Route: `llmappliance.com/api/*`
- Full URL: `https://llmappliance.com/api`

## Update script.js

After setting up the custom domain, update `script.js`:

```javascript
const workerUrl = 'https://api.llmappliance.com';
// Or if using path routing:
// const workerUrl = 'https://llmappliance.com/api';
```

## SSL/TLS

Cloudflare automatically provides SSL/TLS certificates for custom domains. No additional configuration needed.

## Testing

1. Test the custom domain:
   ```powershell
   curl https://api.llmappliance.com
   ```
   Should return "Method not allowed" (expected for GET request)

2. Test from your website:
   - Update `script.js` with the new URL
   - Submit the form
   - Check that it works

## Troubleshooting

### "Host header not configured"
- Make sure the route is added in Worker settings
- Verify DNS record is created and proxied

### SSL Certificate Issues
- Wait a few minutes for Cloudflare to provision the certificate
- Check SSL/TLS settings in Cloudflare Dashboard

### DNS Not Resolving
- Verify CNAME record is created
- Check that proxy is enabled (orange cloud)
- Wait for DNS propagation (usually instant with Cloudflare)

## Benefits of Custom Domain

1. **Professional**: Cleaner URLs (`api.llmappliance.com` vs `worker.workers.dev`)
2. **Branding**: Matches your main domain
3. **Flexibility**: Can use subdomains or paths
4. **SSL**: Automatic SSL/TLS from Cloudflare

## Example Configuration

For `api.llmappliance.com`:

**wrangler.toml:**
```toml
name = "llm-appliance-form-handler"
main = "worker.js"
compatibility_date = "2024-01-01"

routes = [
  { pattern = "api.llmappliance.com", custom_domain = true }
]
```

**script.js:**
```javascript
const workerUrl = 'https://api.llmappliance.com';
```
