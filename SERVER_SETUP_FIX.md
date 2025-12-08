# Fix: Server Showing Static Files Instead of Running App

## Problem
Uploaded build files to https://shopiapp.samnanresort.com/build/server/ but seeing code instead of running application.

## Why This Happens
- The `/build` folder contains **compiled code**, not a static website
- You need to **run** the Node.js server, not just upload files
- The web server (nginx/apache) needs proper configuration

---

## Solution: Correct Deployment Steps

### Step 1: Upload Files to Correct Location

Upload to your app directory (NOT public_html):
```
/home/yourusername/story-app/
├── build/
├── prisma/
├── package.json
├── package-lock.json
├── shopify.app.toml
└── .env
```

**DO NOT** upload to:
- ❌ `/public_html/build/`
- ❌ `/var/www/html/build/`
- ❌ Any public directory

### Step 2: SSH into Your Server

```bash
ssh user@shopiapp.samnanresort.com
```

### Step 3: Navigate to App Directory

```bash
cd /home/yourusername/story-app
# or wherever you uploaded the files
```

### Step 4: Create .env File

```bash
nano .env
```

Add this content:
```env
SHOPIFY_API_KEY=678d979ac2daaeaf496c83e594dbb230
SHOPIFY_API_SECRET=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
SHOPIFY_APP_URL=https://shopiapp.samnanresort.com
SCOPES=write_products,read_metaobjects,write_metaobjects,write_files,read_files
DATABASE_URL=file:./production.sqlite
NODE_ENV=production
PORT=3000
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Step 5: Install Dependencies

```bash
npm ci --production
```

### Step 6: Set Up Database

```bash
npx prisma generate
npx prisma migrate deploy
```

### Step 7: Start the Application

```bash
# Install PM2 (process manager)
sudo npm install -g pm2

# Start the app
pm2 start npm --name story-app -- start

# Save PM2 configuration
pm2 save

# Make PM2 start on server reboot
pm2 startup
```

Your app is now running on **port 3000** internally.

### Step 8: Configure Nginx Reverse Proxy

Create nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/story-app
```

Add this:
```nginx
server {
    listen 80;
    server_name shopiapp.samnanresort.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shopiapp.samnanresort.com;

    # SSL Certificate (use your existing certificate)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/certificate.key;

    # Proxy to Node.js app on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/story-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9: Verify It's Running

```bash
# Check app status
pm2 status

# Check app logs
pm2 logs story-app

# Test locally
curl http://localhost:3000/healthz
```

Should return: `OK`

---

## Quick Fix Script

Save this as `deploy-fix.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Fixing deployment..."

# Navigate to app directory
cd /home/yourusername/story-app

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Set up database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate deploy

# Start with PM2
echo "▶️ Starting app..."
pm2 stop story-app 2>/dev/null || true
pm2 delete story-app 2>/dev/null || true
pm2 start npm --name story-app -- start
pm2 save

echo "✅ App is running!"
echo "Check status: pm2 status"
echo "Check logs: pm2 logs story-app"
echo ""
echo "Next: Configure nginx reverse proxy"
```

Run it:
```bash
chmod +x deploy-fix.sh
./deploy-fix.sh
```

---

## Important Notes

### ✅ Correct Setup:
- Files uploaded to **app directory** (not public)
- Node.js server **running** on port 3000
- Nginx **reverse proxy** pointing to localhost:3000
- Public URL: `https://shopiapp.samnanresort.com`

### ❌ Wrong Setup:
- Files in public_html/build/server/
- No Node.js server running
- Accessing build files directly
- Showing code instead of app

---

## Verify Deployment

After setup, test these URLs:

1. **Health Check:**
   ```
   https://shopiapp.samnanresort.com/healthz
   ```
   Should return: `OK`

2. **Home Page:**
   ```
   https://shopiapp.samnanresort.com/
   ```
   Should show: Landing page

3. **Admin (requires Shopify OAuth):**
   ```
   https://shopiapp.samnanresort.com/app
   ```
   Should redirect to Shopify login

---

## Troubleshooting

### Still seeing code/files?
- Remove files from public_html
- Ensure nginx is configured correctly
- Restart nginx: `sudo systemctl restart nginx`

### App not starting?
```bash
# Check Node.js version
node -v  # Must be 18.20+

# Check if port 3000 is available
lsof -i :3000

# Check PM2 logs
pm2 logs story-app --lines 50
```

### "Cannot find module" errors?
```bash
npm ci --production
npx prisma generate
```

### Database errors?
```bash
npx prisma migrate deploy
chmod 664 production.sqlite
```

---

## Server Requirements

Make sure your server has:
- ✅ Node.js 18.20+ installed
- ✅ npm installed
- ✅ nginx installed
- ✅ SSL certificate configured
- ✅ Port 3000 available

---

## Need Help?

**Check if Node.js is installed:**
```bash
node -v
npm -v
```

**If not installed:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**Check if nginx is running:**
```bash
sudo systemctl status nginx
```

**Check if PM2 is installed:**
```bash
pm2 -v
```

---

## Summary

1. Upload files to **app directory**, not public folder
2. Install dependencies: `npm ci --production`
3. Set up database: `npx prisma generate && npx prisma migrate deploy`
4. Start app: `pm2 start npm --name story-app -- start`
5. Configure nginx reverse proxy
6. Access at: `https://shopiapp.samnanresort.com`

**Your app should now work!** 🚀
