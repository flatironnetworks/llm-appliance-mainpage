# Deploying the Cloudflare Worker

## Option 1: Using Wrangler CLI (Recommended)

### Prerequisites
1. Install Node.js (v18 or later)
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Login to Cloudflare:
   ```bash
   wrangler login
   ```

### Deploy the Worker

1. **Navigate to the worker directory**:
   ```bash
   cd worker
   ```

2. **Deploy the worker**:
   ```bash
   wrangler deploy
   ```

3. **Set environment variables** (after first deployment):
   ```bash
   # Turnstile secret key (required)
   wrangler secret put TURNSTILE_SECRET_KEY
   
   # Optional: SendGrid API key for email notifications
   wrangler secret put SENDGRID_API_KEY
   
   # Optional: Notification email
   wrangler secret put NOTIFICATION_EMAIL
   
   # Optional: From email
   wrangler secret put FROM_EMAIL
   
   # Optional: Webhook URL
   wrangler secret put WEBHOOK_URL
   ```

4. **Get your Worker URL**:
   After deployment, Wrangler will show you the Worker URL, something like:
   `https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev`

5. **Update the frontend**:
   - Open `script.js` in the root directory
   - Replace `YOUR_WORKER_URL` with your actual Worker URL

## Option 2: Using Cloudflare Dashboard

1. **Go to Cloudflare Dashboard** → **Workers & Pages** → **Create** → **Worker**

2. **Copy the code**:
   - Copy the contents of `worker.js` from the root directory
   - Paste into the Worker editor

3. **Save and Deploy**

4. **Add environment variables**:
   - Go to Worker settings → **Variables**
   - Add each secret as an environment variable:
     - `TURNSTILE_SECRET_KEY` (required)
     - `SENDGRID_API_KEY` (optional)
     - `NOTIFICATION_EMAIL` (optional)
     - `FROM_EMAIL` (optional)
     - `WEBHOOK_URL` (optional)

5. **Get your Worker URL** and update `script.js` as above

## Option 3: Using GitHub Actions (CI/CD)

Create `.github/workflows/deploy-worker.yml`:

```yaml
name: Deploy Worker

on:
  push:
    branches:
      - main
    paths:
      - 'worker/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g wrangler
      - run: wrangler deploy
        working-directory: ./worker
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Testing the Worker

After deployment, test with:

```bash
curl -X POST https://YOUR_WORKER_URL.workers.dev/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "role": "Developer",
    "message": "Test message",
    "cf-turnstile-response": "test-token"
  }'
```

## Troubleshooting

### "Authentication required"
- Run `wrangler login` to authenticate

### "Secret not found"
- Make sure you've set the required secrets using `wrangler secret put`

### CORS errors
- The worker already handles CORS, but verify the `Access-Control-Allow-Origin` header is set

### Worker not responding
- Check Worker logs in Cloudflare Dashboard
- Verify the Worker URL is correct in `script.js`
