/* Motion is an enhancement. The site and all work remain usable without it. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const intro = document.getElementById('welcome');
  const scene = document.querySelector('[data-world-scene]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const motionButtons = [...document.querySelectorAll('[data-toggle-motion]')];
  const statJobs = new Map();
  let userPaused = false;
  let transitionTimer;
  let transitionBusy = false;
  let entranceTimer;
  let pointerFrame = 0;
  try { userPaused = localStorage.getItem('sameer-motion-v1') === 'off'; } catch {}
  const motionAllowed = () => !reduced.matches && !userPaused;

  function finishCounters() {
    statJobs.forEach((job, el) => {
      cancelAnimationFrame(job.frame);
      el.firstChild.nodeValue = job.target.toLocaleString('en-US');
    });
    statJobs.clear();
  }
  function applyMotionPreference() {
    const paused = !motionAllowed();
    root.classList.toggle('motion-paused', paused);
    motionButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', reduced.matches ? 'Motion reduced by your device preference' : paused ? 'Resume decorative motion' : 'Pause decorative motion');
      button.disabled = reduced.matches;
      if (button.classList.contains('world-motion')) {
        button.innerHTML = `${paused ? '▷' : 'Ⅱ'} <span>${reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion'}</span>`;
      } else {
        button.innerHTML = `<span class="motion-switch-icon">${paused ? '▷' : 'Ⅱ'}</span><span class="motion-switch-label">${reduced.matches ? 'Reduced motion' : paused ? 'Motion off' : 'Motion on'}</span>`;
      }
    });
    if (paused) {
      finishCounters();
      scene.style.setProperty('--wx', 0);
      scene.style.setProperty('--wy', 0);
      document.querySelectorAll('[data-motion-tilt]').forEach(el => el.style.removeProperty('transform'));
    }
  }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('sameer-motion-v1', userPaused ? 'off' : 'on'); } catch {}
    applyMotionPreference();
  }));
  reduced.addEventListener('change', applyMotionPreference);
  applyMotionPreference();

  const stories = {
    gym: { label: '01 / GYM & DISCIPLINE', copy: 'Some days it’s a great session. Some days it’s just showing up. Both count. That consistency comes with me to work.', gym: true },
    sports: { label: '02 / SPORTS & SPIRIT', copy: 'The timing of a shot. The energy of a team. The belief that the next ball can change the game. That’s my kind of sport.', gym: false },
    fun: { label: '03 / FUN & GOOD COMPANY', copy: 'Good laughs, a little friendly banter, and people who make the ordinary memorable. Serious about the work. Room for the fun.', gym: true },
    grit: { label: '04 / DEDICATION & GRIT', copy: 'I don’t need every attempt to be perfect. I need to learn, show up again, and make the next one better. Giving up isn’t the plan.', gym: false }
  };
  const traitButtons = [...document.querySelectorAll('[data-world-trait]')];
  traitButtons.forEach(button => button.addEventListener('click', () => {
    const story = stories[button.dataset.worldTrait];
    traitButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const portraitName = { gym: 'showup', sports: 'work', fun: 'gym', grit: 'grit' }[button.dataset.worldTrait];
    scene.dataset.portrait = portraitName;
    scene.querySelectorAll('.world-portrait').forEach(image => image.setAttribute('aria-hidden', String(!image.classList.contains('world-portrait-' + portraitName))));
    document.getElementById('world-story-label').textContent = story.label;
    document.getElementById('world-story-copy').textContent = story.copy;
    const storyBox = document.querySelector('.world-story');
    storyBox.classList.remove('is-changing');
    if (motionAllowed()) requestAnimationFrame(() => storyBox.classList.add('is-changing'));
  }));

  function focusTarget(target) {
    const section = document.getElementById(target) || document.getElementById('portfolio');
    const heading = section.querySelector('h1,h2') || section;
    heading.setAttribute('tabindex', '-1');
    section.scrollIntoView({ behavior: 'instant', block: 'start' });
    heading.focus({ preventScroll: true });
  }
  function showPortfolio(target = 'portfolio', animate = true) {
    if (transitionBusy) return;
    transitionBusy = true;
    const duration = animate && motionAllowed() ? 540 : 0;
    if (duration) body.classList.add('world-leaving');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      intro.hidden = true;
      body.classList.remove('welcome-active');
      body.classList.add('portfolio-entering');
      history.replaceState(null, '', '#' + target);
      focusTarget(target);
      transitionBusy = false;
      clearTimeout(entranceTimer);
      entranceTimer = setTimeout(() => {
        body.classList.remove('portfolio-entering', 'world-leaving');
      }, duration ? 500 : 0);
    }, duration);
  }
  document.querySelectorAll('[data-enter-world]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    showPortfolio(link.dataset.enterWorld);
  }));
  function showWorld() {
    clearTimeout(transitionTimer);
    clearTimeout(entranceTimer);
    transitionBusy = false;
    intro.hidden = false;
    body.classList.add('welcome-active');
    body.classList.remove('world-leaving', 'portfolio-entering');
    history.replaceState(null, '', '#welcome');
    window.scrollTo({ top: 0, behavior: 'instant' });
    const title = document.getElementById('world-title');
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  }
  document.querySelectorAll('[data-show-world]').forEach(button => button.addEventListener('click', showWorld));
  const initialTarget = location.hash.slice(1);
  if (initialTarget && initialTarget !== 'welcome' && document.getElementById(initialTarget)) {
    intro.hidden = true;
    requestAnimationFrame(() => focusTarget(initialTarget));
  } else {
    body.classList.add('welcome-active');
  }
  window.addEventListener('hashchange', () => {
    const target = location.hash.slice(1);
    if (target === 'welcome') showWorld();
    else if (body.classList.contains('welcome-active') && target && document.getElementById(target)) showPortfolio(target, false);
  });

  if ('IntersectionObserver' in window) {
    root.classList.add('motion-ready');
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveals.unobserve(entry.target);
      });
    }, { threshold: .09, rootMargin: '0px 0px -15px 0px' });
    const revealTargets = document.querySelectorAll('.section-head,.featured,.lab-card,.enterprise-note,.skill-workbench,.journey-layout,.about-left,.about-right,.rohit-interlude,.kohli-interlude,.anime-art,.anime-lessons,.team-section,.contact-grid,.proof-intro,.proof-stat');
    revealTargets.forEach((el, i) => {
      el.classList.add('motion-reveal');
      el.style.setProperty('--reveal-delay', `${el.classList.contains('proof-stat') ? (i % 3) * 75 : 0}ms`);
      reveals.observe(el);
    });
    const metrics = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      metrics.unobserve(el);
      const target = Number(el.firstChild.nodeValue.replace(/[^0-9]/g, ''));
      if (!motionAllowed() || !target) return;
      el.setAttribute('aria-label', el.textContent);
      const start = performance.now();
      const job = { target, frame: 0 };
      statJobs.set(el, job);
      function tick(now) {
        const progress = Math.min((now - start) / 1050, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.firstChild.nodeValue = Math.round(target * ease).toLocaleString('en-US');
        if (progress < 1 && motionAllowed() && !document.hidden) job.frame = requestAnimationFrame(tick);
        else {
          el.firstChild.nodeValue = target.toLocaleString('en-US');
          statJobs.delete(el);
        }
      }
      job.frame = requestAnimationFrame(tick);
    }), { threshold: .7 });
    document.querySelectorAll('.proof-stat>strong').forEach(el => metrics.observe(el));
    const navLinks = [...document.querySelectorAll('.header nav a,.mobile-dock a')];
    const navObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const id = visible[0].target.id;
      navLinks.forEach(a => a.classList.toggle('is-current', a.hash === '#' + id));
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('#work,#skills,#journey,#lab,#contact').forEach(el => navObserver.observe(el));
  }

  scene.addEventListener('pointermove', event => {
    if (!finePointer.matches || !motionAllowed()) return;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect();
      scene.style.setProperty('--wx', ((event.clientX - rect.left) / rect.width - .5) * 2);
      scene.style.setProperty('--wy', ((event.clientY - rect.top) / rect.height - .5) * 2);
    });
  });
  scene.addEventListener('pointerleave', () => {
    cancelAnimationFrame(pointerFrame);
    scene.style.setProperty('--wx', 0);
    scene.style.setProperty('--wy', 0);
  });
  document.querySelectorAll('.lab-card,.signal-art').forEach(card => {
    card.dataset.motionTilt = '';
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!finePointer.matches || !motionAllowed() || card.classList.contains('motion-reveal') && !card.classList.contains('is-visible')) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = ((event.clientX - r.left) / r.width - .5) * 4;
        const y = ((event.clientY - r.top) / r.height - .5) * -4;
        card.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${x}deg) translateY(-3px)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.style.removeProperty('transform');
    });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) finishCounters();
  });
})();
