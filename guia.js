(() => {
  const guide = window.GUIDE_DATA;
  if (!guide) {
    return;
  }

  const root = document.documentElement;
  const storedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', storedTheme || (prefersDark ? 'dark' : 'light'));

  const getStored = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const setStored = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  };

  const storedRole = localStorage.getItem('guideRole');
  const initialRole = storedRole === 'teacher' ? 'teacher' : 'student';

  const state = {
    role: initialRole,
    completed: new Set(getStored('guideCompleted', [])),
    query: '',
  };

  const header = document.querySelector('.guide-header');
  const setHeaderHeight = () => {
    if (!header) {
      return;
    }
    root.style.setProperty('--guide-header-height', `${header.offsetHeight}px`);
  };

  setHeaderHeight();

  const searchInput = document.querySelector('#search-input');
  const sidebarContent = document.querySelector('#sidebar-content');
  const modulesContainer = document.querySelector('#modules-container');
  const templatesContainer = document.querySelector('#templates-container');
  const resultsContainer = document.querySelector('#search-results');
  const roleButtons = document.querySelectorAll('.role-toggle button');

  const navToggle = document.querySelector('.guide-menu');
  const navClose = document.querySelector('.guide-close');
  const scrim = document.querySelector('[data-guide-scrim]');

  const setNavState = (isOpen) => {
    document.body.classList.toggle('guide-nav-open', isOpen);
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', String(isOpen));
    }
  };

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      setNavState(!isOpen);
    });
  }

  if (navClose) {
    navClose.addEventListener('click', () => setNavState(false));
  }

  if (scrim) {
    scrim.addEventListener('click', () => setNavState(false));
  }

  if (sidebarContent) {
    sidebarContent.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setNavState(false);
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setNavState(false);
    }
  });

  window.addEventListener('resize', () => {
    setHeaderHeight();
    if (window.innerWidth > 1024) {
      setNavState(false);
    }
  });
  window.addEventListener('load', setHeaderHeight);

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const normalizeText = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const tokensFromQuery = (query) => query
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const highlightText = (text, tokens) => {
    const safeText = escapeHtml(text);
    if (!tokens.length) {
      return safeText;
    }
    let highlighted = safeText;
    tokens.forEach((token) => {
      const safeToken = escapeHtml(token);
      if (!safeToken) {
        return;
      }
      const regex = new RegExp(`(${escapeRegExp(safeToken)})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    return highlighted;
  };

  const lessonIndex = new Map();

  const getObjectives = (lesson) => {
    if (lesson.objectives && lesson.objectives.length) {
      return lesson.objectives;
    }
    const fallback = [`Compreender o tema: ${lesson.title}.`];
    if (lesson.deliverable) {
      fallback.push(`Concluir a entrega: ${lesson.deliverable}.`);
    }
    return fallback;
  };

  const buildDefaultTimeline = (lesson) => {
    return guide.meta.structure.map((item) => {
      const [timePart, ...labelParts] = item.split(' ');
      const label = labelParts.join(' ');
      const labelLower = label.toLowerCase();
      let detail = 'Siga o roteiro padrão desta etapa.';

      if (labelLower.includes('check-in')) {
        detail = 'Revisão rápida da aula anterior e aquecimento.';
      } else if (labelLower.includes('conceito')) {
        detail = `Apresentar o conceito central: ${lesson.title}.`;
      } else if (labelLower.includes('exemplo')) {
        detail = lesson.student?.summary || `Exemplo prático aplicado ao tema ${lesson.title}.`;
      } else if (labelLower.includes('lab')) {
        detail = lesson.deliverable ? `Entrega: ${lesson.deliverable}.` : 'Prática guiada com entrega.';
      } else if (labelLower.includes('desafio')) {
        detail = lesson.student?.challenge?.prompt || 'Resolver desafio individual do tema.';
      } else if (labelLower.includes('checklist')) {
        detail = lesson.student?.homework
          ? `Checklist e tarefa: ${lesson.student.homework}`
          : 'Checklist de prontidão e tarefa final.';
      }

      return {
        time: timePart,
        label,
        detail,
      };
    });
  };

  const getTimeline = (lesson) => {
    if (lesson.timeline && lesson.timeline.length) {
      return lesson.timeline;
    }
    return buildDefaultTimeline(lesson);
  };

  const getExample = (lesson, timeline) => {
    const exampleItem = timeline.find((item) => item.label.toLowerCase().includes('exemplo'));
    if (exampleItem?.detail) {
      return exampleItem.detail;
    }
    if (lesson.student?.summary) {
      return lesson.student.summary;
    }
    return `Exemplo aplicado ao tema: ${lesson.title}.`;
  };

  const getChecklist = (lesson, objectives) => {
    const items = [];
    if (lesson.deliverable) {
      items.push(`Entrega pronta: ${lesson.deliverable}.`);
    }
    objectives.forEach((objective) => items.push(objective));
    if (lesson.student?.challenge?.prompt) {
      items.push('Desafio individual concluído.');
    }
    return items.length ? items : ['Checklist definido pelo professor durante a aula.'];
  };

  const getCommonMistakes = (lesson) => {
    if (lesson.teacher?.commonMistakes?.length) {
      return lesson.teacher.commonMistakes;
    }
    return [
      'Critérios vagos ou não testáveis.',
      'Ignorar casos de borda e erros previstos.',
      'Entrega incompleta ou sem validação clara.',
    ];
  };

  const buildLessonIndex = () => {
    guide.modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        const objectives = getObjectives(lesson);
        const timeline = getTimeline(lesson);
        const example = getExample(lesson, timeline);
        const checklist = getChecklist(lesson, objectives);
        const mistakes = getCommonMistakes(lesson);
        const parts = [
          lesson.id,
          lesson.title,
          lesson.deliverable,
          ...objectives,
          ...timeline.flatMap((item) => [item.time, item.label, item.detail]),
          example,
          ...(lesson.student?.labSteps || []),
          lesson.student?.challenge?.prompt,
          lesson.student?.challenge?.expected,
          lesson.student?.homework,
          ...checklist,
          ...mistakes,
          ...(lesson.teacher?.talkTrack || []),
          ...(lesson.teacher?.facilitationNotes || []),
          ...(lesson.teacher?.rubric || []),
        ].filter(Boolean);
        lessonIndex.set(lesson.id, normalizeText(parts.join(' ')));
      });
    });
  };

  const updateRoleToggle = () => {
    roleButtons.forEach((button) => {
      const isActive = button.dataset.role === state.role;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    document.body.dataset.role = state.role;
  };

  const setRole = (role) => {
    state.role = role;
    localStorage.setItem('guideRole', role);
    updateRoleToggle();
    render();
  };

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => setRole(button.dataset.role));
  });

  const isLessonMatch = (lesson, matchTokens) => {
    if (!matchTokens.length) {
      return true;
    }
    const text = lessonIndex.get(lesson.id) || '';
    return matchTokens.every((token) => text.includes(token));
  };

  const renderHero = () => {
    const titleEl = document.querySelector('#guide-title');
    const metaEl = document.querySelector('#guide-meta');
    const structureEl = document.querySelector('#guide-structure');

    if (titleEl) {
      titleEl.textContent = guide.meta.title || 'Guia Oficial';
    }

    if (metaEl) {
      const totalLessons = guide.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      metaEl.innerHTML = [
        `<span class="meta-pill">${guide.modules.length} módulos</span>`,
        `<span class="meta-pill">${totalLessons} aulas</span>`,
        `<span class="meta-pill">${guide.meta.lessonDurationMinutes} min por aula</span>`,
      ].join('');
    }

    if (structureEl) {
      structureEl.innerHTML = guide.meta.structure
        .map((item) => `<div>${escapeHtml(item)}</div>`)
        .join('');
    }
  };

  const renderSidebar = (tokens, matchedIds) => {
    if (!sidebarContent) {
      return;
    }

    const modulesMarkup = guide.modules.map((module) => {
      const lessons = tokens.length
        ? module.lessons.filter((lesson) => matchedIds.has(lesson.id))
        : module.lessons;

      if (!lessons.length) {
        return '';
      }

      const completedCount = module.lessons.filter((lesson) => state.completed.has(lesson.id)).length;
      const progressPercent = Math.round((completedCount / module.lessons.length) * 100);

      const lessonsMarkup = lessons.map((lesson) => {
        const isComplete = state.completed.has(lesson.id);
        return `
          <li class="sidebar-lesson ${isComplete ? 'is-complete' : ''}">
            <a href="#lesson-${lesson.id}">
              <span class="lesson-check" aria-hidden="true"></span>
              <span>${highlightText(`${lesson.id} · ${lesson.title}`, tokens)}</span>
            </a>
          </li>
        `;
      }).join('');

      return `
        <div class="sidebar-module">
          <div class="sidebar-module-header">
            <div class="sidebar-title">${highlightText(module.title, tokens)}</div>
            <div class="sidebar-progress">
              <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
                <span style="width: ${progressPercent}%"></span>
              </div>
              <div>${completedCount}/${module.lessons.length} aulas concluídas</div>
            </div>
          </div>
          <ul class="sidebar-lessons">${lessonsMarkup}</ul>
        </div>
      `;
    }).join('');

    sidebarContent.innerHTML = modulesMarkup || '<div class="empty-state">Nenhuma aula encontrada para esta busca.</div>';
  };

  const renderTeacherBlock = (lesson, tokens) => {
    if (state.role !== 'teacher' || !lesson.teacher) {
      return '';
    }

    const talkTrack = lesson.teacher.talkTrack?.length
      ? `
        <div>
          <h4>Fala do professor</h4>
          <ul>${lesson.teacher.talkTrack.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}</ul>
        </div>
      `
      : '';

    const facilitation = lesson.teacher.facilitationNotes?.length
      ? `
        <div>
          <h4>Dicas de condução</h4>
          <ul>${lesson.teacher.facilitationNotes.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}</ul>
        </div>
      `
      : '';

    const rubric = lesson.teacher.rubric?.length
      ? `
        <div>
          <h4>Rubrica</h4>
          <ul>${lesson.teacher.rubric.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}</ul>
        </div>
      `
      : '';

    const scoring = lesson.teacher.scoring
      ? `<p class="teacher-meta">Pontuação sugerida: Check-in ${lesson.teacher.scoring.checkin}, Lab ${lesson.teacher.scoring.lab}, Desafio ${lesson.teacher.scoring.challenge}.</p>`
      : '';

    return `
      <div class="teacher-block">
        <h4>Modo Professor</h4>
        ${talkTrack}
        ${facilitation}
        ${rubric}
        ${scoring}
      </div>
    `;
  };

  const renderLesson = (lesson, tokens, openLessons) => {
    const objectives = getObjectives(lesson);
    const timeline = getTimeline(lesson);
    const example = getExample(lesson, timeline);
    const checklist = getChecklist(lesson, objectives);
    const mistakes = getCommonMistakes(lesson);
    const isComplete = state.completed.has(lesson.id);
    const openAttr = tokens.length ? 'open' : (openLessons.has(lesson.id) ? 'open' : '');

    const labSteps = lesson.student?.labSteps?.length
      ? `<ol>${lesson.student.labSteps.map((step) => `<li>${highlightText(step, tokens)}</li>`).join('')}</ol>`
      : '<p>Nenhum passo definido para este lab.</p>';

    const answerOpen = state.role === 'teacher' ? 'open' : '';
    const challenge = lesson.student?.challenge
      ? `
        <div class="challenge-grid">
          <div>
            <p><strong>Desafio:</strong> ${highlightText(lesson.student.challenge.prompt, tokens)}</p>
          </div>
          <details class="challenge-answer" ${answerOpen}>
            <summary>Ver gabarito</summary>
            <p>${highlightText(lesson.student.challenge.expected || 'Gabarito não definido.', tokens)}</p>
          </details>
        </div>
      `
      : '<p>Desafio definido em sala.</p>';

    return `
      <details class="lesson-card" id="lesson-${lesson.id}" data-lesson-id="${lesson.id}" ${openAttr}>
        <summary>
          <div class="lesson-summary">
            <span class="lesson-code">${highlightText(lesson.id, tokens)}</span>
            <span class="lesson-title">${highlightText(lesson.title, tokens)}</span>
          </div>
          <span class="lesson-deliverable">${highlightText(lesson.deliverable || 'Entrega definida em sala.', tokens)}</span>
          <span class="lesson-toggle" aria-hidden="true"></span>
        </summary>
        <div class="lesson-body">
          <div class="lesson-actions">
            <button class="btn btn-outline btn-small lesson-complete-btn" data-action="toggle-complete" data-lesson-id="${lesson.id}" aria-pressed="${isComplete}">
              ${isComplete ? 'Concluída' : 'Marcar aula como concluída'}
            </button>
            <span class="status-pill ${isComplete ? 'is-complete' : ''}">${isComplete ? 'Concluída' : 'Em andamento'}</span>
          </div>

          <div class="lesson-grid">
            <section class="lesson-section">
              <h4>Objetivo</h4>
              <ul>${objectives.map((objective) => `<li>${highlightText(objective, tokens)}</li>`).join('')}</ul>
            </section>
            <section class="lesson-section">
              <h4>Entrega</h4>
              <p>${highlightText(lesson.deliverable || 'Entrega definida em sala.', tokens)}</p>
            </section>
            <section class="lesson-section lesson-section--full">
              <h4>Roteiro 90 min</h4>
              <div class="timeline">
                ${timeline.map((item) => `
                  <div class="timeline-item">
                    <div class="timeline-time">${highlightText(item.time, tokens)}</div>
                    <div class="timeline-content">
                      <h5>${highlightText(item.label, tokens)}</h5>
                      <p>${highlightText(item.detail || 'Detalhe definido em sala.', tokens)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
            <section class="lesson-section">
              <h4>Exemplo resolvido</h4>
              <p>${highlightText(example, tokens)}</p>
            </section>
            <section class="lesson-section lesson-section--full">
              <h4>Lab guiado (passo a passo)</h4>
              ${labSteps}
            </section>
            <section class="lesson-section lesson-section--full">
              <h4>Desafio individual + gabarito</h4>
              ${challenge}
            </section>
            <section class="lesson-section">
              <h4>Checklist de prontidão</h4>
              <ul>${checklist.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}</ul>
            </section>
            <section class="lesson-section">
              <h4>Erros comuns</h4>
              <ul>${mistakes.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}</ul>
            </section>
            <section class="lesson-section">
              <h4>Tarefa</h4>
              <p>${highlightText(lesson.student?.homework || 'Tarefa definida em sala.', tokens)}</p>
            </section>
          </div>
          ${renderTeacherBlock(lesson, tokens)}
        </div>
      </details>
    `;
  };

  const renderModules = (tokens, matchedIds) => {
    if (!modulesContainer) {
      return;
    }

    const openLessons = new Set(
      [...document.querySelectorAll('details.lesson-card[open]')].map((detail) => detail.dataset.lessonId)
    );

    const modulesMarkup = guide.modules.map((module) => {
      const lessons = tokens.length
        ? module.lessons.filter((lesson) => matchedIds.has(lesson.id))
        : module.lessons;

      if (!lessons.length) {
        return '';
      }

      const completedCount = module.lessons.filter((lesson) => state.completed.has(lesson.id)).length;
      const progressPercent = Math.round((completedCount / module.lessons.length) * 100);

      return `
        <section class="module-card" id="module-${module.id}">
          <div class="module-header">
            <div>
              <h2>${highlightText(module.title, tokens)}</h2>
              <ul class="module-outcomes">
                ${module.outcomes.map((item) => `<li>${highlightText(item, tokens)}</li>`).join('')}
              </ul>
            </div>
            <div class="module-progress-card">
              <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPercent}">
                <span style="width: ${progressPercent}%"></span>
              </div>
              <div class="progress-count">${completedCount}/${module.lessons.length} aulas concluídas</div>
            </div>
          </div>
          <div class="module-lessons">
            ${lessons.map((lesson) => renderLesson(lesson, tokens, openLessons)).join('')}
          </div>
        </section>
      `;
    }).join('');

    modulesContainer.innerHTML = modulesMarkup || '<div class="empty-state">Nenhuma aula encontrada para esta busca.</div>';
  };

  const renderResults = (tokens, matches) => {
    if (!resultsContainer) {
      return;
    }

    if (!tokens.length) {
      resultsContainer.hidden = true;
      resultsContainer.innerHTML = '';
      return;
    }

    const resultsMarkup = matches.length
      ? `
        <div class="results-card">
          <div>
            <strong>Resultados para:</strong> "${escapeHtml(state.query.trim())}" (${matches.length} aulas)
          </div>
          <div class="results-list">
            ${matches.map((match) => `
              <div>
                <a href="#lesson-${match.lesson.id}">${highlightText(`${match.lesson.id} · ${match.lesson.title}`, tokens)}</a>
                <div class="results-meta">${highlightText(match.module.title, tokens)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : `
        <div class="results-card">
          <div>
            <strong>Nenhum resultado para:</strong> "${escapeHtml(state.query.trim())}"
          </div>
          <div class="results-meta">Tente outro termo ou revise a escrita.</div>
        </div>
      `;

    resultsContainer.hidden = false;
    resultsContainer.innerHTML = resultsMarkup;
  };

  const renderTemplates = () => {
    if (!templatesContainer || templatesContainer.dataset.ready === 'true') {
      return;
    }

    const templatesMarkup = `
      <div class="section-title">
        <p class="eyebrow">Templates</p>
        <h2>Templates prontos para copiar</h2>
        <p class="lead">Use estes modelos como base para as entregas das aulas.</p>
      </div>
      <div class="template-grid">
        ${guide.templates.map((template) => `
          <div class="template-card" data-template-id="${template.id}">
            <div class="template-head">
              <h3>${escapeHtml(template.title)}</h3>
              <button class="btn btn-outline btn-small" data-action="copy-template" data-template-id="${template.id}">Copiar</button>
            </div>
            <pre class="template-content">${escapeHtml(template.content)}</pre>
          </div>
        `).join('')}
      </div>
    `;

    templatesContainer.innerHTML = templatesMarkup;
    templatesContainer.dataset.ready = 'true';
  };

  const render = () => {
    const tokens = tokensFromQuery(state.query);
    const matchTokens = tokens.map((token) => normalizeText(token)).filter(Boolean);
    const matches = [];
    const matchedIds = new Set();

    if (matchTokens.length) {
      guide.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if (isLessonMatch(lesson, matchTokens)) {
            matches.push({ module, lesson });
            matchedIds.add(lesson.id);
          }
        });
      });
    }

    renderSidebar(tokens, matchedIds);
    renderModules(tokens, matchedIds);
    renderResults(tokens, matches);
    renderTemplates();
  };

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      render();
    });
  }

  document.addEventListener('click', async (event) => {
    const completeButton = event.target.closest('[data-action="toggle-complete"]');
    if (completeButton) {
      const lessonId = completeButton.dataset.lessonId;
      if (!lessonId) {
        return;
      }
      if (state.completed.has(lessonId)) {
        state.completed.delete(lessonId);
      } else {
        state.completed.add(lessonId);
      }
      setStored('guideCompleted', [...state.completed]);
      render();
      return;
    }

    const copyButton = event.target.closest('[data-action="copy-template"]');
    if (copyButton) {
      const templateId = copyButton.dataset.templateId;
      const template = guide.templates.find((item) => item.id === templateId);
      if (!template) {
        return;
      }

      let copied = false;
      try {
        await navigator.clipboard.writeText(template.content);
        copied = true;
      } catch (error) {
        const temp = document.createElement('textarea');
        temp.value = template.content;
        temp.style.position = 'fixed';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        try {
          document.execCommand('copy');
          copied = true;
        } catch (err) {
          copied = false;
        }
        temp.remove();
      }

      if (copied) {
        const originalLabel = copyButton.textContent;
        copyButton.textContent = 'Copiado!';
        copyButton.disabled = true;
        setTimeout(() => {
          copyButton.textContent = originalLabel;
          copyButton.disabled = false;
        }, 1600);
      }
    }
  });

  updateRoleToggle();
  buildLessonIndex();
  renderHero();
  render();
})();

