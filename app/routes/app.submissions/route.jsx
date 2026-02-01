import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Cropper from "react-easy-crop";
import { authenticate } from "../../shopify.server";
import prisma from "../../db.server";
import { ToastProvider, useToast, ToastStyles } from "../../components/Toast";
import styles from "./styles.module.css";

// Constants
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

const STATUS_COLORS = {
  pending: "#f59e0b",
  approved: "#10b981",
  published: "#8b5cf6",
  rejected: "#e53e3e",
};

// Normalize photo URLs to consistent format
function normalizePhotoUrls(photoUrlsRaw) {
  if (!photoUrlsRaw) return [];
  const parsed = typeof photoUrlsRaw === "string" ? JSON.parse(photoUrlsRaw) : photoUrlsRaw;
  if (!Array.isArray(parsed)) return [];

  if (parsed.length > 0 && typeof parsed[0] === "object" && "originalUrl" in parsed[0]) {
    return parsed;
  }
  return parsed.map((url, index) => ({ originalUrl: url, currentUrl: null, order: index }));
}

// Loader
export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  if (!session) throw new Response("Unauthorized", { status: 401 });

  const allSubmissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const submissions = allSubmissions.map((sub) => ({
    id: sub.id,
    firstName: sub.submitterName.split(" ")[0] || "",
    lastName: sub.submitterName.split(" ").slice(1).join(" ") || "",
    email: sub.submitterEmail,
    category: sub.roadUserType,
    location: sub.state,
    date: sub.incidentDate,
    details: sub.victimStory,
    imageUrls: normalizePhotoUrls(sub.photoUrls),
    createdAt: sub.createdAt,
    publishedAt: sub.publishedAt,
    status: sub.status,
    metaobjectId: sub.metaobjectId,
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
    photoUrls: normalizePhotoUrls(sub.photoUrls),
  }));

  return {
    submissions: {
      pending: submissions.filter((s) => s.status === "pending"),
      approved: submissions.filter((s) => s.status === "approved"),
      published: submissions.filter((s) => s.status === "published"),
      rejected: submissions.filter((s) => s.status === "rejected"),
      all: submissions,
    },
    shop: session.shop,
  };
}

// Action handler
export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("action");
  const submissionId = formData.get("submissionId");

  if (!submissionId) {
    return json({ error: "Missing submission ID" }, { status: 400 });
  }

  try {
    // Delete submission
    if (actionType === "delete") {
      await prisma.submission.delete({ where: { id: submissionId } });
      return json({ success: true, deleted: true, submissionId });
    }

    // Update submission details
    if (actionType === "update") {
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

      const photoUrlsString = formData.get("photoUrls");
      if (photoUrlsString) updateData.photoUrls = photoUrlsString;

      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: updateData,
      });
      return json({ success: true, submission: updatedSubmission, updated: true });
    }

    // Update image order
    if (actionType === "updateImages") {
      const photoUrls = formData.get("photoUrls");
      await prisma.submission.update({
        where: { id: submissionId },
        data: { photoUrls },
      });
      return json({ success: true, imagesUpdated: true });
    }

    // Update status
    const status = formData.get("status");
    if (!status) return json({ error: "Missing status" }, { status: 400 });

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null,
      },
    });
    return json({ success: true, submission: updatedSubmission });

  } catch (error) {
    console.error("Action error:", error);
    return json({ error: error.message }, { status: 500 });
  }
};

export const meta = () => [{ title: "Story Submissions | Admin Dashboard" }];

// Main page component
export default function SubmissionsPage() {
  return (
    <ToastProvider>
      <ToastStyles />
      <SubmissionsContent />
    </ToastProvider>
  );
}

function SubmissionsContent() {
  const { submissions, shop } = useLoaderData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Story Submissions</h1>
        <p className={styles.pageSubtitle}>
          Manage story submissions from your storefront. Review, approve, and publish stories.
        </p>
      </header>

      <div className={styles.stats}>
        <StatCard label="Total" value={submissions.all.length} />
        <StatCard label="Pending" value={submissions.pending.length} />
        <StatCard label="Approved" value={submissions.approved.length} />
        <StatCard label="Published" value={submissions.published.length} />
      </div>

      <SubmissionList title="Pending Review" submissions={submissions.pending} status="pending" shop={shop} />
      <SubmissionList title="Approved Stories" submissions={submissions.approved} status="approved" shop={shop} />
      <SubmissionList title="Published Stories" submissions={submissions.published} status="published" shop={shop} />
      <SubmissionList title="Rejected Stories" submissions={submissions.rejected} status="rejected" shop={shop} />

      <Instructions />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statNumber}>{value}</p>
    </div>
  );
}

function SubmissionList({ title, submissions, status, shop }) {
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
          <SubmissionCard key={submission.id} submission={submission} shop={shop} />
        ))}
      </div>
    </div>
  );
}

// Main submission card component
function SubmissionCard({ submission, shop }) {
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const previousStatusRef = useRef(null);

  const [modal, setModal] = useState({ isOpen: false, action: null, message: "" });
  const [viewMode, setViewMode] = useState("collapsed"); // collapsed, details, edit, images
  const [editData, setEditData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);

  const isUpdating = fetcher.state !== "idle";

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      if (fetcher.data.deleted) {
        showToast("Story deleted successfully!", { type: "success" });
        setIsDeleted(true);
        return;
      }
      if (fetcher.data.updated) {
        showToast("Story updated successfully!", { type: "success" });
        setViewMode("details");
        return;
      }
      if (fetcher.data.imagesUpdated) {
        showToast("Images updated successfully!", { type: "success" });
        return;
      }

      const newStatus = fetcher.data.submission?.status;
      if (newStatus && previousStatusRef.current !== newStatus) {
        previousStatusRef.current = newStatus;
        const messages = {
          approved: "Story approved!",
          rejected: "Story rejected!",
          published: "Story published!",
        };
        showToast(messages[newStatus] || "Status updated!", { type: "success" });
      }
    }
  }, [fetcher.data, fetcher.state, showToast]);

  const handleViewToggle = () => {
    setViewMode(viewMode === "collapsed" ? "details" : "collapsed");
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
    });
    setViewMode("edit");
  };

  const handleManageImages = () => {
    setImageData([...submission.photoUrls]);
    setViewMode("images");
  };

  const handleSaveEdit = (formData) => {
    fetcher.submit(
      { ...formData, submissionId: submission.id, action: "update" },
      { method: "post" }
    );
  };

  const handleSaveImages = (photos) => {
    fetcher.submit(
      { submissionId: submission.id, action: "updateImages", photoUrls: JSON.stringify(photos) },
      { method: "post" }
    );
  };

  const handleCancel = () => {
    setViewMode("details");
    setEditData(null);
    setImageData(null);
  };

  const openConfirmation = (action) => {
    const messages = {
      approved: "Approve this story?",
      rejected: "Reject this story?",
      published: "Publish this story?",
      delete: "Permanently delete this story? This cannot be undone.",
    };
    setModal({ isOpen: true, action, message: messages[action] });
  };

  const handleConfirm = () => {
    if (modal.action === "delete") {
      fetcher.submit({ submissionId: submission.id, action: "delete" }, { method: "post" });
    } else {
      fetcher.submit({ submissionId: submission.id, status: modal.action }, { method: "post" });
    }
    setModal({ isOpen: false, action: null, message: "" });
  };

  if (isDeleted) return null;

  const isExpanded = viewMode !== "collapsed";
  const hasImages = submission.photoUrls?.length > 0;

  return (
    <div className={styles.submissionCard} style={{ opacity: isUpdating ? 0.6 : 1 }}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderInfo}>
          <h4 className={styles.submitterName}>
            {submission.firstName} {submission.lastName}
          </h4>
          <p className={styles.submitterEmail}>{submission.email}</p>
          {submission.shortTitle && (
            <p className={styles.shortTitle}>"{submission.shortTitle}"</p>
          )}
        </div>
        <div className={styles.cardHeaderActions}>
          <button
            onClick={handleViewToggle}
            className={`${styles.actionButton} ${isExpanded ? styles.actionButtonActive : ""}`}
          >
            {isExpanded ? "Hide" : "View"}
          </button>
          {viewMode !== "edit" && viewMode !== "images" && (
            <>
              <button onClick={handleEdit} className={styles.actionButton}>Edit</button>
              {hasImages && (
                <button onClick={handleManageImages} className={styles.actionButtonBlue}>
                  Images ({submission.photoUrls.length})
                </button>
              )}
              <button onClick={() => openConfirmation("delete")} className={styles.actionButtonRed}>
                Delete
              </button>
            </>
          )}
          <span className={styles.statusBadge} style={{ backgroundColor: STATUS_COLORS[submission.status] }}>
            {submission.status}
          </span>
        </div>
      </div>

      {/* Collapsed preview */}
      {viewMode === "collapsed" && (
        <div className={styles.cardPreview}>
          <div className={styles.previewMeta}>
            <span><strong>Category:</strong> {submission.category}</span>
            <span><strong>Location:</strong> {submission.location}</span>
            <span><strong>Date:</strong> {submission.date}</span>
            {hasImages && <span>📷 {submission.photoUrls.length} image(s)</span>}
          </div>
          <p className={styles.previewText}>{submission.details?.substring(0, 150)}...</p>
        </div>
      )}

      {/* Details view */}
      {viewMode === "details" && (
        <div className={styles.expandedContent}>
          <StoryDetailView submission={submission} />
        </div>
      )}

      {/* Edit view */}
      {viewMode === "edit" && (
        <div className={styles.expandedContent}>
          <InlineEditForm
            editData={editData}
            setEditData={setEditData}
            onSave={handleSaveEdit}
            onCancel={handleCancel}
            isUpdating={isUpdating}
          />
        </div>
      )}

      {/* Image management view */}
      {viewMode === "images" && (
        <div className={styles.expandedContent}>
          <InlineImageManager
            images={imageData}
            setImages={setImageData}
            onSave={handleSaveImages}
            onCancel={handleCancel}
            isUpdating={isUpdating}
            shop={shop}
          />
        </div>
      )}

      {/* Status action buttons */}
      {viewMode !== "edit" && viewMode !== "images" && (
        <StatusActions
          status={submission.status}
          publishedAt={submission.publishedAt}
          isUpdating={isUpdating}
          onAction={openConfirmation}
        />
      )}

      {/* Confirmation modal */}
      {modal.isOpen && (
        <ConfirmationModal
          message={modal.message}
          onConfirm={handleConfirm}
          onCancel={() => setModal({ isOpen: false, action: null, message: "" })}
          isDanger={modal.action === "delete" || modal.action === "rejected"}
        />
      )}
    </div>
  );
}

// Story detail view
function StoryDetailView({ submission }) {
  return (
    <div className={styles.detailView}>
      {submission.photoUrls?.length > 0 && (
        <div className={styles.detailSection}>
          <h4 className={styles.sectionHeading}>Photos ({submission.photoUrls.length})</h4>
          <div className={styles.photoGrid}>
            {submission.photoUrls.map((photo, index) => (
              <div key={index} className={styles.photoItem}>
                <img
                  src={photo.currentUrl || photo.originalUrl || photo}
                  alt={`Photo ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.detailSection}>
        <h4 className={styles.sectionHeading}>Story</h4>
        <p className={styles.storyText}>{submission.victimStory}</p>
      </div>

      <div className={styles.detailGrid}>
        <InfoBlock title="Submitter Information">
          <InfoRow label="Name" value={submission.submitterName} />
          <InfoRow label="Email" value={submission.submitterEmail} />
          {submission.victimName && <InfoRow label="Victim Name" value={submission.victimName} />}
          {submission.relation && <InfoRow label="Relation" value={submission.relation} />}
          {submission.age && <InfoRow label="Age" value={submission.age} />}
          {submission.gender && <InfoRow label="Gender" value={submission.gender} />}
        </InfoBlock>

        <InfoBlock title="Incident Details">
          <InfoRow label="Date" value={submission.incidentDate} />
          <InfoRow label="State" value={submission.state} />
          <InfoRow label="Road User Type" value={submission.roadUserType} />
          <InfoRow label="Injury Type" value={submission.injuryType} />
        </InfoBlock>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div className={styles.infoBlock}>
      <h4 className={styles.sectionHeading}>{title}</h4>
      <div className={styles.infoRows}>{children}</div>
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

// Inline edit form
function InlineEditForm({ editData, setEditData, onSave, onCancel, isUpdating }) {
  const handleChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Story Details</h4>
        <FormField
          label="Short Title" required
          value={editData.shortTitle}
          onChange={(e) => handleChange("shortTitle", e.target.value)}
        />
        <FormField
          label="Story" required type="textarea"
          value={editData.victimStory}
          onChange={(e) => handleChange("victimStory", e.target.value)}
        />
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Submitter Information</h4>
        <div className={styles.formGrid}>
          <FormField
            label="Name" required
            value={editData.submitterName}
            onChange={(e) => handleChange("submitterName", e.target.value)}
          />
          <FormField
            label="Email" required type="email"
            value={editData.submitterEmail}
            onChange={(e) => handleChange("submitterEmail", e.target.value)}
          />
          <FormField
            label="Victim Name"
            value={editData.victimName}
            onChange={(e) => handleChange("victimName", e.target.value)}
          />
          <FormField
            label="Relation"
            value={editData.relation}
            onChange={(e) => handleChange("relation", e.target.value)}
          />
          <FormField
            label="Age" type="number"
            value={editData.age}
            onChange={(e) => handleChange("age", e.target.value)}
          />
          <FormSelect
            label="Gender"
            value={editData.gender}
            onChange={(e) => handleChange("gender", e.target.value)}
            options={GENDERS}
          />
        </div>
      </div>

      <div className={styles.formSection}>
        <h4 className={styles.sectionHeading}>Incident Details</h4>
        <div className={styles.formGrid}>
          <FormField
            label="Incident Date" required type="date"
            value={editData.incidentDate}
            onChange={(e) => handleChange("incidentDate", e.target.value)}
          />
          <FormSelect
            label="State" required
            value={editData.state}
            onChange={(e) => handleChange("state", e.target.value)}
            options={US_STATES}
          />
          <FormSelect
            label="Road User Type" required
            value={editData.roadUserType}
            onChange={(e) => handleChange("roadUserType", e.target.value)}
            options={ROAD_USER_TYPES}
          />
          <FormSelect
            label="Injury Type" required
            value={editData.injuryType}
            onChange={(e) => handleChange("injuryType", e.target.value)}
            options={INJURY_TYPES}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} disabled={isUpdating} className={styles.cancelButton}>
          Cancel
        </button>
        <button type="submit" disabled={isUpdating} className={styles.saveButton}>
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// Inline image manager with drag & drop and crop
function InlineImageManager({ images, setImages, onSave, onCancel, isUpdating, shop }) {
  const { showToast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cropImage, setCropImage] = useState(null); // { index, url }
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getImageId = (index) => `image-${index}`;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.replace("image-", ""));
      const newIndex = parseInt(over.id.replace("image-", ""));
      const reordered = arrayMove(images, oldIndex, newIndex).map((img, i) => ({ ...img, order: i }));
      setImages(reordered);
      setHasChanges(true);
    }
  };

  const handleDelete = (index) => {
    const newImages = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i }));
    setImages(newImages);
    setHasChanges(true);
    setDeleteConfirm(null);
  };

  const handleCrop = (index) => {
    const img = images[index];
    const url = img.originalUrl || img;
    setCropImage({ index, url });
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!cropImage) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("shop", shop);
      formData.append("files", croppedBlob, `cropped-${Date.now()}.jpg`);

      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json();

      if (!result.success || !result.urls?.[0]) {
        throw new Error(result.error || "Upload failed");
      }

      const newImages = images.map((img, i) =>
        i === cropImage.index ? { ...img, currentUrl: result.urls[0] } : img
      );
      setImages(newImages);
      setHasChanges(true);
      showToast("Image cropped successfully!", { type: "success" });
    } catch (error) {
      console.error("Crop upload error:", error);
      showToast("Failed to save cropped image", { type: "danger" });
    } finally {
      setIsUploading(false);
      setCropImage(null);
    }
  };

  const handleSave = () => {
    onSave(images);
    setHasChanges(false);
  };

  const getImageUrl = (img) => img.currentUrl || img.originalUrl || img;

  return (
    <div className={styles.imageManager}>
      <div className={styles.imageManagerHeader}>
        <h4 className={styles.sectionHeading}>Manage Images</h4>
        <p className={styles.dragHint}>Drag to reorder • Click crop to edit</p>
      </div>

      {images.length === 0 ? (
        <p className={styles.noImages}>No images available.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((_, i) => getImageId(i))} strategy={rectSortingStrategy}>
            <div className={styles.imageManagerGrid}>
              {images.map((img, index) => (
                <SortableImageItem
                  key={index}
                  id={getImageId(index)}
                  url={getImageUrl(img)}
                  index={index}
                  onCrop={() => handleCrop(index)}
                  onDelete={() => setDeleteConfirm(index)}
                  isEdited={!!img.currentUrl}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} disabled={isUpdating || isUploading} className={styles.cancelButton}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating || isUploading || !hasChanges}
          className={styles.saveButton}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {deleteConfirm !== null && (
        <ConfirmationModal
          message="Delete this image? This cannot be undone."
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          isDanger
        />
      )}

      {cropImage && (
        <CropModal
          imageUrl={cropImage.url}
          onSave={handleCropComplete}
          onCancel={() => setCropImage(null)}
          isUploading={isUploading}
        />
      )}
    </div>
  );
}

function SortableImageItem({ id, url, index, onCrop, onDelete, isEdited }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.sortableImage}>
      <button type="button" className={styles.dragHandle} {...attributes} {...listeners}>
        <DragIcon />
      </button>
      {isEdited && <span className={styles.editedBadge}>Edited</span>}
      <img src={url} alt={`Image ${index + 1}`} draggable={false} />
      <div className={styles.imageActions}>
        <button type="button" onClick={onCrop} className={styles.imageCropButton} title="Crop image">
          <CropIcon />
        </button>
        <button type="button" onClick={onDelete} className={styles.imageDeleteButton} title="Delete image">
          <DeleteIcon />
        </button>
      </div>
    </div>
  );
}

// Crop Modal with react-easy-crop
function CropModal({ imageUrl, onSave, onCancel, isUploading }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImage(imageUrl, croppedAreaPixels);
      onSave(croppedBlob);
    } catch (error) {
      console.error("Crop error:", error);
    }
  };

  return (
    <div className={styles.cropOverlay}>
      <div className={styles.cropModal}>
        <div className={styles.cropHeader}>
          <h3>Crop Image</h3>
          <button type="button" onClick={onCancel} disabled={isUploading} className={styles.cropCloseButton}>
            &times;
          </button>
        </div>

        <div className={styles.cropContainer}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className={styles.cropControls}>
          <label className={styles.zoomLabel}>
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
              disabled={isUploading}
            />
          </label>
        </div>

        <div className={styles.cropActions}>
          <button type="button" onClick={onCancel} disabled={isUploading} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={isUploading} className={styles.saveButton}>
            {isUploading ? "Saving..." : "Apply Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: Create cropped image from canvas
async function getCroppedImage(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
  });
}

// Helper: Load image
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });
}

// Form components
function FormField({ label, required, type = "text", value, onChange }) {
  const isTextarea = type === "textarea";
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      {isTextarea ? (
        <textarea value={value} onChange={onChange} required={required} rows={5} className={styles.textarea} />
      ) : (
        <input type={type} value={value} onChange={onChange} required={required} className={styles.input} />
      )}
    </div>
  );
}

function FormSelect({ label, required, value, onChange, options }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      <select value={value} onChange={onChange} required={required} className={styles.select}>
        <option value="">Select {label}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// Status action buttons
function StatusActions({ status, publishedAt, isUpdating, onAction }) {
  if (status === "pending" || status === "rejected") {
    return (
      <div className={styles.statusActions}>
        <button onClick={() => onAction("approved")} disabled={isUpdating} className={styles.approveButton}>
          Approve
        </button>
        <button onClick={() => onAction("rejected")} disabled={isUpdating} className={styles.rejectButton}>
          Reject
        </button>
      </div>
    );
  }

  if (status === "approved") {
    return (
      <div className={styles.statusActions}>
        <button onClick={() => onAction("published")} disabled={isUpdating} className={styles.publishButton}>
          Publish
        </button>
      </div>
    );
  }

  if (status === "published") {
    return (
      <div className={styles.publishedStatus}>
        ✓ Published {publishedAt && `on ${new Date(publishedAt).toLocaleDateString()}`}
      </div>
    );
  }

  return null;
}

// Confirmation modal
function ConfirmationModal({ message, onConfirm, onCancel, isDanger }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Confirm Action</h3>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button onClick={onCancel} className={styles.modalCancelButton}>Cancel</button>
          <button
            onClick={onConfirm}
            className={`${styles.modalConfirmButton} ${isDanger ? styles.modalConfirmDanger : ""}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Instructions
function Instructions() {
  return (
    <div className={styles.instructions}>
      <h3 className={styles.instructionsTitle}>How It Works</h3>
      <ol className={styles.instructionsList}>
        <li>Customers submit stories through your storefront form</li>
        <li>Review submissions and click "Approve" to move them forward</li>
        <li>Approved stories can be edited and then published</li>
        <li>Published stories appear in your Community Stories section</li>
      </ol>
      <p className={styles.instructionsNote}>
        Status workflow: <strong>Pending → Approved → Published</strong>
      </p>
    </div>
  );
}

// Icons
function DragIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="9" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  );
}

function CropIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2v4H2v2h4v12h12v4h2v-4h4v-2h-4V6h-2v12H8V6h12V4H8V2H6z" />
    </svg>
  );
}
