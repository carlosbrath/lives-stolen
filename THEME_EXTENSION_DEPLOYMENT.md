# Memorial Stories Theme Extension - Deployment Guide

## ✅ Extension Created Successfully!

Your theme app extension has been created with **3 customizable blocks** that merchants can add to their Shopify theme.

---

## 📦 What's Included

### **Blocks Created:**

1. **Memorial Stories Wall** - Display a grid of published stories
2. **Story Submission Form** - Embed the submission form on any page
3. **Memorial Stories Banner** - Hero/CTA banner with customizable design

**Location:** `extensions/memorial-stories/`

---

## 🚀 Deployment Steps

### **Step 1: Deploy the Extension**

Run this command to deploy your extension to Shopify:

```bash
npm run deploy
```

Or:

```bash
shopify app deploy
```

**What happens:**
- Shopify CLI will bundle your extension
- Upload it to your Shopify app
- Make it available to merchants who install your app

### **Step 2: Verify Deployment**

After deployment completes, you should see:
```
✓ Deployed memorial-stories extension
```

### **Step 3: Test in Your Store**

1. Install your app in a development store
2. Go to **Online Store → Themes → Customize**
3. Click **Add section** anywhere on the page
4. Look for **Apps → Memorial Stories**
5. You should see your 3 blocks available!

---

## 🎨 How Merchants Use the Blocks

### **Adding Blocks to Theme:**

1. **Open Theme Editor:**
   - Shopify Admin → Online Store → Themes
   - Click **Customize** on the active theme

2. **Add a Block:**
   - Click **Add section** (on any page)
   - Scroll to **Apps** category
   - Find **Memorial Stories Wall**, **Story Submission Form**, or **Memorial Stories Banner**
   - Click to add it to the page

3. **Customize Settings:**
   - Each block has settings in the right panel:
     - Text content (headings, descriptions)
     - Colors (backgrounds, text, buttons)
     - Layout options (grid columns, banner style)
     - Toggle features on/off

4. **Save and Publish:**
   - Click **Save** in the theme editor
   - The block is now live on the storefront!

---

## 🔗 URLs Used by Blocks

The blocks embed content from these routes:

| Block | Embedded URL |
|-------|-------------|
| Story Wall | `/apps/stories-app/stories?embed=true` |
| Submission Form | `/apps/stories-app/submit-story?embed=true` |
| Banner CTAs | `/apps/stories-app/stories` (View All)<br>`/apps/stories-app/submit-story` (Submit) |

**Note:** Make sure your `shopify.app.toml` has the app proxy configured (already done):

```toml
[app_proxy]
url = "https://stories-app.fly.dev"
subpath = "stories-app"
prefix = "apps"
```

---

## 🎯 Example Use Cases

### **Use Case 1: Homepage Hero**
Add the **Memorial Stories Banner** to the homepage to drive traffic:
- Centered layout with background image
- "Share a Story" and "View All Stories" buttons
- Custom brand colors

### **Use Case 2: Dedicated Stories Page**
Create a page template with:
- **Memorial Stories Banner** at the top
- **Memorial Stories Wall** in the middle
- **Story Submission Form** at the bottom

### **Use Case 3: Embed Form Anywhere**
Add the **Story Submission Form** block to:
- Contact page
- About Us page
- Blog sidebar
- Any custom page

---

## ⚙️ Customization Options

### **Memorial Stories Wall Settings:**
- Heading text
- Description text
- Stories per row (2-4)
- Max stories to display (3-12)
- Show/hide "View All" button
- Custom colors (heading, background)

### **Story Submission Form Settings:**
- Heading text
- Description text
- Show/hide full-page link
- Custom colors (heading, background)

### **Memorial Stories Banner Settings:**
- Heading and description
- Button text (primary & secondary)
- Layout (centered or split with image)
- Background image
- All colors customizable

---

## 🛠️ Troubleshooting

### **Issue: Blocks don't appear in theme editor**

**Solution:**
1. Make sure you ran `npm run deploy`
2. Verify the extension deployed successfully
3. Refresh the theme editor page
4. Check that your app is installed in the store

### **Issue: iframes not loading content**

**Solution:**
1. Verify app proxy is configured in `shopify.app.toml`
2. Check that your app is deployed and running
3. Ensure the routes `/stories` and `/submit-story` are working
4. Check browser console for CORS errors

### **Issue: Styling looks broken**

**Solution:**
1. The blocks use inline styles to avoid theme conflicts
2. Check that `assets/memorial-stories.css` was deployed
3. Verify iframe content is rendering correctly

---

## 📱 Mobile Responsive

All blocks are fully responsive and work on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

---

## ♿ Accessibility

The blocks follow WCAG 2.1 AA guidelines:
- Proper heading hierarchy
- Color contrast ratios
- Focus indicators on interactive elements
- Semantic HTML
- Alt text support for images

---

## 🔄 Updating the Extension

To make changes to the extension:

1. Edit files in `extensions/memorial-stories/`
2. Run `npm run deploy` again
3. Changes will be reflected immediately in theme editor
4. No reinstall needed for merchants

---

## 📚 Next Steps

1. **Deploy the extension** using `npm run deploy`
2. **Test in your development store**
3. **Share with merchants** - They can now add blocks to their theme!
4. **Optional:** Add support for `?embed=true` parameter to optimize iframe rendering

---

## 🎉 You're Done!

Your merchants can now:
- ✅ Add memorial story blocks anywhere in their theme
- ✅ Customize colors, text, and layout
- ✅ Showcase stories without coding
- ✅ Collect submissions directly on product/landing pages

Questions? Check the README in `extensions/memorial-stories/README.md`
