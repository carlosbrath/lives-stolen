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
   * Extract URL from image data (handles both string URLs and object format)
   * Object format: { originalUrl: "url", currentUrl: "edited_url", order: 0 }
   */
  getImageUrl(image) {
    if (!image) return '';
    if (typeof image === 'string') {
      return image;
    }
    // Handle object format from admin image updates
    return image.currentUrl || image.originalUrl || '';
  },

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
    const imageUrl = hasImages ? MemorialStoriesUtils.getImageUrl(images[0]) : `${apiBaseUrl}/Avatar-default.png`;

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

  /**
   * Convert numeric age to age range display
   */
  getAgeRangeDisplay(age) {
    if (!age) return 'N/A';

    if (age <= 17) return '0-17';
    if (age >= 18 && age <= 30) return '18-30';
    if (age >= 31 && age <= 45) return '31-45';
    if (age >= 46 && age <= 60) return '46-60';
    if (age > 60) return '60+';

    return age; // Fallback to numeric age
  },
};

/**
 * Story Wall Manager - 3 Section Version
 * Handles 3 independent sections: Lives Stolen, Lives Shattered, Lives Forever Changed
 * Each section has its own filters, grid, and "See all" button
 */
class StoryWallManager {
  constructor(config = {}) {
    this.api = new MemorialStoriesAPI(config.apiBaseUrl || 'https://stories-app.fly.dev');
    this.allStories = [];

    // Get responsive display count (3 for mobile, 6 for desktop)
    this.getDisplayCount = () => {
      return window.innerWidth <= 768 ? 3 : 6;
    };

    // Configuration for 3 sections
    this.sections = {
      'Fatal': {
        injuryType: 'Fatal',
        gridId: 'lives-stolen-grid',
        filterId: 'lives-stolen-filter',
        seeAllId: 'lives-stolen-see-all',
        get displayCount() { return window.innerWidth <= 768 ? 3 : 6; },
        showAll: false,
        filters: {
          roadUserType: [],
          ageRange: [],
          gender: [],
          state: [],
          year: []
        },
        expandedGroups: {}
      },
      'Non-fatal': {
        injuryType: 'Non-fatal',
        gridId: 'lives-shattered-grid',
        filterId: 'lives-shattered-filter',
        seeAllId: 'lives-shattered-see-all',
        get displayCount() { return window.innerWidth <= 768 ? 3 : 6; },
        showAll: false,
        filters: {
          roadUserType: [],
          ageRange: [],
          gender: [],
          state: [],
          year: []
        },
        expandedGroups: {}
      },
      'Not-hit': {
        injuryType: 'Not-hit',
        gridId: 'lives-changed-grid',
        filterId: 'lives-changed-filter',
        seeAllId: 'lives-changed-see-all',
        get displayCount() { return window.innerWidth <= 768 ? 3 : 6; },
        showAll: false,
        filters: {
          roadUserType: [],
          ageRange: [],
          gender: [],
          state: [],
          year: []
        },
        expandedGroups: {}
      }
    };

    this.init();
  }

  async init() {
    await this.loadStories();
    this.setupEventListeners();
    this.renderAllSections();

    // Re-render on resize to update display count
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.renderAllSections();
      }, 250);
    });
  }

  async loadStories() {
    try {
      const data = await this.api.fetchStories();
      this.allStories = data.stories || [];
      this.updateStats();
    } catch (error) {
      console.error('Error loading stories:', error);
      this.allStories = [];
    }
  }

  updateStats() {
    const livesStolen = this.allStories.filter(s => s.injuryType === "Fatal").length;
    const livesShattered = this.allStories.filter(s => s.injuryType === "Non-fatal").length;
    const livesChanged = this.allStories.filter(s => s.injuryType === "Not-hit").length;

    const stolenCountEl = document.getElementById('lives-stolen-count');
    const shatteredCountEl = document.getElementById('lives-shattered-count');
    const changedCountEl = document.getElementById('lives-changed-count');

    if (stolenCountEl) stolenCountEl.textContent = livesStolen;
    if (shatteredCountEl) shatteredCountEl.textContent = livesShattered;
    if (changedCountEl) changedCountEl.textContent = livesChanged;
  }

  setupEventListeners() {
    // Setup for each section
    Object.keys(this.sections).forEach(injuryType => {
      const section = this.sections[injuryType];

      // Filter toggle
      const filterToggle = document.getElementById(`${section.filterId}-toggle`);
      const filterDropdown = document.getElementById(section.filterId);
      const filterOverlay = document.getElementById(`${section.filterId}-overlay`);

      if (filterToggle && filterDropdown && filterOverlay) {
        filterToggle.addEventListener('click', () => {
          const isOpen = filterDropdown.style.display === 'block';
          filterDropdown.style.display = isOpen ? 'none' : 'block';
          filterOverlay.style.display = isOpen ? 'none' : 'block';
        });

        filterOverlay.addEventListener('click', () => {
          filterDropdown.style.display = 'none';
          filterOverlay.style.display = 'none';
        });
      }

      // Filter group expansion buttons
      const filterButtons = filterDropdown?.querySelectorAll('.memorial-filter-button');
      filterButtons?.forEach(button => {
        button.addEventListener('click', () => {
          const groupName = button.dataset.filterGroup;
          this.toggleFilterGroup(injuryType, groupName, button);
        });
      });

      // Filter checkboxes (only for this section)
      const filterCheckboxes = filterDropdown?.querySelectorAll(`.memorial-filter-option input[type="checkbox"][data-section="${injuryType}"]`);
      filterCheckboxes?.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          this.handleFilterChange(injuryType, e.target.name, e.target.value, e.target.checked);
        });
      });

      // Clear filters button
      const clearButton = document.getElementById(`${section.filterId}-clear`);
      if (clearButton) {
        clearButton.addEventListener('click', () => this.clearFilters(injuryType));
      }

      // See all button
      const seeAllButton = document.getElementById(section.seeAllId);
      if (seeAllButton) {
        seeAllButton.addEventListener('click', () => this.toggleSeeAll(injuryType));
      }
    });

    // Form submission
    this.setupFormSubmission();
  }

  toggleFilterGroup(injuryType, groupName, button) {
    const section = this.sections[injuryType];
    section.expandedGroups[groupName] = !section.expandedGroups[groupName];
    const options = button.nextElementSibling;

    if (section.expandedGroups[groupName]) {
      button.classList.add('memorial-filter-button-expanded');
      options.classList.add('memorial-filter-options-expanded');
    } else {
      button.classList.remove('memorial-filter-button-expanded');
      options.classList.remove('memorial-filter-options-expanded');
    }
  }

  handleFilterChange(injuryType, filterName, value, isChecked) {
    const section = this.sections[injuryType];
    const currentValues = section.filters[filterName];

    if (isChecked) {
      if (!currentValues.includes(value)) {
        section.filters[filterName] = [...currentValues, value];
      }
    } else {
      section.filters[filterName] = currentValues.filter(v => v !== value);
    }

    this.renderSection(injuryType);
    this.updateClearFiltersButton(injuryType);
  }

  clearFilters(injuryType) {
    const section = this.sections[injuryType];

    // Reset all filters
    section.filters = {
      roadUserType: [],
      ageRange: [],
      gender: [],
      state: [],
      year: []
    };

    // Uncheck all checkboxes for this section
    const filterDropdown = document.getElementById(section.filterId);
    const checkboxes = filterDropdown?.querySelectorAll(`input[type="checkbox"][data-section="${injuryType}"]`);
    checkboxes?.forEach(checkbox => {
      checkbox.checked = false;
    });

    this.renderSection(injuryType);
    this.updateClearFiltersButton(injuryType);
  }

  updateClearFiltersButton(injuryType) {
    const section = this.sections[injuryType];
    const hasActiveFilters =
      section.filters.roadUserType.length > 0 ||
      section.filters.ageRange.length > 0 ||
      section.filters.gender.length > 0 ||
      section.filters.state.length > 0 ||
      section.filters.year.length > 0;

    const clearButton = document.getElementById(`${section.filterId}-clear`);
    if (clearButton) {
      clearButton.style.display = hasActiveFilters ? 'block' : 'none';
    }
  }

  toggleSeeAll(injuryType) {
    const section = this.sections[injuryType];
    section.showAll = !section.showAll;

    const button = document.getElementById(section.seeAllId);
    if (button) {
      button.textContent = section.showAll ? 'See less' : 'See all';
    }

    this.renderSection(injuryType);
  }

  getFilteredStories(injuryType) {
    const section = this.sections[injuryType];

    return this.allStories.filter(story => {
      // Injury Type (section filter)
      if (story.injuryType !== injuryType) {
        return false;
      }

      // Road User Type
      if (section.filters.roadUserType.length > 0 && !section.filters.roadUserType.includes(story.category)) {
        return false;
      }

      // Age Range
      if (section.filters.ageRange.length > 0 && !MemorialStoriesUtils.matchesAgeRange(story, section.filters.ageRange)) {
        return false;
      }

      // Gender
      if (section.filters.gender.length > 0 && !section.filters.gender.includes(story.gender)) {
        return false;
      }

      // State
      if (section.filters.state.length > 0 && !section.filters.state.includes(story.state)) {
        return false;
      }

      // Year
      if (section.filters.year.length > 0 && !section.filters.year.includes(story.year)) {
        return false;
      }

      return true;
    });
  }

  renderSection(injuryType) {
    const section = this.sections[injuryType];
    const grid = document.getElementById(section.gridId);
    const emptyState = document.getElementById(`${section.gridId}-empty`);
    const seeAllContainer = document.getElementById(`${section.seeAllId}-container`);

    if (!grid) return;

    const filteredStories = this.getFilteredStories(injuryType);
    const displayedStories = section.showAll ? filteredStories : filteredStories.slice(0, section.displayCount);
    const hasMore = filteredStories.length > section.displayCount;

    if (filteredStories.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (seeAllContainer) seeAllContainer.style.display = 'none';
    } else {
      if (emptyState) emptyState.style.display = 'none';

      // Render story cards
      grid.innerHTML = displayedStories.map(story =>
        MemorialStoriesUtils.createStoryCard(story, '/pages/story-detail')
      ).join('');

      // Show/hide see all button
      if (seeAllContainer) {
        seeAllContainer.style.display = hasMore || section.showAll ? 'flex' : 'none';
      }
    }
  }

  renderAllSections() {
    Object.keys(this.sections).forEach(injuryType => {
      this.renderSection(injuryType);
    });
  }

  setupFormSubmission() {
    const form = document.getElementById('memorial-submission-form');
    if (!form) return;

    const submitButton = document.getElementById('submit-button');
    const errorDiv = document.getElementById('form-error');
    const successDiv = document.getElementById('memorial-form-success');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitText = submitButton ? submitButton.querySelector('.submit-text') : null;
      const submitLoading = submitButton ? submitButton.querySelector('.submit-loading') : null;

      if (errorDiv) errorDiv.style.display = 'none';
      if (window.imageUploadManager) window.imageUploadManager.clearError();

      if (submitButton) {
        submitButton.disabled = true;
        if (submitText) submitText.style.display = 'none';
        if (submitLoading) submitLoading.style.display = 'inline';
      }

      try {
        let photoUrls = [];

        if (window.imageUploadManager && window.imageUploadManager.selectedFiles.length > 0) {
          if (submitLoading) submitLoading.textContent = 'Uploading images...';

          try {
            photoUrls = await window.imageUploadManager.uploadFiles();
          } catch (uploadError) {
            const errorMessage = uploadError.message || 'Failed to upload images. Please try again.';
            if (window.imageUploadManager) {
              window.imageUploadManager.showError(errorMessage);
            }
            if (errorDiv) {
              errorDiv.textContent = `Image upload failed: ${errorMessage}`;
              errorDiv.style.display = 'block';
            }

            if (submitButton) {
              submitButton.disabled = false;
              if (submitText) submitText.style.display = 'inline';
              if (submitLoading) {
                submitLoading.style.display = 'none';
                submitLoading.textContent = 'Submitting...';
              }
            }

            return;
          }
        }

        if (submitLoading) submitLoading.textContent = 'Submitting story...';

        const formData = new FormData(form);
        formData.set('photoUrls', JSON.stringify(photoUrls));
        formData.set('shop', window.MEMORIAL_SETTINGS?.shop || 'public');

        const result = await this.api.submitStory(formData, []);

        if (result.success) {
          form.style.display = 'none';
          if (successDiv) successDiv.style.display = 'flex';

          if (window.imageUploadManager) {
            window.imageUploadManager.reset();
          }

          if (successDiv) {
            successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

        } else {
          throw new Error(result.error || 'Submission failed');
        }

      } catch (error) {
        if (errorDiv) {
          errorDiv.textContent = error.message || 'Submission failed. Please try again.';
          errorDiv.style.display = 'block';
        }

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
      console.log('[DEBUG CLIENT] Uploading to shop:', shop);
      console.log('[DEBUG CLIENT] MEMORIAL_SETTINGS:', window.MEMORIAL_SETTINGS);
      uploadFormData.append('shop', shop);

      // Add all files
      this.selectedFiles.forEach(item => {
        uploadFormData.append('files', item.file);
      });

      const response = await fetch(`${this.apiBaseUrl}api/upload`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Image upload failed');
      }

      this.uploadedUrls = result.urls;

      this.isUploading = false;
      return this.uploadedUrls;

    } catch (error) {
      this.isUploading = false;
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

    // Extract URLs from images (handles both string URLs and object format)
    const imageUrls = images
      .map(img => MemorialStoriesUtils.getImageUrl(img))
      .filter(url => url && url.length > 0);

    this.images = imageUrls.length > 0 ? imageUrls : [`${this.apiBaseUrl}/Avatar-default.png`];
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
    const injuryLabel = this.story.injuryType === 'Fatal' ? 'Lives Stolen' :
                        this.story.injuryType === 'Non-fatal' ? 'Lives Shattered' :
                        'Lives Forever Changed';
    const actionLabel = this.story.injuryType === 'Fatal' ? 'Killed' : 'Injured';

    this.container.innerHTML = `
      <div class="story-detail-wrapper">
        <!-- Top Title -->
        <div class="story-detail-top-title">
          <h1 class="story-detail-injury-title">${injuryLabel}</h1>
        </div>

        <!-- Header with Back Button -->
        <header class="story-detail-header">
          <a href="${this.getBackUrl()}" class="story-detail-back-button" aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <h2 class="story-detail-victim-name">${this.story.victimName || this.story.title}</h2>
        </header>

        <!-- Main Content: Two-column layout -->
        <div class="story-detail-main-content">
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
      <div class="story-detail-info-list">
        ${this.story.state ? `
          <div class="story-detail-info-item">
            <span class="story-detail-info-label">Location: </span>
            <span class="story-detail-info-value">${this.story.state}</span>
          </div>
        ` : ''}

        <div class="story-detail-info-item">
          <span class="story-detail-info-label">Age: </span>
          <span class="story-detail-info-value">${this.story.age || 'N/A'}</span>
        </div>

        ${this.story.date ? `
          <div class="story-detail-info-item">
            <span class="story-detail-info-label">Date: </span>
            <span class="story-detail-info-value">${actionLabel} ${formattedDate}</span>
          </div>
        ` : ''}

        ${this.story.category ? `
          <div class="story-detail-info-item">
            <span class="story-detail-info-label">Road User Type: </span>
            <span class="story-detail-info-value">${this.story.category}</span>
          </div>
        ` : ''}
      </div>

      <!-- Share Buttons -->
      <div class="story-detail-share-buttons">
        <button class="story-detail-share-button" id="share-facebook" aria-label="Share on Facebook">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button class="story-detail-share-button" id="share-instagram" aria-label="Share on Instagram">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
          </svg>
        </button>

        <button class="story-detail-share-button" id="share-linkedin" aria-label="Share on LinkedIn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="2" y="9" width="4" height="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>

        <button class="story-detail-share-button" id="share-copy" aria-label="Copy link">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
          <a href="${this.getBackUrl()}" class="story-detail-lives-button">
            ${injuryLabel}
          </a>
        </div>
      </article>
    `;
  }

  getBackUrl() {
    // Try to use document.referrer if it's from the same origin
    if (document.referrer && document.referrer.includes(window.location.origin)) {
      return document.referrer;
    }
    // Fall back to configured back link URL
    return this.backLinkUrl;
  }

  setupEventListeners() {
    // Image navigation buttons (only if multiple images)
    if (this.images.length > 1) {
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
    }

    // Share buttons (always available)
    const facebookBtn = document.getElementById('share-facebook');
    const instagramBtn = document.getElementById('share-instagram');
    const linkedinBtn = document.getElementById('share-linkedin');
    const copyBtn = document.getElementById('share-copy');

    if (facebookBtn) {
      facebookBtn.addEventListener('click', () => this.shareStory('facebook'));
    }

    if (instagramBtn) {
      instagramBtn.addEventListener('click', () => this.shareStory('instagram'));
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

    // Instagram doesn't support direct URL sharing, copy link and open Instagram
    if (platform === 'instagram') {
      this.copyLink().then(() => {
        // Open Instagram app or website
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.open('instagram://app', '_blank');
        } else {
          window.open('https://www.instagram.com/', '_blank');
        }
      });
      return;
    }

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

/**
 * Searchable Select Manager (Select2-like dropdown)
 * Handles searchable dropdown with keyboard navigation
 */
class SearchableSelectManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.hiddenInput = this.container.querySelector('input[type="hidden"]');
    this.trigger = this.container.querySelector('.memorial-searchable-select-trigger');
    this.valueDisplay = this.container.querySelector('.memorial-searchable-select-value');
    this.dropdown = this.container.querySelector('.memorial-searchable-select-dropdown');
    this.searchInput = this.container.querySelector('.memorial-searchable-select-input');
    this.optionsList = this.container.querySelector('.memorial-searchable-select-options');
    this.options = this.container.querySelectorAll('.memorial-searchable-select-option');

    this.isOpen = false;
    this.highlightedIndex = -1;
    this.filteredOptions = Array.from(this.options);

    this.init();
  }

  init() {
    if (!this.container) return;

    // Set initial placeholder state
    this.valueDisplay.classList.add('placeholder');

    // Trigger click
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.filterOptions(e.target.value);
    });

    // Prevent closing when clicking inside dropdown
    this.dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Option selection
    this.options.forEach((option, index) => {
      option.addEventListener('click', () => {
        this.selectOption(option);
      });

      option.addEventListener('mouseenter', () => {
        this.highlightOption(index);
      });
    });

    // Keyboard navigation
    this.searchInput.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.dropdown.style.display = 'flex';
    this.trigger.classList.add('open');
    this.searchInput.value = '';
    this.filterOptions('');
    this.searchInput.focus();
    this.highlightedIndex = -1;
  }

  close() {
    this.isOpen = false;
    this.dropdown.style.display = 'none';
    this.trigger.classList.remove('open');
    this.highlightedIndex = -1;
    this.clearHighlight();
  }

  filterOptions(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    let visibleCount = 0;

    this.options.forEach((option) => {
      const text = option.textContent.toLowerCase();
      const matches = term === '' || text.includes(term);

      if (matches) {
        option.classList.remove('hidden');
        visibleCount++;
      } else {
        option.classList.add('hidden');
      }
    });

    // Update filtered options list
    this.filteredOptions = Array.from(this.options).filter(
      opt => !opt.classList.contains('hidden')
    );

    // Show/hide no results message
    let noResults = this.optionsList.querySelector('.memorial-searchable-select-no-results');

    if (visibleCount === 0) {
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'memorial-searchable-select-no-results';
        noResults.textContent = 'No states found';
        this.optionsList.appendChild(noResults);
      }
      noResults.style.display = 'block';
    } else if (noResults) {
      noResults.style.display = 'none';
    }

    // Reset highlight
    this.highlightedIndex = -1;
    this.clearHighlight();
  }

  selectOption(option) {
    const value = option.dataset.value;
    const text = option.textContent;

    // Update hidden input
    this.hiddenInput.value = value;

    // Update display
    this.valueDisplay.textContent = text;
    this.valueDisplay.classList.remove('placeholder');

    // Update selected state
    this.options.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');

    // Trigger change event on hidden input
    const event = new Event('change', { bubbles: true });
    this.hiddenInput.dispatchEvent(event);

    this.close();
  }

  highlightOption(index) {
    this.clearHighlight();

    if (index >= 0 && index < this.filteredOptions.length) {
      this.highlightedIndex = index;
      this.filteredOptions[index].classList.add('highlighted');
      this.filteredOptions[index].scrollIntoView({ block: 'nearest' });
    }
  }

  clearHighlight() {
    this.options.forEach(opt => opt.classList.remove('highlighted'));
  }

  handleKeydown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (this.highlightedIndex < this.filteredOptions.length - 1) {
          this.highlightOption(this.highlightedIndex + 1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.highlightedIndex > 0) {
          this.highlightOption(this.highlightedIndex - 1);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredOptions.length) {
          this.selectOption(this.filteredOptions[this.highlightedIndex]);
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  // Get current value
  getValue() {
    return this.hiddenInput.value;
  }

  // Set value programmatically
  setValue(value) {
    const option = Array.from(this.options).find(opt => opt.dataset.value === value);
    if (option) {
      this.selectOption(option);
    }
  }

  // Reset to initial state
  reset() {
    this.hiddenInput.value = '';
    this.valueDisplay.textContent = 'Select a state...';
    this.valueDisplay.classList.add('placeholder');
    this.options.forEach(opt => opt.classList.remove('selected'));
  }
}

// Export to window for use in Liquid templates
if (typeof window !== 'undefined') {
  window.MemorialStoriesAPI = MemorialStoriesAPI;
  window.MemorialStoriesUtils = MemorialStoriesUtils;
  window.StoryWallManager = StoryWallManager;
  window.ImageUploadManager = ImageUploadManager;
  window.StoryDetailManager = StoryDetailManager;
  window.SearchableSelectManager = SearchableSelectManager;

  // Auto-initialize story wall if settings are present
  document.addEventListener('DOMContentLoaded', function() {
    if (window.MEMORIAL_SETTINGS && document.getElementById('lives-stolen-grid')) {
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

    // Auto-initialize searchable select for state field
    if (document.getElementById('state-select-container')) {
      window.stateSelectManager = new SearchableSelectManager('state-select-container');
    }
  });
}
