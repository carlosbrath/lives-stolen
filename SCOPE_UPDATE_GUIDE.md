# 🔄 How to Update App Scopes

When you update scopes in `shopify.app.toml`, the session in the database **does NOT automatically update**. You need to force a re-authorization to get a new access token with the updated scopes.

## 📝 Why This Happens

1. You add new scopes to `shopify.app.toml` (e.g., `write_files`, `read_files`)
2. The app configuration updates on Shopify's side
3. BUT the old session/access token in your database still has the OLD scopes
4. API calls fail with "Invalid API key or access token" because the token lacks required permissions

## 🔧 Solution for LOCAL DEVELOPMENT

### Option 1: Use Refresh Endpoint (Recommended)

Visit this URL in your browser:
```
http://localhost:3000/api/refresh-scopes?shop=YOUR_SHOP_NAME
```

Example:
```
http://localhost:3000/api/refresh-scopes?shop=lives-stories
```

This will:
- ✅ Delete old session from database
- ✅ Redirect to OAuth flow
- ✅ Create new session with updated scopes

### Option 2: Manual Database Cleanup

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Delete sessions:**
   - Go to "Session" table
   - Find your shop (e.g., `lives-stories.myshopify.com`)
   - Delete all sessions for that shop

3. **Reinstall app:**
   - Go to Shopify admin: `https://YOUR_SHOP.myshopify.com/admin/apps`
   - Click your app
   - You'll be prompted to re-authorize with new scopes

### Option 3: Quick Dev Reset

```bash
# Stop dev server (Ctrl+C)

# Clear database
npx prisma migrate reset --force

# Restart dev server
npm run dev
```

## 🚀 Solution for PRODUCTION (Fly.io)

### Option 1: Use Refresh Endpoint

Visit:
```
https://stories-app.fly.dev/api/refresh-scopes?shop=SHOP_NAME
```

### Option 2: Trigger from Shopify Admin

1. **Update config:**
   ```bash
   shopify app config push
   ```

2. **In Shopify Partner Dashboard:**
   - Go to your app
   - Click "Update" to push new scopes
   - Shopify will show "Requires re-authorization"

3. **Merchants must re-install:**
   - Shop owners need to visit the app
   - They'll see a prompt to accept new permissions
   - This creates a new session with updated scopes

### Option 3: Database Migration

Connect to production database and run:

```javascript
// Delete old sessions
await prisma.session.deleteMany({
  where: {
    shop: "lives-stories.myshopify.com"
  }
});
```

Then reinstall the app on that shop.

## 🔍 How to Verify Scopes

After updating, check the session has new scopes:

```bash
npx prisma studio
```

1. Open "Session" table
2. Find your shop's session
3. Copy the `content` field
4. Parse the JSON
5. Check the `scope` field should include your new scopes:
   ```json
   {
     "scope": "write_products,read_metaobjects,write_metaobjects,write_files,read_files",
     ...
   }
   ```

## ✅ Current Scopes for stories-app

```toml
scopes = "read_files,write_files,read_customers,write_customers,read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects,read_content,write_content"
```

Required for:
- ✅ `read_files` - Read uploaded images from Shopify Files API
- ✅ `write_files` - Upload images to Shopify Files API
- ✅ `read_customers` - Read customer data
- ✅ `write_customers` - Write customer data
- ✅ `read_metaobject_definitions` - Read metaobject schemas
- ✅ `write_metaobject_definitions` - Create/update metaobject schemas
- ✅ `read_metaobjects` - Read story metaobjects
- ✅ `write_metaobjects` - Create story metaobjects
- ✅ `read_content` - Read blog posts and content
- ✅ `write_content` - Create blog posts

## 🛠️ Preventing This Issue

**Best Practice:** When adding new scopes:

1. Update `shopify.app.toml`
2. Run scope refresh immediately
3. Test API calls to verify new permissions
4. Document scope changes for merchants

## 📚 Related Files

- `/app/routes/api.refresh-scopes.jsx` - Auto refresh endpoint
- `/app/routes/api.debug-session.jsx` - Debug session info
- `shopify.app.toml` - App configuration with scopes
