/**
 * Memorial Stories - Shared JavaScript
 * Handles API calls, filtering, and interactions for all story blocks
 * Matching functionality from app/routes/stories._index/route.jsx
 */

class MemorialStoriesAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || 'https://stories-app.fly.dev';
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

      const response = await fetch(`${this.baseUrl}/api/stories?${params.toString()}`);

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
      const response = await fetch(`${this.baseUrl}/api/stories/${id}`);

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
      const response = await fetch(`${this.baseUrl}/api/submit`, {
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
    const hasImages = story.images && story.images.length > 0;
    const imageUrl = hasImages ? story.images[0] : 'https://stories-app.fly.dev/Avatar-default.png';

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

      // Show loading state
      if (submitButton) {
        submitButton.disabled = true;
        const submitText = submitButton.querySelector('.submit-text');
        const submitLoading = submitButton.querySelector('.submit-loading');
        if (submitText) submitText.style.display = 'none';
        if (submitLoading) submitLoading.style.display = 'inline';
      }

      if (errorDiv) errorDiv.style.display = 'none';

      // Prepare form data
      const formData = new FormData(form);

      // Submit story
      const result = await this.api.submitStory(formData);

      if (result.success) {
        // Show success message
        form.style.display = 'none';
        if (successDiv) successDiv.style.display = 'block';

        // Scroll to success message
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Show error
        if (errorDiv) {
          errorDiv.textContent = result.error || 'Submission failed. Please try again.';
          errorDiv.style.display = 'block';
        }

        // Reset button
        if (submitButton) {
          submitButton.disabled = false;
          const submitText = submitButton.querySelector('.submit-text');
          const submitLoading = submitButton.querySelector('.submit-loading');
          if (submitText) submitText.style.display = 'inline';
          if (submitLoading) submitLoading.style.display = 'none';
        }
      }
    });
  }
}

// Export to window for use in Liquid templates
if (typeof window !== 'undefined') {
  window.MemorialStoriesAPI = MemorialStoriesAPI;
  window.MemorialStoriesUtils = MemorialStoriesUtils;
  window.StoryWallManager = StoryWallManager;

  // Auto-initialize story wall if settings are present
  document.addEventListener('DOMContentLoaded', function() {
    if (window.MEMORIAL_SETTINGS && document.getElementById('stories-grid')) {
      new StoryWallManager(window.MEMORIAL_SETTINGS);
    }
  });
}
