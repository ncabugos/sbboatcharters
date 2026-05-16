'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './PageSlideshow.module.css';

export default function PageSlideshow({ slides }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef(null);

  const goTo = (index) => {
    if (index === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 280);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  const resetTimer = (fn) => {
    clearInterval(intervalRef.current);
    fn();
    intervalRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  return (
    <section className={styles.wrapper}>
      <div className={styles.inner}>
        {/* Main Stage */}
        <div className={styles.stage}>
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`${styles.slide} ${i === current ? styles.slideActive : ''} ${fading && i === current ? styles.slideFading : ''}`}
            >
              <img src={slide.src} alt={slide.alt} />
              <div className={styles.slideOverlay} />
              {slide.caption && (
                <div className={styles.caption}>
                  <span>{slide.caption}</span>
                </div>
              )}
            </div>
          ))}

          {/* Arrows */}
          <button
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => resetTimer(prev)}
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => resetTimer(next)}
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Counter */}
          <div className={styles.counter}>
            <span>{String(current + 1).padStart(2, '0')}</span>
            <div className={styles.bar}><div className={styles.fill} style={{ width: `${((current + 1) / slides.length) * 100}%` }} /></div>
            <span>{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Thumbnails */}
        <div className={styles.thumbs}>
          {slides.map((slide, i) => (
            <button
              key={i}
              className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
              onClick={() => resetTimer(() => goTo(i))}
              aria-label={`Slide ${i + 1}`}
            >
              <img src={slide.src} alt={slide.alt} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
