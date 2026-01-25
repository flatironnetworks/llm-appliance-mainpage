# SEO Metadata Configuration

## Overview

Comprehensive SEO metadata has been added to the landing page, including:
- Primary meta tags
- Open Graph tags (Facebook, LinkedIn)
- Twitter Card tags
- Structured data (JSON-LD schema)
- Canonical URLs

## What's Included

### 1. Primary Meta Tags
- **Title**: Optimized with brand name and key value proposition
- **Description**: Comprehensive description with target keywords
- **Keywords**: Relevant keywords for search engines
- **Author**: Flatiron Networks, Inc.
- **Robots**: Index, follow
- **Canonical URL**: Set to prevent duplicate content issues

### 2. Open Graph Tags (Social Media)
- Optimized for Facebook, LinkedIn, and other social platforms
- Includes image dimensions (1200x630 recommended)
- Proper locale and site name

### 3. Twitter Card Tags
- Large image card format
- Twitter handle placeholders
- Optimized descriptions

### 4. Structured Data (JSON-LD)
Three schema.org structured data blocks:
- **SoftwareApplication**: Describes LLM Appliance as software
- **Organization**: Describes Flatiron Networks, Inc.
- **WebSite**: Describes the website structure

## Customization Required

### URLs to Update
Replace placeholder URLs with your actual domain:

1. **Canonical URL** (line 16):
   ```html
   <link rel="canonical" href="https://llmappliance.com/">
   ```

2. **Open Graph URL** (line 19):
   ```html
   <meta property="og:url" content="https://llmappliance.com/">
   ```

3. **Open Graph Image** (line 23):
   ```html
   <meta property="og:image" content="https://llmappliance.com/og-image.jpg">
   ```
   **Action Required**: Create a 1200x630px image for social sharing

4. **Twitter Image** (line 35):
   ```html
   <meta name="twitter:image" content="https://llmappliance.com/twitter-image.jpg">
   ```
   **Action Required**: Create a 1200x630px image for Twitter

5. **Twitter Handles** (lines 37-38):
   ```html
   <meta name="twitter:creator" content="@flatironnetworks">
   <meta name="twitter:site" content="@flatironnetworks">
   ```
   **Action Required**: Replace with actual Twitter handles

6. **Organization URLs** in structured data:
   - Update `https://flatironnetworks.com` with actual URL
   - Update LinkedIn URL in `sameAs` array
   - Update email in contact point

### Images to Create

1. **Open Graph Image** (`og-image.jpg`)
   - Size: 1200x630px
   - Format: JPG or PNG
   - Should include: LLM Appliance branding, key value proposition
   - Purpose: Display when shared on Facebook, LinkedIn

2. **Twitter Image** (`twitter-image.jpg`)
   - Size: 1200x630px (or 1200x675px for better Twitter display)
   - Format: JPG or PNG
   - Can be same as OG image or customized for Twitter

3. **Favicon** (optional but recommended)
   - Multiple sizes: 16x16, 32x32, 180x180
   - Apple touch icon: 180x180
   - Uncomment favicon links in HTML when ready

### Social Media Accounts

Update these with actual accounts:
- Twitter handle: `@flatironnetworks` (replace if different)
- LinkedIn company page URL
- Any other social media profiles

## SEO Best Practices Implemented

✅ **Title Optimization**: Includes brand + key value proposition (under 60 characters)
✅ **Description Optimization**: Includes target keywords naturally (under 160 characters)
✅ **Keyword Targeting**: Focused on regulated industries and key differentiators
✅ **Structured Data**: Helps search engines understand content
✅ **Canonical URLs**: Prevents duplicate content issues
✅ **Open Graph**: Optimizes social media sharing
✅ **Mobile-Friendly**: Viewport meta tag included
✅ **Language Declaration**: HTML lang attribute set

## Testing Your SEO

### Tools to Use:
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Test structured data
   
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Test Open Graph tags
   - Clear cache if needed
   
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Test Twitter Card tags
   
4. **Google Search Console**: https://search.google.com/search-console
   - Monitor search performance
   - Submit sitemap (create one if needed)

### Checklist:
- [ ] Update all placeholder URLs
- [ ] Create OG image (1200x630px)
- [ ] Create Twitter image (1200x630px)
- [ ] Update Twitter handles
- [ ] Update organization URLs in structured data
- [ ] Test with Google Rich Results Test
- [ ] Test with Facebook Sharing Debugger
- [ ] Test with Twitter Card Validator
- [ ] Create and submit sitemap.xml
- [ ] Set up Google Search Console
- [ ] Create favicon files (optional)

## Additional Recommendations

1. **Create a sitemap.xml** for better search engine indexing
2. **Set up Google Analytics** for tracking
3. **Set up Google Search Console** for monitoring
4. **Create robots.txt** file
5. **Add alt text** to all images (already done in HTML)
6. **Ensure fast page load** (already optimized with static site)
7. **Use HTTPS** (Cloudflare Pages provides this automatically)

## Keywords Targeted

The metadata targets these key search terms:
- Self-hosted LLM
- On-premise AI
- Zero data retention
- Data sovereignty
- HIPAA-ready AI
- Enterprise LLM
- Private AI
- Secure AI
- Compliance AI
- Healthcare AI
- Financial services AI
- Government AI
- Regulated industries AI

## Notes

- All URLs are currently placeholders and must be updated
- Image files need to be created and uploaded
- Social media handles need to be verified
- Structured data uses schema.org standards for maximum compatibility
