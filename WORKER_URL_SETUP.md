# Setting Up Your Worker URL

## The Problem

The contact form is trying to send data to `https://YOUR_WORKER_URL.workers.dev/contact`, which is a placeholder. You need to:

1. Deploy your Worker
2. Get the Worker URL
3. Update `script.js` with the real URL

## Step 1: Deploy the Worker

If you haven't deployed the worker yet:

```powershell
cd worker
wrangler deploy
```

After deployment, you'll see output like:
```
✨  Success! Published llm-appliance-form-handler
  https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev
```

Copy that URL!

## Step 2: Get Your Worker URL

### Option A: From Wrangler Output
After `wrangler deploy`, the URL is shown in the output.

### Option B: From Cloudflare Dashboard
1. Go to Cloudflare Dashboard → **Workers & Pages**
2. Click on your worker name (`llm-appliance-form-handler`)
3. The URL is shown at the top of the page

### Option C: List Workers
```powershell
wrangler deployments list
```

## Step 3: Update script.js

1. Open `script.js` in the root directory
2. Find line 91 (or search for `YOUR_WORKER_URL`)
3. Replace the placeholder with your actual Worker URL:

**Before:**
```javascript
const workerUrl = 'https://YOUR_WORKER_URL.workers.dev';
```

**After:**
```javascript
const workerUrl = 'https://llm-appliance-form-handler.YOUR_SUBDOMAIN.workers.dev';
```

Replace `YOUR_SUBDOMAIN` with your actual subdomain (usually your Cloudflare account subdomain).

## Step 4: Test

1. Save `script.js`
2. Commit and push to trigger Cloudflare Pages rebuild
3. Test the form on your live site
4. Check browser console (F12) for any errors

## Troubleshooting

### "Network error" message
- Verify Worker URL is correct (no typos)
- Check that Worker is deployed and active
- Verify Worker route handles `/contact` endpoint

### "Worker URL not configured" alert
- The placeholder is still in the code
- Update `script.js` with your actual Worker URL

### CORS errors
- Worker already handles CORS, but verify `Access-Control-Allow-Origin: *` header
- Check browser console for specific CORS error messages

### 404 Not Found
- Verify the Worker URL is correct
- Check that the route is `/contact` (not `/api/contact` or other)
- Verify Worker is deployed and active

## Quick Check

Your Worker URL should look like:
- ✅ `https://llm-appliance-form-handler.abc123.workers.dev`
- ❌ `https://YOUR_WORKER_URL.workers.dev` (placeholder)
- ❌ `https://workers.dev` (incomplete)

## Example

If your Worker URL is `https://llm-appliance-form-handler.abc123.workers.dev`:

```javascript
const workerUrl = 'https://llm-appliance-form-handler.abc123.workers.dev';
```

Then the form will POST to: `https://llm-appliance-form-handler.abc123.workers.dev/contact`
