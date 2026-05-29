/* ============================================================
   FOCUS LOCK — Landing Page Scripts
   Analytics event architecture + interactions
   ============================================================ */

/* ── Analytics layer ─────────────────────────────────────────── */
const Analytics = {
  // Replace with real implementation (Firebase, PostHog, Mixpanel, etc.)
  track(event, props = {}) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      ...props
    };

    // Development: log to console
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log('[Analytics]', payload);
    }

    // Production: send to your analytics endpoint
    // firebase.analytics().logEvent(event, props);
    // posthog.capture(event, props);
    // window.gtag('event', event, props);
  },

  // Predefined event catalogue
  events: {
    PAGE_VIEW:        'page_view',
    HERO_CTA:         'hero_cta_clicked',
    EMAIL_SUBMITTED:  'beta_email_submitted',
    FEATURE_HOVERED:  'feature_hovered',
    STATE_HOVERED:    'state_card_hovered',
    SCROLL_DEPTH:     'scroll_depth_reached',
    NAV_CTA:          'nav_cta_clicked',
    // App-level events (for reference / in-app use):
    STATE_SELECTED:    'state_selected',
    RECOVERY_STARTED:  'recovery_started',
    FOCUS_STARTED:     'focus_started',
    FOCUS_COMPLETED:   'focus_completed',
    HYDRATION_LOGGED:  'hydration_logged',
    TASK_COMPLETED:    'task_completed',
    APP_OPENED:        'app_opened',
    CHECKIN_COMPLETED: 'checkin_completed',
    UPGRADE_SHOWN:     'upgrade_prompt_shown',
    UPGRADE_COMPLETED: 'upgrade_completed',
  }
};

/* ── Nav scroll behaviour ────────────────────────────────────── */
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

/* ── Scroll reveal ───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── Scroll depth tracking ───────────────────────────────────── */
const depthMilestones = new Set();
window.addEventListener('scroll', () => {
  const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
  [25, 50, 75, 100].forEach(milestone => {
    if (pct >= milestone && !depthMilestones.has(milestone)) {
      depthMilestones.add(milestone);
      Analytics.track(Analytics.events.SCROLL_DEPTH, { depth: milestone });
    }
  });
}, { passive: true });

/* ── Hero CTA ────────────────────────────────────────────────── */
document.querySelectorAll('[data-action="hero-cta"]').forEach(el => {
  el.addEventListener('click', () => {
    Analytics.track(Analytics.events.HERO_CTA);
    document.querySelector('#beta').scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── Nav CTA ─────────────────────────────────────────────────── */
document.querySelector('[data-action="nav-cta"]')?.addEventListener('click', () => {
  Analytics.track(Analytics.events.NAV_CTA);
  document.querySelector('#beta').scrollIntoView({ behavior: 'smooth' });
});

/* ── Feature hover tracking ──────────────────────────────────── */
document.querySelectorAll('.feature-item').forEach(el => {
  el.addEventListener('mouseenter', () => {
    Analytics.track(Analytics.events.FEATURE_HOVERED, {
      feature: el.dataset.feature
    });
  });
});

/* ── State card hover tracking ───────────────────────────────── */
document.querySelectorAll('.state-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    Analytics.track(Analytics.events.STATE_HOVERED, {
      state: el.dataset.state
    });
  });
});

/* ── Email form ──────────────────────────────────────────────── */
const form = document.querySelector('#beta-form');
form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.querySelector('.email-input').value.trim();
  if (!email) return;

  const btn = form.querySelector('.email-submit');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  Analytics.track(Analytics.events.EMAIL_SUBMITTED, { email_domain: email.split('@')[1] });

  try {
    const res = await fetch('https://aios.lv/api/beta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      btn.textContent = '✓ You\'re on the list';
      btn.style.background = 'var(--green)';
    } else {
      btn.textContent = 'Try again';
      btn.disabled = false;
    }
  } catch {
    btn.textContent = '✓ You\'re on the list'; // show success even on network error
    btn.style.background = 'var(--green)';
  }
});

/* ── Marquee pause on hover ──────────────────────────────────── */
document.querySelectorAll('.marquee-track').forEach(el => {
  el.addEventListener('mouseenter', () => el.style.animationPlayState = 'paused');
  el.addEventListener('mouseleave', () => el.style.animationPlayState = 'running');
});

/* ── Page view ───────────────────────────────────────────────── */
Analytics.track(Analytics.events.PAGE_VIEW, {
  referrer: document.referrer,
  path: location.pathname
});
