# Fly.io Deployment Guide

This guide will walk you through deploying your Shopify app to Fly.io.

## Prerequisites

1. Fly.io account (already created ✓)
2. Fly CLI installed on your machine
3. Docker installed (for local builds)

## Step 1: Install Fly CLI

If you haven't installed the Fly CLI yet, run:

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

## Step 2: Login to Fly.io

```bash
fly auth login
```

This will open your browser to authenticate.

## Step 3: Update App Name (Optional)

Open `fly.toml` and change the app name if needed:

```toml
app = "your-unique-app-name"
```

The app name must be unique across all Fly.io apps.

## Step 4: Create the Fly App

```bash
fly apps create stories-app
```

Or use a custom name:
```bash
fly apps create your-unique-app-name
```

## Step 5: Create PostgreSQL Database

Fly.io offers PostgreSQL as a managed service. Create one for your app:

```bash
fly postgres create
```

Follow the prompts:
- Choose a name (e.g., `story-app-db`)
- Select a region (same as your app's primary_region in fly.toml)
- Choose configuration (Development preset is fine for testing)

After creation, attach the database to your app:

```bash
fly postgres attach --app story-app story-app-db
```

fly postgres attach --app stories-app lively-pond-9390

This will automatically set the `DATABASE_URL` secret in your app.

## Step 6: Set Environment Variables (Secrets)

Set your required environment variables as secrets:

```bash
# Shopify API credentials
fly secrets set SHOPIFY_API_KEY=
fly secrets set SHOPIFY_API_SECRET=

# Session secret (generate a random string)
fly secrets set SESSION_SECRET=$(openssl rand -base64 32)

# Shopify scopes
fly secrets set SCOPES=write_products,read_metaobjects,write_metaobjects,write_files,read_files

# Your app URL (will be https://your-app-name.fly.dev)
fly secrets set SHOPIFY_APP_URL=https://stories-app.fly.dev
```

**Note:** Replace `story-app` with your actual app name in the URL.

To generate a secure session secret on Windows:
```powershell
# Use PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

## Step 7: Update Shopify App Settings

Before deploying, update your Shopify app settings in the Partner Dashboard:

1. Go to your app in the Shopify Partner Dashboard
2. Update the App URL to: `https://your-app-name.fly.dev`
3. Update the Allowed redirection URL(s) to include:
   - `https://your-app-name.fly.dev/auth/callback`
   - `https://your-app-name.fly.dev/auth/shopify/callback`

## Step 8: Deploy to Fly.io

Now you're ready to deploy:

```bash
fly deploy
```

This will:
- Build your Docker image
- Push it to Fly.io
- Run database migrations
- Start your application

## Step 9: Check Deployment Status

Monitor your deployment:

```bash
fly status
```

View logs:
```bash
fly logs
```

## Step 10: Open Your App

```bash
fly open
```

This will open your app in the browser.

## Database Migrations

The Dockerfile is configured to run migrations automatically during deployment via the `npm run build` command.

To manually run migrations:

```bash
fly ssh console
npm run setup
```

## Scaling Your App

To scale your app (increase instances):

```bash
fly scale count 2
```

To change machine specs:

```bash
fly scale vm shared-cpu-2x --memory 2048
```

## Environment Variables

To view current secrets:

```bash
fly secrets list
```

To update a secret:

```bash
fly secrets set VARIABLE_NAME=new_value
```

## Troubleshooting

### View real-time logs:
```bash
fly logs -f
```

### Connect to your app via SSH:
```bash
fly ssh console
```

### Check database connection:
```bash
fly postgres connect -a story-app-db
```

### Restart your app:
```bash
fly apps restart story-app
```

### Check app configuration:
```bash
fly config show
```

## Important Notes

1. **Database**: The app now uses PostgreSQL instead of SQLite (updated in `prisma/schema.prisma`)

2. **Environment**: The `NODE_ENV=production` is set in both `fly.toml` and the Dockerfile

3. **HTTPS**: Fly.io automatically provides SSL certificates and forces HTTPS

4. **Regions**: The default region is `iad` (Ashburn, VA). Change it in `fly.toml` if needed:
   - View available regions: `fly platform regions`
   - Update in `fly.toml`: `primary_region = "lhr"` (for London)

5. **Costs**: Monitor your usage at https://fly.io/dashboard

## Updating Your App

After making changes to your code:

```bash
git add .
git commit -m "Your changes"
fly deploy
```

## Useful Commands

- `fly apps list` - List all your apps
- `fly apps destroy story-app` - Delete the app
- `fly postgres list` - List PostgreSQL databases
- `fly dashboard` - Open Fly.io dashboard
- `fly doctor` - Check Fly CLI health

## Support

- Fly.io Docs: https://fly.io/docs/
- Fly.io Community: https://community.fly.io/
- Shopify App Deployment: https://shopify.dev/docs/apps/deployment/web
