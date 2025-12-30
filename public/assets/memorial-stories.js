/**
 * Memorial Stories - Shared JavaScript
 * Handles API calls, filtering, and interactions for all story blocks
 * Matching functionality from app/routes/stories._index/route.jsx
 * New deployment: https://stories-app.fly.dev 12/30/2025
 */

class MemorialStoriesAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://stories-app.fly.dev/';
  }

  /**
   * Fetch stories with optional filters
   */
  async fetchStories(filters = {}) {
    console.log(this.baseUrl);
    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.roadUserType && filters.roadUserType.length > 0) {
        filters.roadUserType.forEach(type => params.append('roadUserType', type));
      }
      if (filters.ageRange && filters.ageRange.length > 0) {
        filters.ageRange.forEach(range => params.append('ageRange', range));
      }
      if (filters.gender && filters.gender.length > 0) {
        filters.gender.forEach(gender => params.append('gender', gender));
      }
      if (filters.injuryType) {
        params.append('injuryType', filters.injuryType);
      }
      if (filters.state && filters.state.length > 0) {
        filters.state.forEach(state => params.append('state', state));
      }
      if (filters.year && filters.year.length > 0) {
        filters.year.forEach(year => params.append('year', year));
      }
      if (filters.limit) {
        params.append('limit', filters.limit);
      }
      if (filters.offset) {
        params.append('offset', filters.offset);
      }

      const response = await fetch(`${this.baseUrl}api/stories?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      return { stories: [], stats: { total: 0, livesStolen: 0, livesShattered: 0 } };
    }
  }

  /**
   * Fetch a single story by ID
   */
  async fetchStory(id) {
    try {
      const response = await fetch(`${this.baseUrl}api/stories/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      return data.story;
    } catch (error) {
      console.error('Error fetching story:', error);
      return null;
    }
  }

  /**
   * Submit a new story
   */
  async submitStory(formData) {
    try {
      const response = await fetch(`${this.baseUrl}api/submit`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Submission failed', errors: data.errors };
      }

      return { success: true, message: data.message, submissionId: data.submissionId };
    } catch (error) {
      console.error('Error submitting story:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }
}

/**
 * Utility Functions
 */
const MemorialStoriesUtils = {
  /**
   * Format date string
   */
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  },

  /**
   * Create story card HTML
   */
  createStoryCard(story, linkPrefix = '') {
    // Parse images if it's a JSON string
    let images = story.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        console.error('Failed to parse images:', e);
        images = [];
      }
    }

    // Ensure images is an array
    if (!Array.isArray(images)) {
      images = [];
    }

    // Get first image URL or use default avatar
    const apiBaseUrl = window.MEMORIAL_CONFIG?.apiBaseUrl || window.MEMORIAL_SETTINGS?.apiBaseUrl || 'https://stories-app.fly.dev';
    const hasImages = images.length > 0;
    const imageUrl = hasImages ? images[0] : `${apiBaseUrl}/Avatar-default.png`;

    return `
      <a href="${linkPrefix}?id=${story.id}" class="memorial-card" data-story-id="${story.id}">
        <div class="memorial-card__image">
          <img src="${imageUrl}" alt="${story.victimName || story.title}" loading="lazy">
        </div>
        <div class="memorial-card__info">
          <div class="memorial-card__detail">
            <strong>Name:</strong> ${story.victimName || story.title}
          </div>
          <div class="memorial-card__detail">
            <strong>Age:</strong> ${story.age || 'N/A'}
          </div>
          <div class="memorial-card__detail">
            <strong>Type:</strong> ${story.category}
          </div>
          <div class="memorial-card__detail">
            <strong>Location:</strong> ${story.state}
          </div>
        </div>
      </a>
    `;
  },

  /**
   * Show loading state
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="memorial-loading">
        <div class="memorial-loading__spinner"></div>
        <p>Loading stories...</p>
      </div>
    `;
  },

  /**
   * Show error state
   */
  showError(container, message) {
    container.innerHTML = `
      <div class="memorial-error">
        <p>${message}</p>
      </div>
    `;
  },

  /**
   * Show empty state
   */
  showEmpty(container, message = 'No stories found matching your filters.') {
    container.innerHTML = `
      <div class="memorial-empty-state">
        <p>${message}</p>
      </div>
    `;
  },

  /**
   * Debounce function for performance
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Check if story matches age range
   */
  matchesAgeRange(story, ageRanges) {
    if (!ageRanges || ageRanges.length === 0) return true;
    if (!story.age) return false;

    return ageRanges.some(range => {
      const [min, max] = range.includes("+")
        ? [parseInt(range), Infinity]
        : range.split("-").map(Number);
      return story.age >= min && story.age <= max;
    });
  },
};

/**
 * Story Wall Manager
 * Handles the complete story wall functionality with filters
 */
class StoryWallManager {
  constructor(config = {}) {
    this.api = new MemorialStoriesAPI(config.apiBaseUrl || 'https://stories-app.fly.dev');
    this.initialLoad = config.initialLoad || 12;
    this.itemsPerPage = 12;
    this.allStories = [];
    this.displayCount = this.initialLoad;

    // Filter state matching the app
    this.filters = {
      roadUserType: [],
      ageRange: [],
      gender: [],
      injuryType: "Fatal", // Default to Lives Stolen
      state: [],
      year: [],
    };

    this.expandedGroups = {};
    this.init();
  }

  async init() {
    await this.loadStories();
    this.setupEventListeners();
    this.renderStories();
  }

  async loadStories() {
    try {
      // Fetch all published stories
      const data = await this.api.fetchStories();
      this.allStories = data.stories || [];

      // Update stats
      this.updateStats();
    } catch (error) {
      console.error('Error loading stories:', error);
      this.allStories = [];
    }
  }

  updateStats() {
    const livesStolen = this.allStories.filter(s => s.injuryType === "Fatal").length;
    const livesShattered = this.allStories.filter(s => s.injuryType === "Non-fatal").length;

    const stolenCountEl = document.getElementById('lives-stolen-count');
    const shatteredCountEl = document.getElementById('lives-shattered-count');

    if (stolenCountEl) stolenCountEl.textContent = livesStolen;
    if (shatteredCountEl) shatteredCountEl.textContent = livesShattered;
  }

  setupEventListeners() {
    // Filter toggle button
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterOverlay = document.getElementById('filter-overlay');

    if (filterToggle) {
      filterToggle.addEventListener('click', () => {
        const isOpen = filterDropdown.style.display === 'block';
        filterDropdown.style.display = isOpen ? 'none' : 'block';
        filterOverlay.style.display = isOpen ? 'none' : 'block';
      });
    }

    if (filterOverlay) {
      filterOverlay.addEventListener('click', () => {
        filterDropdown.style.display = 'none';
        filterOverlay.style.display = 'none';
      });
    }

    // Filter group expansion
    const filterButtons = document.querySelectorAll('.memorial-filter-button');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const groupName = button.dataset.filterGroup;
        this.toggleFilterGroup(groupName, button);
      });
    });

    // Filter checkboxes
    const filterCheckboxes = document.querySelectorAll('.memorial-filter-option input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleFilterChange(e.target.name, e.target.value, e.target.checked);
      });
    });

    // Lives Stolen/Shattered buttons
    const fatalButton = document.getElementById('filter-fatal');
    const nonfatalButton = document.getElementById('filter-nonfatal');

    if (fatalButton) {
      fatalButton.addEventListener('click', () => {
        this.setInjuryTypeFilter('Fatal', fatalButton, nonfatalButton);
      });
    }

    if (nonfatalButton) {
      nonfatalButton.addEventListener('click', () => {
        this.setInjuryTypeFilter('Non-fatal', nonfatalButton, fatalButton);
      });
    }

    // Clear filters button
    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
      clearButton.addEventListener('click', () => this.clearAllFilters());
    }

    // Load more button
    const loadMoreButton = document.getElementById('load-more-button');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', () => this.loadMore());
    }

    // Form submission
    this.setupFormSubmission();
  }

  toggleFilterGroup(groupName, button) {
    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
    const options = button.nextElementSibling;

    if (this.expandedGroups[groupName]) {
      button.classList.add('memorial-filter-button-expanded');
      options.classList.add('memorial-filter-options-expanded');
    } else {
      button.classList.remove('memorial-filter-button-expanded');
      options.classList.remove('memorial-filter-options-expanded');
    }
  }

  handleFilterChange(filterName, value, isChecked) {
    if (filterName === "injuryType") {
      this.filters[filterName] = value;
    } else {
      const currentValues = this.filters[filterName];
      if (isChecked) {
        if (!currentValues.includes(value)) {
          this.filters[filterName] = [...currentValues, value];
        }
      } else {
        this.filters[filterName] = currentValues.filter(v => v !== value);
      }
    }

    this.displayCount = this.itemsPerPage;
    this.renderStories();
    this.updateClearFiltersButton();
  }

  setInjuryTypeFilter(type, activeButton, inactiveButton) {
    this.filters.injuryType = type;
    this.displayCount = this.itemsPerPage;

    // Update button states
    activeButton.classList.add('memorial-heading-button-active');
    inactiveButton.classList.remove('memorial-heading-button-active');

    // Update section title
    const sectionTitle = document.getElementById('current-section-title');
    if (sectionTitle) {
      sectionTitle.textContent = type === 'Fatal' ? 'Lives Stolen' : 'Lives Shattered';
    }

    this.renderStories();
  }

  clearAllFilters() {
    // Reset all filters except injury type
    this.filters = {
      roadUserType: [],
      ageRange: [],
      gender: [],
      injuryType: this.filters.injuryType, // Keep current injury type
      state: [],
      year: [],
    };

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('.memorial-filter-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    this.displayCount = this.itemsPerPage;
    this.renderStories();
    this.updateClearFiltersButton();
  }

  updateClearFiltersButton() {
    const hasActiveFilters =
      this.filters.roadUserType.length > 0 ||
      this.filters.ageRange.length > 0 ||
      this.filters.gender.length > 0 ||
      this.filters.state.length > 0 ||
      this.filters.year.length > 0;

    const clearButton = document.getElementById('clear-filters');
    if (clearButton) {
      clearButton.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  getFilteredStories() {
    return this.allStories.filter(story => {
      // Road User Type
      if (this.filters.roadUserType.length > 0 && !this.filters.roadUserType.includes(story.category)) {
        return false;
      }

      // Age Range
      if (this.filters.ageRange.length > 0 && !MemorialStoriesUtils.matchesAgeRange(story, this.filters.ageRange)) {
        return false;
      }

      // Gender
      if (this.filters.gender.length > 0 && !this.filters.gender.includes(story.gender)) {
        return false;
      }

      // Injury Type
      if (this.filters.injuryType && story.injuryType !== this.filters.injuryType) {
        return false;
      }

      // State
      if (this.filters.state.length > 0 && !this.filters.state.includes(story.state)) {
        return false;
      }

      // Year
      if (this.filters.year.length > 0 && !this.filters.year.includes(story.year)) {
        return false;
      }

      return true;
    });
  }

  renderStories() {
    const storiesGrid = document.getElementById('stories-grid');
    const emptyState = document.getElementById('empty-state');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (!storiesGrid) return;

    const filteredStories = this.getFilteredStories();
    const displayedStories = filteredStories.slice(0, this.displayCount);
    const hasMoreStories = this.displayCount < filteredStories.length;

    if (filteredStories.length === 0) {
      storiesGrid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';

      // Render story cards
      storiesGrid.innerHTML = displayedStories.map(story =>
        MemorialStoriesUtils.createStoryCard(story, '/pages/story-detail')
      ).join('');

      // Show/hide load more button
      if (loadMoreContainer) {
        loadMoreContainer.style.display = hasMoreStories ? 'flex' : 'none';
      }
    }
  }

  loadMore() {
    this.displayCount += this.itemsPerPage;
    this.renderStories();
  }

  setupFormSubmission() {
    const form = document.getElementById('memorial-submission-form');
    if (!form) return;

    const submitButton = document.getElementById('submit-button');
    const errorDiv = document.getElementById('form-error');
    const successDiv = document.getElementById('memorial-form-success');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get button elements once at the start
      const submitText = submitButton ? submitButton.querySelector('.submit-text') : null;
      const submitLoading = submitButton ? submitButton.querySelector('.submit-loading') : null;

      // Clear previous errors
      if (errorDiv) errorDiv.style.display = 'none';
      if (window.imageUploadManager) window.imageUploadManager.clearError();

      // Show loading state
      if (submitButton) {
        submitButton.disabled = true;
        if (submitText) submitText.style.display = 'none';
        if (submitLoading) submitLoading.style.display = 'inline';
      }

      try {
        let photoUrls = [];

        // Step 1: Upload images first (if any)
        if (window.imageUploadManager && window.imageUploadManager.selectedFiles.length > 0) {
          console.log('📤 Uploading images before form submission...');

          // Update button text to show upload progress
          if (submitLoading) submitLoading.textContent = 'Uploading images...';

          try {
            photoUrls = await window.imageUploadManager.uploadFiles();
            console.log('✅ Images uploaded successfully');
          } catch (uploadError) {
            console.error('❌ Image upload failed:', uploadError);

            // Show upload error
            const errorMessage = uploadError.message || 'Failed to upload images. Please try again.';
            if (window.imageUploadManager) {
              window.imageUploadManager.showError(errorMessage);
            }
            if (errorDiv) {
              errorDiv.textContent = `Image upload failed: ${errorMessage}`;
              errorDiv.style.display = 'block';
            }

            // Reset button
            if (submitButton) {
              submitButton.disabled = false;
              if (submitText) submitText.style.display = 'inline';
              if (submitLoading) {
                submitLoading.style.display = 'none';
                submitLoading.textContent = 'Submitting...';
              }
            }

            return; // Stop submission if upload fails
          }
        }

        // Update button text for form submission
        if (submitLoading) submitLoading.textContent = 'Submitting story...';

        // Step 2: Prepare form data with uploaded CDN URLs
        const formData = new FormData(form);
        formData.set('photoUrls', JSON.stringify(photoUrls));
        formData.set('shop', window.MEMORIAL_SETTINGS?.shop || 'public');

        // Step 3: Submit story with CDN URLs
        const result = await this.api.submitStory(formData, []); // No files, just URLs

        if (result.success) {
          console.log('✅ Story submitted successfully');

          // Show success message
          form.style.display = 'none';
          if (successDiv) successDiv.style.display = 'block';

          // Reset image upload manager
          if (window.imageUploadManager) {
            window.imageUploadManager.reset();
          }

          // Scroll to success message
          if (successDiv) {
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

        } else {
          throw new Error(result.error || 'Submission failed');
        }

      } catch (error) {
        console.error('❌ Submission error:', error);

        // Show error
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Submission failed. Please try again.';
          errorDiv.style.display = 'block';
        }

        // Reset button
        if (submitButton) {
          submitButton.disabled = false;
          if (submitText) submitText.style.display = 'inline';
          if (submitLoading) {
            submitLoading.style.display = 'none';
            submitLoading.textContent = 'Submitting...';
          }
        }
      }
    });
  }
}

/**
 * Image Upload Manager with Drag & Drop
 * Handles file selection, preview, and upload with comprehensive error handling
 */
class ImageUploadManager {
  constructor(config = {}) {
    this.maxImages = config.maxImages || 10;
    this.maxFileSize = config.maxFileSize || 5 * 1024 * 1024; // 5MB default
    this.allowedTypes = config.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.apiBaseUrl = config.apiBaseUrl || window.MEMORIAL_SETTINGS?.apiBaseUrl || 'https://stories-app.fly.dev';

    this.selectedFiles = [];
    this.uploadedUrls = [];
    this.isUploading = false;

    this.init();
  }

  init() {
    this.fileInput = document.getElementById('photo-upload');
    this.uploadArea = document.getElementById('upload-area');
    this.previewGrid = document.getElementById('preview-grid');
    this.uploadCount = document.getElementById('upload-count');
    this.uploadError = document.getElementById('upload-error');
    this.uploadErrorMessage = document.getElementById('upload-error-message');

    if (!this.fileInput || !this.uploadArea) return;

    this.setupEventListeners();
    this.updateUploadCount();
  }

  setupEventListeners() {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
    });

    // Click to browse
    this.uploadArea.addEventListener('click', () => {
      if (this.selectedFiles.length < this.maxImages) {
        this.fileInput.click();
      }
    });

    // Drag and drop
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadArea.classList.add('drag-over');
    });

    this.uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadArea.classList.remove('drag-over');
    });

    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.uploadArea.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files).filter(file =>
        this.allowedTypes.includes(file.type)
      );

      if (files.length > 0) {
        this.handleFiles(files);
      } else {
        this.showError('Please drop only image files (JPG, PNG, GIF)');
      }
    });
  }

  handleFiles(files) {
    this.clearError();

    const remainingSlots = this.maxImages - this.selectedFiles.length;

    if (files.length + this.selectedFiles.length > this.maxImages) {
      this.showError(`You can only upload up to ${this.maxImages} images. ${remainingSlots} slot(s) remaining.`);
      files = files.slice(0, remainingSlots);
    }

    // Validate files
    const validFiles = [];
    for (const file of files) {
      if (!this.allowedTypes.includes(file.type)) {
        this.showError(`File "${file.name}" is not a supported image type.`);
        continue;
      }

      if (file.size > this.maxFileSize) {
        this.showError(`File "${file.name}" is too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      validFiles.forEach(file => this.addFile(file));
      this.updateUploadCount();
      this.renderPreviews();
    }
  }

  addFile(file) {
    const id = Date.now() + Math.random();
    const preview = URL.createObjectURL(file);

    this.selectedFiles.push({
      id,
      file,
      preview,
      uploaded: false
    });
  }

  removeFile(id) {
    const index = this.selectedFiles.findIndex(f => f.id === id);
    if (index !== -1) {
      // Revoke object URL
      if (this.selectedFiles[index].preview) {
        URL.revokeObjectURL(this.selectedFiles[index].preview);
      }

      this.selectedFiles.splice(index, 1);
      this.updateUploadCount();
      this.renderPreviews();
    }
  }

  renderPreviews() {
    if (!this.previewGrid) return;

    this.previewGrid.innerHTML = this.selectedFiles.map(item => `
      <div class="memorial-preview-item" data-id="${item.id}">
        <img src="${item.preview}" alt="Preview" class="memorial-preview-image">
        <button
          type="button"
          class="memorial-remove-image"
          onclick="window.imageUploadManager.removeFile(${item.id})"
          aria-label="Remove image"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    `).join('');

    // Hide upload area if max images reached
    if (this.selectedFiles.length >= this.maxImages) {
      this.uploadArea.style.display = 'none';
    } else {
      this.uploadArea.style.display = 'flex';
    }
  }

  updateUploadCount() {
    if (this.uploadCount) {
      this.uploadCount.textContent = `${this.selectedFiles.length} / ${this.maxImages} images`;
    }
  }

  showError(message) {
    if (this.uploadError && this.uploadErrorMessage) {
      this.uploadErrorMessage.textContent = message;
      this.uploadError.style.display = 'flex';

      // Auto-hide after 5 seconds
      setTimeout(() => this.clearError(), 5000);
    }
  }

  clearError() {
    if (this.uploadError) {
      this.uploadError.style.display = 'none';
    }
  }

  /**
   * Upload all selected files to Shopify
   * Returns array of CDN URLs or throws error
   */
  async uploadFiles() {
    if (this.selectedFiles.length === 0) {
      return [];
    }

    if (this.isUploading) {
      throw new Error('Upload already in progress');
    }

    this.isUploading = true;
    this.clearError();

    try {
      const uploadFormData = new FormData();

      // Add shop domain
      const shop = window.MEMORIAL_SETTINGS?.shop || window.Shopify?.shop || 'unknown';
      uploadFormData.append('shop', shop);

      // Add all files
      this.selectedFiles.forEach(item => {
        uploadFormData.append('files', item.file);
      });

      console.log(`📤 Uploading ${this.selectedFiles.length} images to ${this.apiBaseUrl}api/upload`);

      const response = await fetch(`${this.apiBaseUrl}api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Image upload failed');
      }

      this.uploadedUrls = result.urls;
      console.log('✅ Images uploaded successfully:', this.uploadedUrls);

      this.isUploading = false;
      return this.uploadedUrls;

    } catch (error) {
      this.isUploading = false;
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  /**
   * Get array of File objects for form submission
   */
  getFiles() {
    return this.selectedFiles.map(item => item.file);
  }

  /**
   * Get uploaded CDN URLs
   */
  getUploadedUrls() {
    return this.uploadedUrls;
  }

  /**
   * Reset the upload manager
   */
  reset() {
    // Revoke all object URLs
    this.selectedFiles.forEach(item => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });

    this.selectedFiles = [];
    this.uploadedUrls = [];
    this.isUploading = false;
    this.updateUploadCount();
    this.renderPreviews();
    this.clearError();

    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }
}

/**
 * Story Detail Manager
 * Handles the story detail page with image slider and component-based architecture
 */
class StoryDetailManager {
  constructor(config = {}) {
    this.api = new MemorialStoriesAPI(config.apiBaseUrl || 'https://stories-app.fly.dev');
    this.apiBaseUrl = config.apiBaseUrl || 'https://stories-app.fly.dev';
    this.storyId = config.storyId;
    this.backLinkUrl = config.backLinkUrl || '/pages/memorial-wall';
    this.backLinkText = config.backLinkText || 'Back to Memorial Wall';
    this.container = config.container;

    this.selectedImageIndex = 0;
    this.images = [];
    this.story = null;

    if (this.container && this.storyId) {
      this.init();
    }
  }

  async init() {
    try {
      // Show loading state
      this.showLoading();

      // Fetch story data
      this.story = await this.api.fetchStory(this.storyId);

      if (!this.story) {
        this.showError('Story not found.');
        return;
      }

      // Parse images
      this.parseImages();

      // Render the complete detail page
      this.render();

      // Setup event listeners
      this.setupEventListeners();

      // Update page title
      document.title = `${this.story.victimName || this.story.title} | Memorial Story`;

    } catch (error) {
      console.error('Error loading story:', error);
      this.showError('Unable to load story. Please try again later.');
    }
  }

  parseImages() {
    let images = this.story.images;

    // Parse if JSON string
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        console.error('Failed to parse images:', e);
        images = [];
      }
    }

    // Ensure it's an array
    if (!Array.isArray(images)) {
      images = [];
    }

    this.images = images.length > 0 ? images : [`${this.apiBaseUrl}/Avatar-default.png`];
  }

  showLoading() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="memorial-loading">
        <div class="memorial-loading__spinner"></div>
        <p>Loading story...</p>
      </div>
    `;
  }

  showError(message) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="memorial-error">
        <p>${message}</p>
      </div>
    `;
  }

  render() {
    if (!this.container || !this.story) return;

    const formattedDate = MemorialStoriesUtils.formatDate(this.story.date);
    const injuryLabel = this.story.injuryType === 'Fatal' ? 'Lives Stolen' : 'Lives Shattered';
    const actionLabel = this.story.injuryType === 'Fatal' ? 'Killed' : 'Injured';

    this.container.innerHTML = `
      <div class="story-detail-wrapper">
        <!-- Top Title -->
        <div class="story-detail-top-title">
          <h1 class="story-detail-injury-title">${injuryLabel}</h1>
        </div>

        <!-- Header with Back Button -->
        <header class="story-detail-header">
          <a href="${this.backLinkUrl}" class="story-detail-back-button" aria-label="${this.backLinkText}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <h2 class="story-detail-victim-name">${this.story.victimName || this.story.title}</h2>
        </header>

        <!-- Main Content: Two-column layout -->
        <div class="story-detail-content">
          <!-- Left Column: Image Gallery -->
          <div class="story-detail-image-section">
            ${this.renderImageGallery()}
          </div>

          <!-- Right Column: Story Info -->
          <div class="story-detail-info-section">
            ${this.renderStoryInfo(formattedDate, actionLabel)}
          </div>
        </div>

        <!-- Story Content Section -->
        ${this.renderStoryContent(injuryLabel)}
      </div>
    `;
  }

  renderImageGallery() {
    const hasMultipleImages = this.images.length > 1;

    return `
      <div class="story-detail-image-gallery">
        <!-- Main Image Display -->
        <div class="story-detail-image-main">
          <img
            id="main-story-image"
            src="${this.images[0]}"
            alt="${this.story.victimName || this.story.title}"
            loading="lazy"
          >

          ${hasMultipleImages ? `
            <!-- Navigation Buttons -->
            <button
              class="story-detail-nav-button story-detail-nav-prev"
              id="prev-image-btn"
              aria-label="Previous image"
              ${this.selectedImageIndex === 0 ? 'disabled' : ''}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <button
              class="story-detail-nav-button story-detail-nav-next"
              id="next-image-btn"
              aria-label="Next image"
              ${this.selectedImageIndex === this.images.length - 1 ? 'disabled' : ''}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            <!-- Image Counter -->
            <div class="story-detail-image-counter">
              <span id="current-image-number">1</span> / ${this.images.length}
            </div>
          ` : ''}
        </div>

        ${hasMultipleImages ? `
          <!-- Thumbnail Grid -->
          <div class="story-detail-thumbnails" id="thumbnail-grid">
            ${this.images.map((img, index) => `
              <button
                class="story-detail-thumbnail ${index === 0 ? 'active' : ''}"
                data-index="${index}"
                aria-label="View image ${index + 1}"
              >
                <img src="${img}" alt="Thumbnail ${index + 1}" loading="lazy">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderStoryInfo(formattedDate, actionLabel) {
    return `
      ${this.story.relation ? `
        <p class="story-detail-relation">${this.story.relation}</p>
      ` : ''}

      ${this.story.state ? `
        <p class="story-detail-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${this.story.state}
        </p>
      ` : ''}

      ${this.story.date ? `
        <p class="story-detail-date">${actionLabel} ${formattedDate}</p>
      ` : ''}

      ${this.story.category ? `
        <p class="story-detail-category">${this.story.category}</p>
      ` : ''}

      <!-- Share Buttons -->
      <div class="story-detail-share-buttons">
        <button class="story-detail-share-button" id="share-facebook" aria-label="Share on Facebook">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>

        <button class="story-detail-share-button" id="share-linkedin" aria-label="Share on LinkedIn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </button>

        <button class="story-detail-share-button" id="share-copy" aria-label="Copy link">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    `;
  }

  renderStoryContent(injuryLabel) {
    return `
      <article class="story-detail-story-section">
        <h2 class="story-detail-story-label">Story:</h2>
        <div class="story-detail-story-text">
          ${this.story.description.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
        </div>

        <div class="story-detail-button-wrapper">
          <a href="${this.backLinkUrl}" class="story-detail-button">
            ${injuryLabel}
          </a>
        </div>
      </article>
    `;
  }

  setupEventListeners() {
    if (this.images.length <= 1) return;

    // Image navigation buttons
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.navigateImage(-1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.navigateImage(1));
    }

    // Thumbnail clicks
    const thumbnails = document.querySelectorAll('.story-detail-thumbnail');
    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', () => this.selectImage(index));
    });

    // Share buttons
    const facebookBtn = document.getElementById('share-facebook');
    const linkedinBtn = document.getElementById('share-linkedin');
    const copyBtn = document.getElementById('share-copy');

    if (facebookBtn) {
      facebookBtn.addEventListener('click', () => this.shareStory('facebook'));
    }

    if (linkedinBtn) {
      linkedinBtn.addEventListener('click', () => this.shareStory('linkedin'));
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyLink());
    }
  }

  navigateImage(direction) {
    const newIndex = this.selectedImageIndex + direction;

    if (newIndex >= 0 && newIndex < this.images.length) {
      this.selectImage(newIndex);
    }
  }

  selectImage(index) {
    if (index < 0 || index >= this.images.length) return;

    this.selectedImageIndex = index;

    // Update main image
    const mainImage = document.getElementById('main-story-image');
    if (mainImage) {
      mainImage.src = this.images[index];
    }

    // Update counter
    const counter = document.getElementById('current-image-number');
    if (counter) {
      counter.textContent = index + 1;
    }

    // Update navigation buttons
    const prevBtn = document.getElementById('prev-image-btn');
    const nextBtn = document.getElementById('next-image-btn');

    if (prevBtn) {
      prevBtn.disabled = index === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = index === this.images.length - 1;
    }

    // Update thumbnails
    const thumbnails = document.querySelectorAll('.story-detail-thumbnail');
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add('active');
      } else {
        thumb.classList.remove('active');
      }
    });
  }

  shareStory(platform) {
    const shareUrl = window.location.href;
    const shareText = this.story.victimName || this.story.title;

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      // Show feedback
      const copyBtn = document.getElementById('share-copy');
      if (copyBtn) {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        `;

        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link');
    }
  }
}

// Export to window for use in Liquid templates
if (typeof window !== 'undefined') {
  window.MemorialStoriesAPI = MemorialStoriesAPI;
  window.MemorialStoriesUtils = MemorialStoriesUtils;
  window.StoryWallManager = StoryWallManager;
  window.ImageUploadManager = ImageUploadManager;
  window.StoryDetailManager = StoryDetailManager;

  // Auto-initialize story wall if settings are present
  document.addEventListener('DOMContentLoaded', function() {
    if (window.MEMORIAL_SETTINGS && document.getElementById('stories-grid')) {
      new StoryWallManager(window.MEMORIAL_SETTINGS);
    }

    // Auto-initialize image upload if upload area is present
    if (document.getElementById('upload-area')) {
      window.imageUploadManager = new ImageUploadManager({
        maxImages: 10,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        apiBaseUrl: window.MEMORIAL_SETTINGS?.apiBaseUrl
      });
    }
  });
}
