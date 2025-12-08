# Deploy Story App to Vercel

Complete guide to deploying your Shopify Remix app to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Shopify Partner account with your app created

---

## Step 1: Prepare Your Repository

### 1.1 Push Code to Git Repository

If not already done:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

### 1.2 Verify Configuration Files

The following files have been created/updated:
- `vercel.json` - Vercel build configuration
- `package.json` - Added `postbuild` script for Prisma
- `prisma/schema.prisma` - Updated to use PostgreSQL

---

## Step 2: Set Up Vercel Postgres Database

### 2.1 Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. **STOP at the Configure Project step** - don't deploy yet!

### 2.2 Add Vercel Postgres Storage

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Postgres"
4. Choose a name (e.g., "story-app-db")
5. Select a region (choose closest to your users)
6. Click "Create"

### 2.3 Connect Database to Project

1. After creating the database, click "Connect to Project"
2. Select your project
3. Vercel will automatically add these environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - And more...

---

## Step 3: Configure Environment Variables

Go to your Vercel project settings → "Environment Variables" and add:

### Required Shopify Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `SHOPIFY_API_KEY` | `678d979ac2daaeaf496c83e594dbb230` | Your Shopify app API key |
| `SHOPIFY_API_SECRET` | Your secret key | Get from Shopify Partner Dashboard |
| `SHOPIFY_APP_URL` | Your Vercel URL | Will be like `https://your-app.vercel.app` |
| `SCOPES` | `write_products,read_metaobjects,write_metaobjects,write_files,read_files` | API scopes |

### Database Variable

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Use `POSTGRES_PRISMA_URL` | Set to the Vercel Postgres connection string |

**Note:** Vercel will create `POSTGRES_PRISMA_URL` automatically when you connect the database. In the environment variables, add a new variable called `DATABASE_URL` and set its value to `$POSTGRES_PRISMA_URL` (this references the auto-created variable).

### Optional Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `SESSION_SECRET` | Generate a random string | For session encryption |

### How to Generate SESSION_SECRET

Run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Initial Deployment

### 4.1 Deploy to Vercel

1. Click "Deploy" in the Vercel project configuration
2. Wait for the build to complete
3. You'll get a deployment URL like: `https://your-app.vercel.app`

### 4.2 Run Database Migrations

After first deployment, you need to set up the database schema:

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy
```

**Option B: Using Vercel Dashboard**

1. Go to your project → Settings → Functions
2. Add a one-time build script or use Vercel's console feature
3. Run: `npx prisma migrate deploy`

---

## Step 5: Update Shopify App URLs

### 5.1 Get Your Vercel URL

After deployment, copy your production URL from Vercel (e.g., `https://story-app-abc123.vercel.app`)

### 5.2 Update shopify.app.toml

Update the following in `shopify.app.toml`:

```toml
application_url = "https://your-app.vercel.app"

[auth]
redirect_urls = [ "https://your-app.vercel.app/api/auth" ]
```

### 5.3 Update Shopify Partner Dashboard

1. Go to https://partners.shopify.com
2. Navigate to Apps → Your App → Configuration
3. Update **App URL** to: `https://your-app.vercel.app`
4. Update **Allowed redirection URL(s)** to: `https://your-app.vercel.app/api/auth`
5. Click "Save"

### 5.4 Update SHOPIFY_APP_URL Environment Variable

1. Go to Vercel project → Settings → Environment Variables
2. Update `SHOPIFY_APP_URL` to your production URL
3. Redeploy the application for changes to take effect

---

## Step 6: Redeploy with Updated Configuration

```bash
git add shopify.app.toml
git commit -m "Update Shopify URLs for Vercel deployment"
git push origin master
```

Vercel will automatically redeploy when you push to your repository.

---

## Step 7: Test Your Deployment

### 7.1 Access Your App

1. Go to your Shopify Partner Dashboard
2. Navigate to Apps → Your App → Test on development store
3. Click "Select store" and choose a development store
4. Your app should load from Vercel

### 7.2 Verify Database Connection

- Try creating a submission through the public form
- Check that data is being saved in Vercel Postgres
- Verify admin can see submissions

---

## Important Notes

### Database Considerations

1. **SQLite → PostgreSQL Migration**
   - Your schema has been updated to use PostgreSQL
   - If you have existing SQLite data, you'll need to export and import it
   - For small datasets, you can manually recreate the data

2. **Prisma Migrations**
   - Always run `npx prisma migrate deploy` after deploying schema changes
   - For development: use `npx prisma migrate dev`
   - For production: use `npx prisma migrate deploy`

### Environment Management

1. **Different Environments**
   - Vercel supports preview deployments for branches
   - Main branch deploys to production
   - Other branches deploy to preview URLs

2. **Environment Variables**
   - Set variables for all environments (Production, Preview, Development)
   - Or selectively choose which environments need which variables

### Custom Domain (Optional)

To use a custom domain like `app.yourdomain.com`:

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update Shopify app URLs to use custom domain

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module '@prisma/client'"**
- Solution: The `postbuild` script should handle this. Verify package.json:5-6

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is set correctly in Vercel
- Check that Vercel Postgres database is connected

### App Doesn't Load in Shopify

**"App installation failed"**
- Verify redirect URLs match in Shopify Partner Dashboard
- Check that `SHOPIFY_APP_URL` environment variable is correct
- Ensure app URL doesn't have trailing slash

**"Authentication error"**
- Verify `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are correct
- Check that scopes match between .env and shopify.app.toml

### Database Issues

**"Table does not exist"**
- Run database migrations: `npx prisma migrate deploy`
- Or use Vercel CLI to execute migrations

**"Connection pool timeout"**
- Use `POSTGRES_PRISMA_URL` (connection pooling) instead of `POSTGRES_URL`
- Vercel Postgres has connection limits based on your plan

---

## Useful Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# View logs
vercel logs

# Run command in production
vercel exec -- npx prisma migrate deploy

# Pull environment variables
vercel env pull
```

---

## Production Checklist

- [ ] Vercel Postgres database created and connected
- [ ] All environment variables configured in Vercel
- [ ] Database migrations run successfully
- [ ] shopify.app.toml updated with production URLs
- [ ] Shopify Partner Dashboard URLs updated
- [ ] App tested in a development store
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Webhooks tested (app/uninstalled, GDPR endpoints)

---

## Next Steps

1. **Monitor Your App**
   - Use Vercel Analytics to track performance
   - Set up error monitoring (e.g., Sentry)

2. **Set Up CI/CD**
   - Configure automatic deployments from Git
   - Add preview deployments for pull requests

3. **Scale Your Database**
   - Monitor Vercel Postgres usage
   - Upgrade plan if needed for more connections/storage

4. **Add Custom Domain**
   - Makes your app URL more professional
   - Update all Shopify configuration accordingly

---

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- Remix on Vercel: https://vercel.com/docs/frameworks/remix
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Shopify App Development: https://shopify.dev/docs/apps
- Prisma with Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
