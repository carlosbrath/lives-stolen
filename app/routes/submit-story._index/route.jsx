import { useState, useEffect } from "react";
import { Link, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import styles from "./styles.module.css";
import {
  createBlogPostInShopify,
  getAccessTokenForStore,
  formatSubmissionAsHTML,
  saveSubmissionToDatabase,
} from "../../services/shopify.server";

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    // Get store from request
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN;

    if (!shop) {
      return json(
        { error: "Store information not found" },
        { status: 400 }
      );
    }

    // Extract form data
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const category = formData.get("category");
    const date = formData.get("date");
    const location = formData.get("location");
    const details = formData.get("details");
    const driverAccountable = formData.get("driverAccountable");
    const podcast = formData.get("podcast") === "on";
    const permission = formData.get("permission") === "on";

    // Validate required fields
    const errors = {};
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) errors.email = "Email is required";
    if (!category) errors.category = "Category is required";
    if (!date) errors.date = "Date is required";
    if (!location) errors.location = "Location is required";
    if (!details) errors.details = "Story details are required";
    if (!permission) errors.permission = "Permission to share is required";

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }

    // Get access token for the store
    const accessToken = await getAccessTokenForStore(shop);

    if (!accessToken) {
      return json(
        { error: "Unable to authenticate with Shopify. Please try again." },
        { status: 401 }
      );
    }

    // Format submission data
    const submissionData = {
      firstName,
      lastName,
      email,
      category,
      date,
      location,
      details,
      driverAccountable,
      podcast,
      permission,
    };

    // Create title from story
    const title = `${category} Story: ${location}`;

    // Create excerpt from details
    const excerpt = details.substring(0, 160) + (details.length > 160 ? "..." : "");

    // Format HTML for blog post
    const bodyHtml = formatSubmissionAsHTML(submissionData);

    // Create blog post in Shopify
    const blogPost = await createBlogPostInShopify(shop, accessToken, {
      title,
      body: bodyHtml,
      excerpt,
      tags: [category, "Community Story"],
    });

    // Save submission to database
    await saveSubmissionToDatabase(shop, submissionData, blogPost);

    return json(
      {
        success: true,
        message: "Your story has been submitted successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return json(
      {
        error:
          error.message ||
          "An error occurred while submitting your story. Please try again.",
      },
      { status: 500 }
    );
  }
}

const CATEGORIES = [
  { value: "cyclist", label: "Cyclist" },
  { value: "pedestrian", label: "Pedestrian" },
  { value: "motorcyclist", label: "Motorcyclist" },
];

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/svg+xml"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 10;

export const meta = () => [
  { title: "Submit Your Story | Story Submission" },
  {
    name: "description",
    content: "Share your story with our community of cyclists, pedestrians, and motorcyclists",
  },
];

function FormInput({ label, name, type = "text", placeholder, required, value, onChange, error }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`${styles.formInput} ${error ? styles.inputError : ""}`}
        required={required}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, options, required, value, onChange, error }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`${styles.formSelect} ${error ? styles.inputError : ""}`}
        required={required}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, placeholder, required, value, onChange, error, rows = 6 }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className={`${styles.formTextarea} ${error ? styles.inputError : ""}`}
        required={required}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormCheckbox({ label, name, checked, onChange }) {
  return (
    <div className={styles.checkboxGroup}>
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={styles.formCheckbox}
      />
      <label className={styles.checkboxLabel} htmlFor={name}>
        {label}
      </label>
    </div>
  );
}

export default function SubmitStoryPage() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    category: "",
    date: "",
    location: "",
    details: "",
    driverAccountable: "",
    podcast: false,
    permission: false,
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [...files, ...selectedFiles].slice(0, MAX_FILES);

    const validFiles = newFiles.filter((file) => {
      // Check file type
      const hasValidType = ALLOWED_FILE_TYPES.includes(file.type);
      const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidType && !hasValidExtension) {
        return false;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return false;
      }

      return true;
    });

    setFiles(validFiles);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Show errors if action returned errors
  useEffect(() => {
    if (actionData?.errors) {
      setErrors(actionData.errors);
    }
  }, [actionData?.errors]);

  if (actionData?.success) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Thank You for Sharing!</h2>
          <p className={styles.successText}>
            {actionData?.message || "Your story has been submitted successfully. Our team will review it and approve it soon."}
          </p>
          {formData.podcast && (
            <p className={styles.successText}>
              We'll be in touch about featuring your story on our podcast!
            </p>
          )}
          <Link to="/stories" className={styles.successLink}>
            ← Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <Link to="/stories" className={styles.backLink}>
          ← Back to Stories
        </Link>

        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Share Your Story</h1>
          <p className={styles.pageSubtitle}>
            We'd love to hear from you! Tell us about your experience as a cyclist, pedestrian, or
            motorcyclist.
          </p>
        </header>

        <form method="POST" className={styles.form}>
          {actionData?.error && <div className={styles.submitError}>{actionData.error}</div>}

          <div className={styles.formRow}>
            <FormInput
              label="First Name"
              name="firstName"
              placeholder="John"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              error={errors.firstName}
            />
            <FormInput
              label="Last Name"
              name="lastName"
              placeholder="Doe"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              error={errors.lastName}
            />
          </div>

          <FormInput
            label="Email"
            name="email"
            type="email"
            placeholder="john@example.com"
            required
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
          />

          <div className={styles.formRow}>
            <FormSelect
              label="What happened?"
              name="category"
              options={CATEGORIES}
              required
              value={formData.category}
              onChange={handleInputChange}
              error={errors.category}
            />
            <FormInput
              label="When did this happen?"
              name="date"
              type="text"
              placeholder="e.g., November 15, 2024 or 11/15/2024"
              required
              value={formData.date}
              onChange={handleInputChange}
              error={errors.date}
            />
          </div>

          <FormInput
            label="Where did this happen?"
            name="location"
            placeholder="e.g., Main Street, Los Angeles, CA"
            required
            value={formData.location}
            onChange={handleInputChange}
            error={errors.location}
          />

          <FormTextarea
            label="Give us the details…"
            name="details"
            placeholder="Tell us what happened, why it matters to you, and any other details that help tell your story..."
            required
            value={formData.details}
            onChange={handleInputChange}
            error={errors.details}
            rows={8}
          />

          <FormInput
            label="Was the driver held accountable?"
            name="driverAccountable"
            placeholder="Share what happened next..."
            value={formData.driverAccountable}
            onChange={handleInputChange}
          />

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Want to share a picture?</label>
            <p className={styles.fileHelp}>
              You can upload up to {MAX_FILES} images (JPG, PNG, SVG - max 5MB each)
            </p>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
              onChange={handleFileChange}
              className={styles.fileInput}
            />

            {files.length > 0 && (
              <div className={styles.fileList}>
                <p className={styles.fileListTitle}>
                  Selected images ({files.length}/{MAX_FILES}):
                </p>
                <ul className={styles.files}>
                  {files.map((file, index) => (
                    <li key={index} className={styles.fileItem}>
                      <span className={styles.fileName}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className={styles.removeButton}
                        aria-label="Remove file"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <FormCheckbox
            label="Yes, I'd like to be contacted for our podcast"
            name="podcast"
            checked={formData.podcast}
            onChange={handleInputChange}
          />

          <FormCheckbox
            label="Yes, you have my permission to share my story on your platform and social media"
            name="permission"
            checked={formData.permission}
            onChange={handleInputChange}
          />
          {errors.permission && <p className={styles.errorMessage}>{errors.permission}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Your Story"}
          </button>
        </form>
      </div>
    </div>
  );
}
