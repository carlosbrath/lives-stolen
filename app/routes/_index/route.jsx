import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Lives Stolen</h1>
          <p className={styles.heroSubtitle}>
            Remembering those who lost their lives to traffic violence
          </p>
          <p className={styles.heroDescription}>
            Every life lost on our roads represents a family forever changed,
            dreams cut short, and a community diminished. This memorial honors
            their memory and tells their stories.
          </p>
          <div className={styles.heroButtons}>
            <a href="/stories" className={styles.primaryButton}>
              View Memorial Wall
            </a>
            <a href="/stories#submit-story" className={styles.secondaryButton}>
              Share a Story
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresContent}>
          <h2 className={styles.featuresTitle}>Honoring Their Memory</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Remember Lives Lost</h3>
              <p className={styles.featureDescription}>
                Browse memorials of individuals who lost their lives in traffic collisions.
                Each story represents a real person with loved ones left behind.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Share Their Story</h3>
              <p className={styles.featureDescription}>
                Help us remember by submitting stories of those lost to traffic violence.
                Your submission honors their memory and raises awareness.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Build Awareness</h3>
              <p className={styles.featureDescription}>
                Together we can raise awareness about traffic safety and advocate
                for safer streets for pedestrians, cyclists, and all road users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Lost someone to traffic violence?</h2>
          <p className={styles.ctaDescription}>
            Share their story and honor their memory on our memorial wall.
          </p>
          <a href="/stories#submit-story" className={styles.ctaButton}>
            Submit a Story
          </a>
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
