import { json } from "@remix-run/node";
import {
  sendTestEmail,
  sendStatusChangeEmail,
} from "../services/email/index.js";

/**
 * Test email endpoint
 *
 * GET /api/test-email?to=your@email.com
 *   - Sends a simple test email
 *
 * POST /api/test-email
 *   - Body: { to, type, submitterName, status, victimName, shortTitle, rejectionReason }
 *   - type: "test" | "status"
 *   - status: "approved" | "published" | "rejected"
 */

// Basic email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// GET - Simple test email
export async function loader({ request }) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  if (!to) {
    return json(
      {
        success: false,
        error: "Missing 'to' parameter. Use: /api/test-email?to=your@email.com",
      },
      { status: 400 }
    );
  }

  if (!isValidEmail(to)) {
    return json(
      { success: false, error: "Invalid email format" },
      { status: 400 }
    );
  }

  const result = await sendTestEmail(to);

  if (result.success) {
    return json({
      success: true,
      message: `Test email sent to ${result.recipient}`,
      messageId: result.messageId,
      timestamp: result.timestamp,
    });
  }

  return json(
    {
      success: false,
      error: result.error,
      timestamp: result.timestamp,
    },
    { status: 500 }
  );
}

// POST - Test status notification emails
export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const {
      to,
      type = "test",
      submitterName = "Test User",
      submitterEmail,
      status = "published",
      victimName,
      shortTitle = "Test Story",
      rejectionReason,
    } = body;

    // Use 'to' or 'submitterEmail'
    const recipientEmail = to || submitterEmail;

    if (!recipientEmail) {
      return json(
        {
          success: false,
          error: "Missing 'to' or 'submitterEmail' field in request body",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(recipientEmail)) {
      return json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    let result;

    if (type === "status") {
      // Validate status
      const validStatuses = ["approved", "published", "rejected"];
      if (!validStatuses.includes(status)) {
        return json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Mock submission object for testing
      const mockSubmission = {
        submitterName,
        submitterEmail: recipientEmail,
        victimName: victimName || null,
        shortTitle,
      };

      result = await sendStatusChangeEmail(mockSubmission, status, {
        rejectionReason,
      });
    } else {
      // Simple test email
      result = await sendTestEmail(recipientEmail);
    }

    if (result.success) {
      return json({
        success: true,
        message: `Email sent successfully to ${result.recipient}`,
        messageId: result.messageId,
        timestamp: result.timestamp,
        type: type === "status" ? `status_${status}` : "test",
      });
    }

    return json(
      {
        success: false,
        error: result.error,
        timestamp: result.timestamp,
      },
      { status: 500 }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error: `Invalid request: ${error.message}`,
      },
      { status: 400 }
    );
  }
}
