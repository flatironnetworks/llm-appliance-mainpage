# Contact Form Backend Setup Guide

## Overview

This project uses **Cloudflare Workers** exclusively for form handling.

## Current Form Functionality

The contact form on the landing page:
1. **Collects data** from these fields:
   - Name
   - Email
   - Company
   - Role
   - Message (use case description)

2. **Sends data** to Cloudflare Worker
3. **Shows success message** after successful submission

## Setup Instructions

**See `CLOUDFLARE_WORKER_SETUP.md` for complete setup instructions.**

Quick steps:
1. Create a Cloudflare Worker using `worker.js`
2. Update the Worker URL in `script.js`
3. (Optional) Configure email notifications, database, or webhooks

## Backend Configuration Options (Cloudflare Workers Only)

### Option 1: Cloudflare Workers (Recommended for Cloudflare Pages)

Since you're using Cloudflare Pages, Cloudflare Workers is the most integrated solution.

#### Setup Steps:

1. **Create a Worker** in your Cloudflare dashboard:
   - Go to Workers & Pages → Create → Worker
   - Name it something like `llm-appliance-form-handler`

2. **Worker Code** (JavaScript):
```javascript
export default {
  async fetch(request) {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse the form data
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.company || !data.message) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Send email notification (using a service like SendGrid, Mailgun, etc.)
    // Or store in a database (like Cloudflare D1, Airtable, etc.)
    
    // Example: Send to email service
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'your-email@example.com' }],
          subject: `New POC Request from ${data.name}`
        }],
        from: { email: 'noreply@yourdomain.com' },
        content: [{
          type: 'text/plain',
          value: `
New POC Request:
Name: ${data.name}
Email: ${data.email}
Company: ${data.company}
Role: ${data.role}
Message: ${data.message}
          `
        }]
      })
    });

    if (emailResponse.ok) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response('Error sending email', { status: 500 });
    }
  }
}
```

3. **Update `script.js`** to send to your Worker:
```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/contact', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

4. **Deploy the Worker** and get its URL

5. **Update the form handler** in `script.js` (uncomment and modify the fetch call)

---

### Option 2: Webhook Service (Simplest)

Use a service like:
- **Formspree** (https://formspree.io)
- **FormSubmit** (https://formsubmit.co)
- **Web3Forms** (https://web3forms.com)

#### Setup with Formspree:

1. **Sign up** at formspree.io
2. **Create a form** and get your endpoint URL
3. **Update `script.js`**:
```javascript
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

**Pros**: No backend code needed, handles spam protection, email notifications
**Cons**: May have usage limits on free tier

---

### Option 3: Serverless Function (Vercel, Netlify, etc.)

If you're using a different hosting platform, use their serverless functions.

#### Example: Vercel Serverless Function

Create `api/contact.js`:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, role, message } = req.body;

  // Send email or save to database
  // ...

  res.status(200).json({ success: true });
}
```

---

### Option 4: Custom Backend API

If you have an existing backend:

1. **Create an endpoint** (e.g., `/api/contact` or `/contact`)
2. **Update `script.js`** to point to your endpoint
3. **Handle CORS** if needed (add CORS headers to your API response)

---

## Recommended Implementation Steps

### For Cloudflare Pages (Recommended):

1. **Create Cloudflare Worker** for form handling
2. **Set up email service** (SendGrid, Mailgun, or use Cloudflare Email Routing)
3. **Update `script.js`** with your Worker URL
4. **Test the form** submission

### Quick Start with Formspree (Easiest):

1. Go to https://formspree.io and create account
2. Create a new form
3. Copy your form endpoint URL
4. Update the fetch URL in `script.js`:
   ```javascript
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
       },
       body: JSON.stringify(data)
   });
   ```
5. Uncomment the fetch code in `script.js` and remove the console.log

---

## Current Code Location

The form handler is in `script.js` starting at line 69. Look for the commented-out fetch code around lines 94-109.

## Security Considerations

1. **Rate Limiting**: Implement rate limiting to prevent spam
2. **Validation**: Validate email format, required fields on backend
3. **CORS**: Configure CORS properly if using external API
4. **Spam Protection**: Consider adding reCAPTCHA or similar
5. **HTTPS**: Always use HTTPS for form submissions

## Testing

After setting up your backend:
1. Fill out the form on your site
2. Check that data reaches your backend
3. Verify email notifications (if configured)
4. Test error handling (try submitting with missing fields)

---

## Need Help?

- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Formspree docs: https://help.formspree.io/
- Cloudflare Email Routing: https://developers.cloudflare.com/email-routing/
