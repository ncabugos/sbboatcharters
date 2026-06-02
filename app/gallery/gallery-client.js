'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './gallery.module.css';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

export default function GalleryClient({ instagramData }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [igLightbox, setIgLightbox] = useState(null); // index into instagramData.posts

  const openIgLightbox = (index) => {
    setIgLightbox(index);
    document.body.style.overflow = 'hidden';
  };

  const closeIgLightbox = () => {
    setIgLightbox(null);
    document.body.style.overflow = '';
  };

  const prevIgPost = () => setIgLightbox((i) => (i - 1 + instagramData.posts.length) % instagramData.posts.length);
  const nextIgPost = () => setIgLightbox((i) => (i + 1) % instagramData.posts.length);

  useEffect(() => {
    if (igLightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeIgLightbox();
      if (e.key === 'ArrowLeft') prevIgPost();
      if (e.key === 'ArrowRight') nextIgPost();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [igLightbox]);

  const fetchVideos = useCallback(async () => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
      setError('YouTube API key not configured');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet&order=date&maxResults=12&type=video`
      );

      if (!res.ok) {
        throw new Error(`YouTube API error: ${res.status}`);
      }

      const data = await res.json();
      setVideos(data.items || []);
    } catch (err) {
      console.error('Failed to fetch YouTube videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);


  const openVideoPlayer = (videoId) => {
    setActiveVideo(videoId);
    document.body.style.overflow = 'hidden';
  };

  const closeVideoPlayer = () => {
    setActiveVideo(null);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className={styles.hero}>
        <img
          src="/images/hero-orcas-channel.jpg"
          alt="Orcas in the Santa Barbara Channel"
          className={styles.heroBgImage}
          loading="eager"
          fetchPriority="high"
        />
        <div className={styles.heroOverlay}></div>
        <div className={`container ${styles.heroContent}`}>
          <span className={styles.heroLabel}>Media</span>
          <h1 className={styles.heroTitle}>Adventures in Action</h1>
          <p className={styles.heroSubtitle}>
            Watch our latest videos from the Santa Barbara coast and Channel Islands,
            and follow along on Instagram for daily adventure updates.
          </p>
        </div>
      </section>

      {/* ===== YOUTUBE VIDEOS ===== */}
      <section className={styles.videosSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Latest Videos</span>
            <h2 className={styles.sectionTitle}>Watch Our Adventures</h2>
            <p className={styles.sectionSubtitle}>
              From Channel Islands tours to whale watching, spearfishing, and sunset cruises — 
              see what it's like out on the water with SB Boat Charters.
            </p>
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <div className={styles.videoGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.videoSkeleton}>
                  <div className={styles.skeletonThumb}></div>
                  <div className={styles.skeletonInfo}>
                    <div className={styles.skeletonLine}></div>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error / No API Key State */}
          {!loading && error && (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <h3>Videos Coming Soon</h3>
              <p>Our video feed is being set up. Check back soon or visit our YouTube channel directly.</p>
              <a
                href={`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                  <polygon fill="white" points="9.545 15.568 15.818 12 9.545 8.432"/>
                </svg>
                Visit Our YouTube Channel
              </a>
            </div>
          )}

          {/* Video Grid */}
          {!loading && !error && videos.length > 0 && (
            <div className={styles.videoGrid}>
              {videos.map((video) => {
                const videoId = video.id.videoId;
                const snippet = video.snippet;
                const thumb = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url;

                return (
                  <div
                    key={videoId}
                    className={styles.videoCard}
                    onClick={() => openVideoPlayer(videoId)}
                  >
                    <div className={styles.videoThumbWrap}>
                      <img
                        src={thumb}
                        alt={snippet.title}
                        className={styles.videoThumb}
                        loading="lazy"
                      />
                      <div className={styles.videoPlayBtn}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                      </div>
                      <div className={styles.videoDuration}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Watch
                      </div>
                    </div>
                    <div className={styles.videoInfo}>
                      <h3 className={styles.videoTitle}>{snippet.title}</h3>
                      <p className={styles.videoDate}>
                        {new Date(snippet.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* YouTube CTA */}
          <div className={styles.youtubeCTA}>
            <a
              href={`https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.youtubeBtn}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
                <polygon fill="white" points="9.545 15.568 15.818 12 9.545 8.432"/>
              </svg>
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ===== INSTAGRAM FEED ===== */}
      <section className={styles.instagramSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Instagram</span>
            <h2 className={styles.sectionTitle}>Follow Our Adventures</h2>
            <p className={styles.sectionSubtitle}>
              Daily updates from the water. Follow <a href="https://www.instagram.com/sbboatcharters/" target="_blank" rel="noopener noreferrer" className={styles.igHandle}>@sbboatcharters</a> for the latest.
            </p>
          </div>

          {/* Instagram Grid */}
          <div className={styles.igGrid}>
            {instagramData.posts.map((post, index) => {
              const isVideo = post.isReel || post.mediaType === 'VIDEO';
              const isCarousel = post.mediaType === 'CAROUSEL_ALBUM';
              return (
                <button
                  key={post.id}
                  className={styles.igCard}
                  onClick={() => openIgLightbox(index)}
                  aria-label={post.prunedCaption}
                >
                  <div className={styles.igThumbWrap}>
                    <img
                      src={post.thumbnailUrl}
                      alt={post.prunedCaption}
                      className={styles.igThumb}
                      loading="lazy"
                    />
                    <div className={styles.igOverlay}>
                      <p className={styles.igCaption}>{post.prunedCaption}</p>
                    </div>
                    {/* Glass play button for videos */}
                    {isVideo && (
                      <div className={styles.igPlayBtn}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <polygon points="6 3 20 12 6 21 6 3"/>
                        </svg>
                      </div>
                    )}
                    {/* Type badge */}
                    {isVideo && (
                      <span className={styles.igBadge}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Reel
                      </span>
                    )}
                    {isCarousel && (
                      <span className={styles.igBadge}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                          <rect x="2" y="2" width="13" height="13" rx="2"/>
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                        </svg>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Instagram CTA */}
          <div className={styles.instagramCTA}>
            <a
              href="https://www.instagram.com/sbboatcharters/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.instagramBtn}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Follow @sbboatcharters
            </a>
          </div>
        </div>
      </section>

      {/* ===== INSTAGRAM LIGHTBOX ===== */}
      {igLightbox !== null && (() => {
        const post = instagramData.posts[igLightbox];
        const isVideo = post.isReel || post.mediaType === 'VIDEO';
        const isCarousel = post.mediaType === 'CAROUSEL_ALBUM';
        return (
          <div className={styles.igModal} onClick={closeIgLightbox}>
            <button className={styles.igModalClose} onClick={closeIgLightbox} aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>

            {/* Prev */}
            <button className={`${styles.igModalNav} ${styles.igModalNavPrev}`} onClick={(e) => { e.stopPropagation(); prevIgPost(); }} aria-label="Previous">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>

            <div className={styles.igModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.igModalImg}>
                <img src={post.thumbnailUrl} alt={post.prunedCaption} />
                {isVideo && (
                  <div className={styles.igModalPlayOverlay}>
                    <div className={styles.igModalPlayBtn}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.igModalInfo}>
                <div className={styles.igModalMeta}>
                  {isVideo && <span className={styles.igModalType}>Reel</span>}
                  {isCarousel && <span className={styles.igModalType}>Album</span>}
                  <span className={styles.igModalDate}>
                    {new Date(post.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className={styles.igModalCaption}>{post.prunedCaption}</p>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.igModalLink}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  View on Instagram
                </a>
              </div>
            </div>

            {/* Next */}
            <button className={`${styles.igModalNav} ${styles.igModalNavNext}`} onClick={(e) => { e.stopPropagation(); nextIgPost(); }} aria-label="Next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            <div className={styles.igModalCounter}>
              {igLightbox + 1} / {instagramData.posts.length}
            </div>
          </div>
        );
      })()}

      {/* ===== VIDEO PLAYER MODAL ===== */}
      {activeVideo && (
        <div className={styles.videoModal} onClick={closeVideoPlayer}>
          <button className={styles.modalClose} onClick={closeVideoPlayer}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalPlayer}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
                title="YouTube Video Player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
