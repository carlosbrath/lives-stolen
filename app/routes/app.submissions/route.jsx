import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { ToastProvider, useToast, ToastStyles } from "../../components/Toast";
import styles from "./styles.module.css";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const ROAD_USER_TYPES = ["Cyclist", "Pedestrian", "Motorcyclist"];
const INJURY_TYPES = ["Fatal", "Non-fatal"];
const GENDERS = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // Get all submissions from database
  const allSubmissions = await prisma.submission.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform to match expected format
  const submissions = allSubmissions.map((sub) => ({
    id: sub.id,
    firstName: sub.submitterName.split(" ")[0] || "",
    lastName: sub.submitterName.split(" ").slice(1).join(" ") || "",
    email: sub.submitterEmail,
    category: sub.roadUserType,
    location: sub.state,
    date: sub.incidentDate,
    details: sub.victimStory,
    podcastContact: false,
    imageUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
    createdAt: sub.createdAt,
    publishedAt: sub.publishedAt,
    status: sub.status,
    adminNotes: sub.adminNotes || "",
    blogPostUrl: null,
    metaobjectId: sub.metaobjectId,
    // Include all original fields for editing
    submitterName: sub.submitterName,
    submitterEmail: sub.submitterEmail,
    victimName: sub.victimName,
    relation: sub.relation,
    age: sub.age,
    gender: sub.gender,
    incidentDate: sub.incidentDate,
    state: sub.state,
    roadUserType: sub.roadUserType,
    injuryType: sub.injuryType,
    shortTitle: sub.shortTitle,
    victimStory: sub.victimStory,
    photoUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
  }));

  // Group by status
  const pending = submissions.filter((s) => s.status === "pending");
  const approved = submissions.filter((s) => s.status === "approved");
  const published = submissions.filter((s) => s.status === "published");
  const rejected = submissions.filter((s) => s.status === "rejected");

  return {
    submissions: {
      pending,
      approved,
      published,
      rejected,
      all: submissions,
    },
    shop: session.shop,
  };
}

export const action = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("action");
  const submissionId = formData.get("submissionId");

  if (!submissionId) {
    return json({ error: "Missing submission ID" }, { status: 400 });
  }

  try {
    if (action === "update") {
      // Handle full story update
      const updateData = {
        submitterName: formData.get("submitterName"),
        submitterEmail: formData.get("submitterEmail"),
        victimName: formData.get("victimName") || null,
        relation: formData.get("relation") || null,
        incidentDate: formData.get("incidentDate"),
        state: formData.get("state"),
        roadUserType: formData.get("roadUserType"),
        injuryType: formData.get("injuryType"),
        age: formData.get("age") ? parseInt(formData.get("age")) : null,
        gender: formData.get("gender") || null,
        shortTitle: formData.get("shortTitle"),
        victimStory: formData.get("victimStory"),
      };

      // Handle photoUrls if provided
      const photoUrlsString = formData.get("photoUrls");
      if (photoUrlsString) {
        updateData.photoUrls = photoUrlsString;
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: updateData,
      });

      return json({ success: true, submission: updatedSubmission, updated: true });
    } else {
      // Handle status change
      const status = formData.get("status");
      if (!status) {
        return json({ error: "Missing status" }, { status: 400 });
      }

      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          publishedAt: status === "published" ? new Date() : null,
        },
      });

      return json({ success: true, submission: updatedSubmission });
    }
  } catch (error) {
    console.error("Error updating submission:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

export const meta = () => [
  { title: "Story Submissions | Admin Dashboard" },
];

function SubmissionCard({ submission, status }) {
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, action: null, message: "" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const previousStatusRef = useRef(null);

  const statusColor = {
    pending: "#f59e0b",
    approved: "#10b981",
    published: "#8b5cf6",
    rejected: "#e53e3e",
  };

  const isUpdating = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      if (fetcher.data.updated) {
        showToast("Story updated successfully!", { type: "success", position: "top-right" });
        setIsEditing(false);
        return;
      }

      const newStatus = fetcher.data.submission.status;

      if (previousStatusRef.current !== newStatus) {
        previousStatusRef.current = newStatus;

        const messages = {
          approved: { text: "Story approved successfully!", type: "success" },
          rejected: { text: "Story rejected successfully!", type: "danger" },
          published: { text: "Story published successfully!", type: "success" },
        };

        const msg = messages[newStatus] || { text: "Status updated!", type: "info" };
        showToast(msg.text, { type: msg.type, position: "top-right" });
      }
    }
  }, [fetcher.data, fetcher.state, showToast]);

  const openConfirmation = (action) => {
    const messages = {
      approved: "Do you want to approve this story?",
      rejected: "Do you want to reject this story?",
      published: "Do you want to publish this story?",
    };
    setModal({ isOpen: true, action, message: messages[action] });
  };

  const handleConfirm = () => {
    fetcher.submit(
      {
        submissionId: submission.id,
        status: modal.action,
      },
      { method: "post" }
    );
    setModal({ isOpen: false, action: null, message: "" });
  };

  const handleCancel = () => {
    setModal({ isOpen: false, action: null, message: "" });
  };

  const handleEdit = () => {
    setEditData({
      submitterName: submission.submitterName || "",
      submitterEmail: submission.submitterEmail || "",
      victimName: submission.victimName || "",
      relation: submission.relation || "",
      incidentDate: submission.incidentDate || "",
      state: submission.state || "",
      roadUserType: submission.roadUserType || "",
      injuryType: submission.injuryType || "",
      age: submission.age || "",
      gender: submission.gender || "",
      shortTitle: submission.shortTitle || "",
      victimStory: submission.victimStory || "",
      photoUrls: submission.photoUrls || [],
    });
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleSaveEdit = (formData) => {
    fetcher.submit(
      {
        ...formData,
        submissionId: submission.id,
        action: "update",
      },
      { method: "post" }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  return (
    <div className={styles.submissionCard} style={{ opacity: isUpdating ? 0.6 : 1 }}>
      <div className={styles.cardHeader}>
        <div>
          <h4 className={styles.submitterName}>
            {submission.firstName} {submission.lastName}
          </h4>
          <p className={styles.submitterEmail}>{submission.email}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.actionButton}
            style={{
              background: isExpanded ? "#000" : "#fff",
              color: isExpanded ? "#fff" : "#000",
            }}
          >
            {isExpanded ? "Hide Details" : "View Details"}
          </button>
          {!isEditing && (
            <button onClick={handleEdit} className={styles.actionButton}>
              Edit
            </button>
          )}
          <span
            className={styles.statusBadge}
            style={{ backgroundColor: statusColor[submission.status] }}
          >
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </span>
        </div>
      </div>

      {!isExpanded && (
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
        </div>
      )}

      {isExpanded && (
        <div className={styles.expandedContent}>
          {isEditing ? (
            <InlineEditForm
              editData={editData}
              setEditData={setEditData}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              isUpdating={isUpdating}
            />
          ) : (
            <StoryDetailView submission={submission} />
          )}
        </div>
      )}

      {!isEditing && (
        <>
          {(submission.status === "pending" || submission.status === "rejected") && (
            <div className={styles.actionButtons}>
              <button
                onClick={() => openConfirmation("approved")}
                disabled={isUpdating}
                className={styles.approveButton}
              >
                Approve
              </button>
              <button
                onClick={() => openConfirmation("rejected")}
                disabled={isUpdating}
                className={styles.rejectButton}
              >
                Reject
              </button>
            </div>
          )}

          {submission.status === "approved" && (
            <div className={styles.actionButtons}>
              <button
                onClick={() => openConfirmation("published")}
                disabled={isUpdating}
                className={styles.publishButton}
              >
                Publish
              </button>
            </div>
          )}

          {submission.status === "published" && (
            <div className={styles.publishedStatus}>
              ✓ This story has been published
              {submission.publishedAt && (
                <span className={styles.timestamp}>
                  {" "}
                  on {new Date(submission.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {modal.isOpen && (
        <ConfirmationModal
          message={modal.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
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
  return (
    <ToastProvider>
      <ToastStyles />
      <SubmissionsContent />
    </ToastProvider>
  );
}

function SubmissionsContent() {
  const { submissions } = useLoaderData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Story Submissions</h1>
        <p className={styles.pageSubtitle}>
          Manage story submissions from your storefront. Review, approve, and publish stories.
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
          <p className={styles.statLabel}>Approved</p>
          <p className={styles.statNumber}>{submissions.approved.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Published</p>
          <p className={styles.statNumber}>{submissions.published.length}</p>
        </div>
      </div>

      <SubmissionList
        title="Pending Review"
        submissions={submissions.pending}
        status="pending"
      />
      <SubmissionList
        title="Approved Stories"
        submissions={submissions.approved}
        status="approved"
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
          <li>Review submissions and click "Approve" to move them forward</li>
          <li>Approved stories can be edited and then published</li>
          <li>Published stories appear in your Community Stories section</li>
        </ol>
        <p className={styles.instructionsNote}>
          💡 Status workflow: <strong>Pending → Approved → Published</strong>
        </p>
      </div>
    </div>
  );
}

// Helper Components
function StoryDetailView({ submission }) {
  return (
    <div className={styles.detailView}>
      {submission.imageUrls && submission.imageUrls.length > 0 && (
        <div className={styles.imagesSection}>
          <h4 className={styles.sectionHeading}>Photos ({submission.imageUrls.length})</h4>
          <div className={styles.imageGrid}>
            {submission.imageUrls.map((url, index) => (
              <div key={index} className={styles.imageWrapper}>
                <img src={url} alt={`Photo ${index + 1}`} className={styles.image} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.storySection}>
        <h4 className={styles.sectionHeading}>Full Story</h4>
        <p className={styles.storyText}>{submission.victimStory}</p>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionHeading}>Submitter Information</h4>
        <div className={styles.infoGrid}>
          <InfoRow label="Submitter Name" value={submission.submitterName} />
          <InfoRow label="Submitter Email" value={submission.submitterEmail} />
          {submission.victimName && <InfoRow label="Victim Name" value={submission.victimName} />}
          {submission.relation && <InfoRow label="Relation" value={submission.relation} />}
          {submission.age && <InfoRow label="Age" value={submission.age} />}
          {submission.gender && <InfoRow label="Gender" value={submission.gender} />}
        </div>
      </div>

      <div className={styles.infoSection}>
        <h4 className={styles.sectionHeading}>Incident Details</h4>
        <div className={styles.infoGrid}>
          <InfoRow label="Incident Date" value={submission.incidentDate} />
          <InfoRow label="State" value={submission.state} />
          <InfoRow label="Road User Type" value={submission.roadUserType} />
          <InfoRow label="Injury Type" value={submission.injuryType} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}:</span>
      <span className={styles.infoValue}>{value || "—"}</span>
    </div>
  );
}

function InlineEditForm({ editData, setEditData, handleSaveEdit, handleCancelEdit, isUpdating }) {
  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = {
      ...editData,
      photoUrls: JSON.stringify(editData.photoUrls)
    };
    handleSaveEdit(updatedFormData);
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.editForm}>
      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Story Details</h4>
        <FormField
          label="Short Title"
          required
          value={editData.shortTitle}
          onChange={(e) => handleChange("shortTitle", e.target.value)}
          placeholder="Brief title for this story"
        />
        <FormField
          label="Victim's Story"
          required
          type="textarea"
          value={editData.victimStory}
          onChange={(e) => handleChange("victimStory", e.target.value)}
          placeholder="Share the story..."
          maxLength={1000}
        />
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Submitter Information</h4>
        <div className={styles.formGrid}>
          <FormField
            label="Submitter Name"
            required
            value={editData.submitterName}
            onChange={(e) => handleChange("submitterName", e.target.value)}
            placeholder="Full name"
          />
          <FormField
            label="Submitter Email"
            required
            type="email"
            value={editData.submitterEmail}
            onChange={(e) => handleChange("submitterEmail", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Victim Information</h4>
        <div className={styles.formGrid}>
          <FormField
            label="Victim Name"
            value={editData.victimName}
            onChange={(e) => handleChange("victimName", e.target.value)}
            placeholder="Victim's full name (optional)"
          />
          <FormField
            label="Relation"
            value={editData.relation}
            onChange={(e) => handleChange("relation", e.target.value)}
            placeholder="Relationship to victim (optional)"
          />
          <FormField
            label="Age"
            type="number"
            value={editData.age}
            onChange={(e) => handleChange("age", e.target.value)}
            placeholder="Age (optional)"
          />
          <FormSelect
            label="Gender"
            value={editData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            options={GENDERS}
            placeholder="Select gender (optional)"
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Incident Details</h4>
        <div className={styles.formGrid}>
          <FormField
            label="Incident Date"
            required
            type="date"
            value={editData.incidentDate}
            onChange={(e) => handleChange("incidentDate", e.target.value)}
          />
          <FormSelect
            label="State"
            required
            value={editData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            options={US_STATES}
            placeholder="Select state"
          />
          <FormSelect
            label="Road User Type"
            required
            value={editData.roadUserType}
            onChange={(e) => handleChange("roadUserType", e.target.value)}
            options={ROAD_USER_TYPES}
            placeholder="Select road user type"
          />
          <FormSelect
            label="Injury Type"
            required
            value={editData.injuryType}
            onChange={(e) => handleChange("injuryType", e.target.value)}
            options={INJURY_TYPES}
            placeholder="Select injury type"
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isUpdating}
          className={styles.cancelEditButton}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          className={styles.saveEditButton}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, required, type = "text", value, onChange, placeholder, maxLength }) {
  const characterCount = value ? value.length : 0;
  const isTextarea = type === "textarea";

  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {isTextarea ? (
        <>
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            required={required}
            rows={6}
            className={styles.textarea}
          />
          {maxLength && (
            <div className={styles.characterCount}>
              {characterCount} / {maxLength} characters
            </div>
          )}
        </>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          className={styles.input}
        />
      )}
    </div>
  );
}

function FormSelect({ label, required, value, onChange, options, placeholder }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={styles.select}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConfirmationModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Confirm Action</h3>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.modalCancelButton}>
            Cancel
          </button>
          <button onClick={onConfirm} className={styles.modalConfirmButton}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
