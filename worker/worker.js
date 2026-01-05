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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
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
      if (!data.name || !data.email || !data.company || !data.message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }), 
          { 
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
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

      // Option 1: Send email notification using Cloudflare Email Routing or external service
      // Option 2: Store in Cloudflare D1 database
      // Option 3: Send to webhook (Slack, Discord, etc.)
      
      // Example: Send email via SendGrid (requires SENDGRID_API_KEY in env)
      if (env.SENDGRID_API_KEY) {
        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: env.NOTIFICATION_EMAIL || 'your-email@example.com' }],
              subject: `New LLM Appliance POC Request from ${data.name}`
            }],
            from: { email: env.FROM_EMAIL || 'noreply@yourdomain.com' },
            content: [{
              type: 'text/html',
              value: `
                <h2>New POC Request</h2>
                <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
                <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
                <p><strong>Role:</strong> ${escapeHtml(data.role || 'Not provided')}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
              `
            }]
          })
        });

        if (!emailResponse.ok) {
          console.error('SendGrid error:', await emailResponse.text());
        }
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
          await fetch(env.WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: `New POC Request from ${data.name} (${data.email}) at ${data.company}`,
              attachments: [{
                color: 'good',
                fields: [
                  { title: 'Name', value: data.name, short: true },
                  { title: 'Email', value: data.email, short: true },
                  { title: 'Company', value: data.company, short: true },
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
