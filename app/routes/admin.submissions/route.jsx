import { json } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { ToastProvider, useToast, ToastStyles } from "../../components/Toast";
import prisma from "../../db.server";

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

export const loader = async () => {
  try {
    const submissions = await prisma.submission.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse photoUrls JSON
    const parsedSubmissions = submissions.map((sub) => ({
      ...sub,
      photoUrls: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
    }));

    return json({ submissions: parsedSubmissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return json({ submissions: [], error: error.message });
  }
};

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
        // photoUrls is already a JSON string, just store it
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

export default function AdminSubmissionsPage() {
  return (
    <ToastProvider>
      <ToastStyles />
      <AdminSubmissionsContent />
    </ToastProvider>
  );
}

function AdminSubmissionsContent() {
  const { submissions, error } = useLoaderData();

  if (error) {
    return (
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "20px", color: "#dc2626" }}>
          Error Loading Submissions
        </h1>
        <p>{error}</p>
      </div>
    );
  }

  const statusCounts = {
    pending: submissions.filter((s) => s.status === "pending").length,
    approved: submissions.filter((s) => s.status === "approved").length,
    published: submissions.filter((s) => s.status === "published").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
            Story Submissions
          </h1>
          <Link
            to="/stories"
            style={{
              padding: "10px 20px",
              background: "#000",
              color: "#fff",
              textDecoration: "none",
              borderRadius: "6px",
              fontWeight: "600",
            }}
          >
            View Stories Page
          </Link>
        </div>
        <p style={{ color: "#666", margin: 0 }}>
          All story submissions from your database
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <StatCard label="Total" count={submissions.length} color="#3b82f6" />
        <StatCard label="Pending" count={statusCounts.pending} color="#f59e0b" />
        <StatCard label="Approved" count={statusCounts.approved} color="#10b981" />
        <StatCard label="Published" count={statusCounts.published} color="#8b5cf6" />
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "#f9f9f9",
            borderRadius: "12px",
            border: "2px dashed #ddd",
          }}
        >
          <p style={{ fontSize: "1.1rem", color: "#666", margin: 0 }}>
            No submissions yet. Submit a story to see it here!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div
      style={{
        padding: "24px",
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px",
      }}
    >
      <p style={{ fontSize: "0.9rem", color: "#666", margin: "0 0 8px 0" }}>{label}</p>
      <p style={{ fontSize: "2rem", fontWeight: "bold", color, margin: 0 }}>{count}</p>
    </div>
  );
}

function SubmissionCard({ submission }) {
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const [modal, setModal] = useState({ isOpen: false, action: null, message: "" });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const previousStatusRef = useRef(null);

  const statusColors = {
    pending: "#f59e0b",
    approved: "#10b981",
    published: "#8b5cf6",
    rejected: "#ef4444",
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
    <div
      style={{
        background: "#fff",
        border: "2px solid #e5e5e5",
        borderRadius: "12px",
        padding: "24px",
        opacity: isUpdating ? 0.6 : 1,
        transition: "all 0.3s ease",
      }}
    >
      {/* Compact Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", margin: "0 0 8px 0" }}>
            {submission.shortTitle}
          </h3>
          <div style={{ display: "flex", gap: "12px", fontSize: "0.9rem", color: "#666", flexWrap: "wrap" }}>
            <span>📍 {submission.state}</span>
            <span>📅 {submission.incidentDate}</span>
            <span>🚴 {submission.roadUserType}</span>
            <span>⚠️ {submission.injuryType}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: "8px 16px",
              background: isExpanded ? "#000" : "#fff",
              color: isExpanded ? "#fff" : "#000",
              border: "2px solid #000",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {isExpanded ? "Hide" : "View"}
          </button>
          {!isEditing && (
            <button
              onClick={handleEdit}
              style={{
                padding: "8px 16px",
                background: "#fff",
                color: "#000",
                border: "2px solid #000",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}
          <div
            style={{
              padding: "6px 12px",
              background: statusColors[submission.status] || "#999",
              color: "#fff",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              textTransform: "capitalize",
            }}
          >
            {submission.status}
          </div>
        </div>
      </div>

      {/* Compact Story Preview (always visible) */}
      {!isExpanded && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ color: "#333", lineHeight: "1.6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {submission.victimStory}
          </p>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div style={{
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: "2px solid #e5e5e5",
          animation: "fadeIn 0.3s ease"
        }}>
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

      {/* Action Buttons */}
      {!isEditing && (
        <>
          {(submission.status === "pending" || submission.status === "rejected") && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                flexWrap: "wrap",
                marginTop: "16px",
              }}
            >
              <button
                onClick={() => openConfirmation("approved")}
                disabled={isUpdating}
                style={{
                  padding: "10px 20px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => !isUpdating && (e.target.style.background = "#059669")}
                onMouseLeave={(e) => !isUpdating && (e.target.style.background = "#10b981")}
              >
                Approve
              </button>

              <button
                onClick={() => openConfirmation("rejected")}
                disabled={isUpdating}
                style={{
                  padding: "10px 20px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => !isUpdating && (e.target.style.background = "#dc2626")}
                onMouseLeave={(e) => !isUpdating && (e.target.style.background = "#ef4444")}
              >
                Reject
              </button>
            </div>
          )}

          {submission.status === "approved" && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                marginTop: "16px",
              }}
            >
              <button
                onClick={() => openConfirmation("published")}
                disabled={isUpdating}
                style={{
                  padding: "10px 20px",
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "0.9rem",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => !isUpdating && (e.target.style.background = "#7c3aed")}
                onMouseLeave={(e) => !isUpdating && (e.target.style.background = "#8b5cf6")}
              >
                Publish
              </button>
            </div>
          )}

          {submission.status === "published" && (
            <div
              style={{
                paddingTop: "16px",
                borderTop: "1px solid #e5e5e5",
                textAlign: "center",
                color: "#8b5cf6",
                fontWeight: "600",
                marginTop: "16px",
              }}
            >
              ✓ This story has been published
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
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

function StoryDetailView({ submission }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Images Section */}
      {submission.photoUrls && submission.photoUrls.length > 0 && (
        <div>
          <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
            Photos ({submission.photoUrls.length})
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px"
          }}>
            {submission.photoUrls.map((url, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  paddingBottom: "100%",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "2px solid #e5e5e5"
                }}
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story Content */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px", color: "#000" }}>
          Story
        </h4>
        <p style={{ color: "#333", lineHeight: "1.8", margin: 0, whiteSpace: "pre-wrap" }}>
          {submission.victimStory}
        </p>
      </div>

      {/* Submitter Information */}
      <div style={{
        padding: "20px",
        background: "#f9fafb",
        borderRadius: "8px",
        border: "1px solid #e5e7eb"
      }}>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000" }}>
          Submitter Information
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
          <InfoRow label="Submitter Name" value={submission.submitterName} />
          <InfoRow label="Submitter Email" value={submission.submitterEmail} />
          {submission.victimName && <InfoRow label="Victim Name" value={submission.victimName} />}
          {submission.relation && <InfoRow label="Relation" value={submission.relation} />}
          {submission.age && <InfoRow label="Age" value={submission.age} />}
          {submission.gender && <InfoRow label="Gender" value={submission.gender} />}
        </div>
      </div>

      {/* Meta Information */}
      <div style={{
        padding: "20px",
        background: "#fefce8",
        borderRadius: "8px",
        border: "1px solid #fef08a"
      }}>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000" }}>
          Incident Details
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
          <InfoRow label="Incident Date" value={submission.incidentDate} />
          <InfoRow label="State" value={submission.state} />
          <InfoRow label="Road User Type" value={submission.roadUserType} />
          <InfoRow label="Injury Type" value={submission.injuryType} />
        </div>
      </div>

      {/* System Information */}
      <div style={{
        padding: "16px",
        background: "#f3f4f6",
        borderRadius: "8px",
        fontSize: "0.85rem",
        color: "#666"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <strong>Database ID:</strong> {submission.id}
          </div>
          <div>
            <strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleString()}
          </div>
          {submission.metaobjectId && (
            <div style={{ color: "#10b981" }}>
              <strong>✅ Synced to Shopify</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#666", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.95rem", color: "#000" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function ImageUploadManager({ existingImages, setExistingImages, newImages, setNewImages, maxImages }) {
  const fileInputRef = useRef(null);
  const totalImages = existingImages.length + newImages.length;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - totalImages;

    if (files.length + totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images total`);
      return;
    }

    const newPreviews = [];
    files.slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result, id: Date.now() + Math.random() });
          if (newPreviews.length === files.slice(0, remainingSlots).length) {
            setNewImages([...newImages, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExisting = (indexToRemove) => {
    const updatedImages = existingImages.filter((_, index) => index !== indexToRemove);
    setExistingImages(updatedImages);
  };

  const handleRemoveNew = (indexToRemove) => {
    const updatedImages = newImages.filter((_, index) => index !== indexToRemove);
    setNewImages(updatedImages);
  };

  return (
    <div>
      {/* Upload Button */}
      {totalImages < maxImages && (
        <div style={{
          border: "2px dashed #000",
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
          background: "#f9fafb",
          marginBottom: "16px",
          cursor: "pointer",
          transition: "all 0.2s"
        }}
        onClick={() => fileInputRef.current?.click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f3f4f6";
          e.currentTarget.style.borderColor = "#666";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#f9fafb";
          e.currentTarget.style.borderColor = "#000";
        }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: "0 auto 12px" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <div style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "8px", color: "#000" }}>
            Click to upload photos
          </div>
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            {totalImages} / {maxImages} images uploaded
          </div>
        </div>
      )}

      {/* Image Grid */}
      {(existingImages.length > 0 || newImages.length > 0) && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "12px"
        }}>
          {/* Existing Images */}
          {existingImages.map((url, index) => (
            <div
              key={`existing-${index}`}
              style={{
                position: "relative",
                paddingBottom: "100%",
                background: "#f3f4f6",
                borderRadius: "8px",
                overflow: "hidden",
                border: "2px solid #e5e5e5"
              }}
            >
              <img
                src={url}
                alt={`Existing ${index + 1}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveExisting(index)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "scale(1)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* New Images */}
          {newImages.map((item, index) => (
            <div
              key={item.id || `new-${index}`}
              style={{
                position: "relative",
                paddingBottom: "100%",
                background: "#f3f4f6",
                borderRadius: "8px",
                overflow: "hidden",
                border: "2px solid #10b981"
              }}
            >
              <img
                src={item.preview}
                alt={`New ${index + 1}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <div style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                background: "#10b981",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "600"
              }}>
                NEW
              </div>
              <button
                type="button"
                onClick={() => handleRemoveNew(index)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#dc2626";
                  e.target.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ef4444";
                  e.target.style.transform = "scale(1)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {totalImages === 0 && (
        <div style={{
          padding: "24px",
          textAlign: "center",
          color: "#666",
          fontSize: "0.9rem",
          background: "#f9fafb",
          borderRadius: "8px",
          border: "1px solid #e5e5e5"
        }}>
          No photos uploaded yet
        </div>
      )}
    </div>
  );
}

function InlineEditForm({ editData, setEditData, handleSaveEdit, handleCancelEdit, isUpdating }) {
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(editData.photoUrls || []);

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Combine existing and new images
    const allImages = [...existingImages, ...images.map(img => img.preview)];

    // Create updated form data with images
    const updatedFormData = {
      ...editData,
      photoUrls: JSON.stringify(allImages)
    };

    handleSaveEdit(updatedFormData);
  };

  return (
    <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Images Section */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }}>
          Photos
        </h4>
        <ImageUploadManager
          existingImages={existingImages}
          setExistingImages={setExistingImages}
          newImages={images}
          setNewImages={setImages}
          maxImages={10}
        />
      </div>

      {/* Story Details Section */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }}>
          Story Details
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
      </div>

      {/* Submitter Information Section */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }}>
          Submitter Information
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
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

      {/* Victim Information Section */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }}>
          Victim Information
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
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

      {/* Incident Details Section */}
      <div>
        <h4 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "16px", color: "#000", paddingBottom: "8px", borderBottom: "2px solid #e5e5e5" }}>
          Incident Details
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
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

      {/* Form Actions */}
      <div style={{
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        paddingTop: "16px",
        borderTop: "2px solid #e5e5e5"
      }}>
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isUpdating}
          style={{
            padding: "12px 32px",
            background: "#f3f4f6",
            color: "#333",
            border: "2px solid #e5e5e5",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: isUpdating ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isUpdating}
          style={{
            padding: "12px 32px",
            background: "#000",
            color: "#fff",
            border: "2px solid #000",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: isUpdating ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
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
    <div>
      <label style={{
        fontSize: "0.9rem",
        fontWeight: "600",
        color: "#000",
        marginBottom: "8px",
        display: "block"
      }}>
        {label}
        {required && <span style={{ color: "#dc2626", fontWeight: "700" }}> *</span>}
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
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#ffffff",
              color: "#000",
              border: "2px solid #000",
              borderRadius: "6px",
              fontSize: "1rem",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: "120px",
              lineHeight: "1.5",
              transition: "all 0.2s ease",
            }}
          />
          {maxLength && (
            <div style={{
              fontSize: "0.85rem",
              color: "#666",
              textAlign: "right",
              marginTop: "4px"
            }}>
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
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#ffffff",
            color: "#000",
            border: "2px solid #000",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            transition: "all 0.2s ease",
          }}
        />
      )}
    </div>
  );
}

function FormSelect({ label, required, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{
        fontSize: "0.9rem",
        fontWeight: "600",
        color: "#000",
        marginBottom: "8px",
        display: "block"
      }}>
        {label}
        {required && <span style={{ color: "#dc2626", fontWeight: "700" }}> *</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: "#ffffff",
          color: "#000",
          border: "2px solid #000",
          borderRadius: "6px",
          fontSize: "1rem",
          fontFamily: "inherit",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "16px", color: "#333" }}>
          Confirm Action
        </h3>
        <p style={{ color: "#666", marginBottom: "24px", lineHeight: "1.6" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              background: "#f3f4f6",
              color: "#333",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#e5e7eb")}
            onMouseLeave={(e) => (e.target.style.background = "#f3f4f6")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.target.style.background = "#3b82f6")}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Add animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  if (!document.querySelector('style[data-admin-animations]')) {
    style.setAttribute('data-admin-animations', 'true');
    document.head.appendChild(style);
  }
}

