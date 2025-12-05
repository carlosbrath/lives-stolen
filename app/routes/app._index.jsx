import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const setupFetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [setupComplete, setSetupComplete] = useState(false);

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

  const goToSubmissions = () => {
    navigate("/app/submissions");
  };

  return (
    <Page>
      <TitleBar title="Story App - Dashboard" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Welcome to Story App
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This app allows your customers to submit memorial stories that can be displayed
                    on your storefront. Stories are stored as Shopify metaobjects for seamless
                    integration with your theme.
                  </Text>
                </BlockStack>

                {setupComplete && (
                  <Banner tone="success">
                    <p>
                      Metaobject definition created successfully! You can now start accepting story
                      submissions.
                    </p>
                  </Banner>
                )}

                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Quick Start
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

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    loading={isSettingUp}
                    onClick={runSetup}
                  >
                    Run Initial Setup
                  </Button>
                  <Button onClick={goToSubmissions}>
                    View Submissions
                  </Button>
                </InlineStack>

                {setupFetcher.data?.definition && (
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
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Features
                  </Text>
                  <List>
                    <List.Item>Public story submission form</List.Item>
                    <List.Item>Admin submission review dashboard</List.Item>
                    <List.Item>Photo upload support</List.Item>
                    <List.Item>Shopify metaobject integration</List.Item>
                    <List.Item>GDPR compliant data handling</List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Public URLs
                  </Text>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      <strong>Submission Form:</strong>
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      /stories (public memorial wall + form)
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      /submit-story (standalone form)
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Resources
                  </Text>
                  <List>
                    <List.Item>
                      View DEPLOYMENT_GUIDE.md for production setup
                    </List.Item>
                    <List.Item>
                      Check APP_CONFIG_INFO.md for configuration details
                    </List.Item>
                    <List.Item>
                      Privacy Policy and Terms of Service are available at /privacy-policy and
                      /terms-of-service
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
