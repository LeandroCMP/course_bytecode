const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');

const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');

if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isOpen));
    navList.classList.toggle('is-open', !isOpen);
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') {
      event.preventDefault();
      return;
    }

    const target = document.querySelector(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    const offset = header ? header.offsetHeight + 12 : 0;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });

    if (navList && navToggle && navList.classList.contains('is-open')) {
      navList.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
});

const accordions = document.querySelectorAll('[data-accordion]');

const openPanel = (trigger, panel) => {
  trigger.setAttribute('aria-expanded', 'true');
  panel.hidden = false;
  panel.classList.add('is-open');
  panel.style.maxHeight = `${panel.scrollHeight}px`;
};

const closePanel = (trigger, panel) => {
  trigger.setAttribute('aria-expanded', 'false');
  panel.style.maxHeight = `${panel.scrollHeight}px`;
  requestAnimationFrame(() => {
    panel.style.maxHeight = '0px';
  });
  panel.classList.remove('is-open');
  const onEnd = () => {
    panel.hidden = true;
    panel.removeEventListener('transitionend', onEnd);
  };
  panel.addEventListener('transitionend', onEnd);
};

accordions.forEach((accordion) => {
  const triggers = accordion.querySelectorAll('.accordion-trigger');
  triggers.forEach((trigger) => {
    const panelId = trigger.getAttribute('aria-controls');
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) {
      return;
    }

    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      if (prefersReducedMotion) {
        trigger.setAttribute('aria-expanded', String(!isExpanded));
        panel.hidden = isExpanded;
        panel.classList.toggle('is-open', !isExpanded);
        panel.style.maxHeight = '';
        return;
      }

      if (isExpanded) {
        closePanel(trigger, panel);
      } else {
        openPanel(trigger, panel);
      }
    });
  });
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.accordion-panel.is-open').forEach((panel) => {
    panel.style.maxHeight = `${panel.scrollHeight}px`;
  });
});

const toTop = document.querySelector('.to-top');
const onScroll = () => {
  if (!toTop) {
    return;
  }
  toTop.classList.toggle('is-visible', window.scrollY > 600);
};

window.addEventListener('scroll', onScroll);
if (toTop) {
  onScroll();
  toTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
}

const themeToggle = document.querySelector('.theme-toggle');
const root = document.documentElement;
const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (storedTheme) {
  root.setAttribute('data-theme', storedTheme);
} else {
  root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}

const setToggleText = (theme) => {
  if (!themeToggle) {
    return;
  }
  const label = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  themeToggle.querySelector('.theme-toggle-text').textContent = label;
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
};

setToggleText(root.getAttribute('data-theme'));

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    root.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    setToggleText(nextTheme);
  });
}

const revealItems = document.querySelectorAll('.reveal');
if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

const form = document.querySelector('#lead-form');
const formStatus = document.querySelector('#form-status');

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formStatus) {
      formStatus.textContent = 'Dados recebidos. Em breve entraremos em contato.';
    }
    form.reset();
  });
}
