import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { 
  Page, Layout, Card, BlockStack, Text, TextField, 
  Button, InlineStack, Box, List, Divider 
} from "@shopify/polaris";
import { ClipboardIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

// LOADER: Fetches your API details from environment variables
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const baseUrl = process.env.SHOPIFY_APP_URL || "https://your-app.fly.dev";
  
  return json({ 
    shop: session.shop, 
    apiUrl: `${baseUrl}/api/updateAdaptDetails`, 
    apiKey: process.env.X_ADAPT_KEY || "12345" 
  });
};

export default function Dashboard() {
  const { shop, apiUrl, apiKey } = useLoaderData();
  const shopify = useAppBridge();
  const fetcher = useFetcher();
  const [testInvoice, setTestInvoice] = useState("");

  // Handles Success/Error Notifications
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.status === "success") {
        shopify.toast.show("Order Fulfilled Successfully!");
      } else if (fetcher.data.error) {
        shopify.toast.show(fetcher.data.error, { isError: true });
      }
    }
  }, [fetcher.data, shopify]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    shopify.toast.show("Copied to clipboard");
  };

  const runManualTest = () => {
    fetcher.submit(
      { invoiceNumber: testInvoice, shop: shop }, 
      { method: "POST", action: "/api/updateAdaptDetails" }
    );
  };

  return (
    <Page title="Integration Dashboard">
      <Layout>
        {/* --- LEFT SIDE: API CREDENTIALS --- */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Webhook Credentials</Text>
              <Text as="p" tone="subdued">
                Use these details to connect your external automation systems.
              </Text>
              
              <TextField
                label="Endpoint URL"
                value={apiUrl}
                readOnly
                connectedRight={
                  <Button icon={ClipboardIcon} onClick={() => copyToClipboard(apiUrl)} />
                }
              />

              <TextField
                label="Secret Key (X-Adapt-Key)"
                value={apiKey}
                readOnly
                connectedRight={
                  <Button icon={ClipboardIcon} onClick={() => copyToClipboard(apiKey)} />
                }
              />
            </BlockStack>
          </Card>

          {/* --- MANUAL TESTER CARD --- */}
          <Box paddingBlockStart="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Manual Fulfillment Tester</Text>
                <InlineStack gap="300" align="start">
                  <div style={{ flex: 1 }}>
                    <TextField
                      placeholder="Enter Order Number (e.g. 1012)"
                      value={testInvoice}
                      onChange={(val) => setTestInvoice(val)}
                      autoComplete="off"
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={runManualTest}
                    loading={fetcher.state !== "idle"}
                    disabled={!testInvoice}
                  >
                    Test Fulfillment
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>

        {/* --- RIGHT SIDE: QUICK SETUP GUIDE --- */}
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Quick Setup</Text>
              <List>
                <List.Item>Send a <b>POST</b> request to the Endpoint URL.</List.Item>
                <List.Item>Include the <b>X-Adapt-Key</b> in your headers.</List.Item>
                <List.Item>Pass <b>invoiceNumber</b> in the JSON body.</List.Item>
              </List>
              <Divider />
              <Box paddingBlockStart="200">
                <Text variant="bodySm" tone="subdued">
                  Example JSON Body:
                </Text>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <pre style={{ fontSize: "11px", margin: 0 }}>
                    {`{\n  "invoiceNumber": "1001",\n  "shop": "${shop}"\n}`}
                  </pre>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}