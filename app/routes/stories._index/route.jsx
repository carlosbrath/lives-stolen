import { useState, useMemo } from "react";
import { useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import prisma from "../../db.server";
import StorySubmissionForm from "../../components/StorySubmissionForm";
import { rateLimitSubmission } from "../../utils/rateLimit.server";
import styles from "./styles.module.css";

export const loader = async () => {
  try {
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

    return { stories: stories.length > 0 ? stories : [] };
  } catch (error) {
    console.error("Error fetching stories:", error);
    return { stories: [] };
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
    const shortTitle = formData.get("shortTitle");
    const victimStory = formData.get("victimStory");

    // Validate required fields
    const errors = {};
    if (!submitterName) errors.submitterName = "Submitter name is required";
    if (!submitterEmail) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!shortTitle) errors.shortTitle = "Short title is required";
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
          shortTitle: shortTitle.trim(),
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
          Gender: {story.gender || 'N/A'}
        </div>
        <div className={styles.memorialDetails}>
          Type: {story.category}
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
  const injuryTypes = ["Fatal"];
  const states = ["California", "New York", "Texas", "Washington", "Florida", "Colorado"];
  const years = ["2024", "2023", "2022", "2021"];

  const hasActiveFilters =
    filters.roadUserType ||
    filters.ageRange ||
    filters.gender ||
    filters.injuryType ||
    filters.state ||
    filters.year;

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
                      checked={filters.roadUserType === type}
                      onChange={(e) =>
                        onFilterChange("roadUserType", e.target.checked ? type : null)
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
                      checked={filters.ageRange === range}
                      onChange={(e) =>
                        onFilterChange("ageRange", e.target.checked ? range : null)
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
                      checked={filters.gender === gender}
                      onChange={(e) =>
                        onFilterChange("gender", e.target.checked ? gender : null)
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
                        onFilterChange("injuryType", e.target.checked ? type : null)
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
                      checked={filters.state === state}
                      onChange={(e) =>
                        onFilterChange("state", e.target.checked ? state : null)
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
                      checked={filters.year === year}
                      onChange={(e) =>
                        onFilterChange("year", e.target.checked ? year : null)
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
  const { stories } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [filters, setFilters] = useState({
    roadUserType: null,
    ageRange: null,
    gender: null,
    injuryType: null, // Changed from "Fatal" to null to show all stories
    state: null,
    year: null,
  });
  const [displayCount, setDisplayCount] = useState(12);

  const ITEMS_PER_PAGE = 12;

  // Filter logic
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (filters.roadUserType && story.category !== filters.roadUserType) {
        return false;
      }

      if (filters.ageRange) {
        const [min, max] = filters.ageRange.includes("+")
          ? [parseInt(filters.ageRange), Infinity]
          : filters.ageRange.split("-").map(Number);
        if (story.age < min || story.age > max) {
          return false;
        }
      }

      if (filters.gender && story.gender !== filters.gender) {
        return false;
      }

      if (filters.injuryType && story.injuryType !== filters.injuryType) {
        return false;
      }

      if (filters.state && story.state !== filters.state) {
        return false;
      }

      if (filters.year && story.year !== filters.year) {
        return false;
      }

      return true;
    });
  }, [stories, filters]);

  const displayedStories = filteredStories.slice(0, displayCount);
  const hasMoreStories = displayCount < filteredStories.length;

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleClearFilters = () => {
    setFilters({
      roadUserType: null,
      ageRange: null,
      gender: null,
      injuryType: null,
      state: null,
      year: null,
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

  return (
    <div className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <h2 className={styles.mainTitle}>Lives Stolen</h2>
      </header>

      <div className={styles.contentWrapper}>
         <p className={styles.subtitle}>Fatal Collisions</p>
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

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