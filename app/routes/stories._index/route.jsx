import { useState, useMemo } from "react";
import { useLoaderData, useActionData, useNavigation, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import StorySubmissionForm from "../../components/StorySubmissionForm";
import styles from "./styles.module.css";

// Dummy story data - expanded with approval status
const DUMMY_STORIES = [
  {
    id: 1,
    title: "My First Bike Commute Experience",
    category: "Cyclist",
    state: "California",
    date: "2024-11-15",
    status: "Approved",
    age: 28,
    gender: "Male",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505594905485-016e32251e01?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Started cycling to work three months ago and it completely changed my daily routine. The morning rides help me stay fit and reduce my carbon footprint. What began as a simple way to save money on gas has evolved into a passion that's transformed my daily commute into something I look forward to.\n\nThe first few weeks were challenging. My legs were sore, and the weather was unpredictable. But I persisted, and soon my body adapted. Now, three months in, I feel stronger and more energized than ever before. The fresh air, the physical exercise, and the connection with nature has had profound benefits on my mental health.\n\nI've also discovered a wonderful cycling community in my area. Weekly group rides, maintenance workshops, and casual coffee meetups have made this journey even more rewarding. If you're thinking about cycling to work, I highly recommend it. Start small, invest in a decent bike, and don't be afraid to ask experienced cyclists for advice.",
    tags: ["Commute", "Fitness", "Environment", "Community"],
  },
  {
    id: 2,
    title: "Walking Through Downtown Changes",
    category: "Pedestrian",
    state: "New York",
    date: "2024-11-12",
    status: "Approved",
    age: 45,
    gender: "Female",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    ],
    description:
      "The new pedestrian pathways downtown have made walking safer and more enjoyable. More people are using the streets now. The city invested heavily in infrastructure improvements, including wider sidewalks, dedicated crossing zones, and better lighting. The transformation has been remarkable—not only do I feel safer walking at night, but the entire downtown area has become more vibrant and welcoming.\n\nWalking used to feel like a necessity, something I did to get from point A to B. Now it's become an experience. I notice architectural details I never saw before, stop for coffee at local cafes, and regularly bump into neighbors. The pedestrian-first approach has encouraged more people to explore downtown on foot.",
    tags: ["Infrastructure", "Safety", "Urban Design", "Community"],
  },
  {
    id: 3,
    title: "Motorcycle Safety Tips That Saved My Life",
    category: "Motorcyclist",
    state: "Texas",
    date: "2024-11-10",
    status: "Approved",
    age: 32,
    gender: "Male",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Learning proper motorcycle safety techniques gave me the confidence to ride more. Always wear proper gear and stay alert. A close call on the highway made me realize how important safety practices really are. After taking a professional safety course, I learned techniques that literally changed everything.\n\nThe most critical lessons: always wear a full helmet, protective jacket, gloves, and boots. Practice emergency braking and cornering. Be visible—use reflective gear and keep your lights on. Most importantly, never ride impaired or distracted. These fundamentals have made me a better, more confident rider.",
    tags: ["Safety", "Training", "Gear", "Prevention"],
  },
  {
    id: 4,
    title: "Urban Cycling Culture",
    category: "Cyclist",
    state: "Washington",
    date: "2024-11-08",
    status: "Approved",
    age: 35,
    gender: "Female",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505594905485-016e32251e01?w=800&h=600&fit=crop",
    ],
    description:
      "The cycling community in Seattle is amazing. From group rides to bike maintenance workshops, there's always something happening. Seattle has embraced cycling culture in a way that's truly inspiring. The city has invested in bike infrastructure, but more importantly, the community itself is supportive and welcoming to cyclists of all levels.\n\nWhether you're a casual commuter or a serious enthusiast, there's a place for you. I've made friends through cycling meetups, learned repair skills at community workshops, and discovered new routes on guided rides. It's not just about the bikes—it's about the people and the shared passion for sustainable, healthy transportation.",
    tags: ["Community", "Culture", "Infrastructure", "Social"],
  },
  {
    id: 5,
    title: "Walking and Social Connection",
    category: "Pedestrian",
    state: "Florida",
    date: "2024-11-05",
    status: "Approved",
    age: 52,
    gender: "Male",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=600&fit=crop",
    ],
    description:
      "I started walking in my neighborhood and discovered a whole community. It's amazing how walking creates connections. Before I committed to daily walks, I knew my neighbors only by sight. But walking regularly through the same streets at the same times changed that completely.\n\nI began stopping to chat, joining neighborhood walking groups, and becoming part of something larger than myself. Walking has a way of slowing you down enough to notice people and places. It builds genuine connections that are rare in our fast-paced world.",
    tags: ["Community", "Mental Health", "Neighborhood", "Connection"],
  },
  {
    id: 6,
    title: "Road Trip on Two Wheels",
    category: "Motorcyclist",
    state: "Colorado",
    date: "2024-11-01",
    status: "Approved",
    age: 29,
    gender: "Female",
    injuryType: "Fatal",
    year: "2024",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Took my first long motorcycle trip across the Rocky Mountains. The freedom and views were absolutely incredible. This trip was a turning point for me. I've ridden locally before, but committing to a multi-day journey across some of the most spectacular scenery in the country was transformative.\n\nThe winding mountain roads, the mountain air, the quiet moments in nature—it all made me feel truly alive. I learned a lot about myself and what I'm capable of. Every corner brought new adventures, from unexpected detours to chance meetings with other riders.",
    tags: ["Adventure", "Travel", "Freedom", "Nature"],
  },
];

export const loader = async () => {
  return { stories: DUMMY_STORIES };
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

    // Here you would save to database/Shopify
    // For now, just return success
    return json(
      {
        success: true,
        message: "Your submission has been received. Thank you for sharing this story.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Form submission error:", error);
    return json(
      {
        error: "An error occurred while submitting. Please try again.",
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
  return (
    <Link to={`/stories/${story.id}`} className={styles.memorialCard}>
      <div className={styles.silhouetteContainer}>
        <div className={styles.silhouette}>
          {/* Placeholder silhouette - in production, you'd use actual silhouette images */}
          <svg viewBox="0 0 200 200" className={styles.silhouetteSvg}>
            <circle cx="100" cy="70" r="35" />
            <ellipse cx="100" cy="150" rx="50" ry="60" />
          </svg>
        </div>
      </div>
      <div className={styles.memorialInfo}>
        <div className={styles.memorialName}>{story.title}</div>
        <div className={styles.memorialDetails}>
          {story.age} • {story.gender} • {story.category}
        </div>
        <div className={styles.memorialLocation}>
          {story.state} • {story.year}
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
    injuryType: "Fatal",
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
      injuryType: "Fatal",
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
        <h1 className={styles.mainTitle}>Lives Stolen</h1>
        <p className={styles.subtitle}>Fatal Collisions</p>
      </header>

      <div className={styles.contentWrapper}>
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