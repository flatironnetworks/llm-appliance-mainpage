# Email Configuration Guide

This guide explains how to configure email notifications for form submissions.

## Current Email Setup

The worker currently supports **SendGrid** for sending emails. You can also add other email services.

## Option 1: SendGrid (Current Implementation)

### Setup Steps

1. **Create SendGrid Account**
   - Sign up at https://sendgrid.com
   - Free tier includes 100 emails/day

2. **Create API Key**
   - Go to SendGrid Dashboard → **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it (e.g., "LLM Appliance Worker")
   - Select **Full Access** or **Restricted Access** with "Mail Send" permission
   - Copy the API key (you'll only see it once!)

3. **Verify Sender Email**
   - Go to **Settings** → **Sender Authentication**
   - Verify a single sender or authenticate your domain
   - This is required for the `FROM_EMAIL`

4. **Set Environment Variables in Worker**

   Using Wrangler CLI:
   ```powershell
   cd worker
   
   # Required: SendGrid API Key
   wrangler secret put SENDGRID_API_KEY
   # Paste your SendGrid API key when prompted
   
   # Required: Email to receive notifications
   wrangler secret put NOTIFICATION_EMAIL
   # Enter: your-email@example.com
   
   # Required: Email to send from (must be verified in SendGrid)
   wrangler secret put FROM_EMAIL
   # Enter: noreply@yourdomain.com (or your verified email)
   ```

5. **Test the Configuration**
   - Submit a test form on your website
   - Check your email inbox for the notification

### Email Template

The current email template includes:
- Subject: "New LLM Appliance POC Request from [Name]"
- HTML formatted email with:
  - Name
  - Email
  - Company
  - Role
  - Message

## Option 2: Cloudflare Email Routing (Free Alternative)

Cloudflare Email Routing is free and works if your domain is on Cloudflare.

### Setup Steps

1. **Enable Email Routing**
   - In Cloudflare Dashboard → **Email** → **Email Routing**
   - Click **Get Started**
   - Add your domain (if not already added)

2. **Create Destination Address**
   - Go to **Routing** → **Destination addresses**
   - Click **Create address**
   - Add your email (e.g., `notifications@yourdomain.com`)

3. **Create Routing Rule**
   - Go to **Routing** → **Routing rules**
   - Create a rule to forward emails to your destination

4. **Update Worker Code**

   Replace the SendGrid section in `worker.js` with:

   ```javascript
   // Send email via Cloudflare Email Routing
   if (env.EMAIL_ROUTING_ENABLED) {
     const emailResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/email/routing/addresses/${env.EMAIL_DESTINATION}/send`, {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         to: env.NOTIFICATION_EMAIL,
         from: env.FROM_EMAIL,
         subject: `New LLM Appliance POC Request from ${data.name}`,
         html: `
           <h2>New POC Request</h2>
           <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
           <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
           <p><strong>Role:</strong> ${escapeHtml(data.role || 'Not provided')}</p>
           <p><strong>Message:</strong></p>
           <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
         `
       })
     });
   }
   ```

## Option 3: Mailgun

### Setup Steps

1. **Create Mailgun Account**
   - Sign up at https://www.mailgun.com
   - Free tier includes 5,000 emails/month for 3 months

2. **Get API Key**
   - Go to **Sending** → **Domain Settings**
   - Copy your API key

3. **Update Worker Code**

   Add this to `worker.js`:

   ```javascript
   // Send email via Mailgun
   if (env.MAILGUN_API_KEY) {
     const mailgunDomain = env.MAILGUN_DOMAIN; // e.g., "mg.yourdomain.com"
     const emailResponse = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
       method: 'POST',
       headers: {
         'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: new URLSearchParams({
         from: env.FROM_EMAIL,
         to: env.NOTIFICATION_EMAIL,
         subject: `New LLM Appliance POC Request from ${data.name}`,
         html: `
           <h2>New POC Request</h2>
           <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
           <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
           <p><strong>Role:</strong> ${escapeHtml(data.role || 'Not provided')}</p>
           <p><strong>Message:</strong></p>
           <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
         `
       })
     });
   }
   ```

4. **Set Environment Variables**:
   ```powershell
   wrangler secret put MAILGUN_API_KEY
   wrangler secret put MAILGUN_DOMAIN
   wrangler secret put NOTIFICATION_EMAIL
   wrangler secret put FROM_EMAIL
   ```

## Option 4: SMTP (Using Nodemailer via Worker)

For custom SMTP servers, you'd need to use a library. This requires bundling, which is more complex.

## Customizing Email Content

To customize the email template, edit the `value` field in the email content section of `worker.js` (around line 129):

```javascript
value: `
  <h2>New POC Request</h2>
  <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
  <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
  <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
  <p><strong>Role:</strong> ${escapeHtml(data.role || 'Not provided')}</p>
  <p><strong>Message:</strong></p>
  <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
  
  <!-- Add custom content here -->
  <hr>
  <p><small>This email was sent from the LLM Appliance contact form.</small></p>
`
```

## Testing Email Configuration

1. **Deploy the worker** with your email configuration
2. **Submit a test form** on your website
3. **Check your email** (and spam folder)
4. **Check worker logs** in Cloudflare Dashboard if email doesn't arrive

## Troubleshooting

### Email not received
- Check spam/junk folder
- Verify `FROM_EMAIL` is verified in SendGrid
- Check worker logs in Cloudflare Dashboard
- Verify environment variables are set correctly

### SendGrid errors
- Verify API key has "Mail Send" permission
- Ensure sender email is verified
- Check SendGrid activity logs

### Rate limits
- SendGrid free tier: 100 emails/day
- Mailgun free tier: 5,000 emails/month (first 3 months)
- Consider upgrading if you expect high volume

## Recommended Setup

For most use cases, **SendGrid** is recommended because:
- Easy to set up
- Free tier available (100 emails/day)
- Reliable delivery
- Good documentation
- Works well with Cloudflare Workers

## Next Steps

1. Choose your email service (SendGrid recommended)
2. Set up the service account
3. Set environment variables using `wrangler secret put`
4. Test with a form submission
5. Customize email template if needed
