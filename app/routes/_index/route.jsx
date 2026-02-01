import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

function ApiTestSection() {
  const [stories, setStories] = useState([]);
  const [stats, setStats] = useState({ total: 0, livesStolen: 0, livesShattered: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ injuryType: "", limit: 10 });

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.injuryType) params.set("injuryType", filters.injuryType);
      params.set("limit", filters.limit.toString());

      const res = await fetch(`/api/stories?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setStories(data.stories || []);
        setStats(data.stats || { total: 0, livesStolen: 0, livesShattered: 0 });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.apiSection}>
      <div className={styles.apiContent}>
        <h2 className={styles.apiTitle}>API Test - Story Listing</h2>
        <p className={styles.apiDescription}>
          Test the stories API endpoint. This fetches published stories from the database.
        </p>

        <div className={styles.apiControls}>
          <select
            className={styles.select}
            value={filters.injuryType}
            onChange={(e) => setFilters({ ...filters, injuryType: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="Fatal">Lives Stolen (Fatal)</option>
            <option value="Non-fatal">Lives Shattered (Non-fatal)</option>
          </select>

          <select
            className={styles.select}
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
          >
            <option value="5">5 stories</option>
            <option value="10">10 stories</option>
            <option value="25">25 stories</option>
            <option value="50">50 stories</option>
          </select>

          <button className={styles.fetchButton} onClick={fetchStories} disabled={loading}>
            {loading ? "Loading..." : "Fetch Stories"}
          </button>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {stats.total > 0 && (
          <div className={styles.statsBar}>
            <span>Total: {stats.total}</span>
            <span>Lives Stolen: {stats.livesStolen}</span>
            <span>Lives Shattered: {stats.livesShattered}</span>
          </div>
        )}

        {stories.length > 0 && (
          <div className={styles.storiesGrid}>
            {stories.map((story) => (
              <div key={story.id} className={styles.storyCard}>
                {story.images?.[0] && (
                  <img
                    src={story.images[0]}
                    alt={story.victimName || "Memorial"}
                    className={styles.storyImage}
                  />
                )}
                <div className={styles.storyContent}>
                  <h3 className={styles.storyName}>{story.victimName || "Anonymous"}</h3>
                  <div className={styles.storyMeta}>
                    <span className={`${styles.badge} ${story.injuryType === "Fatal" ? styles.badgeFatal : styles.badgeNonFatal}`}>
                      {story.injuryType === "Fatal" ? "Lives Stolen" : "Lives Shattered"}
                    </span>
                    <span>{story.state}</span>
                    {story.age && <span>Age: {story.age}</span>}
                  </div>
                  <p className={styles.storyDescription}>
                    {story.description?.substring(0, 150)}
                    {story.description?.length > 150 ? "..." : ""}
                  </p>
                  <div className={styles.storyFooter}>
                    <span className={styles.storyCategory}>{story.category}</span>
                    <span className={styles.storyDate}>{story.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && stories.length === 0 && !error && (
          <p className={styles.noStories}>Click "Fetch Stories" to load stories from the API.</p>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Lives Stolen Memorial</h1>
          <p className={styles.heroSubtitle}>
            A Shopify App for Traffic Violence Awareness
          </p>
          <p className={styles.heroDescription}>
            This application helps Shopify stores create and manage memorial walls
            honoring victims of traffic violence. The memorial content is displayed
            directly on your storefront using Shopify theme blocks.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContent}>
          <h2 className={styles.featuresTitle}>How It Works</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Theme Blocks</h3>
              <p className={styles.featureDescription}>
                Add the memorial wall, story details, and submission form directly
                to your Shopify theme using customizable blocks in the theme editor.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Story Management</h3>
              <p className={styles.featureDescription}>
                Review, approve, and manage submitted stories through the admin
                dashboard. Keep full control over what appears on your memorial.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Easy Setup</h3>
              <p className={styles.featureDescription}>
                Install the app, configure your settings, and add blocks to your
                theme. No coding required to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* API Test Section */}
      <ApiTestSection />

      {/* Info Section */}
      <section className={styles.infoSection}>
        <div className={styles.infoContent}>
          <h2 className={styles.infoTitle}>For Store Owners</h2>
          <p className={styles.infoDescription}>
            If you have this app installed on your Shopify store, log in below to
            access the admin dashboard where you can manage story submissions and
            configure your memorial wall settings.
          </p>
        </div>
      </section>

      {showForm && (
        <section className={styles.adminSection}>
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Admin Log in
            </button>
          </Form>
        </section>
      )}
    </div>
  );
}
