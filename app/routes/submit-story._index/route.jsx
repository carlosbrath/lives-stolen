import { useState } from "react";
import { Link, useActionData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import StorySubmissionForm from "../../components/StorySubmissionForm";
import styles from "./styles.module.css";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    // Extract form data with new field names
    const submitterName = formData.get("submitterName");
    const submitterEmail = formData.get("submitterEmail");
    const victimName = formData.get("victimName");
    const relation = formData.get("relation");
    const incidentDate = formData.get("incidentDate");
    const state = formData.get("state");
    const roadUserType = formData.get("roadUserType");
    const injuryType = formData.get("injuryType");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const shortTitle = formData.get("shortTitle");
    const victimStory = formData.get("victimStory");

    // Validate required fields
    const errors = {};
    if (!submitterName) errors.submitterName = "Submitter name is required";
    if (!submitterEmail) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!shortTitle) errors.shortTitle = "Short title is required";
    if (!victimStory) errors.victimStory = "Victim's story is required";

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }

    // Here you would save to database/Shopify
    // For now, just return success
    return json(
      {
        success: true,
        message: "Your submission has been received. Thank you for sharing this story.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return json(
      {
        error: "An error occurred while submitting. Please try again.",
      },
      { status: 500 }
    );
  }
}

export const meta = () => [
  { title: "Submit a Story | Lives Stolen" },
  {
    name: "description",
    content: "Share a story of a traffic collision victim",
  },
];

export default function SubmitStoryPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.successContainer}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Thank You</h2>
            <p className={styles.successText}>
              {actionData?.message || "Your submission has been received. We appreciate you sharing this story."}
            </p>
            <Link to="/stories" className={styles.successButton}>
              Return to Memorial Wall
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <Link to="/stories" className={styles.backLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Stories
        </Link>
        <h1 className={styles.pageTitle}>Lost someone you love to traffic violence?</h1>
        <p className={styles.pageSubtitle}>
          Honor their memory. Share their story.
        </p>
      </header>

      <StorySubmissionForm
        isSubmitting={isSubmitting}
        actionData={actionData}
      />
    </div>
  );
}
