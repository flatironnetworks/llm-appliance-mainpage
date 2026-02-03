/**
 * Cloudflare Worker for LLM Appliance Contact Form
 *
 * Creates leads directly in Odoo via JSON-RPC API
 *
 * Environment Variables (wrangler.toml):
 *   ODOO_URL - Odoo instance URL
 *   ODOO_DATABASE - Odoo database name
 *
 * Secrets (wrangler secret put):
 *   ODOO_API_USER - Odoo username
 *   ODOO_API_PASSWORD - Odoo password
 *   TURNSTILE_SECRET_KEY - Cloudflare Turnstile secret
 *   WEBHOOK_URL - (optional) Slack/Discord webhook
 */

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(),
      });
    }

    try {
      // Parse the form data
      const data = await request.json();

      // Validate required fields
      if (!data.name || !data.email || !data.request_type || !data.message) {
        return jsonResponse({ error: 'Missing required fields' }, 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return jsonResponse({ error: 'Invalid email format' }, 400);
      }

      // Verify Turnstile token
      if (data['cf-turnstile-response']) {
        const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: data['cf-turnstile-response'],
            remoteip: request.headers.get('CF-Connecting-IP') || ''
          })
        });

        const turnstileResult = await turnstileResponse.json();
        if (!turnstileResult.success) {
          return jsonResponse({ error: 'Turnstile verification failed' }, 400);
        }
      } else {
        return jsonResponse({ error: 'Turnstile token missing' }, 400);
      }

      // Create lead in Odoo
      try {
        const leadId = await createOdooLead(data, env);
        console.log('Odoo lead created:', leadId);
      } catch (odooError) {
        console.error('Odoo error:', odooError.message);
        // Don't fail the request - webhook can still capture the lead
      }

      // Store in Cloudflare D1 database (if configured)
      if (env.DB) {
        try {
          await env.DB.prepare(
            `INSERT INTO contact_submissions (name, email, company, role, request_type, message, submitted_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.name,
            data.email,
            data.company || '',
            data.role || '',
            data.request_type,
            data.message,
            new Date().toISOString()
          ).run();
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      // Send to webhook (Slack, Discord, etc.) as backup notification
      if (env.WEBHOOK_URL) {
        try {
          const requestTypeLabel = getRequestTypeLabel(data.request_type);
          await fetch(env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `New ${requestTypeLabel} from ${data.name} (${data.email}) at ${data.company || 'N/A'}`,
              attachments: [{
                color: 'good',
                fields: [
                  { title: 'Request Type', value: requestTypeLabel, short: true },
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
        }
      }

      // Return success response
      return jsonResponse({ success: true, message: 'Form submitted successfully' }, 200);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

// ============================================================
// Odoo API Functions
// ============================================================

/**
 * Authenticate with Odoo and get user ID
 */
async function authenticateOdoo(env) {
  const response = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [env.ODOO_DATABASE, env.ODOO_API_USER, env.ODOO_API_PASSWORD, {}]
      },
      id: 1
    })
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Odoo auth error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  if (!result.result) {
    throw new Error('Odoo authentication failed - invalid credentials');
  }

  return result.result; // Returns user ID
}

/**
 * Create a lead in Odoo CRM
 */
async function createOdooLead(data, env) {
  const uid = await authenticateOdoo(env);

  const requestTypeLabel = getRequestTypeLabel(data.request_type);

  const response = await fetch(`${env.ODOO_URL}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          env.ODOO_DATABASE,
          uid,
          env.ODOO_API_PASSWORD,
          'crm.lead',
          'create',
          [{
            name: `[${requestTypeLabel}] ${data.name}`,
            contact_name: data.name,
            email_from: data.email,
            partner_name: data.company || '',
            function: data.role || '',
            description: data.message,
            type: 'lead'
          }]
        ]
      },
      id: Date.now()
    })
  });

  const result = await response.json();

  if (result.error) {
    throw new Error(`Odoo create error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  return result.result; // Returns new lead ID
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Get readable request type label
 */
function getRequestTypeLabel(type) {
  const labels = {
    'demo': 'Demo/POC Request',
    'pricing': 'Sales & Pricing',
    'general': 'General Inquiry'
  };
  return labels[type] || type;
}

/**
 * CORS headers for all responses
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
