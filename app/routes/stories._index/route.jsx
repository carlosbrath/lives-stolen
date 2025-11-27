import { useState, useMemo } from "react";
import { useLoaderData, Link } from "@remix-run/react";
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
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Took my first long motorcycle trip across the Rocky Mountains. The freedom and views were absolutely incredible. This trip was a turning point for me. I've ridden locally before, but committing to a multi-day journey across some of the most spectacular scenery in the country was transformative.\n\nThe winding mountain roads, the mountain air, the quiet moments in nature—it all made me feel truly alive. I learned a lot about myself and what I'm capable of. Every corner brought new adventures, from unexpected detours to chance meetings with other riders.",
    tags: ["Adventure", "Travel", "Freedom", "Nature"],
  },
  {
    id: 7,
    title: "Cycling for Fitness",
    category: "Cyclist",
    state: "Oregon",
    date: "2024-10-28",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1505594905485-016e32251e01?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
    ],
    description:
      "Six months of consistent cycling and I've never felt better. It's a fun way to stay active without the gym. When I started, my goal was simple: get in better shape. But cycling quickly became so much more than a fitness tool—it became my favorite part of the day.\n\nThe physical benefits are undeniable: stronger legs, better cardio, improved posture. But the mental benefits are even more impressive. Each ride is a meditation, a chance to clear my head and process my thoughts. Plus, I enjoy riding so much that staying consistent isn't a chore—it's a pleasure.",
    tags: ["Fitness", "Health", "Wellness", "Lifestyle"],
  },
  {
    id: 8,
    title: "Safe Pedestrian Infrastructure Works",
    category: "Pedestrian",
    state: "Massachusetts",
    date: "2024-10-25",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    ],
    description:
      "Our city added better crossings and street lighting. The number of pedestrian incidents has dropped significantly. This initiative proves that thoughtful urban planning can save lives. The improvements included more visible crossings with better-lit signage, extended crossing times for elderly pedestrians, and street light upgrades.\n\nThe results speak for themselves. Not only are there fewer incidents, but pedestrians feel more confident and safe. More people are walking, which boosts local business and creates a more vibrant community. It's a win-win investment.",
    tags: ["Safety", "Infrastructure", "Urban Planning", "Health"],
  },
  {
    id: 9,
    title: "Motorcycle Maintenance Basics",
    category: "Motorcyclist",
    state: "Illinois",
    date: "2024-10-22",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Learning to maintain my own motorcycle saved me money and gave me a deeper understanding of my bike. Maintenance used to feel intimidating, but breaking it down into simple tasks made it manageable. I started with the basics: oil changes, filter replacements, chain maintenance, and brake checks.\n\nNot only has this saved me hundreds in shop labor, but I now know my bike inside and out. If something goes wrong on the road, I have a fighting chance of fixing it myself. Plus, there's a real satisfaction in keeping my bike running smoothly.",
    tags: ["Maintenance", "DIY", "Mechanical", "Knowledge"],
  },
  {
    id: 10,
    title: "Winter Cycling Adventures",
    category: "Cyclist",
    state: "Minnesota",
    date: "2024-10-20",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1505594905485-016e32251e01?w=800&h=600&fit=crop",
    ],
    description:
      "Cycling in winter requires special preparation and gear, but the quiet, snowy rides are magical. Most cyclists hang up their bikes when the temperature drops, but winter riding offers something special. The crisp air, the peacefulness of snowy trails, and the incredible satisfaction of tackling a challenging season—it's worth every bit of preparation.\n\nProperly dressed in layers, with good winter tires and lights, I've discovered a whole new dimension to cycling. Winter riding makes you a better cyclist overall because it demands more skill and awareness.",
    tags: ["Winter", "Challenge", "Preparation", "Adventure"],
  },
  {
    id: 11,
    title: "Community Walking Events",
    category: "Pedestrian",
    state: "California",
    date: "2024-10-18",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
    ],
    description:
      "Our town organized monthly walking events. It brings neighbors together and builds a stronger community. What started as a simple idea has grown into something truly special. Monthly themed walks bring together dozens of residents, from young children to seniors, all united by a love of walking and community.\n\nThese events have become social touchstones—people look forward to them, friendships form, and newcomers feel welcomed. It's proven that creating opportunities for people to come together can transform a neighborhood.",
    tags: ["Events", "Community", "Social", "Health"],
  },
  {
    id: 12,
    title: "Motorcycle Gear That Makes a Difference",
    category: "Motorcyclist",
    state: "Arizona",
    date: "2024-10-15",
    status: "Approved",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1506361197048-46a72bb872d5?w=800&h=600&fit=crop",
    ],
    description:
      "Investing in quality protective gear was one of the best decisions I made as a rider. At first, I thought expensive gear was unnecessary. But after my first real accident—thankfully minor—I realized how much protection my gear provided. Had I been wearing inferior equipment, the outcome could have been very different.\n\nNow I'm passionate about gear quality. A good helmet, jacket, gloves, and boots aren't just safety equipment—they're peace of mind. They allow you to ride with confidence knowing you're protected.",
    tags: ["Safety", "Gear", "Protection", "Investment"],
  },
];

export const loader = async () => {
  return { stories: DUMMY_STORIES };
};

export const meta = () => [
  { title: "Stories | Story Submission" },
  {
    name: "description",
    content: "Read inspiring stories from cyclists, pedestrians, and motorcyclists",
  },
];

function StoryCard({ story }) {
  const categoryColor = {
    Cyclist: "#3b82f6",
    Pedestrian: "#10b981",
    Motorcyclist: "#f59e0b",
  };

  return (
    <Link to={`/stories/${story.id}`} className={styles.storyCardLink}>
      <div className={styles.storyCard}>
        <div className={styles.cardImage}>
          <img src={story.images[0]} alt={story.title} />
          <span
            className={styles.categoryBadge}
            style={{ backgroundColor: categoryColor[story.category] }}
          >
            {story.category}
          </span>
        </div>
        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{story.title}</h3>
          <p className={styles.cardDescription}>{story.description}</p>
          <div className={styles.cardMeta}>
            <span className={styles.state}>{story.state}</span>
            <span className={styles.date}>
              {new Date(story.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SearchAndFilters({ searchTerm, onSearchChange, filters, onFilterChange, onClearFilters }) {
  const categories = ["Cyclist", "Pedestrian", "Motorcyclist"];
  const statuses = ["Approved"];

  const dateRanges = [
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "Last 90 days", value: "90days" },
    { label: "All time", value: "all" },
  ];

  const hasActiveFilters = searchTerm || filters.category || filters.dateRange || filters.status;

  return (
    <div className={styles.filterSection}>
      <div className={styles.searchBox}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search stories by title or keyword..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Category</label>
          <select
            className={styles.filterSelect}
            value={filters.category || ""}
            onChange={(e) => onFilterChange("category", e.target.value || null)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date Range</label>
          <select
            className={styles.filterSelect}
            value={filters.dateRange || "all"}
            onChange={(e) => onFilterChange("dateRange", e.target.value)}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Approval Status</label>
          <select
            className={styles.filterSelect}
            value={filters.status || "Approved"}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button className={styles.clearButton} onClick={onClearFilters}>
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}

export default function StoriesPage() {
  const { stories } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: null,
    dateRange: "all",
    status: "Approved",
  });
  const [displayCount, setDisplayCount] = useState(6);

  const ITEMS_PER_PAGE = 6;

  // Filter and search logic
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Search filter
      if (
        searchTerm &&
        !story.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !story.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (filters.category && story.category !== filters.category) {
        return false;
      }

      // Status filter
      if (story.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== "all") {
        const storyDate = new Date(story.date);
        const now = new Date();
        const daysDiff = Math.floor((now - storyDate) / (1000 * 60 * 60 * 24));

        const daysLimit = {
          "7days": 7,
          "30days": 30,
          "90days": 90,
        };

        if (daysDiff > daysLimit[filters.dateRange]) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, filters]);

  const displayedStories = filteredStories.slice(0, displayCount);
  const hasMoreStories = displayCount < filteredStories.length;

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on filter change
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setDisplayCount(ITEMS_PER_PAGE); // Reset pagination on search
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      category: null,
      dateRange: "all",
      status: "Approved",
    });
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Community Stories</h1>
        <p className={styles.pageSubtitle}>
          Inspiring stories from cyclists, pedestrians, and motorcyclists
        </p>
      </header>

      <SearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {filteredStories.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            No stories found. Try adjusting your filters or search term.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.resultsCount}>
            Showing {displayedStories.length} of {filteredStories.length} stories
          </div>

          <div className={styles.storiesGrid}>
            {displayedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>

          {hasMoreStories && (
            <div className={styles.paginationContainer}>
              <button className={styles.loadMoreButton} onClick={handleLoadMore}>
                Load More Stories
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
