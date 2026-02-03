# LLM Appliance Worker - Secret Setup Script
# Run this script to configure secrets in Cloudflare's encrypted storage

Write-Host "LLM Appliance Worker - Secret Configuration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will configure the following secrets:" -ForegroundColor Yellow
Write-Host "  1. TURNSTILE_SECRET_KEY - Cloudflare Turnstile secret key"
Write-Host "  2. SENDGRID_API_KEY     - SendGrid API key for email notifications"
Write-Host "  3. WEBHOOK_URL          - Discord/Slack webhook URL (optional)"
Write-Host ""
Write-Host "Each secret will be stored encrypted in Cloudflare's secret storage."
Write-Host "You will be prompted to enter each value interactively."
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Configuring TURNSTILE_SECRET_KEY..." -ForegroundColor Green
wrangler secret put TURNSTILE_SECRET_KEY

Write-Host ""
Write-Host "Configuring SENDGRID_API_KEY..." -ForegroundColor Green
wrangler secret put SENDGRID_API_KEY

Write-Host ""
$webhookConfirm = Read-Host "Configure WEBHOOK_URL? (y/n)"
if ($webhookConfirm -eq "y") {
    Write-Host "Configuring WEBHOOK_URL..." -ForegroundColor Green
    wrangler secret put WEBHOOK_URL
}

Write-Host ""
Write-Host "Secret configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy the worker: wrangler deploy"
Write-Host "  2. Test the contact form on your site"
Write-Host ""
