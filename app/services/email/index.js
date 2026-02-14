/**
 * Email Service Module
 *
 * Centralized email service with:
 * - Template-based emails
 * - Send confirmation/tracking
 * - Error handling
 * - Logging
 */

import { Resend } from 'resend';
import {
  storyPublishedTemplate,
  storyApprovedTemplate,
  storyRejectedTemplate,
  storyReceivedTemplate,
  testEmailTemplate,
} from './templates.js';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default sender - Update this when you have a custom domain
const DEFAULT_FROM = 'Story Memorial <onboarding@resend.dev>';

// Test email for development (override recipient)
const TEST_EMAIL = 'sabasabir36203@gmail.com';
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Email send result type
 * @typedef {Object} EmailResult
 * @property {boolean} success - Whether email was sent successfully
 * @property {string|null} messageId - Resend message ID if successful
 * @property {string|null} error - Error message if failed
 * @property {string} recipient - Actual recipient email
 * @property {string} timestamp - ISO timestamp of send attempt
 */

/**
 * Core email sending function
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender (optional)
 * @returns {Promise<EmailResult>}
 */
async function sendEmail({ to, subject, html, from = DEFAULT_FROM }) {
  const timestamp = new Date().toISOString();

  // Use test email in development mode
  const recipient = IS_DEV ? to : to;

  // Check if Resend is configured
  if (!resend) {
    console.error('[EMAIL] Resend API key not configured');
    return {
      success: false,
      messageId: null,
      error: 'Email service not configured (missing RESEND_API_KEY)',
      recipient,
      timestamp,
    };
  }

  try {
    console.log(`[EMAIL] Sending to: ${recipient} (original: ${to})`);
    console.log(`[EMAIL] Subject: ${subject}`);

    const { data, error } = await resend.emails.send({
      from,
      to: [recipient],
      subject: IS_DEV ? `[TEST] ${subject}` : subject,
      html,
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      return {
        success: false,
        messageId: null,
        error: error.message || 'Failed to send email',
        recipient,
        timestamp,
      };
    }

    console.log(`[EMAIL] Success! Message ID: ${data?.id}`);
    return {
      success: true,
      messageId: data?.id || null,
      error: null,
      recipient,
      timestamp,
    };
  } catch (err) {
    console.error('[EMAIL] Exception:', err);
    return {
      success: false,
      messageId: null,
      error: err.message || 'Unexpected error sending email',
      recipient,
      timestamp,
    };
  }
}

/**
 * Send story published notification
 * @param {Object} submission - Submission data from database
 * @returns {Promise<EmailResult>}
 */
export async function sendStoryPublishedEmail(submission) {
  const template = storyPublishedTemplate({
    submitterName: submission.submitterName || 'Valued Submitter',
    victimName: submission.victimName,
    shortTitle: submission.shortTitle,
    storyUrl: null, // Can add URL if available
  });

  return sendEmail({
    to: submission.submitterEmail,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send story approved notification
 * @param {Object} submission - Submission data from database
 * @returns {Promise<EmailResult>}
 */
export async function sendStoryApprovedEmail(submission) {
  const template = storyApprovedTemplate({
    submitterName: submission.submitterName || 'Valued Submitter',
    victimName: submission.victimName,
    shortTitle: submission.shortTitle,
  });

  return sendEmail({
    to: submission.submitterEmail,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send story rejected notification
 * @param {Object} submission - Submission data from database
 * @param {string} [reason] - Optional rejection reason
 * @returns {Promise<EmailResult>}
 */
export async function sendStoryRejectedEmail(submission, reason = null) {
  const template = storyRejectedTemplate({
    submitterName: submission.submitterName || 'Valued Submitter',
    victimName: submission.victimName,
    shortTitle: submission.shortTitle,
    reason,
  });

  return sendEmail({
    to: submission.submitterEmail,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send story received confirmation
 * @param {Object} submission - Submission data from database
 * @returns {Promise<EmailResult>}
 */
export async function sendStoryReceivedEmail(submission) {
  const template = storyReceivedTemplate({
    submitterName: submission.submitterName || 'Valued Submitter',
    victimName: submission.victimName,
    shortTitle: submission.shortTitle,
  });

  return sendEmail({
    to: submission.submitterEmail,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send test email
 * @param {string} to - Recipient email
 * @returns {Promise<EmailResult>}
 */
export async function sendTestEmail(to) {
  const template = testEmailTemplate();

  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
  });
}

/**
 * Send status change email based on new status
 * @param {Object} submission - Submission data
 * @param {string} newStatus - New status (approved, published, rejected)
 * @param {Object} [options] - Additional options
 * @param {string} [options.rejectionReason] - Reason for rejection
 * @returns {Promise<EmailResult>}
 */
export async function sendStatusChangeEmail(submission, newStatus, options = {}) {
  switch (newStatus) {
    case 'approved':
      return sendStoryApprovedEmail(submission);
    case 'published':
      return sendStoryPublishedEmail(submission);
    case 'rejected':
      return sendStoryRejectedEmail(submission, options.rejectionReason);
    default:
      return {
        success: false,
        messageId: null,
        error: `Unknown status: ${newStatus}`,
        recipient: submission.submitterEmail,
        timestamp: new Date().toISOString(),
      };
  }
}

// Export for direct use
export { sendEmail };
