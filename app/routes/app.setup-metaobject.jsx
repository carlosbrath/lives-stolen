import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

/**
 * Auto-setup route for creating the Story metaobject definition
 * This should be run once when the app is first installed
 */
export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    // Check if metaobject definition already exists
    const checkQuery = `
      query {
        metaobjectDefinitions(first: 50) {
          nodes {
            id
            type
            name
          }
        }
      }
    `;

    const checkResponse = await admin.graphql(checkQuery);
    const checkData = await checkResponse.json();

    const existingDef = checkData.data?.metaobjectDefinitions?.nodes?.find(
      (def) => def.type === "story"
    );

    if (existingDef) {
      return json({
        success: true,
        message: "Story metaobject definition already exists",
        definition: existingDef,
        alreadyExists: true,
      });
    }

    // Create the Story metaobject definition
    const createDefinitionMutation = `
      mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
            name
            type
            fieldDefinitions {
              name
              key
              type {
                name
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      definition: {
        name: "Story",
        type: "story",
        description: "Memorial stories submitted by the community",
        fieldDefinitions: [
          {
            name: "Submitter Name",
            key: "submitter_name",
            description: "Name of the person submitting the story",
            type: "single_line_text_field",
            required: true,
          },
          {
            name: "Submitter Email",
            key: "submitter_email",
            description: "Email of the person submitting the story",
            type: "single_line_text_field",
            required: true,
          },
          {
            name: "Victim Name",
            key: "victim_name",
            description: "Name of the victim",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Relation",
            key: "relation",
            description: "Relationship to the victim",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Age",
            key: "age",
            description: "Age of the victim",
            type: "number_integer",
            required: false,
          },
          {
            name: "Gender",
            key: "gender",
            description: "Gender of the victim",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Incident Date",
            key: "incident_date",
            description: "Date of the incident",
            type: "date",
            required: false,
          },
          {
            name: "State",
            key: "state",
            description: "State where the incident occurred",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Road User Type",
            key: "road_user_type",
            description: "Type of road user (pedestrian, cyclist, etc.)",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Injury Type",
            key: "injury_type",
            description: "Type of injury sustained",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Short Title",
            key: "short_title",
            description: "Brief title for the story",
            type: "single_line_text_field",
            required: true,
          },
          {
            name: "Victim Story",
            key: "victim_story",
            description: "Full story text",
            type: "multi_line_text_field",
            required: true,
          },
          {
            name: "Photo URLs",
            key: "photo_urls",
            description: "JSON array of photo URLs",
            type: "multi_line_text_field",
            required: false,
          },
          {
            name: "Status",
            key: "status",
            description: "Publication status (pending, published, rejected)",
            type: "single_line_text_field",
            required: false,
          },
          {
            name: "Published At",
            key: "published_at",
            description: "Date when the story was published",
            type: "date_time",
            required: false,
          },
        ],
        access: {
          admin: "PUBLIC_READ_WRITE",
          storefront: "PUBLIC_READ",
        },
      },
    };

    const response = await admin.graphql(createDefinitionMutation, {
      variables,
    });

    const data = await response.json();

    if (data.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
      return json({
        success: false,
        errors: data.data.metaobjectDefinitionCreate.userErrors,
      }, { status: 400 });
    }

    return json({
      success: true,
      message: "Story metaobject definition created successfully!",
      definition: data.data?.metaobjectDefinitionCreate?.metaobjectDefinition,
    });
  } catch (error) {
    console.error("Error setting up metaobject definition:", error);
    return json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
};

export const loader = async ({ request }) => {
  // Redirect GET requests to the app home page
  return json({ message: "Use POST to set up metaobject definition" }, { status: 405 });
};
