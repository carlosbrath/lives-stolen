/**
 * Email Templates Module
 *
 * Centralized email templates for the Story App.
 * Easy to update and maintain.
 */

// Base styles for all emails
const baseStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    background-color: #ffffff;
  `,
  header: `
    text-align: center;
    padding-bottom: 30px;
    border-bottom: 1px solid #eaeaea;
    margin-bottom: 30px;
  `,
  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #333;
  `,
  heading: `
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
  `,
  subheading: `
    font-size: 16px;
    color: #666;
    margin: 0;
  `,
  content: `
    padding: 20px 0;
  `,
  paragraph: `
    font-size: 16px;
    line-height: 1.6;
    color: #444;
    margin: 0 0 16px 0;
  `,
  highlight: `
    background-color: #f8f9fa;
    border-left: 4px solid #8b5cf6;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 0 4px 4px 0;
  `,
  button: `
    display: inline-block;
    background-color: #8b5cf6;
    color: #ffffff;
    padding: 14px 28px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
  `,
  footer: `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #eaeaea;
    text-align: center;
    color: #999;
    font-size: 14px;
  `,
  footerText: `
    margin: 5px 0;
  `,
};

/**
 * Story Published Email Template
 */
export function storyPublishedTemplate({ submitterName, victimName, shortTitle, storyUrl = null }) {
  const displayName = victimName || shortTitle || 'your loved one';

  return {
    subject: `Your Story Has Been Published - ${displayName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Story Published</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseStyles.container}">
            <!-- Header -->
            <div style="${baseStyles.header}">
              <div style="${baseStyles.logo}">Story Memorial</div>
            </div>

            <!-- Main Content -->
            <div style="${baseStyles.content}">
              <h1 style="${baseStyles.heading}; color: #10b981;">Your Story Has Been Published!</h1>
              <p style="${baseStyles.subheading}">Thank you for sharing with our community</p>

              <p style="${baseStyles.paragraph}; margin-top: 30px;">
                Dear ${submitterName},
              </p>

              <p style="${baseStyles.paragraph}">
                We are pleased to inform you that your story about <strong>${displayName}</strong> has been reviewed and published on our memorial wall.
              </p>

              <div style="${baseStyles.highlight}">
                <strong style="color: #333;">Story Title:</strong><br>
                <span style="color: #666;">${shortTitle || 'Memorial Story'}</span>
              </div>

              <p style="${baseStyles.paragraph}">
                Your story will now be visible to visitors, helping to raise awareness and honor the memory of those we've lost.
              </p>

              ${storyUrl ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${storyUrl}" style="${baseStyles.button}">View Your Story</a>
                </div>
              ` : ''}

              <p style="${baseStyles.paragraph}">
                Thank you for being part of our community and for helping us make a difference.
              </p>

              <p style="${baseStyles.paragraph}">
                With gratitude,<br>
                <strong>The Story Memorial Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">This is an automated message from Story Memorial</p>
              <p style="${baseStyles.footerText}">Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Story Approved Email Template
 */
export function storyApprovedTemplate({ submitterName, victimName, shortTitle }) {
  const displayName = victimName || shortTitle || 'your loved one';

  return {
    subject: `Your Story Has Been Approved - ${displayName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Story Approved</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseStyles.container}">
            <!-- Header -->
            <div style="${baseStyles.header}">
              <div style="${baseStyles.logo}">Story Memorial</div>
            </div>

            <!-- Main Content -->
            <div style="${baseStyles.content}">
              <h1 style="${baseStyles.heading}; color: #f59e0b;">Your Story Has Been Approved!</h1>
              <p style="${baseStyles.subheading}">One step closer to being published</p>

              <p style="${baseStyles.paragraph}; margin-top: 30px;">
                Dear ${submitterName},
              </p>

              <p style="${baseStyles.paragraph}">
                Great news! Your story about <strong>${displayName}</strong> has been reviewed and approved by our team.
              </p>

              <div style="${baseStyles.highlight}">
                <strong style="color: #333;">What happens next?</strong><br>
                <span style="color: #666;">Your story is now in our approved queue and will be published soon. You'll receive another email once it's live on our memorial wall.</span>
              </div>

              <p style="${baseStyles.paragraph}">
                Thank you for your patience and for sharing this important story with us.
              </p>

              <p style="${baseStyles.paragraph}">
                Best regards,<br>
                <strong>The Story Memorial Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">This is an automated message from Story Memorial</p>
              <p style="${baseStyles.footerText}">Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Story Rejected Email Template
 */
export function storyRejectedTemplate({ submitterName, victimName, shortTitle, reason = null }) {
  const displayName = victimName || shortTitle || 'your submission';

  return {
    subject: `Update on Your Story Submission`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Update</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseStyles.container}">
            <!-- Header -->
            <div style="${baseStyles.header}">
              <div style="${baseStyles.logo}">Story Memorial</div>
            </div>

            <!-- Main Content -->
            <div style="${baseStyles.content}">
              <h1 style="${baseStyles.heading}; color: #666;">Submission Update</h1>

              <p style="${baseStyles.paragraph}; margin-top: 30px;">
                Dear ${submitterName},
              </p>

              <p style="${baseStyles.paragraph}">
                Thank you for submitting your story about <strong>${displayName}</strong> to our memorial wall.
              </p>

              <p style="${baseStyles.paragraph}">
                After careful review, we were unable to publish your submission at this time. This may be due to content guidelines, incomplete information, or other editorial considerations.
              </p>

              ${reason ? `
                <div style="${baseStyles.highlight}; border-left-color: #e53e3e;">
                  <strong style="color: #333;">Feedback from our team:</strong><br>
                  <span style="color: #666;">${reason}</span>
                </div>
              ` : ''}

              <p style="${baseStyles.paragraph}">
                If you believe this was in error or would like to resubmit with changes, please don't hesitate to contact us.
              </p>

              <p style="${baseStyles.paragraph}">
                We appreciate your understanding and thank you for being part of our community.
              </p>

              <p style="${baseStyles.paragraph}">
                Sincerely,<br>
                <strong>The Story Memorial Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">This is an automated message from Story Memorial</p>
              <p style="${baseStyles.footerText}">Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Story Received Email Template (Confirmation)
 */
export function storyReceivedTemplate({ submitterName, victimName, shortTitle }) {
  const displayName = victimName || shortTitle || 'your loved one';

  return {
    subject: `We Received Your Story Submission`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Submission Received</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseStyles.container}">
            <!-- Header -->
            <div style="${baseStyles.header}">
              <div style="${baseStyles.logo}">Story Memorial</div>
            </div>

            <!-- Main Content -->
            <div style="${baseStyles.content}">
              <h1 style="${baseStyles.heading}; color: #3b82f6;">Thank You for Your Submission</h1>
              <p style="${baseStyles.subheading}">We've received your story</p>

              <p style="${baseStyles.paragraph}; margin-top: 30px;">
                Dear ${submitterName},
              </p>

              <p style="${baseStyles.paragraph}">
                Thank you for sharing the story of <strong>${displayName}</strong> with our community. We have received your submission and it is now in our review queue.
              </p>

              <div style="${baseStyles.highlight}; border-left-color: #3b82f6;">
                <strong style="color: #333;">What to expect:</strong><br>
                <ul style="color: #666; margin: 10px 0; padding-left: 20px;">
                  <li>Our team will review your submission</li>
                  <li>You'll receive an email once it's approved</li>
                  <li>Another email will notify you when it's published</li>
                </ul>
              </div>

              <p style="${baseStyles.paragraph}">
                We appreciate your patience during the review process. Every story matters, and we want to ensure each one is presented with the care it deserves.
              </p>

              <p style="${baseStyles.paragraph}">
                Thank you for being part of our mission,<br>
                <strong>The Story Memorial Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">This is an automated message from Story Memorial</p>
              <p style="${baseStyles.footerText}">Please do not reply to this email</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Test Email Template
 */
export function testEmailTemplate() {
  return {
    subject: 'Test Email - Story App',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="${baseStyles.container}">
            <div style="${baseStyles.header}">
              <div style="${baseStyles.logo}">Story Memorial</div>
            </div>

            <div style="${baseStyles.content}">
              <h1 style="${baseStyles.heading}; color: #10b981;">Email Integration Test</h1>

              <p style="${baseStyles.paragraph}">
                This is a test email from your Story App.
              </p>

              <p style="${baseStyles.paragraph}">
                If you received this, your Resend integration is working correctly!
              </p>

              <div style="${baseStyles.highlight}">
                <strong>Timestamp:</strong> ${new Date().toISOString()}
              </div>
            </div>

            <div style="${baseStyles.footer}">
              <p style="${baseStyles.footerText}">Test email from Story App</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}
