# App Configuration Information

## Active Configuration

**File:** `shopify.app.toml`
- **App Name:** story-app
- **Client ID:** 678d979ac2daaeaf496c83e594dbb230
- **Status:** ACTIVE - This is the configuration being used

## Old/Duplicate Configurations (Archived)

You have 2 additional TOML files that appear to be from previous app setups:

### 1. shopify.app.stories-submission.toml
- **App Name:** stories submission
- **Client ID:** e55df74b8fa6cefdbaa19fbc7eb30d6b
- **Scopes:** write_products (outdated/incomplete)
- **Status:** INACTIVE

### 2. shopify.app.lives-storis.toml (typo in filename)
- **App Name:** Lives Storis
- **Client ID:** 5108cc85b0f5a6331d708d72a935ab54
- **Scopes:** Empty
- **Status:** INACTIVE

## Recommendation

**Option 1: Delete old configs** (Recommended if you're only using one app)
```bash
rm shopify.app.stories-submission.toml
rm shopify.app.lives-storis.toml
```

**Option 2: Archive them** (If you might need them later)
```bash
mkdir old-configs
mv shopify.app.stories-submission.toml old-configs/
mv shopify.app.lives-storis.toml old-configs/
```

**Option 3: Keep them** (If you're managing multiple apps)
- Keep them only if you're actively using multiple Shopify apps with different client IDs
- Make sure to update each one with the correct URLs and scopes

## Current Active App Settings

The active `shopify.app.toml` has:
- ✅ GDPR webhooks configured
- ✅ Proper scopes: write_products, read_metaobjects, write_metaobjects, write_files, read_files
- ✅ Webhook handlers for app/uninstalled, app/scopes_update
- ⚠️ Application URL still set to "https://example.com" - UPDATE THIS before deployment
- ⚠️ Redirect URLs still set to "https://example.com/api/auth" - UPDATE THIS before deployment
