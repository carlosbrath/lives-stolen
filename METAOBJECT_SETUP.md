# Shopify Metaobject Setup Guide

This guide will walk you through setting up the Shopify Metaobject definition to store story submissions.

## What are Metaobjects?

Metaobjects are Shopify's flexible data structures that allow you to store custom content beyond products, customers, and orders. They're perfect for storing story submissions, testimonials, reviews, and other custom content.

## Step 1: Access Metaobject Settings

1. Log in to your **Shopify Admin**
2. Navigate to **Settings** (bottom left)
3. Click on **Custom data**
4. Click on **Metaobjects** tab
5. Click **Add definition**

## Step 2: Create the Story Submission Definition

### Basic Information

- **Type**: `story_submission` (exactly as shown, lowercase with underscore)
- **Name**: `Story Submission`
- **Description**: `Customer-submitted traffic collision stories and testimonials`

### Capabilities

Enable these capabilities:
- ✅ **Web pages** - Allows each submission to have its own URL
- ✅ **Publishable** - Allows you to control when stories go live

### Fields Configuration

Add the following fields in this exact order:

#### 1. Submitter Name
- **Type**: Single line text
- **Key**: `submitter_name`
- **Name**: Submitter Name
- **Description**: Name of the person submitting the story
- **Required**: Yes

#### 2. Submitter Email
- **Type**: Single line text
- **Key**: `submitter_email`
- **Name**: Submitter Email
- **Description**: Email address of the submitter
- **Required**: Yes
- **Validation**: Email format (if available)

#### 3. Victim Name
- **Type**: Single line text
- **Key**: `victim_name`
- **Name**: Victim Name
- **Description**: Name of the victim (optional)
- **Required**: No

#### 4. Relation
- **Type**: Single line text
- **Key**: `relation`
- **Name**: Relation to Victim
- **Description**: Submitter's relationship to the victim
- **Required**: No

#### 5. Incident Date
- **Type**: Date
- **Key**: `incident_date`
- **Name**: Incident Date
- **Description**: Date when the incident occurred
- **Required**: Yes

#### 6. State
- **Type**: Single line text
- **Key**: `state`
- **Name**: State
- **Description**: U.S. state where incident occurred
- **Required**: Yes

#### 7. Road User Type
- **Type**: Single line text
- **Key**: `road_user_type`
- **Name**: Road User Type
- **Description**: Type of road user (Cyclist, Pedestrian, Motorcyclist)
- **Required**: Yes
- **Validation**: List of values
  - Cyclist
  - Pedestrian
  - Motorcyclist

#### 8. Injury Type
- **Type**: Single line text
- **Key**: `injury_type`
- **Name**: Injury Type
- **Description**: Type of injury sustained
- **Required**: Yes
- **Validation**: List of values
  - Fatal
  - Non-fatal

#### 9. Age
- **Type**: Number (Integer)
- **Key**: `age`
- **Name**: Age at Incident
- **Description**: Age of victim at time of incident
- **Required**: No
- **Min value**: 0
- **Max value**: 150

#### 10. Gender
- **Type**: Single line text
- **Key**: `gender`
- **Name**: Gender
- **Description**: Gender of victim
- **Required**: No
- **Validation**: List of values
  - Male
  - Female
  - Non-binary
  - Other
  - Prefer not to say

#### 11. Short Title
- **Type**: Single line text
- **Key**: `short_title`
- **Name**: Short Title
- **Description**: Brief title for the story
- **Required**: Yes
- **Character limit**: 100

#### 12. Victim's Story
- **Type**: Multi-line text
- **Key**: `victim_story`
- **Name**: Victim's Story
- **Description**: Full story narrative
- **Required**: Yes
- **Character limit**: 1000

#### 13. Photo URLs
- **Type**: JSON
- **Key**: `photo_urls`
- **Name**: Photo URLs
- **Description**: Array of uploaded photo URLs
- **Required**: No

#### 14. Status
- **Type**: Single line text
- **Key**: `status`
- **Name**: Status
- **Description**: Submission review status
- **Required**: Yes
- **Default value**: `pending`
- **Validation**: List of values
  - pending
  - approved
  - rejected
  - published

#### 15. Submission Date
- **Type**: Date and time
- **Key**: `submission_date`
- **Name**: Submission Date
- **Description**: When the story was submitted
- **Required**: Yes

#### 16. Admin Notes (Optional)
- **Type**: Multi-line text
- **Key**: `admin_notes`
- **Name**: Admin Notes
- **Description**: Internal notes for review process
- **Required**: No

## Step 3: Save the Definition

1. Review all fields to ensure they match exactly
2. Click **Save** at the top right

## Step 4: Verify the Setup

After saving, you should see your new "Story Submission" metaobject definition in the list.

To test:
1. Click on the definition name
2. Click **Add entry**
3. Fill in some test data
4. Click **Save**

## Step 5: Update Your App Permissions (If Needed)

Your Shopify app needs these permissions to work with metaobjects:

**Required Scopes:**
- `write_metaobjects` - To create and update submissions
- `read_metaobjects` - To retrieve submissions

If you need to add these scopes:

1. Open your `shopify.app.toml` file
2. Add to the scopes section:
   ```toml
   scopes = "write_metaobjects,read_metaobjects,write_products,read_products"
   ```
3. Reinstall the app to apply new permissions

## Using Metaobjects in Your App

### Creating a Submission
The form submission will automatically create a metaobject entry when submitted. The code handles this in `app/routes/stories._index/route.jsx`.

### Viewing Submissions in Shopify Admin

1. Go to **Content** in your Shopify admin
2. Click on **Metaobjects**
3. Click on **Story Submission**
4. You'll see all submitted stories

### Managing Submissions

You can:
- Edit any field
- Change status from "pending" to "approved" or "published"
- Add admin notes
- Delete submissions
- Publish/unpublish stories

### Displaying Published Stories

To fetch and display published stories on your storefront, use the provided functions in `app/services/metaobjects.server.js`:

```javascript
import { getStoryMetaobjects } from "~/services/metaobjects.server";

// In your loader
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const publishedStories = await getStoryMetaobjects(admin, "published");

  return json({ stories: publishedStories });
}
```

## Troubleshooting

### Error: "Metaobject type not found"
- Make sure the type is exactly `story_submission` (lowercase, with underscore)
- Verify the metaobject definition was saved successfully

### Error: "Field key mismatch"
- Check that all field keys match exactly (e.g., `submitter_name` not `submitterName`)
- Field keys must use underscores, not camelCase

### Submissions not appearing
- Check that your app has the correct permissions
- Verify the metaobject was created successfully in Shopify admin
- Check the browser console and server logs for errors

## Next Steps

Once your metaobject is set up:

1. ✅ Test the form submission on your app
2. ✅ Check Shopify admin to see the created entry
3. ✅ Set up a workflow to review and approve submissions
4. ✅ Create a public display page for approved stories (optional)

## Advanced Features

### Webhooks
You can set up webhooks to get notified when new submissions are created:

**Topic**: `metaobjects/create`

### Bulk Operations
Use Shopify's bulk operations API to export or process multiple submissions at once.

### Custom Storefronts
Use the Storefront API to fetch and display published stories on custom storefronts.

---

For more information, see the [Shopify Metaobjects documentation](https://shopify.dev/docs/apps/build/custom-data/metaobjects).
