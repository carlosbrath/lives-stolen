import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../../shopify.server";
import { getSubmissionsForStore } from "../../services/shopify.server";
import styles from "./styles.module.css";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Get all submissions for this store
  const submissions = await getSubmissionsForStore(session.shop);

  // Group by status
  const pending = submissions.filter((s) => s.status === "pending");
  const published = submissions.filter((s) => s.status === "published");
  const rejected = submissions.filter((s) => s.status === "rejected");

  return {
    submissions: {
      pending,
      published,
      rejected,
      all: submissions,
    },
    shop: session.shop,
  };
}

export const meta = () => [
  { title: "Story Submissions | Admin Dashboard" },
];

function SubmissionCard({ submission, status }) {
  const statusColor = {
    pending: "#f59e0b",
    published: "#10b981",
    rejected: "#e53e3e",
  };

  return (
    <div className={styles.submissionCard}>
      <div className={styles.cardHeader}>
        <div>
          <h4 className={styles.submitterName}>
            {submission.firstName} {submission.lastName}
          </h4>
          <p className={styles.submitterEmail}>{submission.email}</p>
        </div>
        <span
          className={styles.statusBadge}
          style={{ backgroundColor: statusColor[submission.status] }}
        >
          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
        </span>
      </div>

      <div className={styles.cardContent}>
        <p className={styles.category}>
          <strong>Category:</strong> {submission.category}
        </p>
        <p className={styles.location}>
          <strong>Location:</strong> {submission.location}
        </p>
        <p className={styles.date}>
          <strong>Date:</strong> {submission.date}
        </p>

        <div className={styles.storyPreview}>
          <p className={styles.previewLabel}>Story Preview:</p>
          <p className={styles.previewText}>{submission.details.substring(0, 200)}...</p>
        </div>

        <div className={styles.metadata}>
          <span className={styles.metaItem}>
            📻 {submission.podcastContact ? "Wants podcast contact" : "No podcast contact"}
          </span>
          {submission.imageUrls && submission.imageUrls.length > 0 && (
            <span className={styles.metaItem}>
              📷 {submission.imageUrls.length} image{submission.imageUrls.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className={styles.timestamps}>
          <p className={styles.timestamp}>
            Submitted: {new Date(submission.createdAt).toLocaleDateString()} at{" "}
            {new Date(submission.createdAt).toLocaleTimeString()}
          </p>
          {submission.publishedAt && (
            <p className={styles.timestamp}>
              Published: {new Date(submission.publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {submission.blogPostUrl && (
          <a
            href={`https://${submission.blogPostUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewButton}
          >
            View in Shopify Admin
          </a>
        )}

        {submission.adminNotes && (
          <div className={styles.adminNotes}>
            <p className={styles.notesLabel}>Admin Notes:</p>
            <p className={styles.notesText}>{submission.adminNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubmissionList({ title, submissions, status }) {
  if (submissions.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <p className={styles.emptyMessage}>No {status} submissions yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {title} <span className={styles.count}>{submissions.length}</span>
      </h3>
      <div className={styles.submissionsList}>
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} status={status} />
        ))}
      </div>
    </div>
  );
}

export default function SubmissionsPage() {
  const { submissions } = useLoaderData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Story Submissions</h1>
        <p className={styles.pageSubtitle}>
          Manage story submissions from your storefront. Submissions appear as draft blog posts
          in your Shopify admin.
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Submissions</p>
          <p className={styles.statNumber}>{submissions.all.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pending Review</p>
          <p className={styles.statNumber}>{submissions.pending.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Published</p>
          <p className={styles.statNumber}>{submissions.published.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Rejected</p>
          <p className={styles.statNumber}>{submissions.rejected.length}</p>
        </div>
      </div>

      <SubmissionList
        title="Pending Review"
        submissions={submissions.pending}
        status="pending"
      />
      <SubmissionList
        title="Published Stories"
        submissions={submissions.published}
        status="published"
      />
      <SubmissionList
        title="Rejected Stories"
        submissions={submissions.rejected}
        status="rejected"
      />

      <div className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>How It Works</h3>
        <ol className={styles.instructionsList}>
          <li>Customers submit stories through your storefront form</li>
          <li>Submissions are created as draft blog posts in your Shopify Admin</li>
          <li>You review and approve/reject the posts in Shopify Content → Blog Posts</li>
          <li>Published posts appear in your Community Stories section</li>
        </ol>
        <p className={styles.instructionsNote}>
          📝 To manage submissions, go to <strong>Content → Blog Posts</strong> in your Shopify
          Admin. Look for blog posts tagged with "Community Story".
        </p>
      </div>
    </div>
  );
}
