import { useEffect, useState } from "react";
import { useFetcher, useNavigate, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  List,
  Icon,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  ListBulletedIcon,
  ViewIcon,
  SettingsIcon,
  PlusCircleIcon,
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

// No action needed - refresh permissions uses direct navigation

export default function Index() {
  const { shop } = useLoaderData();
  const setupFetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [setupComplete, setSetupComplete] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSettingUp = setupFetcher.state === "submitting" || setupFetcher.state === "loading";

  useEffect(() => {
    if (setupFetcher.data?.success) {
      shopify.toast.show(setupFetcher.data.message);
      if (!setupFetcher.data.alreadyExists) {
        setSetupComplete(true);
      }
    } else if (setupFetcher.data?.success === false) {
      shopify.toast.show("Setup failed: " + (setupFetcher.data.error || "Unknown error"), {
        isError: true,
      });
    }
  }, [setupFetcher.data, shopify]);

  const runSetup = () => {
    setupFetcher.submit({}, {
      method: "POST",
      action: "/app/setup-metaobject",
    });
  };

  const refreshPermissions = () => {
    console.log("refreshPermissions clicked, shop:", shop); // Debug
    // Navigate directly to refresh-scopes endpoint (full page navigation for OAuth)
    setIsRefreshing(true);
    shopify.toast.show("Refreshing app permissions...");
    // Use window.location for full page redirect to trigger OAuth flow
    window.location.href = `/api/refresh-scopes?shop=${shop}`;
  };

  const goToSubmissions = () => {
    console.log("goToSubmissions clicked"); // Debug
    navigate("/app/submissions");
  };

  const goToStoriesPage = () => {
    console.log("goToStoriesPage clicked"); // Debug
    // Use window.open with noopener for external links in embedded apps
    window.open("https://www.thewhiteline.org/pages/memorial-wall", "_blank", "noopener,noreferrer");
  };

  const goToSubmitForm = () => {
    console.log("goToSubmitForm clicked"); // Debug
    window.open("https://www.thewhiteline.org/pages/memorial-wall#submit-story", "_blank", "noopener,noreferrer");
  };

  return (
    <Page>
      <TitleBar title="Story App - Dashboard" />
      <BlockStack gap="500">
        {/* Quick Actions Section */}
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Quick Actions
              </Text>
              <Layout>
                <Layout.Section variant="oneHalf">
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300" blockAlign="center">
                          <Icon source={ListBulletedIcon} tone="base" />
                          <Text as="h3" variant="headingMd">
                            Manage Submissions
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Review, approve, edit, and publish customer story submissions from your database.
                      </Text>
                      <InlineStack gap="200">
                        <Button variant="primary" onClick={goToSubmissions}>
                          View All Submissions
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300" blockAlign="center">
                          <Icon source={ViewIcon} tone="base" />
                          <Text as="h3" variant="headingMd">
                            Public Story Wall
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        View the public memorial wall where published stories are displayed to visitors.
                      </Text>
                      <InlineStack gap="200">
                        <Button onClick={goToStoriesPage}>
                          View Stories Page
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300" blockAlign="center">
                          <Icon source={PlusCircleIcon} tone="base" />
                          <Text as="h3" variant="headingMd">
                            Submit New Story
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Access the public submission form that customers use to share their stories.
                      </Text>
                      <InlineStack gap="200">
                        <Button onClick={goToSubmitForm}>
                          Open Submission Form
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Layout.Section>

                <Layout.Section variant="oneHalf">
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="300" blockAlign="center">
                          <Icon source={SettingsIcon} tone="base" />
                          <Text as="h3" variant="headingMd">
                            Refresh App Permissions
                          </Text>
                        </InlineStack>
                      </InlineStack>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        If image uploads fail, refresh app permissions to get updated access token with new scopes.
                      </Text>
                      <InlineStack gap="200">
                        <Button
                          onClick={refreshPermissions}
                          tone="critical"
                          loading={isRefreshing}
                        >
                          Refresh Permissions
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </Layout.Section>


              </Layout>
            </BlockStack>
          </Layout.Section>
        </Layout>

        {/* Status Messages */}
        {setupComplete && (
          <Layout>
            <Layout.Section>
              <Banner tone="success">
                <p>
                  Metaobject definition created successfully! You can now start accepting story
                  submissions.
                </p>
              </Banner>
            </Layout.Section>
          </Layout>
        )}

        {setupFetcher.data?.definition && (
          <Layout>
            <Layout.Section>
              <Banner tone="info">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Metaobject Definition:</strong> {setupFetcher.data.definition.name} (
                    {setupFetcher.data.definition.type})
                  </Text>
                  {setupFetcher.data.alreadyExists && (
                    <Text as="p" variant="bodyMd">
                      The metaobject definition already exists - no action needed!
                    </Text>
                  )}
                </BlockStack>
              </Banner>
            </Layout.Section>
          </Layout>
        )}

        {/* Information Section */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  About Story App
                </Text>
                <Text variant="bodyMd" as="p">
                  This app allows your customers to submit memorial stories that can be displayed
                  on your storefront. Stories are stored as Shopify metaobjects for seamless
                  integration with your theme.
                </Text>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingSm">
                    How It Works
                  </Text>
                  <List type="number">
                    <List.Item>
                      Run the initial setup to create the Story metaobject definition (one-time
                      only)
                    </List.Item>
                    <List.Item>
                      Share your public submission form with customers
                    </List.Item>
                    <List.Item>
                      Review and approve submissions in the Submissions page
                    </List.Item>
                    <List.Item>
                      Published stories appear as metaobjects in your Shopify admin
                    </List.Item>
                  </List>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Key Features
                  </Text>
                  <List>
                    <List.Item>Public story submission form with photo upload</List.Item>
                    <List.Item>Admin review dashboard for managing submissions</List.Item>
                    <List.Item>Shopify metaobject integration for seamless theme display</List.Item>
                    <List.Item>Approval workflow (pending → approved → published)</List.Item>
                    <List.Item>GDPR compliant data handling</List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Public Pages
                  </Text>
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Memorial Wall & Form
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        /stories - Public page with story wall and submission form
                      </Text>
                      <Button size="slim" onClick={goToStoriesPage}>
                        Open Stories Page
                      </Button>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Standalone Form
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        /submit-story - Direct link to submission form only
                      </Text>
                      <Button size="slim" onClick={goToSubmitForm}>
                        Open Form
                      </Button>
                    </BlockStack>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        Individual Stories
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        /stories/:id - View individual published story details
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Additional Resources
                  </Text>
                  <List>
                    <List.Item>
                      <Text as="span" variant="bodySm">
                        Privacy Policy: /privacy-policy
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" variant="bodySm">
                        Terms of Service: /terms-of-service
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="span" variant="bodySm">
                        Check documentation files for deployment and configuration details
                      </Text>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
