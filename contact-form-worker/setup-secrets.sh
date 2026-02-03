#!/bin/bash
# LLM Appliance Worker - Secret Setup Script
# Run this script to configure secrets in Cloudflare's encrypted storage

echo "LLM Appliance Worker - Secret Configuration"
echo "============================================"
echo ""
echo "This script will configure the following secrets:"
echo "  1. TURNSTILE_SECRET_KEY - Cloudflare Turnstile secret key"
echo "  2. SENDGRID_API_KEY     - SendGrid API key for email notifications"
echo "  3. WEBHOOK_URL          - Discord/Slack webhook URL (optional)"
echo ""
echo "Each secret will be stored encrypted in Cloudflare's secret storage."
echo "You will be prompted to enter each value interactively."
echo ""

read -p "Continue? (y/n) " confirm
if [ "$confirm" != "y" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Configuring TURNSTILE_SECRET_KEY..."
wrangler secret put TURNSTILE_SECRET_KEY

echo ""
echo "Configuring SENDGRID_API_KEY..."
wrangler secret put SENDGRID_API_KEY

echo ""
read -p "Configure WEBHOOK_URL? (y/n) " webhook_confirm
if [ "$webhook_confirm" = "y" ]; then
    echo "Configuring WEBHOOK_URL..."
    wrangler secret put WEBHOOK_URL
fi

echo ""
echo "Secret configuration complete!"
echo ""
echo "Next steps:"
echo "  1. Deploy the worker: wrangler deploy"
echo "  2. Test the contact form on your site"
echo ""
