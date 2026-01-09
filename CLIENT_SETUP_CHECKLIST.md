# Client Setup Checklist

Use this checklist to ensure smooth deployment of the Memorial Stories app to client stores.

## Pre-Deployment Checklist

### Client Requirements
- [ ] Client has created their Shopify app in Dev Dashboard
- [ ] Client has Node.js installed (v18.20+)
- [ ] Client has Shopify CLI installed
- [ ] Client has cloned the repository

### Client Must Provide to Developer
- [ ] **Client ID** (from Shopify Partner Dashboard → App → Configuration)
- [ ] **Client Secret** (from Shopify Partner Dashboard → App → Configuration)
- [ ] **Store Domain** (e.g., `client-store.myshopify.com`)
- [ ] **Store Admin Email** (for admin panel access)

### Developer Tasks (Before Client Deployment)
- [ ] Verify backend server is running at `https://stories-app.fly.dev/`
- [ ] Add client's app credentials to backend environment variables:
  ```bash
  # Add to backend .env or Fly.io secrets
  SHOPIFY_API_KEY=<client_api_key>
  SHOPIFY_API_SECRET=<client_api_secret>
  ```
- [ ] Create database entry for client's store
- [ ] Set up admin panel access for client
- [ ] Test API endpoints are accessible
- [ ] Verify assets are serving correctly:
  - `https://stories-app.fly.dev/assets/memorial-stories.css`
  - `https://stories-app.fly.dev/assets/memorial-stories.js`

### Client App Configuration Checklist

Client must configure these in their Shopify Partner Dashboard:

#### 1. App URLs
- [ ] **App URL**: `https://stories-app.fly.dev/`
- [ ] **Allowed redirection URL**: `https://stories-app.fly.dev/api/auth`

#### 2. App Proxy (CRITICAL)
- [ ] **Subpath prefix**: `apps`
- [ ] **Subpath**: `stories-app`
- [ ] **Proxy URL**: `https://stories-app.fly.dev`
- [ ] Status: **Enabled**

#### 3. Access Scopes
- [ ] `read_metaobjects`
- [ ] `write_metaobjects`
- [ ] `read_files`
- [ ] `write_files`
- [ ] `write_products` (optional)

## Deployment Checklist

### Client Steps
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Run `shopify app config link` (select their app)
- [ ] **WAIT** for developer confirmation that credentials are added to backend
- [ ] Run `npm run deploy`
- [ ] Install app on their store
- [ ] Add blocks to theme via Theme Editor

### Developer Verification
- [ ] Confirm extension deployed successfully
- [ ] Test API connection from client's store
- [ ] Verify story submission works
- [ ] Verify story display works
- [ ] Provide admin panel URL and credentials to client
- [ ] Walk client through admin panel features

## Post-Deployment Testing

### Client Tests
- [ ] Story Wall block displays correctly
- [ ] Story Submission Form loads
- [ ] Can submit a test story
- [ ] Styling matches store theme (or can be customized)
- [ ] Mobile responsiveness works

### Developer Tests
- [ ] Verify story appears in database
- [ ] Check admin panel shows submitted story
- [ ] Test approval/rejection workflow
- [ ] Verify images upload correctly
- [ ] Check analytics/logging

## Common Issues & Solutions

### Issue: "App proxy not configured"
**Checklist:**
- [ ] App proxy is enabled in Partner Dashboard
- [ ] Subpath is exactly `stories-app`
- [ ] Proxy URL is `https://stories-app.fly.dev` (no trailing slash)
- [ ] Waited 5-10 minutes after saving (Shopify propagation delay)

### Issue: "Extension not showing in Theme Editor"
**Checklist:**
- [ ] Extension deployed successfully
- [ ] App installed on the store
- [ ] Refreshed Theme Editor
- [ ] Checked correct theme (not draft)

### Issue: "API connection failed"
**Checklist:**
- [ ] Backend server is running
- [ ] Client credentials added to backend
- [ ] Store domain matches exactly (check spelling)
- [ ] App proxy is configured correctly

### Issue: "Form submission fails"
**Checklist:**
- [ ] Check browser console for errors (F12)
- [ ] Verify shop domain is passed correctly
- [ ] Check backend logs for errors
- [ ] Verify API endpoint is accessible

## Security Checklist

- [ ] Client credentials stored securely (not in code)
- [ ] Environment variables configured on backend
- [ ] HTTPS enforced on all connections
- [ ] API endpoints validate shop domain
- [ ] CORS configured correctly
- [ ] Rate limiting enabled on backend

## Documentation Provided to Client

- [ ] CLIENT_DEPLOYMENT_GUIDE.md sent to client
- [ ] Admin panel URL and login provided
- [ ] Support contact information shared
- [ ] Expected timeline communicated
- [ ] Pricing/billing information confirmed (if applicable)

## Final Sign-Off

- [ ] Client confirms app is working
- [ ] Client trained on admin panel usage
- [ ] Client knows how to add/customize blocks
- [ ] Support process explained
- [ ] Update maintenance plan confirmed

---

## Quick Command Reference

```bash
# Install dependencies
npm install

# Link to Shopify app
shopify app config link

# Deploy extension
shopify app deploy

# View deployment status
shopify app info
```

---

## Important URLs

- **Backend Server**: https://stories-app.fly.dev/
- **Admin Panel**: [Provide to client after setup]
- **API Documentation**: [If available]
- **Support Email**: [Your email]

---

## Notes Section

Use this space to track client-specific configurations:

**Client Name:** ___________________________

**Store Domain:** ___________________________

**Deployment Date:** ___________________________

**Special Requirements:**
-
-
-

**Custom Configurations:**
-
-
-

---

**Last Updated:** January 2026
