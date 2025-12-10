import { useState } from "react";
import { useLoaderData, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import prisma from "../../db.server";
import styles from "./styles.module.css";

export const loader = async ({ params }) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      throw new Response("Story not found", { status: 404 });
    }

    const story = {
      id: submission.id,
      title: submission.shortTitle,
      victimName: submission.victimName,
      category: submission.roadUserType,
      state: submission.state,
      date: submission.incidentDate,
      status: submission.status,
      age: submission.age,
      gender: submission.gender,
      injuryType: submission.injuryType,
      year: new Date(submission.incidentDate).getFullYear().toString(),
      images: submission.photoUrls ? JSON.parse(submission.photoUrls) : [],
      description: submission.victimStory,
      relation: submission.relation,
      submitterName: submission.submitterName,
    };

    return json({ story });
  } catch (error) {
    console.error("Error fetching story:", error);
    throw new Response("Story not found", { status: 404 });
  }
};

export const meta = ({ data }) => [
  { title: `${data.story.victimName || data.story.title} | Story Submission` },
  {
    name: "description",
    content: data.story.description.substring(0, 160) + "...",
  },
];

function ShareButtons({ story }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Read ${story.victimName}'s story`;

  const handleShare = (platform) => {
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.shareButtons}>
      <button 
        onClick={() => handleShare('facebook')} 
        className={styles.shareButton}
        aria-label="Share on Facebook"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>

      <button 
        onClick={() => handleShare('linkedin')} 
        className={styles.shareButton}
        aria-label="Share on LinkedIn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      </button>

      <button 
        onClick={handleCopy} 
        className={styles.shareButton}
        aria-label="Copy link"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>

      <button 
        onClick={() => handleShare('twitter')} 
        className={styles.shareButton}
        aria-label="Share"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    </div>
  );
}

function ImageGallery({ images, victimName }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={styles.profileImage}>
        <div className={styles.placeholderImage}>
          <img
            src="/Avatar-default.png"
            alt="Default avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  return (
    <div className={styles.imageGalleryWrapper} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className={styles.profileImage}>
        <img
          src={images[selectedImageIndex]}
          alt={victimName || 'Memorial photo'}
          className={styles.mainImage}
        />

        {/* Navigation arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            <button
              className={`${styles.navButton} ${styles.navButtonNext}`}
              onClick={handleNext}
              aria-label="Next image"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Image counter */}
            <div className={styles.imageCounter}>
              {selectedImageIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((image, index) => (
            <button
              key={index}
              className={`${styles.thumbnail} ${
                index === selectedImageIndex ? styles.activeThumbnail : ""
              }`}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              <img src={image} alt={`Thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoryDetail() {
  const { story } = useLoaderData();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header with back button and name */}
        <header className={styles.pageHeader}>
          <Link to="/stories" className={styles.backButton} aria-label="Back to stories">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className={styles.victimName}>{story.victimName || story.title}</h1>
        </header>

        {/* Main content area */}
        <div className={styles.mainContent}>
          {/* Left side - Image */}
          <div className={styles.imageSection}>
            <ImageGallery images={story.images} victimName={story.victimName} />
          </div>

          {/* Right side - Info */}
          <div className={styles.infoSection}>
            {story.relation && (
              <p className={styles.relation}>{story.relation}</p>
            )}
            
            {story.state && (
              <p className={styles.location}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {story.state}
              </p>
            )}

            {story.date && (
              <p className={styles.date}>
                Killed {formatDate(story.date)}
              </p>
            )}

            {story.category && (
              <p className={styles.category}>{story.category}</p>
            )}

            <ShareButtons story={story} />
          </div>
        </div>

        {/* Story content */}
        <article className={styles.storyContent}>
          <h2 className={styles.storyLabel}>Story:</h2>
          <div className={styles.storyText}>
            {story.description.split("\n").map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Lives Stolen Button */}
          <div className={styles.livesButtonWrapper}>
            <Link to="/stories" className={styles.livesButton}>
              Lives Stolen
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}