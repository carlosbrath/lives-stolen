# Memorial Stories Theme App Extension

This theme app extension allows merchants to add memorial story blocks to their Shopify theme using the theme editor.

## Blocks Included

### 1. **Memorial Stories Wall**
Displays a grid of published memorial stories from your database.

**Features:**
- Customizable heading and description
- Adjustable grid layout (2-4 stories per row)
- Control max stories displayed
- Optional "View All" button
- Custom colors for heading and background

**Usage:** Add this block to any page to show published stories.

---

### 2. **Story Submission Form**
Embeds the story submission form directly into any page.

**Features:**
- Customizable heading and description
- Iframe-based form embedding
- Optional link to full-page form
- Custom colors

**Usage:** Add this block to a dedicated "Share Your Story" page or contact page.

---

### 3. **Memorial Stories Banner**
A hero/call-to-action banner to promote the memorial stories feature.

**Features:**
- Two layout options: Centered or Split (with image)
- Background image support
- Two customizable CTA buttons
- Fully customizable colors
- Responsive design

**Usage:** Add this to the homepage or landing pages to drive traffic to your stories.

---

## Installation

1. **Deploy the extension:**
   ```bash
   npm run deploy
   ```

2. **In Shopify Theme Editor:**
   - Go to **Online Store → Themes → Customize**
   - Click **Add section**
   - Find blocks under **Apps → Memorial Stories**
   - Drag and drop desired block onto the page
   - Customize settings in the right panel

---

## Configuration

### App Proxy Required
Make sure your `shopify.app.toml` includes the app proxy configuration:

```toml
[app_proxy]
url = "https://stories-app.fly.dev"
subpath = "stories-app"
prefix = "apps"
```

This makes your app accessible at: `yourstore.com/apps/stories-app/*`

---

## Block URLs

The blocks use these routes:
- Stories Wall: `/apps/stories-app/stories?embed=true`
- Submission Form: `/apps/stories-app/submit-story?embed=true`
- Banner CTAs: `/apps/stories-app/stories` and `/apps/stories-app/submit-story`

---

## Customization

Merchants can customize:
- **Headings and descriptions** - Edit text content
- **Colors** - Choose brand colors for headings, backgrounds, and buttons
- **Layout** - Adjust grid columns, story count, and banner layout
- **Images** - Add background images to the banner
- **Buttons** - Toggle visibility and customize button text

---

## Browser Support

- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile responsive
- Accessible (WCAG 2.1 AA compliant)

---

## Support

For issues or questions, contact your app developer.
