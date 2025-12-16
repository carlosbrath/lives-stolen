import { useState, useMemo } from "react";
import { useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import prisma from "../../db.server";
import StorySubmissionForm from "../../components/StorySubmissionForm";
import { rateLimitSubmission } from "../../utils/rateLimit.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  try {
    // Check if this is an embed request
    const url = new URL(request.url);
    const embedMode = url.searchParams.get('embed');

    // Fetch published stories from database
    const submissions = await prisma.submission.findMany({
      where: {
        status: 'published',
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform database submissions to match the expected story format
    const stories = submissions.map((sub) => ({
      id: sub.id,
      title: sub.shortTitle,
      victimName: sub.victimName,
      category: sub.roadUserType,
      state: sub.state,
      date: sub.incidentDate,
      status: sub.status,
      age: sub.age,
      gender: sub.gender,
      injuryType: sub.injuryType,
      year: new Date(sub.incidentDate).getFullYear().toString(),
      images: sub.photoUrls ? JSON.parse(sub.photoUrls) : [],
      description: sub.victimStory,
      relation: sub.relation,
      submitterName: sub.submitterName,
    }));

    return { stories: stories.length > 0 ? stories : [], embedMode };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return { stories: [], embedMode: null };
  }
};

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    // Extract form data
    const submitterName = formData.get("submitterName");
    const submitterEmail = formData.get("submitterEmail");

    // Rate limiting: Check both IP and email
    if (submitterEmail) {
      const rateLimitResponse = rateLimitSubmission(request, submitterEmail);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }
    const victimName = formData.get("victimName");
    const relation = formData.get("relation");
    const incidentDate = formData.get("incidentDate");
    const state = formData.get("state");
    const roadUserType = formData.get("roadUserType");
    const injuryType = formData.get("injuryType");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const victimStory = formData.get("victimStory");

    // Validate required fields
    const errors = {};
    if (!submitterName) errors.submitterName = "Submitter name is required";
    if (!submitterEmail) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!victimStory) errors.victimStory = "Victim's story is required";

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400 });
    }

    // Prepare submission data with proper type conversion
    const parsedAge = age && age.trim() !== "" ? parseInt(age, 10) : null;

    // Parse photo URLs from form data
    const photoUrlsRaw = formData.get("photoUrls");
    let photoUrlsArray = [];
    try {
      if (photoUrlsRaw) {
        photoUrlsArray = JSON.parse(photoUrlsRaw);
      }
    } catch (error) {
      console.error("Error parsing photo URLs:", error);
      photoUrlsArray = [];
    }

    // Save to database (public submissions don't require authentication)
    try {
      const submission = await prisma.submission.create({
        data: {
          shop: "public",
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          victimName: victimName && victimName.trim() !== "" ? victimName.trim() : null,
          relation: relation && relation.trim() !== "" ? relation.trim() : null,
          incidentDate: incidentDate.trim(),
          state: state.trim(),
          roadUserType: roadUserType.trim(),
          injuryType: injuryType.trim(),
          age: parsedAge && !isNaN(parsedAge) ? parsedAge : null,
          gender: gender && gender.trim() !== "" ? gender.trim() : null,
          shortTitle: victimName && victimName.trim() !== "" ? victimName.trim() : `Story from ${state}`,
          victimStory: victimStory.trim(),
          photoUrls: JSON.stringify(photoUrlsArray),
          status: "pending", // Pending admin review
        },
      });

      console.log("✅ Story saved to database:", submission.id);

      return json(
        {
          success: true,
          message: "Your submission has been received. Thank you for sharing this story.",
          submissionId: submission.id,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("❌ Database error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });

      return json(
        {
          error: `Submission error: ${error.message}. Please try again or contact support.`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Form submission error:", error);
    console.error("Error stack:", error.stack);

    return json(
      {
        error: `Submission error: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

export const meta = () => [
  { title: "Lives Stolen | Fatal Collisions" },
  {
    name: "description",
    content: "Remembering lives lost in traffic collisions",
  },
];

function MemorialCard({ story }) {
  const hasImages = story.images && story.images.length > 0;
  return (
    <Link to={`/stories/${story.id}`} className={styles.memorialCard}>
      <div className={styles.silhouetteContainer}>
        {hasImages ? (
          
          <img
            src={story.images[0]}
            alt={story.victimName || story.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <img
            src="/Avatar-default.png"
            alt="Default avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}
      </div>
      <div className={styles.memorialInfo}>
        <div className={styles.memorialDetails}>
          Name: {story.victimName || story.title}
        </div>
        <div className={styles.memorialDetails}>
          Age: {story.age || 'N/A'}
        </div>
        
        <div className={styles.memorialDetails}>
          Type: {story.category}
        </div>
        <div className={styles.memorialDetails}>
          Location: {story.state}
        </div>
      </div>
    </Link>
  );
}

function FilterPanel({ filters, onFilterChange, onClearFilters }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const roadUserTypes = ["Cyclist", "Pedestrian", "Motorcyclist"];
  const ageRanges = ["0-17", "18-30", "31-45", "46-60", "60+"];
  const genders = ["Male", "Female", "Other"];
  const injuryTypes = ["Fatal", "Non-fatal"];
  const states = ["California", "New York", "Texas", "Washington", "Florida", "Colorado"];
  const years = ["2025","2024", "2023", "2022", "2021", "2020"];

  const hasActiveFilters =
    filters.roadUserType.length > 0 ||
    filters.ageRange.length > 0 ||
    filters.gender.length > 0 ||
    filters.injuryType ||
    filters.state.length > 0 ||
    filters.year.length > 0;

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest(`.${styles.filterContainer}`)) {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className={styles.filterContainer}>
      {/* Filter Toggle Button */}
      <button
        className={styles.filterToggleButton}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M7 12h10M10 18h4" />
        </svg>
        Filter
      </button>

      {/* Filter Dropdown */}
      {isDropdownOpen && (
        <>
          <div className={styles.filterDropdown}>
            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.roadUserType ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('roadUserType')}
              >
                <span>Road-user type</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.roadUserType ? styles.filterOptionsExpanded : ''}`}>
                {roadUserTypes.map((type) => (
                  <label key={type} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.roadUserType.includes(type)}
                      onChange={(e) =>
                        onFilterChange("roadUserType", type, e.target.checked)
                      }
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.ageRange ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('ageRange')}
              >
                <span>Age range</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.ageRange ? styles.filterOptionsExpanded : ''}`}>
                {ageRanges.map((range) => (
                  <label key={range} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.ageRange.includes(range)}
                      onChange={(e) =>
                        onFilterChange("ageRange", range, e.target.checked)
                      }
                    />
                    <span>{range}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.gender ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('gender')}
              >
                <span>Gender</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.gender ? styles.filterOptionsExpanded : ''}`}>
                {genders.map((gender) => (
                  <label key={gender} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.gender.includes(gender)}
                      onChange={(e) =>
                        onFilterChange("gender", gender, e.target.checked)
                      }
                    />
                    <span>{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.injuryType ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('injuryType')}
              >
                <span>Injury type</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.injuryType ? styles.filterOptionsExpanded : ''}`}>
                {injuryTypes.map((type) => (
                  <label key={type} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.injuryType === type}
                      onChange={(e) =>
                        onFilterChange("injuryType", e.target.checked ? type : null, e.target.checked)
                      }
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.state ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('state')}
              >
                <span>State</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.state ? styles.filterOptionsExpanded : ''}`}>
                {states.map((state) => (
                  <label key={state} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.state.includes(state)}
                      onChange={(e) =>
                        onFilterChange("state", state, e.target.checked)
                      }
                    />
                    <span>{state}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <button
                className={`${styles.filterButton} ${expandedGroups.year ? styles.filterButtonExpanded : ''}`}
                onClick={() => toggleGroup('year')}
              >
                <span>Year</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className={`${styles.filterOptions} ${expandedGroups.year ? styles.filterOptionsExpanded : ''}`}>
                {years.map((year) => (
                  <label key={year} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={filters.year.includes(year)}
                      onChange={(e) =>
                        onFilterChange("year", year, e.target.checked)
                      }
                    />
                    <span>{year}</span>
                  </label>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button className={styles.clearFiltersButton} onClick={onClearFilters}>
                Clear all filters
              </button>
            )}
          </div>

          <div
            className={styles.filterOverlay}
            onClick={() => setIsDropdownOpen(false)}
            style={{ display: 'block', position: 'fixed', inset: 0, zIndex: 50 }}
          />
        </>
      )}
    </div>
  );
}

export default function StoriesPage() {
  const { stories, embedMode } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [filters, setFilters] = useState({
    roadUserType: [], // Array for multiple selections
    ageRange: [], // Array for multiple selections
    gender: [], // Array for multiple selections
    injuryType: "Fatal", // Default to showing Fatal stories (Lives Stolen) - keep as single value
    state: [], // Array for multiple selections
    year: [], // Array for multiple selections
  });
  const [displayCount, setDisplayCount] = useState(12);

  const ITEMS_PER_PAGE = 12;

  // Calculate counts for Lives Stolen and Lives Shattered
  const livesStolen = useMemo(() => {
    return stories.filter(story => story.injuryType === "Fatal").length;
  }, [stories]);

  const livesShattered = useMemo(() => {
    return stories.filter(story => story.injuryType === "Non-fatal").length;
  }, [stories]);

  // Filter logic
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Road User Type - check if story's category is in the selected array
      if (filters.roadUserType.length > 0 && !filters.roadUserType.includes(story.category)) {
        return false;
      }

      // Age Range - check if story's age falls within any selected range
      if (filters.ageRange.length > 0) {
        const ageMatches = filters.ageRange.some((range) => {
          const [min, max] = range.includes("+")
            ? [parseInt(range), Infinity]
            : range.split("-").map(Number);
          return story.age >= min && story.age <= max;
        });
        if (!ageMatches) {
          return false;
        }
      }

      // Gender - check if story's gender is in the selected array
      if (filters.gender.length > 0 && !filters.gender.includes(story.gender)) {
        return false;
      }

      // Injury Type - keep as single value for the main filter buttons
      if (filters.injuryType && story.injuryType !== filters.injuryType) {
        return false;
      }

      // State - check if story's state is in the selected array
      if (filters.state.length > 0 && !filters.state.includes(story.state)) {
        return false;
      }

      // Year - check if story's year is in the selected array
      if (filters.year.length > 0 && !filters.year.includes(story.year)) {
        return false;
      }

      return true;
    });
  }, [stories, filters]);

  const displayedStories = filteredStories.slice(0, displayCount);
  const hasMoreStories = displayCount < filteredStories.length;

  const handleFilterChange = (filterName, value, isChecked) => {
    // Handle injuryType separately as it's a single value, not an array
    if (filterName === "injuryType") {
      setFilters((prev) => ({
        ...prev,
        [filterName]: value,
      }));
    } else {
      // For array-based filters
      setFilters((prev) => {
        const currentValues = prev[filterName];
        let newValues;

        if (isChecked) {
          // Add value to array if not already present
          newValues = currentValues.includes(value) ? currentValues : [...currentValues, value];
        } else {
          // Remove value from array
          newValues = currentValues.filter((v) => v !== value);
        }

        return {
          ...prev,
          [filterName]: newValues,
        };
      });
    }
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleClearFilters = () => {
    setFilters({
      roadUserType: [],
      ageRange: [],
      gender: [],
      injuryType: null,
      state: [],
      year: [],
    });
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Show success message if form was submitted successfully
  if (actionData?.success) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className={styles.successTitle}>Thank You!</h2>
            <p className={styles.successMessage}>
              {actionData?.message || "Your submission has been received. We appreciate you sharing this story."}
            </p>
            <Link to="/stories" className={styles.successButton}>
              Return to Memorial Wall
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Embed mode: Show only the form
  if (embedMode === 'form') {
    return (
      <div className={styles.pageContainer} style={{ background: '#000000', minHeight: 'auto', padding: '40px 20px' }}>
        <StorySubmissionForm
          isSubmitting={isSubmitting}
          actionData={actionData}
        />
      </div>
    );
  }

  // Embed mode: Show only the memorial wall (without form)
  if (embedMode === 'wall') {
    return (
      <div className={styles.pageContainer} style={{ minHeight: 'auto' }}>
        {/* Memorial Wall Header */}
        <header className={styles.memorialWallHeader}>
          <h1 className={styles.memorialWallTitle}>Memorial Wall</h1>
          <p className={styles.memorialWallDescription}>
            Road violence doesn't just take lives, it shatters the lives of survivors and families. Together, these walls show the full impact.
          </p>

          {/* Stats and Filter Buttons */}
          <div className={styles.statsContainer}>
            <div className={styles.statBox}>
              <h3 className={styles.statLabel}>Lives Stolen: {livesStolen}</h3>
              <button
                className={`${styles.headingButtons} ${filters.injuryType === "Fatal" ? styles.headingButtonsActive : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, injuryType: "Fatal" }));
                  setDisplayCount(ITEMS_PER_PAGE);
                }}
              >
                See Lives Stolen
              </button>
            </div>

            <div className={styles.statBox}>
              <h3 className={styles.statLabel}>Lives Shattered: {livesShattered}</h3>
              <button
                className={`${styles.headingButtons} ${filters.injuryType === "Non-fatal" ? styles.headingButtonsActive : ''}`}
                onClick={() => {
                  setFilters(prev => ({ ...prev, injuryType: "Non-fatal" }));
                  setDisplayCount(ITEMS_PER_PAGE);
                }}
              >
                See Lives Shattered
              </button>
            </div>
          </div>
        </header>

        {/* Section Title and Additional Filters */}
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {filters.injuryType === "Fatal" ? "Lives Stolen" : "Lives Shattered"}
          </h2>
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.memorialsSection}>
            {filteredStories.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No memorials found matching your filters.</p>
              </div>
            ) : (
              <>
                <div className={styles.memorialsGrid}>
                  {displayedStories.map((story) => (
                    <MemorialCard key={story.id} story={story} />
                  ))}
                </div>

                {hasMoreStories && (
                  <div className={styles.loadMoreContainer}>
                    <button className={styles.loadMoreButton} onClick={handleLoadMore}>
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full page mode: Show everything
  return (
    <div className={styles.pageContainer}>
      {/* Memorial Wall Header */}
      <header className={styles.memorialWallHeader}>
        <h1 className={styles.memorialWallTitle}>Memorial Wall</h1>
        <p className={styles.memorialWallDescription}>
          Road violence doesn't just take lives, it shatters the lives of survivors and families. Together, these walls show the full impact.
        </p>

        {/* Stats and Filter Buttons */}
        <div className={styles.statsContainer}>
          <div className={styles.statBox}>
            <h3 className={styles.statLabel}>Lives Stolen: {livesStolen}</h3>
            <button
              className={`${styles.headingButtons} ${filters.injuryType === "Fatal" ? styles.headingButtonsActive : ''}`}
              onClick={() => {
                setFilters(prev => ({ ...prev, injuryType: "Fatal" }));
                setDisplayCount(ITEMS_PER_PAGE);
              }}
            >
              See Lives Stolen
            </button>
          </div>

          <div className={styles.statBox}>
            <h3 className={styles.statLabel}>Lives Shattered: {livesShattered}</h3>
            <button
              className={`${styles.headingButtons} ${filters.injuryType === "Non-fatal" ? styles.headingButtonsActive : ''}`}
              onClick={() => {
                setFilters(prev => ({ ...prev, injuryType: "Non-fatal" }));
                setDisplayCount(ITEMS_PER_PAGE);
              }}
            >
              See Lives Shattered
            </button>
          </div>
        </div>
      </header>

      {/* Section Title and Additional Filters */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {filters.injuryType === "Fatal" ? "Lives Stolen" : "Lives Shattered"}
        </h2>
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.memorialsSection}>
          {filteredStories.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No memorials found matching your filters.</p>
            </div>
          ) : (
            <>
              <div className={styles.memorialsGrid}>
                {displayedStories.map((story) => (
                  <MemorialCard key={story.id} story={story} />
                ))}
              </div>

              {hasMoreStories && (
                <div className={styles.loadMoreContainer}>
                  <button className={styles.loadMoreButton} onClick={handleLoadMore}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submit Story Form Section */}
      <section className={styles.formSectionWrapper} id="submit-story">
        <div className={styles.formSectionHeader}>
          <h2 className={styles.formSectionTitle}>Lost someone you love to traffic violence?</h2>
          <p className={styles.formSectionSubtitle}>Honor their memory. Share their story.</p>
        </div>
        <StorySubmissionForm
          isSubmitting={isSubmitting}
          actionData={actionData}
        />
      </section>
    </div>
  );
}