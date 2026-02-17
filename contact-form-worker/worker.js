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
      let odooSuccess = false;
      let odooErrorMsg = '';
      try {
        const leadId = await createOdooLead(data, env);
        console.log('Odoo lead created:', leadId);
        odooSuccess = true;
      } catch (odooError) {
        odooErrorMsg = odooError.message;
        console.error('Odoo error:', odooErrorMsg);
        // Continue to webhook as backup notification
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

      // Send to Discord webhook as backup notification
      let webhookSuccess = false;
      if (env.WEBHOOK_URL) {
        try {
          const requestTypeLabel = getRequestTypeLabel(data.request_type);
          const statusPrefix = odooSuccess ? '✅' : '⚠️ [Odoo Failed]';
          const embedColor = odooSuccess ? 0x00ff00 : 0xffaa00; // Green or Orange

          const fields = [
            { name: 'Request Type', value: requestTypeLabel, inline: true },
            { name: 'Name', value: data.name, inline: true },
            { name: 'Email', value: data.email, inline: true },
            { name: 'Company', value: data.company || 'Not provided', inline: true },
            { name: 'Role', value: data.role || 'Not provided', inline: true },
            { name: 'Message', value: data.message, inline: false }
          ];

          // Add error details if Odoo failed
          if (!odooSuccess && odooErrorMsg) {
            // Split long error messages into multiple fields if needed
            const errorChunks = odooErrorMsg.match(/.{1,900}/g) || [odooErrorMsg];
            errorChunks.forEach((chunk, i) => {
              fields.push({
                name: i === 0 ? '⚠️ Odoo Error' : `⚠️ Error (cont'd ${i + 1})`,
                value: chunk,
                inline: false
              });
            });
          }

          // Add debug info
          fields.push({
            name: '🔧 Debug Info',
            value: `URL: ${env.ODOO_URL}\nDB: ${env.ODOO_DATABASE}\nUser: ${env.ODOO_API_USER ? env.ODOO_API_USER.substring(0, 10) + '...' : 'not set'}`,
            inline: false
          });

          const webhookResponse = await fetch(env.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `${statusPrefix} New ${requestTypeLabel} from **${data.name}**`,
              embeds: [{
                color: embedColor,
                fields: fields
              }]
            })
          });

          if (webhookResponse.ok) {
            webhookSuccess = true;
          } else {
            console.error('Webhook HTTP error:', webhookResponse.status, await webhookResponse.text());
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
        }
      }

      // If neither Odoo nor webhook succeeded, return error with details
      if (!odooSuccess && !webhookSuccess) {
        console.error('Both Odoo and webhook failed. Odoo error:', odooErrorMsg);
        return jsonResponse({
          error: 'Unable to process your request. Please try again or contact us directly.',
          debug: odooErrorMsg  // Remove this line in production
        }, 500);
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
  // Use web session endpoint which is more reliable for Odoo.sh
  const url = `${env.ODOO_URL}/web/session/authenticate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 LLMAppliance-ContactForm/1.0',
      'X-CF-Worker-Bypass': env.CF_BYPASS_SECRET || 'llm-appliance-worker'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        db: env.ODOO_DATABASE || '',
        login: env.ODOO_API_USER,
        password: env.ODOO_API_PASSWORD
      },
      id: 1
    })
  });

  // Get response details
  const contentType = response.headers.get('content-type') || '';
  const status = response.status;
  const redirected = response.redirected ? `REDIRECTED to ${response.url}` : '';
  const actualUrl = response.url;

  // Always read as text first to debug
  const text = await response.text();

  // Check if it looks like HTML (regardless of content-type header)
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE')) {
    throw new Error(`Auth failed: ${url} → actualURL: ${actualUrl} | HTTP ${status} | CT: ${contentType} | ${redirected} | Body: ${text.substring(0, 400)}`);
  }

  // Try to parse as JSON
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`JSON parse failed: ${url} → HTTP ${status} | CT: ${contentType} | Body: ${text.substring(0, 400)}`);
  }

  if (result.error) {
    // Odoo errors include message and data (with debug info)
    const errMsg = result.error.message || 'Unknown error';
    const errData = result.error.data ? JSON.stringify(result.error.data).substring(0, 300) : '';
    throw new Error(`Odoo auth: ${errMsg} ${errData}`);
  }

  if (!result.result || !result.result.uid) {
    throw new Error('Odoo authentication failed - invalid credentials');
  }

  // Return session info including uid and session_id
  return {
    uid: result.result.uid,
    sessionId: response.headers.get('set-cookie')?.match(/session_id=([^;]+)/)?.[1] || ''
  };
}


/**
 * Create a lead in Odoo CRM
 */
async function createOdooLead(data, env) {
  const session = await authenticateOdoo(env);

  const requestTypeLabel = getRequestTypeLabel(data.request_type);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CF-Worker-Bypass': env.CF_BYPASS_SECRET || 'llm-appliance-worker'
  };
  // Include session cookie if available
  if (session.sessionId) {
    headers['Cookie'] = `session_id=${session.sessionId}`;
  }

  // Note: Partner creation removed - requires Internal User permissions
  // Lead contact info is stored in contact_name, email_from, partner_name fields

  // Convert newlines to HTML breaks for proper rendering in Odoo
  const messageHtml = data.message.replace(/\n/g, '<br/>');

  // Format internal notes with HTML line breaks
  const internalNotes = `Subject: ${requestTypeLabel}<br/><br/>Message:<br/>${messageHtml}`;

  // Lead subject is the company name (or contact name if no company)
  const leadSubject = data.company || data.name;

  // Build lead data
  const leadData = {
    name: leadSubject,
    contact_name: data.name,
    email_from: data.email,
    partner_name: data.company || '',
    function: data.role || '',
    description: internalNotes,
    type: 'lead',
    team_id: 10,     // "Contact Form" sales team
    user_id: false   // Unassigned - let Odoo team rules assign
  };

  const createUrl = `${env.ODOO_URL}/web/dataset/call_kw/crm.lead/create`;
  const response = await fetch(createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'crm.lead',
        method: 'create',
        args: [leadData],
        kwargs: {}
      },
      id: Date.now()
    })
  });

  // Defensive handling for HTML responses
  const createText = await response.text();
  if (createText.trim().startsWith('<') || createText.includes('<!DOCTYPE')) {
    throw new Error(`Lead create failed: ${createUrl} | HTTP ${response.status} | Body: ${createText.substring(0, 400)}`);
  }

  let result;
  try {
    result = JSON.parse(createText);
  } catch (e) {
    throw new Error(`Lead create JSON parse failed: ${createUrl} | Body: ${createText.substring(0, 400)}`);
  }

  if (result.error) {
    throw new Error(`Odoo create error: ${result.error.message || JSON.stringify(result.error)}`);
  }

  // Note: Chatter/message_post removed - requires Internal User permissions
  // Full message is available in Internal Notes (description field)

  return result.result;
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
