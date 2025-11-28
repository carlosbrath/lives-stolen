# Running Story App with Shopify CLI

This guide walks you through setting up and running the Story Submission app using `shopify app dev`.

## 📋 Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/admin-rest/latest/getting-started#install-the-shopify-cli) installed
- A [Shopify Partner account](https://partners.shopify.com)
- A development store created in your Partner Dashboard

## 🔑 Step 1: Get Your API Credentials

### 1.1 Go to Shopify Partner Dashboard

1. Go to https://partners.shopify.com
2. Log in with your Shopify Partner credentials
3. Click on **Apps and sales channels**
4. Click on **Your Apps**

### 1.2 Find Your App

- If you don't have an app yet, click **Create an app**
- Give it a name (e.g., "Story Submission")
- Choose **Public distribution** or **Custom app** (based on your needs)

### 1.3 Get API Credentials

Once you've created the app:

1. Go to **Configuration** tab
2. Look for **Admin API credentials** section
3. You'll see:
   - **API Key** (like: `abc123def456ghi789jkl`)
   - **API Secret** (like: `shpaa_123abc456def789ghi`)

### 1.4 Copy to `.env`

Open `.env` file in your project and update:

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
```

Example:
```env
SHOPIFY_API_KEY=abc123def456ghi789jkl
SHOPIFY_API_SECRET=shpaa_123abc456def789ghi
```

## 📊 Step 2: Configure Scopes

### 2.1 Add Scopes in Partner Dashboard

1. In your app's **Configuration** tab
2. Find **Admin API scopes** section
3. Look for and enable these scopes:
   - ✅ `write_blogs` - Write blog articles
   - ✅ `read_blogs` - Read blog articles
   - ✅ `write_files` - Write files
   - ✅ `read_files` - Read files

4. Click **Save** at the top right

### 2.2 Update `.env`

The scopes should already be set in `.env`:

```env
SCOPES=write_blogs,read_blogs,write_files,read_files
```

This matches what you enabled in Partner Dashboard.

## 🏪 Step 3: Create a Development Store

### 3.1 In Partner Dashboard

1. Go to **Stores** tab
2. Click **Add store**
3. Choose **Development store**
4. Give it a name (e.g., "Story Test Store")
5. Choose the Shopify plan (Free tier is fine)
6. Click **Create**

### 3.2 Copy Store Domain

Once created, you'll see the store domain like: `story-test-store.myshopify.com`

Update `.env`:

```env
SHOPIFY_SHOP_DOMAIN=story-test-store.myshopify.com
```

## ✅ Step 4: Update `shopify.app.toml`

The app configuration file should already have the correct settings, but verify:

```toml
scopes = "write_blogs,read_blogs,write_files,read_files"
```

The `SHOPIFY_APP_URL` will be set automatically by Shopify CLI when you run the app.

## 🚀 Step 5: Run the App

### 5.1 Install Dependencies

```bash
npm install
```

### 5.2 Set Up Database

```bash
npm run setup
```

This runs Prisma migrations and creates the database.

### 5.3 Create Blog in Shopify

Before running the app, create a blog in your test store:

1. Log into your test store
2. Go to **Content → Blogs**
3. Click **Create blog**
4. Name it: `Community Stories`
5. The handle should be: `community-stories` (important!)
6. Click **Create blog**

### 5.4 Run Shopify App Dev

```bash
shopify app dev
```

This command will:
- Start your local dev server
- Create a tunnel to your Shopify store
- Output something like:
  ```
  🏪 Shopify app running at https://abcd1234.ngrok.io
  📱 To install your app, open https://admin.shopify.com/admin...
  ```

## 🔐 Step 6: Install App on Development Store

### 6.1 Open Installation Link

The output from `shopify app dev` includes an installation link. Click it or copy it to your browser.

### 6.2 Authorize App

1. Shopify will ask you to authorize the app
2. Review the requested scopes:
   - Write blogs
   - Read blogs
   - Write files
   - Read files
3. Click **Install** or **Authorize**

### 6.3 Verify Installation

Once installed, you should see:
- App installed in your test store
- You're redirected to the app homepage
- No errors in the terminal

## ✨ Step 7: Test the Form

### 7.1 Access Public Form

With the app running, visit:

```
https://your-test-store.myshopify.com/submit-story
```

Or go through the normal storefront route.

### 7.2 Submit a Test Story

1. Fill out the form with test data
2. Click "Submit Your Story"
3. You should see a success message

### 7.3 Check Shopify Admin

1. Log into your test store
2. Go to **Content → Blog Posts**
3. You should see a new **Draft** post:
   - Title: `Cyclist Story: Los Angeles, CA` (or similar)
   - Status: Draft
   - Tags: Cyclist, Community Story

## 🛠️ Step 8: Access Admin Dashboard

The admin dashboard shows all submissions:

```
https://your-test-store.myshopify.com/admin/apps/your-app-id/submissions
```

Or navigate through the app menu.

## 🔧 Troubleshooting

### Error: "Cannot find module '~/services/shopify.server'"

**Solution**: Path alias not resolved. Make sure:
1. `tsconfig.json` has paths configured ✅ (already fixed)
2. Run `npm install` to reinstall dependencies
3. Restart dev server: `npm run dev`

### Error: "Shopify API Key not found"

**Solution**: `.env` file not configured
1. Check `.env` file exists in project root
2. Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set
3. Values should not have quotes around them

### Error: "Blog post not created"

**Solution**: Blog doesn't exist in Shopify
1. Go to your test store
2. Create a blog named "Community Stories" (handle: `community-stories`)
3. Run the submission form again

### Error: "Unauthorized" or "Cannot access Shopify API"

**Solution**: App not installed correctly
1. Run `shopify app dev` again
2. Open the installation link
3. Click "Install" to authorize the app on your store

### Scopes not working

**Solution**: Scopes not enabled in Partner Dashboard
1. Go to Shopify Partner Dashboard
2. Your App → Configuration
3. Enable all 4 scopes listed above
4. Save
5. Restart `shopify app dev`

## 📚 Useful Commands

```bash
# Start development server with tunnel
shopify app dev

# Run database studio to inspect data
npx prisma studio

# Check what environment variables are loaded
npm run dev --verbose

# Reset database
rm prisma/dev.sqlite
npm run setup
```

## 📁 Configuration Checklist

- [ ] `.env` file created with API credentials
- [ ] `SHOPIFY_API_KEY` set
- [ ] `SHOPIFY_API_SECRET` set
- [ ] `SCOPES` configured with write_blogs, read_blogs, write_files, read_files
- [ ] Scopes enabled in Partner Dashboard
- [ ] Development store created
- [ ] Blog "community-stories" created in store
- [ ] `npm install` run
- [ ] `npm run setup` run
- [ ] `shopify app dev` running
- [ ] App installed on development store

## 🎯 Once Everything Works

1. Visit `/submit-story` form
2. Submit test story
3. Check blog posts in Shopify Admin
4. See submission in `/app/submissions` dashboard
5. Publish post in Shopify Admin
6. Published post appears on `/stories` page

## 📞 Next Steps

Once the basic setup is working:

1. [Add email notifications](SHOPIFY_SETUP.md#email-notifications)
2. [Implement image uploads](SHOPIFY_SETUP.md#images)
3. [Configure production deployment](#production-deployment)

## 🚀 Production Deployment

When ready to go live:

1. Update `SHOPIFY_APP_URL` to your production URL
2. Use PostgreSQL instead of SQLite
3. Deploy to hosting service
4. Update API credentials in Partner Dashboard
5. Publish app to Shopify App Store (optional)

See `SHOPIFY_SETUP.md` for production details.
