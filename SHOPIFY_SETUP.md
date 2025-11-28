# Shopify Story Submission App - Setup Guide

This app allows customers to submit stories that are automatically created as draft blog posts in their Shopify store.

## 📋 Prerequisites

- Shopify CLI installed
- Node.js 18+
- Access to Shopify Partner Dashboard

## 🔧 Environment Configuration

### 1. Set Required Scopes

In your `.env` file, set the `SCOPES` variable with these required scopes:

```
SCOPES=write_blogs,read_blogs,write_files,read_files
```

**Why these scopes?**
- `write_blogs` - Create blog posts from submissions
- `read_blogs` - List/verify blog posts
- `write_files` - Upload submission images to Shopify Files
- `read_files` - Access uploaded files

### 2. Configure Shopify Shop Domain

```
SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com
```

## 🗄️ Database Setup

### 1. Run Database Migration

After updating the Prisma schema with the `Submission` model, run:

```bash
npm run setup
```

Or manually:

```bash
npx prisma migrate dev --name add_submissions
npx prisma generate
```

This creates the `submissions` table in your SQLite database.

## 🚀 Deployment Steps

### Step 1: Install App on Test Store

1. Go to Shopify Partner Dashboard
2. Create a development store (if you haven't)
3. Deploy your app: `npm run dev`
4. Authorize the app on your test store
5. Accept the requested scopes (write_blogs, read_blogs, write_files, read_files)

### Step 2: Test the Flow

1. **Access Public Form**: Visit `/submit-story` on your storefront
2. **Submit a Story**: Fill the form with test data
3. **Check Blog Posts**:
   - Go to Shopify Admin → Content → Blog Posts
   - You should see a new draft post titled "Category Story: Location"
   - The post body contains all submission details
4. **Admin Dashboard**: Visit `/app/submissions` to see tracking

### Step 3: Manage Submissions

From Shopify Admin:
- Review the draft blog post
- Edit if needed
- Publish to make it live
- Or delete to reject

The admin dashboard (`/app/submissions`) shows:
- Pending submissions count
- Published stories
- Rejected stories
- Links to Shopify Admin for management

## 📝 How It Works

### Customer Flow

```
1. Customer visits /submit-story
2. Fills form with story details
3. Submits form
4. Remix backend receives data
5. Backend authenticates with Shopify using OAuth token
6. Creates blog post via Shopify Admin GraphQL API
7. Saves submission record to database
8. Shows success message
```

### Backend Flow

```
1. Form POST to /submit-story action
2. Validate form data
3. Get OAuth token for store
4. Call Shopify Admin GraphQL API
5. Create blog post (draft status)
6. Save submission metadata to DB
7. Return success response
```

### Data Storage

**Shopify Blog Post:**
- Title: Category + Location
- Body: HTML with full story, images, metadata
- Tags: Category, "Community Story"
- Status: Draft (awaits approval)
- Author: Storefront customer

**Database (Submissions table):**
- Submitter info (name, email)
- Story content
- Shopify blog post ID (link to actual post)
- Status tracking
- Timestamps
- Admin notes

## 🖼️ Image Handling

Currently, images are stored as URLs. For production, you have two options:

### Option A: External CDN (Recommended)
```javascript
// In services/shopify.server.js uploadImagesToShopify()
// Upload to Cloudinary, S3, or similar
// Return CDN URLs for blog post
```

### Option B: Shopify Files API
```javascript
// Use Shopify Files API to upload directly
// More complex but keeps everything in Shopify
```

**To implement:** Update `uploadImagesToShopify()` function in `app/services/shopify.server.js`

## 🔒 Security Considerations

1. **OAuth Token Storage**
   - Tokens stored securely in Prisma database
   - Connected to Session model for each store
   - Only used for API calls, never exposed to frontend

2. **CSRF Protection**
   - Built-in with Remix
   - Form submissions validated server-side

3. **Input Validation**
   - Server-side validation of all form fields
   - Email format validation
   - File type restrictions

4. **Permission Checks**
   - Customers must grant permission to share stories
   - Store owner can modify/delete via Shopify Admin

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, start Shopify CLI
shopify app dev

# 3. Access form
# - Storefront: https://your-dev-url/submit-story
# - Admin: https://your-admin-url/app/submissions
```

### Test Scenarios

1. **Valid Submission**
   - Fill all fields
   - Submit
   - Check Shopify Admin for draft post

2. **Validation Errors**
   - Leave required field empty
   - Submit
   - See error message

3. **Email Validation**
   - Enter invalid email
   - See validation error

4. **Permission Requirement**
   - Uncheck permission
   - Submit fails

5. **Rejection Workflow**
   - Submit story
   - Go to Shopify Admin
   - Delete the draft post
   - Submission status shows as rejected

## 🐛 Troubleshooting

### Blog Post Not Created

**Problem**: Form submits but no blog post appears

**Solutions**:
1. Check OAuth token in Session table
2. Verify scopes include `write_blogs`
3. Check Shopify API response errors in server logs
4. Ensure blog "community-stories" exists in Shopify

### No Data in Admin Dashboard

**Problem**: Submissions page shows no records

**Solutions**:
1. Run `npx prisma studio` to check database
2. Verify migration ran successfully
3. Check that shop domain in database matches

### Images Not Appearing

**Problem**: Blog post created but images missing

**Current State**: Images placeholder URLs only
- Update `uploadImagesToShopify()` to use real image service

## 📦 Production Deployment

When deploying to production:

1. **Environment Variables**
   ```
   SHOPIFY_API_KEY=your_key
   SHOPIFY_API_SECRET=your_secret
   SHOPIFY_APP_URL=https://your-production-url.com
   SCOPES=write_blogs,read_blogs,write_files,read_files
   ```

2. **Database**
   - Use PostgreSQL instead of SQLite
   - Update Prisma datasource

3. **Image Hosting**
   - Implement real image upload service
   - Use CDN for image delivery

4. **Blog Handle**
   - Current: hardcoded to "community-stories"
   - Consider making configurable

5. **Monitoring**
   - Log API errors
   - Track submission success/failure rates
   - Monitor database performance

## 📚 API Reference

### Form Submission

**Endpoint**: `POST /submit-story`

**Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "category": "Cyclist|Pedestrian|Motorcyclist",
  "date": "string",
  "location": "string",
  "details": "string",
  "driverAccountable": "string (optional)",
  "podcast": "boolean",
  "permission": "boolean"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Your story has been submitted successfully!"
}
```

### Admin Dashboard

**Endpoint**: `GET /app/submissions`

**Returns**:
```json
{
  "submissions": {
    "pending": [...],
    "published": [...],
    "rejected": [...]
  },
  "shop": "example.myshopify.com"
}
```

## 🔗 Related Files

- Form: `app/routes/submit-story._index/route.jsx`
- Services: `app/services/shopify.server.js`
- Admin: `app/routes/app.submissions/route.jsx`
- Database: `prisma/schema.prisma`
- Config: `app/shopify.server.js`

## ✅ Checklist

- [ ] Scopes configured in `.env`
- [ ] Database migration run (`npm run setup`)
- [ ] App installed on test store
- [ ] Test submission created
- [ ] Blog post visible in Shopify Admin
- [ ] Admin dashboard accessible
- [ ] Images upload working (if implemented)
- [ ] Email validation working
- [ ] Permission requirement enforced

## 🆘 Need Help?

Check:
1. Server logs for API errors
2. Database schema with `npx prisma studio`
3. Shopify OAuth token validity
4. API scope permissions

For Shopify API issues, see: https://shopify.dev/docs/admin-api/graphql
