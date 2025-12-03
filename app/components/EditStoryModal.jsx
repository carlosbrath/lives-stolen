import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

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

export default function EditStoryModal({ submission, onClose }) {
  const fetcher = useFetcher();
  const [formData, setFormData] = useState({
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

  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.success) {
      onClose(true);
    }
  }, [fetcher.data, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetcher.submit(
      {
        ...formData,
        submissionId: submission.id,
        action: "update",
      },
      { method: "post" }
    );
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Story Submission</h2>
          <button
            onClick={onClose}
            style={styles.closeButton}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.scrollContent}>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Submitter Information</h3>
              <FormInput
                label="Submitter Name"
                name="submitterName"
                placeholder="Your full name"
                required
                value={formData.submitterName}
                onChange={handleInputChange}
              />
              <FormInput
                label="Submitter Email"
                name="submitterEmail"
                type="email"
                placeholder="your@email.com"
                required
                value={formData.submitterEmail}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Victim Information</h3>
              <FormInput
                label="Victim Name"
                name="victimName"
                placeholder="Victim's full name (optional)"
                value={formData.victimName}
                onChange={handleInputChange}
              />
              <FormInput
                label="Relation"
                name="relation"
                placeholder="Your relationship to the victim (optional)"
                value={formData.relation}
                onChange={handleInputChange}
              />
              <FormInput
                label="Age at Incident"
                name="age"
                type="number"
                placeholder="Age (optional)"
                value={formData.age}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Gender"
                name="gender"
                options={GENDERS}
                placeholder="Select gender (optional)"
                value={formData.gender}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Incident Details</h3>
              <FormInput
                label="Incident Date"
                name="incidentDate"
                type="date"
                required
                value={formData.incidentDate}
                onChange={handleInputChange}
              />
              <FormSelect
                label="State"
                name="state"
                options={US_STATES}
                placeholder="Select state"
                required
                value={formData.state}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Road User Type"
                name="roadUserType"
                options={ROAD_USER_TYPES}
                placeholder="Select road user type"
                required
                value={formData.roadUserType}
                onChange={handleInputChange}
              />
              <FormSelect
                label="Injury Type"
                name="injuryType"
                options={INJURY_TYPES}
                placeholder="Select injury type"
                required
                value={formData.injuryType}
                onChange={handleInputChange}
              />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Story Details</h3>
              <FormInput
                label="Short Title"
                name="shortTitle"
                placeholder="Brief title for this story"
                required
                value={formData.shortTitle}
                onChange={handleInputChange}
              />
              <FormTextarea
                label="Victim's Story"
                name="victimStory"
                placeholder="Share the story... (max 1000 characters)"
                required
                maxLength={1000}
                value={formData.victimStory}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({ label, name, type = "text", placeholder, required, value, onChange }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={styles.formInput}
        required={required}
      />
    </div>
  );
}

function FormSelect({ label, name, options, required, value, onChange, placeholder }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        style={styles.formSelect}
        required={required}
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

function FormTextarea({ label, name, placeholder, required, value, onChange, maxLength }) {
  const characterCount = value ? value.length : 0;

  return (
    <div style={styles.formGroup}>
      <label style={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        style={styles.formTextarea}
        required={required}
        rows={6}
      />
      {maxLength && (
        <div style={styles.characterCount}>
          {characterCount} / {maxLength} characters
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    padding: "20px",
  },
  modal: {
    background: "#ffffff",
    borderRadius: "12px",
    maxWidth: "900px",
    width: "100%",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "2px solid #e5e5e5",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#000",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: "32px",
    cursor: "pointer",
    color: "#666",
    lineHeight: 1,
    padding: "0",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flex: 1,
    overflowY: "auto",
    padding: "32px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#000",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "2px solid #e5e5e5",
  },
  formGroup: {
    marginBottom: "20px",
  },
  formLabel: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "#000",
    marginBottom: "8px",
    display: "block",
  },
  required: {
    color: "#dc2626",
    fontWeight: "700",
  },
  formInput: {
    width: "100%",
    padding: "12px 16px",
    background: "#ffffff",
    color: "#000",
    border: "2px solid #000",
    borderRadius: "6px",
    fontSize: "1rem",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  },
  formSelect: {
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
  },
  formTextarea: {
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
  },
  characterCount: {
    fontSize: "0.85rem",
    color: "#666",
    textAlign: "right",
    marginTop: "4px",
  },
  footer: {
    display: "flex",
    gap: "12px",
    padding: "24px 32px",
    borderTop: "2px solid #e5e5e5",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "12px 32px",
    background: "#f3f4f6",
    color: "#333",
    border: "2px solid #e5e5e5",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  submitButton: {
    padding: "12px 32px",
    background: "#000",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
