import { useState, useEffect } from "react";
import { Form } from "@remix-run/react";
import styles from "./StorySubmissionForm.module.css";

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

const INJURY_TYPES = [
  { value: "Fatal", label: "Fatal" },
  { value: "Non-fatal", label: "Non-fatal" },
  { value: "Not-hit", label: "Not hit, but deeply impacted" }
];

const GENDERS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" }
];

function FormInput({ label, name, type = "text", placeholder, required, value, onChange, error, maxLength }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={`${styles.formInput} ${error ? styles.inputError : ""}`}
        required={required}
      />
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, options, required, value, onChange, error, placeholder }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`${styles.formSelect} ${error ? styles.inputError : ""}`}
        required={required}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormRadioGroup({ label, name, options, required, value, onChange, error }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <div className={styles.radioGroup}>
        {options.map((option) => (
          <label key={option.value} className={styles.radioLabel}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className={styles.radioInput}
              required={required}
            />
            <span className={styles.radioText}>{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function FormTextarea({ label, name, placeholder, required, value, onChange, error, maxLength }) {
  const characterCount = value ? value.length : 0;

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel} htmlFor={name}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className={`${styles.formTextarea} ${error ? styles.inputError : ""}`}
        required={required}
        rows={6}
      />
      {maxLength && (
        <div className={styles.characterCount}>
          {characterCount} / {maxLength} characters
        </div>
      )}
      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

function ImageUpload({ label, name, required, images, onChange, error, maxImages = 10 }) {
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = maxImages - images.length;

    if (files.length + images.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    const newPreviews = [];
    const newImages = [];

    files.slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        // Use URL.createObjectURL for preview instead of base64
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push({
          file, // Store actual File object
          preview: previewUrl, // Object URL for preview
          id: Date.now() + Math.random()
        });
        newImages.push(file); // Store File object, not base64
      }
    });

    setPreviews([...previews, ...newPreviews]);
    onChange([...images, ...newImages]); // Pass File objects to parent
  };

  const handleRemove = (indexToRemove) => {
    const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setPreviews(updatedPreviews);
    onChange(updatedImages);
  };

  useEffect(() => {
    if (images.length === 0) {
      // Clean up object URLs when images are cleared
      previews.forEach(preview => {
        if (preview.preview && preview.preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview.preview);
        }
      });
      setPreviews([]);
    }
  }, [images]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.preview && preview.preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview.preview);
        }
      });
    };
  }, [previews]);

  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      {previews.length < maxImages && (
        <div className={styles.uploadArea}>
          <input
            id={name}
            name={name}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <label htmlFor={name} className={styles.uploadLabel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span>Click to upload photos</span>
            <span className={styles.uploadHint}>
              {previews.length} / {maxImages} images uploaded
            </span>
          </label>
        </div>
      )}

      {previews.length > 0 && (
        <div className={styles.previewGrid}>
          {previews.map((item, index) => (
            <div key={item.id || index} className={styles.previewItem}>
              <img src={item.preview} alt={`Preview ${index + 1}`} className={styles.previewImage} />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={styles.removeButton}
                aria-label="Remove image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}

export default function StorySubmissionForm({ onSubmit, isSubmitting, actionData, shop }) {
  const [formData, setFormData] = useState({
    submitterName: "",
    submitterEmail: "",
    victimName: "",
    relation: "",
    incidentDate: "",
    zipCode: "",
    state: "",
    roadUserType: "",
    injuryType: "",
    age: "",
    gender: "",
    victimStory: "",
    photos: [],
    interestedInContact: "",
  });

  const [errors, setErrors] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (images) => {
    setFormData((prev) => ({
      ...prev,
      photos: images,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setUploadError(null);

    // Client-side validation
    const newErrors = {};
    if (!formData.submitterName) newErrors.submitterName = "Submitter name is required";
    if (!formData.submitterEmail) newErrors.submitterEmail = "Submitter email is required";
    if (!formData.incidentDate) newErrors.incidentDate = "Incident date is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.roadUserType) newErrors.roadUserType = "Road user type is required";
    if (!formData.injuryType) newErrors.injuryType = "Injury type is required";
    if (!formData.victimStory) newErrors.victimStory = "Victim's story is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      let photoUrls = [];

      // Step 1: Upload images if any
      if (formData.photos.length > 0) {
        setIsUploading(true);
        const uploadFormData = new FormData();

        // Get shop domain from window or prop
        const shopDomain = shop || window.Shopify?.shop || window.location.hostname;
        uploadFormData.append("shop", shopDomain);

        // Append actual File objects
        formData.photos.forEach((file) => {
          uploadFormData.append("files", file);
        });

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Image upload failed");
        }

        photoUrls = uploadResult.urls;
        setIsUploading(false);
      }

      // Step 2: Submit story with CDN URLs
      const submitFormData = new FormData(e.target);
      submitFormData.set("photoUrls", JSON.stringify(photoUrls));
      submitFormData.set("shop", shop || window.Shopify?.shop || window.location.hostname);

      // Call parent onSubmit if provided, otherwise submit directly
      if (onSubmit) {
        await onSubmit(submitFormData);
      }

    } catch (error) {
      console.error("Submission error:", error);
      setUploadError(error.message);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (actionData?.errors) {
      setErrors(actionData.errors);
    }
  }, [actionData?.errors]);

  return (
    <div className={styles.formSection}>
      <Form method="post" onSubmit={handleSubmit} className={styles.form}>
        {actionData?.error && (
          <div className={styles.submitError}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {actionData.error}
          </div>
        )}

        {uploadError && (
          <div className={styles.submitError}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <strong>Image Upload Failed</strong>
              <p>{uploadError}</p>
              {uploadError.includes('session') && (
                <p style={{fontSize: '0.9em', marginTop: '0.5em'}}>
                  The shop may need to reinstall the app.
                </p>
              )}
            </div>
          </div>
        )}

        <div className={styles.formContainer}>
          {/* Row 1-4: Full width fields */}
          <FormInput
            label="Submitter Name"
            name="submitterName"
            placeholder="Your full name"
            required
            value={formData.submitterName}
            onChange={handleInputChange}
            error={errors.submitterName}
          />

          <FormInput
            label="Submitter Email"
            name="submitterEmail"
            type="email"
            placeholder="your@email.com"
            required
            value={formData.submitterEmail}
            onChange={handleInputChange}
            error={errors.submitterEmail}
          />

          <FormInput
            label="Victim Name"
            name="victimName"
            placeholder="Victim's full name (optional)"
            value={formData.victimName}
            onChange={handleInputChange}
            error={errors.victimName}
          />

          <FormInput
            label="Relation"
            name="relation"
            placeholder="Your relationship to the victim (optional)"
            value={formData.relation}
            onChange={handleInputChange}
            error={errors.relation}
          />

          {/* Row 5: Three columns - Incident Date | Zip Code | State */}
          <div className={styles.formRow3Cols}>
            <FormInput
              label="Incident Date"
              name="incidentDate"
              type="date"
              required
              value={formData.incidentDate}
              onChange={handleInputChange}
              error={errors.incidentDate}
            />

            <FormInput
              label="Zip Code"
              name="zipCode"
              placeholder="Zip code"
              value={formData.zipCode}
              onChange={handleInputChange}
              error={errors.zipCode}
            />

            <FormSelect
              label="State"
              name="state"
              options={US_STATES}
              placeholder="Select state"
              required
              value={formData.state}
              onChange={handleInputChange}
              error={errors.state}
            />
          </div>

          {/* Row 6: Two columns - Road User Type | Injury Type (Radio) */}
          <div className={styles.formRow2Cols}>
            <FormSelect
              label="Road User Type"
              name="roadUserType"
              options={ROAD_USER_TYPES}
              placeholder="Select road user type"
              required
              value={formData.roadUserType}
              onChange={handleInputChange}
              error={errors.roadUserType}
            />

            <FormRadioGroup
              label="Injury Type"
              name="injuryType"
              options={INJURY_TYPES}
              required
              value={formData.injuryType}
              onChange={handleInputChange}
              error={errors.injuryType}
            />
          </div>

          {/* Row 7: Two columns - Age | Gender */}
          <div className={styles.formRow2Cols}>
            <FormInput
              label="Age at Incident"
              name="age"
              type="number"
              placeholder="Age (optional)"
              value={formData.age}
              onChange={handleInputChange}
              error={errors.age}
            />

            <FormRadioGroup
              label="Gender"
              name="gender"
              options={GENDERS}
              value={formData.gender}
              onChange={handleInputChange}
              error={errors.gender}
            />
          </div>

          {/* Story Details - Full width */}
          <FormTextarea
            label="Victim's Story"
            name="victimStory"
            placeholder="Share the story... (max 1000 characters)"
            required
            maxLength={1000}
            value={formData.victimStory}
            onChange={handleInputChange}
            error={errors.victimStory}
          />

          {/* Photo Upload - Full width */}
          <ImageUpload
            label="Photos"
            name="photos"
            images={formData.photos}
            onChange={handleImageChange}
            error={errors.photos}
            maxImages={10}
          />

          {/* Contact Preference - Radio buttons */}
          <FormRadioGroup
            label="Interested in being contacted about your story?"
            name="interestedInContact"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" }
            ]}
            value={formData.interestedInContact}
            onChange={handleInputChange}
            error={errors.interestedInContact}
          />

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || isUploading}
            >
              {isUploading ? (
                <>
                  <span className={styles.spinner}></span>
                  Uploading images...
                </>
              ) : isSubmitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>

            <a
              href="mailto:contact@example.com"
              className={styles.emailButton}
            >
              Email Us
            </a>
          </div>
        </div>
      </Form>
    </div>
  );
}
