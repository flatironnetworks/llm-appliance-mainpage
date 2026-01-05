# LLM Appliance Landing Page

Marketing landing page for LLM Appliance - a self-hosted LLM solution with zero data retention.

## Overview

This is a static website built for Cloudflare Pages deployment. The site is designed to be marketing-focused, highlighting the key value propositions of LLM Appliance:

- Zero data retention
- Complete data sovereignty
- No infrastructure expertise required
- Rapid deployment (under an hour)
- Pre-validated models

## Project Structure

```
.
├── index.html          # Main landing page
├── styles.css          # All styling and animations
├── script.js           # Interactive features and form handling
└── README.md           # This file
```

## Features

- **Modern, Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **Smooth Animations**: Engaging animations and transitions throughout
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Fast Loading**: Optimized static assets
- **Accessible**: Follows web accessibility best practices

## Deployment to Cloudflare Pages

### Automatic Deployment (Recommended)

1. **Connect GitHub Repository**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub repository
   - Cloudflare will automatically detect it's a static site

2. **Build Settings**
   - **Framework preset**: None (or Static Site)
   - **Build command**: (leave empty - no build needed)
   - **Build output directory**: `/` (root directory)
   - **Root directory**: `/` (if repository is at root)

3. **Deploy**
   - Cloudflare will automatically deploy on every commit to your main branch
   - You can also set up preview deployments for pull requests

### Manual Deployment

If you prefer to deploy manually:

```bash
# Install Wrangler CLI (Cloudflare's CLI tool)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name=llm-appliance-mainpage
```

## Local Development

To view the site locally, you can use any static file server:

### Using Python

```bash
# Python 3
python -m http.server 8000

# Then visit http://localhost:8000
```

### Using Node.js

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Then visit http://localhost:8000
```

### Using VS Code

Install the "Live Server" extension and click "Go Live" in the status bar.

## Customization

### Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #10b981;
    /* ... other variables */
}
```

### Content

- **Hero Section**: Edit the hero title, subtitle, and CTA in `index.html`
- **Features**: Modify the features grid in the features section
- **Use Cases**: Update use case cards as needed
- **Contact Form**: The form currently shows a success message. To connect to a backend, edit the form submission handler in `script.js`

### Form Submission

The contact form currently shows a success message without sending data. To connect to a backend:

1. Update the form submission handler in `script.js`
2. Uncomment and configure the fetch API call
3. Set up your backend endpoint (Cloudflare Workers, API route, etc.)

Example with Cloudflare Workers:

```javascript
const response = await fetch('https://your-worker.your-subdomain.workers.dev/contact', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

The site is optimized for performance:

- Minimal dependencies (no frameworks)
- Optimized CSS with efficient animations
- Lazy loading for images (if added)
- Fast initial page load

## License

Proprietary - Flatiron Networks, Inc.

Copyright (c) 2025 Flatiron Networks, Inc. All rights reserved.

## Support

For questions or issues with the landing page, contact the development team.

---

**Note**: This landing page is for marketing purposes only. It does not contain any proprietary technical details or "secret sauce" about the LLM Appliance product.
