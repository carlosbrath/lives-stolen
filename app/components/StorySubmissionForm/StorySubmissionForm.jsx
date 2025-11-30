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

const INJURY_TYPES = ["Fatal", "Non-fatal"];

const GENDERS = ["Male", "Female", "Non-binary", "Other", "Prefer not to say"];

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
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({ file, preview: reader.result, id: Date.now() + Math.random() });
          if (newPreviews.length === files.slice(0, remainingSlots).length) {
            setPreviews([...previews, ...newPreviews]);
            onChange([...images, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
        newImages.push(file);
      }
    });
  };

  const handleRemove = (indexToRemove) => {
    const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setPreviews(updatedPreviews);
    onChange(updatedImages);
  };

  useEffect(() => {
    if (images.length === 0) {
      setPreviews([]);
    }
  }, [images]);

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

export default function StorySubmissionForm({ onSubmit, isSubmitting, actionData }) {
  const [formData, setFormData] = useState({
    submitterName: "",
    submitterEmail: "",
    victimName: "",
    relation: "",
    incidentDate: "",
    state: "",
    roadUserType: "",
    injuryType: "",
    age: "",
    gender: "",
    shortTitle: "",
    victimStory: "",
    photos: [],
  });

  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    // Client-side validation
    const newErrors = {};
    if (!formData.submitterName) newErrors.submitterName = "Submitter name is required";
    if (!formData.submitterEmail) newErrors.submitterEmail = "Submitter email is required";
    if (!formData.incidentDate) newErrors.incidentDate = "Incident date is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.roadUserType) newErrors.roadUserType = "Road user type is required";
    if (!formData.injuryType) newErrors.injuryType = "Injury type is required";
    if (!formData.shortTitle) newErrors.shortTitle = "Short title is required";
    if (!formData.victimStory) newErrors.victimStory = "Victim's story is required";

    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      return;
    }

    // Add image data to a hidden input before form submission
    // This ensures Remix Form component can handle it properly
    const form = e.target;
    const existingPhotoInput = form.querySelector('input[name="photoUrls"]');

    if (existingPhotoInput) {
      existingPhotoInput.remove();
    }

    const photoInput = document.createElement('input');
    photoInput.type = 'hidden';
    photoInput.name = 'photoUrls';

    if (formData.photos.length > 0) {
      const imageUrls = formData.photos.map(img => img.preview);
      photoInput.value = JSON.stringify(imageUrls);
    } else {
      photoInput.value = JSON.stringify([]);
    }

    form.appendChild(photoInput);

    // Let Remix handle the form submission
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

        <div className={styles.formContainer}>
          {/* Submitter Information */}
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

          {/* Victim Information */}
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

          {/* Incident Details */}
          <FormInput
            label="Incident Date"
            name="incidentDate"
            type="date"
            required
            value={formData.incidentDate}
            onChange={handleInputChange}
            error={errors.incidentDate}
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

          <FormSelect
            label="Injury Type"
            name="injuryType"
            options={INJURY_TYPES}
            placeholder="Select injury type"
            required
            value={formData.injuryType}
            onChange={handleInputChange}
            error={errors.injuryType}
          />

          <FormInput
            label="Age at Incident"
            name="age"
            type="number"
            placeholder="Age (optional)"
            value={formData.age}
            onChange={handleInputChange}
            error={errors.age}
          />

          <FormSelect
            label="Gender"
            name="gender"
            options={GENDERS}
            placeholder="Select gender (optional)"
            value={formData.gender}
            onChange={handleInputChange}
            error={errors.gender}
          />

          {/* Story Details */}
          <FormInput
            label="Short Title"
            name="shortTitle"
            placeholder="Brief title for this story"
            required
            value={formData.shortTitle}
            onChange={handleInputChange}
            error={errors.shortTitle}
          />

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

          {/* Photo Upload */}
          <ImageUpload
            label="Photos"
            name="photos"
            images={formData.photos}
            onChange={handleImageChange}
            error={errors.photos}
            maxImages={10}
          />

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Submitting...
              </>
            ) : (
              "Submit Story"
            )}
          </button>
        </div>
      </Form>
    </div>
  );
}
