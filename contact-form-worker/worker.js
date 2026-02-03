/**
 * Cloudflare Worker for LLM Appliance Contact Form
 * 
 * Deploy this worker in your Cloudflare dashboard:
 * 1. Go to Workers & Pages → Create → Worker
 * 2. Paste this code
 * 3. Add environment variables (see below)
 * 4. Deploy and copy the worker URL
 * 5. Update the fetch URL in script.js
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the form data
      const data = await request.json();
      
      // Validate required fields
      if (!data.name || !data.email || !data.request_type || !data.message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

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
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      // Send email via internal SMTP relay (behind Cloudflare Zero Trust)
      try {
        const relayUrl = env.SMTP_RELAY_URL || 'https://smtp-relay.llmappliance.net/send';

        // Build request headers
        const headers = {
          'Content-Type': 'application/json',
        };

        // Add CF Access Service Token if configured
        if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
          headers['CF-Access-Client-Id'] = env.CF_ACCESS_CLIENT_ID;
          headers['CF-Access-Client-Secret'] = env.CF_ACCESS_CLIENT_SECRET;
        }

        // Add API secret if configured (backup auth layer)
        if (env.RELAY_API_SECRET) {
          headers['X-API-Secret'] = env.RELAY_API_SECRET;
        }

        const requestTypeLabel = getRequestTypeLabel(data.request_type);
        const emailResponse = await fetch(relayUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: env.NOTIFICATION_EMAIL || 'contact@llmappliance.com',
            from_email: env.FROM_EMAIL || 'noreply@llmappliance.com',
            from_name: 'LLM Appliance Contact Form',
            reply_to: data.email,
            reply_to_name: data.name,
            subject: `[${requestTypeLabel}] ${data.name}`,
            html: `
              <h2>${escapeHtml(requestTypeLabel)}</h2>
              <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
              <p><strong>Company:</strong> ${escapeHtml(data.company || 'Not provided')}</p>
              <p><strong>Role:</strong> ${escapeHtml(data.role || 'Not provided')}</p>
              <p><strong>Message:</strong></p>
              <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
            `
          })
        });

        if (!emailResponse.ok) {
          console.error('SMTP Relay error:', await emailResponse.text());
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      // Example: Store in Cloudflare D1 database (requires D1 database binding)
      if (env.DB) {
        try {
          await env.DB.prepare(
            `INSERT INTO contact_submissions (name, email, company, role, message, submitted_at) 
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            data.name,
            data.email,
            data.company,
            data.role || '',
            data.message,
            new Date().toISOString()
          ).run();
        } catch (dbError) {
          console.error('Database error:', dbError);
          // Don't fail the request if DB write fails
        }
      }

      // Example: Send to webhook (Slack, Discord, etc.)
      if (env.WEBHOOK_URL) {
        try {
          const webhookRequestType = getRequestTypeLabel(data.request_type);
          await fetch(env.WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: `New ${webhookRequestType} from ${data.name} (${data.email}) at ${data.company || 'N/A'}`,
              attachments: [{
                color: 'good',
                fields: [
                  { title: 'Request Type', value: webhookRequestType, short: true },
                  { title: 'Name', value: data.name, short: true },
                  { title: 'Email', value: data.email, short: true },
                  { title: 'Company', value: data.company || 'Not provided', short: true },
                  { title: 'Role', value: data.role || 'Not provided', short: true },
                  { title: 'Message', value: data.message, short: false }
                ]
              }]
            })
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't fail the request if webhook fails
        }
      }

      // Return success response
      return new Response(
        JSON.stringify({ success: true, message: 'Form submitted successfully' }), 
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
  }
};

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Helper function to get readable request type label
function getRequestTypeLabel(type) {
  const labels = {
    'demo': 'Demo/POC Request',
    'pricing': 'Sales & Pricing',
    'general': 'General Inquiry'
  };
  return labels[type] || type;
}
