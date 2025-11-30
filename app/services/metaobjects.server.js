import { authenticate } from "../shopify.server";

/**
 * Shopify Metaobject Definition Type for Story Submissions
 *
 * You'll need to create this metaobject definition in your Shopify admin:
 * Settings > Custom Data > Metaobjects > Add definition
 *
 * Type: story_submission
 * Name: Story Submission
 *
 * Fields:
 * - submitter_name (Single line text)
 * - submitter_email (Single line text)
 * - victim_name (Single line text)
 * - relation (Single line text)
 * - incident_date (Date)
 * - state (Single line text)
 * - road_user_type (Single line text)
 * - injury_type (Single line text)
 * - age (Number - Integer)
 * - gender (Single line text)
 * - short_title (Single line text)
 * - victim_story (Multi-line text)
 * - photo_urls (JSON)
 * - status (Single line text) - default: "pending"
 * - submission_date (Date and time)
 */

/**
 * Create a story submission as a Shopify Metaobject
 */
export async function createStoryMetaobject(admin, submissionData) {
  const mutation = `
    mutation CreateStoryMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          displayName
          fields {
            key
            value
          }
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = {
    metaobject: {
      type: "story_submission",
      capabilities: {
        publishable: {
          status: "DRAFT"
        }
      },
      fields: [
        { key: "submitter_name", value: submissionData.submitterName || "" },
        { key: "submitter_email", value: submissionData.submitterEmail || "" },
        { key: "victim_name", value: submissionData.victimName || "" },
        { key: "relation", value: submissionData.relation || "" },
        { key: "incident_date", value: submissionData.incidentDate || "" },
        { key: "state", value: submissionData.state || "" },
        { key: "road_user_type", value: submissionData.roadUserType || "" },
        { key: "injury_type", value: submissionData.injuryType || "" },
        { key: "age", value: submissionData.age?.toString() || "0" },
        { key: "gender", value: submissionData.gender || "" },
        { key: "short_title", value: submissionData.shortTitle || "" },
        { key: "victim_story", value: submissionData.victimStory || "" },
        { key: "photo_urls", value: JSON.stringify(submissionData.photoUrls || []) },
        { key: "status", value: "pending" },
        { key: "submission_date", value: new Date().toISOString() }
      ]
    }
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.metaobjectCreate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectCreate.userErrors;
      console.error("Metaobject creation errors:", errors);
      throw new Error(`Shopify Error: ${JSON.stringify(errors)}`);
    }

    return result.data?.metaobjectCreate?.metaobject;
  } catch (error) {
    console.error("Error creating story metaobject:", error);
    throw error;
  }
}

/**
 * Get all story submissions from metaobjects
 */
export async function getStoryMetaobjects(admin, status = null, first = 50) {
  const query = `
    query GetStorySubmissions($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        edges {
          node {
            id
            handle
            displayName
            fields {
              key
              value
            }
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const variables = {
    type: "story_submission",
    first
  };

  try {
    const response = await admin.graphql(query, { variables });
    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const metaobjects = result.data?.metaobjects?.edges?.map(edge => {
      const fields = {};
      edge.node.fields.forEach(field => {
        fields[field.key] = field.value;
      });

      return {
        id: edge.node.id,
        handle: edge.node.handle,
        displayName: edge.node.displayName,
        ...fields,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt
      };
    }) || [];

    // Filter by status if provided
    if (status) {
      return metaobjects.filter(obj => obj.status === status);
    }

    return metaobjects;
  } catch (error) {
    console.error("Error fetching story metaobjects:", error);
    throw error;
  }
}

/**
 * Get a single story submission metaobject
 */
export async function getStoryMetaobject(admin, id) {
  const query = `
    query GetStorySubmission($id: ID!) {
      metaobject(id: $id) {
        id
        handle
        displayName
        fields {
          key
          value
        }
        createdAt
        updatedAt
      }
    }
  `;

  const variables = { id };

  try {
    const response = await admin.graphql(query, { variables });
    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    const metaobject = result.data?.metaobject;
    if (!metaobject) {
      return null;
    }

    const fields = {};
    metaobject.fields.forEach(field => {
      fields[field.key] = field.value;
    });

    return {
      id: metaobject.id,
      handle: metaobject.handle,
      displayName: metaobject.displayName,
      ...fields,
      createdAt: metaobject.createdAt,
      updatedAt: metaobject.updatedAt
    };
  } catch (error) {
    console.error("Error fetching story metaobject:", error);
    throw error;
  }
}

/**
 * Update a story submission metaobject
 */
export async function updateStoryMetaobject(admin, id, updateData) {
  const mutation = `
    mutation UpdateStoryMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          handle
          displayName
          fields {
            key
            value
          }
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const fields = [];

  // Build fields array from updateData
  if (updateData.status) {
    fields.push({ key: "status", value: updateData.status });
  }
  if (updateData.adminNotes) {
    fields.push({ key: "admin_notes", value: updateData.adminNotes });
  }

  const variables = {
    id,
    metaobject: {
      fields
    }
  };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectUpdate.userErrors;
      console.error("Metaobject update errors:", errors);
      throw new Error(`Shopify Error: ${JSON.stringify(errors)}`);
    }

    return result.data?.metaobjectUpdate?.metaobject;
  } catch (error) {
    console.error("Error updating story metaobject:", error);
    throw error;
  }
}

/**
 * Delete a story submission metaobject
 */
export async function deleteStoryMetaobject(admin, id) {
  const mutation = `
    mutation DeleteStoryMetaobject($id: ID!) {
      metaobjectDelete(id: $id) {
        deletedId
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = { id };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.metaobjectDelete?.userErrors?.length > 0) {
      const errors = result.data.metaobjectDelete.userErrors;
      console.error("Metaobject deletion errors:", errors);
      throw new Error(`Shopify Error: ${JSON.stringify(errors)}`);
    }

    return result.data?.metaobjectDelete?.deletedId;
  } catch (error) {
    console.error("Error deleting story metaobject:", error);
    throw error;
  }
}

/**
 * Publish a story submission (change from DRAFT to ACTIVE)
 */
export async function publishStoryMetaobject(admin, id) {
  const mutation = `
    mutation PublishStoryMetaobject($id: ID!) {
      metaobjectUpdate(
        id: $id
        metaobject: {
          capabilities: {
            publishable: {
              status: ACTIVE
            }
          }
        }
      ) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const variables = { id };

  try {
    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    if (result.data?.metaobjectUpdate?.userErrors?.length > 0) {
      const errors = result.data.metaobjectUpdate.userErrors;
      console.error("Metaobject publish errors:", errors);
      throw new Error(`Shopify Error: ${JSON.stringify(errors)}`);
    }

    // Also update status field
    await updateStoryMetaobject(admin, id, { status: "published" });

    return result.data?.metaobjectUpdate?.metaobject;
  } catch (error) {
    console.error("Error publishing story metaobject:", error);
    throw error;
  }
}
