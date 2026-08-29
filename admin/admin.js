const SESSION_KEY = 'uniprix-cms-session';
const LEGACY_AUTH_KEY = 'uniprix-cms-auth';
const PUBLISH_KEY = 'uniprix-cms-last-publish';
const PUBLISH_HISTORY_KEY = 'uniprix-cms-publish-history';
const SESSION_LONG_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_SHORT_MS = 8 * 60 * 60 * 1000;

const PAGE_META = {
  site: {
    label: 'Site settings',
    desc: 'Navigation, contact info, social links, and global SEO.',
    path: '/',
    color: '#64748b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  },
  home: {
    label: 'Home',
    desc: 'Hero, services preview, stats, testimonials, and CTA.',
    path: '/',
    color: '#faa21b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>',
  },
  about: {
    label: 'About us',
    desc: 'Mission, vision, values, team, and company story.',
    path: '/about-us/',
    color: '#3b82f6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>',
  },
  services: {
    label: 'Services',
    desc: 'Service cards, descriptions, and hero content.',
    path: '/services/',
    color: '#8b5cf6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  },
  projects: {
    label: 'Our projects',
    desc: 'Project listings with images, locations, and details.',
    path: '/our-projects/',
    color: '#10b981',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V10l8-6 8 6v10"/><rect x="9" y="14" width="6" height="6"/></svg>',
  },
  gallery: {
    label: 'Gallery',
    desc: 'Photo gallery images and page headings.',
    path: '/gallery/',
    color: '#ec4899',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
  contact: {
    label: 'Contact us',
    desc: 'Contact page copy, form labels, and office details.',
    path: '/contact-us/',
    color: '#f59e0b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>',
  },
};

const PAGE_LABELS = Object.fromEntries(
  Object.entries(PAGE_META).map(([k, v]) => [k, v.label])
);

const IMAGE_KEYS = new Set(['image', 'img', 'src', 'icon', 'logo', 'avatar', 'photo', 'thumbnail', 'heroimage', 'ogimage']);
const LONG_TEXT_KEYS = new Set(['text', 'description', 'body', 'content', 'paragraph', 'quote', 'bio', 'summary', 'subheading', 'heading', 'overview', 'scope', 'subtitle', 'headline', 'text1', 'text2', 'tagline', 'defaultDescription']);

let config = null;
let auth = null;
let currentPage = 'dashboard';
let editingProjectIndex = null;
let editingGalleryIndex = null;
let homeSection = null;
let editingHomeList = null;
let editingHomeIndex = null;
let aboutSection = null;
let editingAboutList = null;
let editingAboutIndex = null;
let servicesSection = null;
let editingServicesIndex = null;
let siteSection = null;
let editingSiteList = null;
let editingSiteIndex = null;
let content = {};
let fileMeta = {};
let dashboardCharts = [];

const PROJECT_META_KEYS = ['Location', 'Project Type', 'Status'];

const $ = (sel) => document.querySelector(sel);

function setStatus(message, type = 'info') {
  const el = $('#status');
  if (!message) {
    el.classList.add('hidden');
    return;
  }
  el.textContent = message;
  el.className = `toast toast--${type}`;
}

function loadSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!session || session.expires < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(user, remember, token) {
  const expires = Date.now() + (remember ? SESSION_LONG_MS : SESSION_SHORT_MS);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, expires, token }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_AUTH_KEY);
  localStorage.removeItem('uniprix-cms-token');
}

function getSessionToken() {
  const session = loadSession();
  return session?.token || '';
}

function resolveApiUrl() {
  if (config?.apiUrl) return config.apiUrl.replace(/\/$/, '');
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    return 'http://localhost:8787';
  }
  return '';
}

async function apiFetch(path, options = {}) {
  const base = resolveApiUrl();
  if (!base) throw new Error('CMS API is not configured. Set apiUrl in admin/config.json.');

  const headers = {
    Authorization: `Bearer ${getSessionToken()}`,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `API error (${res.status})`);
  return data;
}

function buildAuthContext(user) {
  return {
    user,
    repo: config.repo,
    branch: config.branch || 'main',
  };
}

function getLastPublish() {
  try {
    return JSON.parse(localStorage.getItem(PUBLISH_KEY) || '{}');
  } catch {
    return {};
  }
}

function setLastPublish(page) {
  const data = getLastPublish();
  data[page] = new Date().toISOString();
  localStorage.setItem(PUBLISH_KEY, JSON.stringify(data));
  recordPublishHistory(page);
}

function getPublishHistory() {
  try {
    return JSON.parse(localStorage.getItem(PUBLISH_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function recordPublishHistory(page) {
  const history = getPublishHistory();
  history.push({ page, at: new Date().toISOString() });
  localStorage.setItem(PUBLISH_HISTORY_KEY, JSON.stringify(history.slice(-50)));
}

function formatRelativeTime(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function loadConfig() {
  const configRes = await fetch('/admin/config.json');
  config = await configRes.json();
}

async function githubRequest(path) {
  return apiFetch(`/api/file?path=${encodeURIComponent(path)}`);
}

async function githubListDir(path) {
  const data = await apiFetch(`/api/dir?path=${encodeURIComponent(path)}`);
  return Array.isArray(data) ? data : [];
}

function sanitizeFilename(name) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
  const base = parts.join('.')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';
  return `${base}${ext}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

async function uploadMediaFile(file) {
  if (!getSessionToken()) throw new Error('Sign in to upload images.');

  const maxMb = config.maxUploadMB || 10;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Image must be under ${maxMb} MB.`);
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    throw new Error('Use JPEG, PNG, WebP, GIF, or SVG.');
  }

  const mediaPath = config.mediaPath || 'media';
  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const path = `${mediaPath}/${filename}`;
  const base64 = await fileToBase64(file);

  await apiFetch('/api/file', {
    method: 'PUT',
    body: JSON.stringify({
      path,
      message: `CMS: upload ${filename}`,
      content: base64,
    }),
  });

  return `/${path}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function fetchLocalFile(path) {
  const res = await fetch(`/${path}`);
  if (!res.ok) throw new Error(`Local file not found: ${path}`);
  return res.json();
}

async function fetchFile(path) {
  try {
    const data = await githubRequest(path);
    const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    fileMeta[path] = { sha: data.sha };
    return JSON.parse(text);
  } catch (err) {
    const isMissing = /not found/i.test(err.message);
    if (!isMissing) throw err;
    try {
      return await fetchLocalFile(path);
    } catch {
      throw new Error(
        `"${path}" is not on GitHub yet. Push the CMS files to your repository, or run "npm run dev" locally.`
      );
    }
  }
}

async function saveFile(path, json) {
  const body = JSON.stringify(json, null, 2) + '\n';
  const encoded = btoa(unescape(encodeURIComponent(body)));
  const payload = {
    path,
    message: `CMS: update ${path}`,
    content: encoded,
  };
  if (fileMeta[path]?.sha) payload.sha = fileMeta[path].sha;

  const data = await apiFetch('/api/file', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  fileMeta[path] = { sha: data.content.sha };
}

async function loadAllContent() {
  setStatus('Loading content…');
  content = {};
  for (const [key, path] of Object.entries(config.contentFiles)) {
    try {
      content[key] = await fetchFile(path);
    } catch (err) {
      throw new Error(`${PAGE_LABELS[key] || key}: ${err.message}`);
    }
  }
  setStatus('');
}

function countItems(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    return Object.values(data).reduce((sum, v) => sum + countItems(v), 0);
  }
  return 0;
}

function getDashboardStats() {
  const projects = content.projects?.projects?.length ?? content.projects?.items?.length ?? 0;
  const gallery = content.gallery?.images?.length ?? content.gallery?.items?.length ?? 0;
  const testimonials = content.home?.testimonials?.reviews?.length ?? 0;
  const services = content.services?.cards?.length ?? content.home?.services?.items?.length ?? 0;
  const pages = Object.keys(config.contentFiles).filter((k) => k !== 'site').length;

  return { pages, projects, gallery, testimonials, services };
}

function getDashboardChartData() {
  const pageKeys = Object.keys(config.contentFiles).filter((k) => k !== 'site');
  const publish = getLastPublish();

  const contentByPage = pageKeys.map((key) => ({
    key,
    label: PAGE_LABELS[key] || key,
    count: countItems(content[key]),
    color: PAGE_META[key]?.color || '#64748b',
    lastPublish: publish[key] || null,
  }));

  const stats = getDashboardStats();
  const contentMix = {
    labels: ['Projects', 'Gallery', 'Testimonials', 'Services'],
    values: [stats.projects, stats.gallery, stats.testimonials, stats.services],
    colors: ['#10b981', '#ec4899', '#3b82f6', '#8b5cf6'],
  };

  const freshness = pageKeys.map((key) => {
    const iso = publish[key];
    if (!iso) return { label: PAGE_LABELS[key] || key, days: null, color: PAGE_META[key]?.color || '#64748b' };
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    return { label: PAGE_LABELS[key] || key, days, color: PAGE_META[key]?.color || '#64748b' };
  });

  const activity = { labels: [], values: [] };
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    activity.labels.push(d.toLocaleDateString('en', { weekday: 'short' }));
    activity.values.push(getPublishHistory().filter((h) => h.at.startsWith(key)).length);
  }

  return { contentByPage, contentMix, freshness, activity, stats };
}

function destroyDashboardCharts() {
  dashboardCharts.forEach((chart) => chart.destroy());
  dashboardCharts = [];
}

function waitForChart() {
  return new Promise((resolve) => {
    if (window.Chart) {
      resolve(true);
      return;
    }
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (window.Chart || attempts > 100) {
        clearInterval(timer);
        resolve(!!window.Chart);
      }
    }, 30);
  });
}

function addChart(canvas, config) {
  const chart = new Chart(canvas, config);
  dashboardCharts.push(chart);
  return chart;
}

function renderDashboardCharts() {
  destroyDashboardCharts();

  waitForChart().then((ready) => {
    if (!ready || !window.Chart) return;

    const { contentByPage, contentMix, freshness, activity } = getDashboardChartData();

    Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
    Chart.defaults.color = '#64748b';

    const contentCanvas = document.getElementById('chart-content-by-page');
    if (contentCanvas) {
      addChart(contentCanvas, {
        type: 'bar',
        data: {
          labels: contentByPage.map((p) => p.label),
          datasets: [{
            label: 'Content fields',
            data: contentByPage.map((p) => p.count),
            backgroundColor: contentByPage.map((p) => `${p.color}cc`),
            borderColor: contentByPage.map((p) => p.color),
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#0f2433',
              padding: 10,
              cornerRadius: 8,
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#e2e8f0' },
              ticks: { precision: 0 },
            },
          },
        },
      });
    }

    const mixCanvas = document.getElementById('chart-content-mix');
    if (mixCanvas) {
      addChart(mixCanvas, {
        type: 'doughnut',
        data: {
          labels: contentMix.labels,
          datasets: [{
            data: contentMix.values,
            backgroundColor: contentMix.colors,
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 14, font: { size: 11 } },
            },
          },
        },
      });
    }

    const freshnessCanvas = document.getElementById('chart-freshness');
    if (freshnessCanvas) {
      const labels = freshness.map((f) => f.label);
      const published = freshness.filter((f) => f.days !== null);
      const maxDays = Math.max(30, ...published.map((f) => f.days), 1);

      addChart(freshnessCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Days since last publish',
            data: freshness.map((f) => (f.days === null ? maxDays : f.days)),
            backgroundColor: freshness.map((f) => (f.days === null ? '#e2e8f0' : `${f.color}bb`)),
            borderColor: freshness.map((f) => (f.days === null ? '#cbd5e1' : f.color)),
            borderWidth: 1,
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const f = freshness[ctx.dataIndex];
                  return f.days === null ? 'Never published' : `${f.days} day${f.days === 1 ? '' : 's'} ago`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: '#e2e8f0' },
              title: { display: true, text: 'Days since publish', font: { size: 11 } },
            },
            y: { grid: { display: false } },
          },
        },
      });
    }

    const activityCanvas = document.getElementById('chart-activity');
    if (activityCanvas) {
      addChart(activityCanvas, {
        type: 'line',
        data: {
          labels: activity.labels,
          datasets: [{
            label: 'Publishes',
            data: activity.values,
            borderColor: '#faa21b',
            backgroundColor: 'rgba(250, 162, 27, 0.15)',
            borderWidth: 2.5,
            pointBackgroundColor: '#faa21b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            tension: 0.35,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, precision: 0 },
              grid: { color: '#e2e8f0' },
            },
          },
        },
      });
    }
  });
}

function navigateTo(page) {
  if (page !== 'projects') editingProjectIndex = null;
  if (page !== 'gallery') editingGalleryIndex = null;
  if (page !== 'home') {
    homeSection = null;
    editingHomeList = null;
    editingHomeIndex = null;
  }
  if (page !== 'about') {
    aboutSection = null;
    editingAboutList = null;
    editingAboutIndex = null;
  }
  if (page !== 'services') {
    servicesSection = null;
    editingServicesIndex = null;
  }
  if (page !== 'site') {
    siteSection = null;
    editingSiteList = null;
    editingSiteIndex = null;
  }
  currentPage = page;
  buildNav();
  renderView();
  $('#sidebar')?.classList.remove('is-open');
}

function getProjectMeta(project, key) {
  return project.meta?.find((row) => row.key === key)?.value || '';
}

function setProjectMeta(project, key, value) {
  const meta = [...(project.meta || [])];
  const index = meta.findIndex((row) => row.key === key);
  if (index >= 0) meta[index] = { ...meta[index], value };
  else meta.push({ key, value });
  return { ...project, meta };
}

function updateProjectsList(updater) {
  const projects = updater([...content.projects.projects]);
  content.projects = { ...content.projects, projects };
}

function updateProject(index, patch) {
  updateProjectsList((projects) => {
    projects[index] = { ...projects[index], ...patch };
    return projects;
  });
}

function openProjectEditor(index) {
  editingProjectIndex = index;
  renderView();
}

function closeProjectEditor() {
  editingProjectIndex = null;
  renderView();
}

function createBlankProject(index) {
  const num = String(index + 1).padStart(2, '0');
  return {
    id: `project-${index + 1}`,
    number: num,
    variant: (index + 1) % 2 === 0 ? 'amber' : 'blue',
    title: 'New Project',
    meta: PROJECT_META_KEYS.map((key) => ({ key, value: '' })),
    overview: '',
    details: [],
    scope: '',
    images: [],
  };
}

function addProject() {
  updateProjectsList((projects) => [...projects, createBlankProject(projects.length)]);
  openProjectEditor(content.projects.projects.length - 1);
}

function removeProject(index) {
  const title = content.projects.projects[index]?.title || `Project ${index + 1}`;
  if (!window.confirm(`Remove "${title}"? This cannot be undone until you reload without publishing.`)) return;
  updateProjectsList((projects) => projects.filter((_, i) => i !== index));
  editingProjectIndex = null;
  renderView();
}

function buildProjectCard(project, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `project-card project-card--${project.variant || 'blue'}`;
  const thumb = project.images?.[0]?.src || '';
  const location = getProjectMeta(project, 'Location');
  const status = getProjectMeta(project, 'Status');
  const imageCount = project.images?.length || 0;

  card.innerHTML = `
    <div class="project-card__media">
      ${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : '<div class="project-card__placeholder">No image</div>'}
      <span class="project-card__badge">${project.number || String(index + 1).padStart(2, '0')}</span>
    </div>
    <div class="project-card__body">
      <h4>${project.title || 'Untitled project'}</h4>
      <p class="project-card__meta">${location || 'No location'}${status ? ` · ${status}` : ''}</p>
      <p class="project-card__count">${imageCount} image${imageCount === 1 ? '' : 's'}</p>
    </div>
    <span class="project-card__edit">Edit project</span>
  `;

  card.addEventListener('click', () => openProjectEditor(index));
  return card;
}

function renderDetailsEditor(project, index) {
  const wrap = document.createElement('div');
  wrap.className = 'detail-list';

  const renderItems = () => {
    wrap.innerHTML = '';
    const details = project.details || [];

    details.forEach((detail, detailIndex) => {
      const row = document.createElement('div');
      row.className = 'detail-list__row';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = detail;
      input.placeholder = 'e.g. 4 bedrooms (2 ensuite)';
      input.addEventListener('input', () => {
        const next = [...(content.projects.projects[index].details || [])];
        next[detailIndex] = input.value;
        updateProject(index, { details: next });
        project.details = next;
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        const next = (content.projects.projects[index].details || []).filter((_, i) => i !== detailIndex);
        updateProject(index, { details: next });
        project.details = next;
        renderItems();
      });

      row.append(input, removeBtn);
      wrap.appendChild(row);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-ghost';
    addBtn.textContent = '+ Add detail';
    addBtn.addEventListener('click', () => {
      const next = [...(content.projects.projects[index].details || []), ''];
      updateProject(index, { details: next });
      project.details = next;
      renderItems();
    });
    wrap.appendChild(addBtn);
  };

  renderItems();
  return wrap;
}

function renderImagesEditor(project, index) {
  const wrap = document.createElement('div');
  wrap.className = 'project-images';

  const renderItems = () => {
    wrap.innerHTML = '';
    const images = content.projects.projects[index].images || [];

    images.forEach((image, imageIndex) => {
      const card = document.createElement('div');
      card.className = 'project-image-card';

      const preview = document.createElement('img');
      preview.className = 'project-image-card__preview';
      preview.alt = image.alt || '';
      preview.src = image.src || '';

      const fields = document.createElement('div');
      fields.className = 'project-image-card__fields';

      const srcField = createField('src', image.src, (_, value) => {
        const next = [...content.projects.projects[index].images];
        next[imageIndex] = { ...next[imageIndex], src: value };
        updateProject(index, { images: next });
        preview.src = value;
      });

      const altField = createField('alt', image.alt, (_, value) => {
        const next = [...content.projects.projects[index].images];
        next[imageIndex] = { ...next[imageIndex], alt: value };
        updateProject(index, { images: next });
        preview.alt = value;
      });

      const actions = document.createElement('div');
      actions.className = 'project-image-card__actions';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        const next = (content.projects.projects[index].images || []).filter((_, i) => i !== imageIndex);
        updateProject(index, { images: next });
        renderItems();
      });

      actions.appendChild(removeBtn);
      fields.append(srcField, altField, actions);
      card.append(preview, fields);
      wrap.appendChild(card);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-ghost project-images__add';
    addBtn.textContent = '+ Add image';
    addBtn.addEventListener('click', () => {
      const next = [...(content.projects.projects[index].images || []), { src: '', alt: '' }];
      updateProject(index, { images: next });
      renderItems();
    });
    wrap.appendChild(addBtn);
  };

  renderItems();
  return wrap;
}

function renderProjectDetail(editor, index) {
  const project = content.projects.projects[index];
  if (!project) {
    editingProjectIndex = null;
    renderProjectsEditor();
    return;
  }

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'project-editor-back';
  back.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    Back to all projects
  `;
  back.addEventListener('click', closeProjectEditor);
  editor.appendChild(back);

  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing project ${project.number || index + 1}. Publish when you are done.</p>`;

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete project';
  deleteBtn.addEventListener('click', () => removeProject(index));
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);

  const basics = document.createElement('div');
  basics.className = 'grid-2';
  basics.appendChild(createField('title', project.title, (_, value) => updateProject(index, { title: value })));

  const numberField = createField('number', project.number, (_, value) => updateProject(index, { number: value }));
  basics.appendChild(numberField);

  const variantWrap = document.createElement('div');
  variantWrap.className = 'field';
  const variantLabel = document.createElement('label');
  variantLabel.textContent = 'Layout style';
  const variantSelect = document.createElement('select');
  [
    { value: 'blue', label: 'Blue — image on the right' },
    { value: 'amber', label: 'Amber — image on the left' },
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (project.variant === value) opt.selected = true;
    variantSelect.appendChild(opt);
  });
  variantSelect.addEventListener('change', () => updateProject(index, { variant: variantSelect.value }));
  variantWrap.append(variantLabel, variantSelect);
  basics.appendChild(variantWrap);

  const idField = createField('id', project.id, (_, value) => updateProject(index, { id: value }));
  basics.appendChild(idField);
  editor.appendChild(makeSection('Project basics', basics, false));

  const metaGrid = document.createElement('div');
  metaGrid.className = 'grid-2';
  PROJECT_META_KEYS.forEach((key) => {
    metaGrid.appendChild(createField(key, getProjectMeta(project, key), (_, value) => {
      updateProject(index, setProjectMeta(content.projects.projects[index], key, value));
    }));
  });
  editor.appendChild(makeSection('Location & status', metaGrid, false));

  const contentGrid = document.createElement('div');
  contentGrid.className = 'grid-1';
  contentGrid.appendChild(createField('overview', project.overview, (_, value) => updateProject(index, { overview: value })));
  contentGrid.appendChild(createField('scope', project.scope, (_, value) => updateProject(index, { scope: value })));
  editor.appendChild(makeSection('Project description', contentGrid, false));

  editor.appendChild(makeSection('Key details', renderDetailsEditor(project, index), false));
  editor.appendChild(makeSection('Project images', renderImagesEditor(project, index), false));
}

function renderProjectsEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingProjectIndex !== null) {
    renderProjectDetail(editor, editingProjectIndex);
    return;
  }

  const pageData = content.projects;
  const pageSettings = document.createElement('div');
  pageSettings.className = 'grid-2';
  pageSettings.appendChild(createField('heroTitle', pageData.heroTitle, (_, value) => {
    content.projects = { ...content.projects, heroTitle: value };
  }));
  pageSettings.appendChild(createField('heroImage', pageData.heroImage, (_, value) => {
    content.projects = { ...content.projects, heroImage: value };
  }));
  editor.appendChild(makeSection('Page header', pageSettings));

  const introGrid = document.createElement('div');
  introGrid.className = 'grid-1';
  introGrid.appendChild(createField('heading', pageData.intro?.heading, (_, value) => {
    content.projects = { ...content.projects, intro: { ...content.projects.intro, heading: value } };
  }));
  introGrid.appendChild(createField('text', pageData.intro?.text, (_, value) => {
    content.projects = { ...content.projects, intro: { ...content.projects.intro, text: value } };
  }));
  introGrid.appendChild(createField('label', pageData.intro?.label, (_, value) => {
    content.projects = { ...content.projects, intro: { ...content.projects.intro, label: value } };
  }));
  editor.appendChild(makeSection('Page introduction', introGrid));

  const toolbar = document.createElement('div');
  toolbar.className = 'projects-toolbar';
  toolbar.innerHTML = `
    <div>
      <h3 class="projects-toolbar__title">All projects</h3>
      <p class="hint">Click a project to edit its details, images, and description.</p>
    </div>
  `;
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-accent';
  addBtn.textContent = '+ Add project';
  addBtn.addEventListener('click', addProject);
  toolbar.appendChild(addBtn);
  editor.appendChild(toolbar);

  const grid = document.createElement('div');
  grid.className = 'project-cards';
  (pageData.projects || []).forEach((project, index) => {
    grid.appendChild(buildProjectCard(project, index));
  });
  editor.appendChild(grid);

  if (!pageData.projects?.length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = 'No projects yet. Add your first project above.';
    editor.appendChild(empty);
  }
}

function updateGalleryItems(updater) {
  const items = updater([...(content.gallery.items || [])]);
  content.gallery = { ...content.gallery, items };
}

function updateGalleryItem(index, patch) {
  updateGalleryItems((items) => {
    items[index] = { ...items[index], ...patch };
    return items;
  });
}

function openGalleryEditor(index) {
  editingGalleryIndex = index;
  renderView();
}

function closeGalleryEditor() {
  editingGalleryIndex = null;
  renderView();
}

function createBlankGalleryItem() {
  return { src: '', alt: '', mobileOnly: false };
}

function addGalleryItem() {
  updateGalleryItems((items) => [...items, createBlankGalleryItem()]);
  openGalleryEditor((content.gallery.items || []).length - 1);
}

function removeGalleryItem(index) {
  const alt = content.gallery.items[index]?.alt || `Image ${index + 1}`;
  if (!window.confirm(`Remove "${alt}" from the gallery?`)) return;
  updateGalleryItems((items) => items.filter((_, i) => i !== index));
  editingGalleryIndex = null;
  renderView();
}

function moveGalleryItem(index, direction) {
  const items = [...(content.gallery.items || [])];
  const target = index + direction;
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  content.gallery = { ...content.gallery, items };
  editingGalleryIndex = target;
  renderView();
}

function buildGalleryCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `gallery-cms-card${item.mobileOnly ? ' gallery-cms-card--mobile' : ''}`;

  card.innerHTML = `
    <div class="gallery-cms-card__media">
      ${item.src ? `<img src="${item.src}" alt="" loading="lazy">` : '<div class="gallery-cms-card__placeholder">No image</div>'}
      <span class="gallery-cms-card__index">${index + 1}</span>
      ${item.mobileOnly ? '<span class="gallery-cms-card__badge">Mobile only</span>' : ''}
    </div>
    <div class="gallery-cms-card__body">
      <p>${item.alt || 'No description'}</p>
      <span class="gallery-cms-card__edit">Edit image</span>
    </div>
  `;

  card.addEventListener('click', () => openGalleryEditor(index));
  return card;
}

function createCheckboxField(label, checked, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'field field--checkbox';

  const row = document.createElement('label');
  row.className = 'checkbox-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  row.append(input, document.createTextNode(` ${label}`));
  wrap.appendChild(row);
  return wrap;
}

function renderGalleryItemDetail(editor, index) {
  const item = content.gallery.items?.[index];
  if (!item) {
    editingGalleryIndex = null;
    renderGalleryEditor();
    return;
  }

  const total = content.gallery.items.length;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'project-editor-back';
  back.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    Back to gallery
  `;
  back.addEventListener('click', closeGalleryEditor);
  editor.appendChild(back);

  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing image ${index + 1} of ${total}. Publish when you are done.</p>`;

  const moveGroup = document.createElement('div');
  moveGroup.className = 'gallery-editor-moves';

  const moveUp = document.createElement('button');
  moveUp.type = 'button';
  moveUp.className = 'btn btn-ghost';
  moveUp.textContent = 'Move up';
  moveUp.disabled = index === 0;
  moveUp.addEventListener('click', () => moveGalleryItem(index, -1));

  const moveDown = document.createElement('button');
  moveDown.type = 'button';
  moveDown.className = 'btn btn-ghost';
  moveDown.textContent = 'Move down';
  moveDown.disabled = index === total - 1;
  moveDown.addEventListener('click', () => moveGalleryItem(index, 1));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete image';
  deleteBtn.addEventListener('click', () => removeGalleryItem(index));

  moveGroup.append(moveUp, moveDown);
  actions.prepend(moveGroup);
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);

  const previewWrap = document.createElement('div');
  previewWrap.className = 'gallery-editor-preview';
  const preview = document.createElement('img');
  preview.className = 'gallery-editor-preview__image';
  preview.alt = item.alt || '';
  preview.src = item.src || '';
  previewWrap.appendChild(preview);
  editor.appendChild(makeSection('Preview', previewWrap, false));

  const fields = document.createElement('div');
  fields.className = 'grid-1';

  const srcField = createField('src', item.src, (_, value) => {
    updateGalleryItem(index, { src: value });
    preview.src = value;
  });
  fields.appendChild(srcField);

  const altField = createField('alt', item.alt, (_, value) => {
    updateGalleryItem(index, { alt: value });
    preview.alt = value;
  });
  fields.appendChild(altField);

  fields.appendChild(createCheckboxField(
    'Show on mobile only (hidden on desktop)',
    item.mobileOnly,
    (value) => updateGalleryItem(index, { mobileOnly: value })
  ));

  editor.appendChild(makeSection('Image details', fields, false));
}

function renderGalleryEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingGalleryIndex !== null) {
    renderGalleryItemDetail(editor, editingGalleryIndex);
    return;
  }

  const pageData = content.gallery;
  const pageSettings = document.createElement('div');
  pageSettings.className = 'grid-2';
  pageSettings.appendChild(createField('heroTitle', pageData.heroTitle, (_, value) => {
    content.gallery = { ...content.gallery, heroTitle: value };
  }));
  pageSettings.appendChild(createField('heroImage', pageData.heroImage, (_, value) => {
    content.gallery = { ...content.gallery, heroImage: value };
  }));
  editor.appendChild(makeSection('Page header', pageSettings));

  const introGrid = document.createElement('div');
  introGrid.className = 'grid-1';
  introGrid.appendChild(createField('heading', pageData.heading, (_, value) => {
    content.gallery = { ...content.gallery, heading: value };
  }));
  introGrid.appendChild(createField('subtitle', pageData.subtitle, (_, value) => {
    content.gallery = { ...content.gallery, subtitle: value };
  }));
  editor.appendChild(makeSection('Page introduction', introGrid));

  const toolbar = document.createElement('div');
  toolbar.className = 'projects-toolbar';
  toolbar.innerHTML = `
    <div>
      <h3 class="projects-toolbar__title">Gallery images</h3>
      <p class="hint">Click an image to edit it. Order here matches the live gallery grid.</p>
    </div>
  `;
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-accent';
  addBtn.textContent = '+ Add image';
  addBtn.addEventListener('click', addGalleryItem);
  toolbar.appendChild(addBtn);
  editor.appendChild(toolbar);

  const grid = document.createElement('div');
  grid.className = 'gallery-cms-grid';
  (pageData.items || []).forEach((item, index) => {
    grid.appendChild(buildGalleryCard(item, index));
  });
  editor.appendChild(grid);

  if (!pageData.items?.length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = 'No gallery images yet. Add your first image above.';
    editor.appendChild(empty);
  }
}

const HOME_SECTIONS = {
  hero: {
    label: 'Hero banner',
    desc: 'Headline, buttons, hero image, and statistics.',
    color: '#faa21b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/></svg>',
  },
  about: {
    label: 'About preview',
    desc: 'Short about section with image and link.',
    color: '#3b82f6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>',
  },
  services: {
    label: 'Services carousel',
    desc: 'Service cards in the homepage slider.',
    color: '#8b5cf6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  },
  whyChooseUs: {
    label: 'Why choose us',
    desc: 'Feature highlights and supporting image.',
    color: '#10b981',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
  },
  projects: {
    label: 'Projects carousel',
    desc: 'Project category cards linking to the projects page.',
    color: '#f59e0b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V10l8-6 8 6v10"/></svg>',
  },
  testimonials: {
    label: 'Testimonials',
    desc: 'Client reviews shown in the carousel.',
    color: '#ec4899',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
  cta: {
    label: 'Bottom call to action',
    desc: 'Banner above the footer with heading and image.',
    color: '#64748b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M12 8v8"/></svg>',
  },
};

const HOME_LIST_PATHS = {
  stats: ['hero', 'stats'],
  services: ['services', 'items'],
  features: ['whyChooseUs', 'features'],
  projectCards: ['projects', 'items'],
  reviews: ['testimonials', 'reviews'],
};

const HOME_LIST_LABELS = {
  stats: 'hero stats',
  services: 'services',
  features: 'features',
  projectCards: 'project cards',
  reviews: 'reviews',
};

const HOME_ITEM_BLANKS = {
  stats: { icon: '', number: '', label: '' },
  services: { title: '', description: '', image: '', imageAlt: '' },
  features: { icon: '', title: '', description: '' },
  projectCards: { id: '', title: '', image: '', link: '' },
  reviews: { name: '', text: '', image: '' },
};

function getHomeList(listName) {
  const [section, key] = HOME_LIST_PATHS[listName];
  return content.home[section]?.[key] || [];
}

function updateHomeSection(section, patch) {
  content.home = { ...content.home, [section]: { ...content.home[section], ...patch } };
}

function updateHomeList(listName, updater) {
  const [section, key] = HOME_LIST_PATHS[listName];
  const items = updater([...getHomeList(listName)]);
  content.home = { ...content.home, [section]: { ...content.home[section], [key]: items } };
}

function updateHomeListItem(listName, index, patch) {
  updateHomeList(listName, (items) => {
    items[index] = { ...items[index], ...patch };
    return items;
  });
}

function openHomeSection(section) {
  homeSection = section;
  editingHomeList = null;
  editingHomeIndex = null;
  renderView();
}

function closeHomeSection() {
  homeSection = null;
  editingHomeList = null;
  editingHomeIndex = null;
  renderView();
}

function openHomeItem(listName, index) {
  editingHomeList = listName;
  editingHomeIndex = index;
  renderView();
}

function closeHomeItem() {
  editingHomeList = null;
  editingHomeIndex = null;
  renderView();
}

function addHomeListItem(listName) {
  updateHomeList(listName, (items) => [...items, { ...HOME_ITEM_BLANKS[listName] }]);
  openHomeItem(listName, getHomeList(listName).length - 1);
}

function removeHomeListItem(listName, index) {
  const item = getHomeList(listName)[index];
  const label = item?.title || item?.name || item?.label || `Item ${index + 1}`;
  if (!window.confirm(`Remove "${label}"?`)) return;
  updateHomeList(listName, (items) => items.filter((_, i) => i !== index));
  editingHomeList = null;
  editingHomeIndex = null;
  renderView();
}

function moveHomeListItem(listName, index, direction) {
  const target = index + direction;
  const items = [...getHomeList(listName)];
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  const [section, key] = HOME_LIST_PATHS[listName];
  content.home = { ...content.home, [section]: { ...content.home[section], [key]: items } };
  editingHomeIndex = target;
  renderView();
}

function appendBackButton(editor, label, onClick) {
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'project-editor-back';
  back.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    ${label}
  `;
  back.addEventListener('click', onClick);
  editor.appendChild(back);
}

function appendListToolbar(editor, title, hint, addLabel, onAdd) {
  const toolbar = document.createElement('div');
  toolbar.className = 'projects-toolbar';
  toolbar.innerHTML = `
    <div>
      <h3 class="projects-toolbar__title">${title}</h3>
      <p class="hint">${hint}</p>
    </div>
  `;
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-accent';
  addBtn.textContent = addLabel;
  addBtn.addEventListener('click', onAdd);
  toolbar.appendChild(addBtn);
  editor.appendChild(toolbar);
}

function appendItemActions(editor, listName, index) {
  const total = getHomeList(listName).length;
  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing item ${index + 1} of ${total}.</p>`;

  const moveGroup = document.createElement('div');
  moveGroup.className = 'gallery-editor-moves';

  const moveUp = document.createElement('button');
  moveUp.type = 'button';
  moveUp.className = 'btn btn-ghost';
  moveUp.textContent = 'Move up';
  moveUp.disabled = index === 0;
  moveUp.addEventListener('click', () => moveHomeListItem(listName, index, -1));

  const moveDown = document.createElement('button');
  moveDown.type = 'button';
  moveDown.className = 'btn btn-ghost';
  moveDown.textContent = 'Move down';
  moveDown.disabled = index === total - 1;
  moveDown.addEventListener('click', () => moveHomeListItem(listName, index, 1));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => removeHomeListItem(listName, index));

  moveGroup.append(moveUp, moveDown);
  actions.prepend(moveGroup);
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);
}

function buildHomeListCard(item, index, listName, config) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'home-list-card';
  const image = config.imageKey ? item[config.imageKey] : '';
  const title = config.titleKey ? item[config.titleKey] : '';
  const subtitle = config.subtitleKey ? item[config.subtitleKey] : '';

  card.innerHTML = `
    <div class="home-list-card__media">
      ${image ? `<img src="${image}" alt="" loading="lazy">` : '<div class="gallery-cms-card__placeholder">No image</div>'}
      <span class="gallery-cms-card__index">${index + 1}</span>
    </div>
    <div class="home-list-card__body">
      <h4>${title || config.fallbackTitle || 'Untitled'}</h4>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
      <span class="gallery-cms-card__edit">Edit</span>
    </div>
  `;

  card.addEventListener('click', () => openHomeItem(listName, index));
  return card;
}

function appendHomeListGrid(editor, listName, config) {
  const grid = document.createElement('div');
  grid.className = 'gallery-cms-grid';
  getHomeList(listName).forEach((item, index) => {
    grid.appendChild(buildHomeListCard(item, index, listName, config));
  });
  editor.appendChild(grid);

  if (!getHomeList(listName).length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = config.emptyText || 'No items yet.';
    editor.appendChild(empty);
  }
}

function renderHomeItemDetail(editor, listName, index) {
  const item = getHomeList(listName)[index];
  if (!item) {
    closeHomeItem();
    return;
  }

  appendBackButton(editor, `Back to ${HOME_SECTIONS[homeSection]?.label || 'section'}`, closeHomeItem);
  appendItemActions(editor, listName, index);

  const fields = document.createElement('div');
  fields.className = 'grid-1';

  let preview = null;
  if (item.image || item.icon) {
    preview = document.createElement('img');
    preview.className = 'gallery-editor-preview__image';
    preview.src = item.image || item.icon || '';
    preview.alt = '';
    const previewWrap = document.createElement('div');
    previewWrap.className = 'gallery-editor-preview';
    previewWrap.appendChild(preview);
    editor.appendChild(makeSection('Preview', previewWrap, false));
  }

  Object.keys(HOME_ITEM_BLANKS[listName]).forEach((key) => {
    fields.appendChild(createField(key, item[key], (_, value) => {
      updateHomeListItem(listName, index, { [key]: value });
      if (preview && (key === 'image' || key === 'icon')) preview.src = value;
    }));
  });

  editor.appendChild(makeSection('Details', fields, false));
}

function renderHomeHeroSection(editor) {
  const hero = content.home.hero;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const main = document.createElement('div');
  main.className = 'grid-1';
  main.appendChild(createField('headline', hero.headline, (_, value) => updateHomeSection('hero', { headline: value })));
  const headlineHint = document.createElement('p');
  headlineHint.className = 'hint';
  headlineHint.textContent = 'HTML is allowed — e.g. <br> for line breaks and <span class="upx-hl-amber"> for highlighted text.';
  main.appendChild(headlineHint);
  main.appendChild(createField('subtitle', hero.subtitle, (_, value) => updateHomeSection('hero', { subtitle: value })));
  editor.appendChild(makeSection('Headline & intro', main, false));

  const ctas = document.createElement('div');
  ctas.className = 'grid-2';
  ctas.appendChild(createField('ctaBook', hero.ctaBook, (_, value) => updateHomeSection('hero', { ctaBook: value })));
  ctas.appendChild(createField('ctaBookLink', hero.ctaBookLink, (_, value) => updateHomeSection('hero', { ctaBookLink: value })));
  ctas.appendChild(createField('ctaTalk', hero.ctaTalk, (_, value) => updateHomeSection('hero', { ctaTalk: value })));
  ctas.appendChild(createField('ctaTalkLink', hero.ctaTalkLink, (_, value) => updateHomeSection('hero', { ctaTalkLink: value })));
  editor.appendChild(makeSection('Call-to-action buttons', ctas, false));

  const visual = document.createElement('div');
  visual.className = 'grid-2';
  visual.appendChild(createField('image', hero.image, (_, value) => updateHomeSection('hero', { image: value })));
  visual.appendChild(createField('imageAlt', hero.imageAlt, (_, value) => updateHomeSection('hero', { imageAlt: value })));
  editor.appendChild(makeSection('Hero image', visual, false));

  appendListToolbar(editor, 'Statistics', 'Numbers shown below the hero buttons.', '+ Add stat', () => addHomeListItem('stats'));
  appendHomeListGrid(editor, 'stats', {
    imageKey: 'icon',
    titleKey: 'number',
    subtitleKey: 'label',
    fallbackTitle: 'Stat',
    emptyText: 'No stats yet. Add your first stat above.',
  });
}

function renderHomeAboutSection(editor) {
  const about = content.home.about;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('label', about.label, (_, value) => updateHomeSection('about', { label: value })));
  grid.appendChild(createField('text1', about.text1, (_, value) => updateHomeSection('about', { text1: value })));
  grid.appendChild(createField('text2', about.text2, (_, value) => updateHomeSection('about', { text2: value })));
  grid.appendChild(createField('image', about.image, (_, value) => updateHomeSection('about', { image: value })));
  grid.appendChild(createField('imageAlt', about.imageAlt, (_, value) => updateHomeSection('about', { imageAlt: value })));
  grid.appendChild(createField('buttonText', about.buttonText, (_, value) => updateHomeSection('about', { buttonText: value })));
  grid.appendChild(createField('buttonLink', about.buttonLink, (_, value) => updateHomeSection('about', { buttonLink: value })));
  editor.appendChild(makeSection('About preview', grid, false));
}

function renderHomeServicesSection(editor) {
  const services = content.home.services;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const heading = document.createElement('div');
  heading.className = 'grid-1';
  heading.appendChild(createField('heading', services.heading, (_, value) => updateHomeSection('services', { heading: value })));
  editor.appendChild(makeSection('Section heading', heading, false));

  appendListToolbar(editor, 'Service cards', 'Cards shown in the homepage services carousel.', '+ Add service', () => addHomeListItem('services'));
  appendHomeListGrid(editor, 'services', {
    imageKey: 'image',
    titleKey: 'title',
    subtitleKey: 'description',
    emptyText: 'No services yet. Add your first service above.',
  });
}

function renderHomeWhySection(editor) {
  const why = content.home.whyChooseUs;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const intro = document.createElement('div');
  intro.className = 'grid-1';
  intro.appendChild(createField('label', why.label, (_, value) => updateHomeSection('whyChooseUs', { label: value })));
  intro.appendChild(createField('subtitle', why.subtitle, (_, value) => updateHomeSection('whyChooseUs', { subtitle: value })));
  intro.appendChild(createField('image', why.image, (_, value) => updateHomeSection('whyChooseUs', { image: value })));
  intro.appendChild(createField('imageAlt', why.imageAlt, (_, value) => updateHomeSection('whyChooseUs', { imageAlt: value })));
  editor.appendChild(makeSection('Section content', intro, false));

  const ctas = document.createElement('div');
  ctas.className = 'grid-2';
  ctas.appendChild(createField('ctaBookLink', why.ctaBookLink, (_, value) => updateHomeSection('whyChooseUs', { ctaBookLink: value })));
  ctas.appendChild(createField('ctaTalkLink', why.ctaTalkLink, (_, value) => updateHomeSection('whyChooseUs', { ctaTalkLink: value })));
  editor.appendChild(makeSection('Section buttons', ctas, false));

  appendListToolbar(editor, 'Features', 'Highlight cards in the why choose us grid.', '+ Add feature', () => addHomeListItem('features'));
  appendHomeListGrid(editor, 'features', {
    imageKey: 'icon',
    titleKey: 'title',
    subtitleKey: 'description',
    emptyText: 'No features yet. Add your first feature above.',
  });
}

function renderHomeProjectsSection(editor) {
  const projects = content.home.projects;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const heading = document.createElement('div');
  heading.className = 'grid-1';
  heading.appendChild(createField('heading', projects.heading, (_, value) => updateHomeSection('projects', { heading: value })));
  editor.appendChild(makeSection('Section heading', heading, false));

  appendListToolbar(editor, 'Project cards', 'Category cards in the homepage projects carousel.', '+ Add card', () => addHomeListItem('projectCards'));
  appendHomeListGrid(editor, 'projectCards', {
    imageKey: 'image',
    titleKey: 'title',
    emptyText: 'No project cards yet. Add your first card above.',
  });
}

function renderHomeTestimonialsSection(editor) {
  const testimonials = content.home.testimonials;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const intro = document.createElement('div');
  intro.className = 'grid-1';
  intro.appendChild(createField('heading', testimonials.heading, (_, value) => updateHomeSection('testimonials', { heading: value })));
  intro.appendChild(createField('subheading', testimonials.subheading, (_, value) => updateHomeSection('testimonials', { subheading: value })));
  intro.appendChild(createField('ctaText', testimonials.ctaText, (_, value) => updateHomeSection('testimonials', { ctaText: value })));
  intro.appendChild(createField('ctaLink', testimonials.ctaLink, (_, value) => updateHomeSection('testimonials', { ctaLink: value })));
  editor.appendChild(makeSection('Section settings', intro, false));

  appendListToolbar(editor, 'Client reviews', 'Reviews shown in the testimonials carousel.', '+ Add review', () => addHomeListItem('reviews'));
  appendHomeListGrid(editor, 'reviews', {
    imageKey: 'image',
    titleKey: 'name',
    subtitleKey: 'text',
    emptyText: 'No reviews yet. Add your first review above.',
  });
}

function renderHomeCtaSection(editor) {
  const cta = content.home.cta;
  appendBackButton(editor, 'Back to all sections', closeHomeSection);

  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', cta.heading, (_, value) => updateHomeSection('cta', { heading: value })));
  grid.appendChild(createField('image', cta.image, (_, value) => updateHomeSection('cta', { image: value })));
  editor.appendChild(makeSection('Bottom CTA banner', grid, false));
}

function renderHomeSectionEditor(editor, section) {
  const renderers = {
    hero: renderHomeHeroSection,
    about: renderHomeAboutSection,
    services: renderHomeServicesSection,
    whyChooseUs: renderHomeWhySection,
    projects: renderHomeProjectsSection,
    testimonials: renderHomeTestimonialsSection,
    cta: renderHomeCtaSection,
  };
  renderers[section]?.(editor);
}

function renderHomeOverview(editor) {
  const intro = document.createElement('div');
  intro.className = 'dashboard__hero';
  intro.innerHTML = `
    <h2>Home page sections</h2>
    <p>Select a section to edit. Each area matches a block on your homepage.</p>
  `;
  editor.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'page-cards';

  Object.entries(HOME_SECTIONS).forEach(([key, meta]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    const count = (() => {
      if (key === 'hero') return content.home.hero?.stats?.length || 0;
      if (key === 'services') return content.home.services?.items?.length || 0;
      if (key === 'whyChooseUs') return content.home.whyChooseUs?.features?.length || 0;
      if (key === 'projects') return content.home.projects?.items?.length || 0;
      if (key === 'testimonials') return content.home.testimonials?.reviews?.length || 0;
      return null;
    })();

    card.innerHTML = `
      <div class="page-card__top">
        <div class="page-card__icon" style="background:${meta.color}18;color:${meta.color}">${meta.icon}</div>
        <svg class="page-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <h3>${meta.label}</h3>
      <p>${meta.desc}</p>
      <div class="page-card__meta">${count !== null ? `${count} items · ` : ''}Click to edit</div>
    `;
    card.addEventListener('click', () => openHomeSection(key));
    grid.appendChild(card);
  });

  editor.appendChild(grid);
}

function renderHomeEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingHomeList !== null && editingHomeIndex !== null) {
    renderHomeItemDetail(editor, editingHomeList, editingHomeIndex);
    return;
  }

  if (homeSection) {
    renderHomeSectionEditor(editor, homeSection);
    return;
  }

  renderHomeOverview(editor);
}

const ABOUT_SECTIONS = {
  header: {
    label: 'Page header',
    desc: 'Hero title and background image at the top.',
    color: '#64748b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
  },
  main: {
    label: 'Company intro',
    desc: 'Main about text and team image.',
    color: '#3b82f6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></svg>',
  },
  stats: {
    label: 'Statistics bar',
    desc: 'Numbers shown in the stats strip.',
    color: '#faa21b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  },
  mission: {
    label: 'Our mission',
    desc: 'Mission statement with image.',
    color: '#10b981',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  },
  vision: {
    label: 'Our vision',
    desc: 'Vision statement with image.',
    color: '#8b5cf6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  },
  values: {
    label: 'Core values',
    desc: 'Value cards and supporting image.',
    color: '#f59e0b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>',
  },
  testimonials: {
    label: 'Testimonials',
    desc: 'Client reviews carousel.',
    color: '#ec4899',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  },
};

const ABOUT_LIST_PATHS = {
  values: ['values', 'items'],
  reviews: ['testimonials', 'reviews'],
};

const ABOUT_ITEM_BLANKS = {
  stats: { icon: '', number: '', label: '' },
  values: { title: '', description: '' },
  reviews: { name: '', text: '', image: '' },
};

function getAboutList(listName) {
  if (listName === 'stats') return content.about.stats || [];
  const [section, key] = ABOUT_LIST_PATHS[listName];
  return content.about[section]?.[key] || [];
}

function updateAboutTop(patch) {
  content.about = { ...content.about, ...patch };
}

function updateAboutNested(section, patch) {
  content.about = { ...content.about, [section]: { ...content.about[section], ...patch } };
}

function updateAboutList(listName, updater) {
  if (listName === 'stats') {
    content.about = { ...content.about, stats: updater([...(content.about.stats || [])]) };
    return;
  }
  const [section, key] = ABOUT_LIST_PATHS[listName];
  const items = updater([...getAboutList(listName)]);
  content.about = { ...content.about, [section]: { ...content.about[section], [key]: items } };
}

function updateAboutListItem(listName, index, patch) {
  updateAboutList(listName, (items) => {
    items[index] = { ...items[index], ...patch };
    return items;
  });
}

function openAboutSection(section) {
  aboutSection = section;
  editingAboutList = null;
  editingAboutIndex = null;
  renderView();
}

function closeAboutSection() {
  aboutSection = null;
  editingAboutList = null;
  editingAboutIndex = null;
  renderView();
}

function openAboutItem(listName, index) {
  editingAboutList = listName;
  editingAboutIndex = index;
  renderView();
}

function closeAboutItem() {
  editingAboutList = null;
  editingAboutIndex = null;
  renderView();
}

function addAboutListItem(listName) {
  updateAboutList(listName, (items) => [...items, { ...ABOUT_ITEM_BLANKS[listName] }]);
  openAboutItem(listName, getAboutList(listName).length - 1);
}

function removeAboutListItem(listName, index) {
  const item = getAboutList(listName)[index];
  const label = item?.title || item?.name || item?.label || `Item ${index + 1}`;
  if (!window.confirm(`Remove "${label}"?`)) return;
  updateAboutList(listName, (items) => items.filter((_, i) => i !== index));
  editingAboutList = null;
  editingAboutIndex = null;
  renderView();
}

function moveAboutListItem(listName, index, direction) {
  const target = index + direction;
  const items = [...getAboutList(listName)];
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  if (listName === 'stats') {
    content.about = { ...content.about, stats: items };
  } else {
    const [section, key] = ABOUT_LIST_PATHS[listName];
    content.about = { ...content.about, [section]: { ...content.about[section], [key]: items } };
  }
  editingAboutIndex = target;
  renderView();
}

function appendAboutItemActions(editor, listName, index) {
  const total = getAboutList(listName).length;
  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing item ${index + 1} of ${total}.</p>`;

  const moveGroup = document.createElement('div');
  moveGroup.className = 'gallery-editor-moves';

  const moveUp = document.createElement('button');
  moveUp.type = 'button';
  moveUp.className = 'btn btn-ghost';
  moveUp.textContent = 'Move up';
  moveUp.disabled = index === 0;
  moveUp.addEventListener('click', () => moveAboutListItem(listName, index, -1));

  const moveDown = document.createElement('button');
  moveDown.type = 'button';
  moveDown.className = 'btn btn-ghost';
  moveDown.textContent = 'Move down';
  moveDown.disabled = index === total - 1;
  moveDown.addEventListener('click', () => moveAboutListItem(listName, index, 1));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => removeAboutListItem(listName, index));

  moveGroup.append(moveUp, moveDown);
  actions.prepend(moveGroup);
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);
}

function buildAboutListCard(item, index, listName, config) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'home-list-card';
  const image = config.imageKey ? item[config.imageKey] : '';
  const title = config.titleKey ? item[config.titleKey] : '';
  const subtitle = config.subtitleKey ? item[config.subtitleKey] : '';

  card.innerHTML = `
    <div class="home-list-card__media">
      ${image ? `<img src="${image}" alt="" loading="lazy">` : '<div class="gallery-cms-card__placeholder">No image</div>'}
      <span class="gallery-cms-card__index">${index + 1}</span>
    </div>
    <div class="home-list-card__body">
      <h4>${title || config.fallbackTitle || 'Untitled'}</h4>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
      <span class="gallery-cms-card__edit">Edit</span>
    </div>
  `;

  card.addEventListener('click', () => openAboutItem(listName, index));
  return card;
}

function appendAboutListGrid(editor, listName, config) {
  const grid = document.createElement('div');
  grid.className = 'gallery-cms-grid';
  getAboutList(listName).forEach((item, index) => {
    grid.appendChild(buildAboutListCard(item, index, listName, config));
  });
  editor.appendChild(grid);

  if (!getAboutList(listName).length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = config.emptyText || 'No items yet.';
    editor.appendChild(empty);
  }
}

function renderAboutItemDetail(editor, listName, index) {
  const item = getAboutList(listName)[index];
  if (!item) {
    closeAboutItem();
    return;
  }

  appendBackButton(editor, `Back to ${ABOUT_SECTIONS[aboutSection]?.label || 'section'}`, closeAboutItem);
  appendAboutItemActions(editor, listName, index);

  let preview = null;
  if (item.image || item.icon) {
    preview = document.createElement('img');
    preview.className = 'gallery-editor-preview__image';
    preview.src = item.image || item.icon || '';
    preview.alt = '';
    const previewWrap = document.createElement('div');
    previewWrap.className = 'gallery-editor-preview';
    previewWrap.appendChild(preview);
    editor.appendChild(makeSection('Preview', previewWrap, false));
  }

  const fields = document.createElement('div');
  fields.className = 'grid-1';
  Object.keys(ABOUT_ITEM_BLANKS[listName]).forEach((key) => {
    fields.appendChild(createField(key, item[key], (_, value) => {
      updateAboutListItem(listName, index, { [key]: value });
      if (preview && (key === 'image' || key === 'icon')) preview.src = value;
    }));
  });
  editor.appendChild(makeSection('Details', fields, false));
}

function renderAboutHeaderSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeAboutSection);
  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.appendChild(createField('heroTitle', content.about.heroTitle, (_, value) => updateAboutTop({ heroTitle: value })));
  grid.appendChild(createField('heroImage', content.about.heroImage, (_, value) => updateAboutTop({ heroImage: value })));
  editor.appendChild(makeSection('Page header', grid, false));
}

function renderAboutMainSection(editor) {
  const main = content.about.main;
  appendBackButton(editor, 'Back to all sections', closeAboutSection);

  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', main.heading, (_, value) => updateAboutNested('main', { heading: value })));
  grid.appendChild(createField('text1', main.text1, (_, value) => updateAboutNested('main', { text1: value })));
  grid.appendChild(createField('text2', main.text2, (_, value) => updateAboutNested('main', { text2: value })));
  grid.appendChild(createField('image', main.image, (_, value) => updateAboutNested('main', { image: value })));
  grid.appendChild(createField('engineerIcon', main.engineerIcon, (_, value) => updateAboutNested('main', { engineerIcon: value })));
  editor.appendChild(makeSection('Company intro', grid, false));
}

function renderAboutStatsSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeAboutSection);
  appendListToolbar(editor, 'Statistics', 'Numbers shown in the horizontal stats bar.', '+ Add stat', () => addAboutListItem('stats'));
  appendAboutListGrid(editor, 'stats', {
    imageKey: 'icon',
    titleKey: 'number',
    subtitleKey: 'label',
    fallbackTitle: 'Stat',
    emptyText: 'No stats yet. Add your first stat above.',
  });
}

function renderAboutMissionSection(editor) {
  const mission = content.about.mission;
  appendBackButton(editor, 'Back to all sections', closeAboutSection);

  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', mission.heading, (_, value) => updateAboutNested('mission', { heading: value })));
  grid.appendChild(createField('text1', mission.text1, (_, value) => updateAboutNested('mission', { text1: value })));
  grid.appendChild(createField('text2', mission.text2, (_, value) => updateAboutNested('mission', { text2: value })));
  grid.appendChild(createField('image', mission.image, (_, value) => updateAboutNested('mission', { image: value })));
  grid.appendChild(createField('icon', mission.icon, (_, value) => updateAboutNested('mission', { icon: value })));
  editor.appendChild(makeSection('Our mission', grid, false));
}

function renderAboutVisionSection(editor) {
  const vision = content.about.vision;
  appendBackButton(editor, 'Back to all sections', closeAboutSection);

  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', vision.heading, (_, value) => updateAboutNested('vision', { heading: value })));
  grid.appendChild(createField('text', vision.text, (_, value) => updateAboutNested('vision', { text: value })));
  grid.appendChild(createField('image', vision.image, (_, value) => updateAboutNested('vision', { image: value })));
  grid.appendChild(createField('icon', vision.icon, (_, value) => updateAboutNested('vision', { icon: value })));
  editor.appendChild(makeSection('Our vision', grid, false));
}

function renderAboutValuesSection(editor) {
  const values = content.about.values;
  appendBackButton(editor, 'Back to all sections', closeAboutSection);

  const intro = document.createElement('div');
  intro.className = 'grid-1';
  intro.appendChild(createField('heading', values.heading, (_, value) => updateAboutNested('values', { heading: value })));
  intro.appendChild(createField('image', values.image, (_, value) => updateAboutNested('values', { image: value })));
  intro.appendChild(createField('icon', values.icon, (_, value) => updateAboutNested('values', { icon: value })));
  editor.appendChild(makeSection('Section content', intro, false));

  appendListToolbar(editor, 'Core values', 'Individual value cards listed on the page.', '+ Add value', () => addAboutListItem('values'));
  appendAboutListGrid(editor, 'values', {
    titleKey: 'title',
    subtitleKey: 'description',
    fallbackTitle: 'Value',
    emptyText: 'No values yet. Add your first value above.',
  });
}

function renderAboutTestimonialsSection(editor) {
  const testimonials = content.about.testimonials;
  appendBackButton(editor, 'Back to all sections', closeAboutSection);

  const intro = document.createElement('div');
  intro.className = 'grid-1';
  intro.appendChild(createField('heading', testimonials.heading, (_, value) => updateAboutNested('testimonials', { heading: value })));
  intro.appendChild(createField('subheading', testimonials.subheading, (_, value) => updateAboutNested('testimonials', { subheading: value })));
  intro.appendChild(createField('ctaText', testimonials.ctaText, (_, value) => updateAboutNested('testimonials', { ctaText: value })));
  intro.appendChild(createField('ctaLink', testimonials.ctaLink, (_, value) => updateAboutNested('testimonials', { ctaLink: value })));
  editor.appendChild(makeSection('Section settings', intro, false));

  appendListToolbar(editor, 'Client reviews', 'Reviews shown in the testimonials carousel.', '+ Add review', () => addAboutListItem('reviews'));
  appendAboutListGrid(editor, 'reviews', {
    imageKey: 'image',
    titleKey: 'name',
    subtitleKey: 'text',
    emptyText: 'No reviews yet. Add your first review above.',
  });
}

function renderAboutSectionEditor(editor, section) {
  const renderers = {
    header: renderAboutHeaderSection,
    main: renderAboutMainSection,
    stats: renderAboutStatsSection,
    mission: renderAboutMissionSection,
    vision: renderAboutVisionSection,
    values: renderAboutValuesSection,
    testimonials: renderAboutTestimonialsSection,
  };
  renderers[section]?.(editor);
}

function renderAboutOverview(editor) {
  const intro = document.createElement('div');
  intro.className = 'dashboard__hero';
  intro.innerHTML = `
    <h2>About us sections</h2>
    <p>Select a section to edit. Each area matches a block on your About Us page.</p>
  `;
  editor.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'page-cards';

  Object.entries(ABOUT_SECTIONS).forEach(([key, meta]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    const count = (() => {
      if (key === 'stats') return content.about.stats?.length || 0;
      if (key === 'values') return content.about.values?.items?.length || 0;
      if (key === 'testimonials') return content.about.testimonials?.reviews?.length || 0;
      return null;
    })();

    card.innerHTML = `
      <div class="page-card__top">
        <div class="page-card__icon" style="background:${meta.color}18;color:${meta.color}">${meta.icon}</div>
        <svg class="page-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <h3>${meta.label}</h3>
      <p>${meta.desc}</p>
      <div class="page-card__meta">${count !== null ? `${count} items · ` : ''}Click to edit</div>
    `;
    card.addEventListener('click', () => openAboutSection(key));
    grid.appendChild(card);
  });

  editor.appendChild(grid);
}

function renderAboutEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingAboutList !== null && editingAboutIndex !== null) {
    renderAboutItemDetail(editor, editingAboutList, editingAboutIndex);
    return;
  }

  if (aboutSection) {
    renderAboutSectionEditor(editor, aboutSection);
    return;
  }

  renderAboutOverview(editor);
}

const SERVICES_SECTIONS = {
  header: {
    label: 'Page header',
    desc: 'Hero title and background image.',
    color: '#64748b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>',
  },
  intro: {
    label: 'Introduction',
    desc: 'Heading and text below the hero.',
    color: '#3b82f6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  },
  showcase: {
    label: 'Showcase image',
    desc: 'Large image shown above the service cards.',
    color: '#10b981',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
  },
  cards: {
    label: 'Service cards',
    desc: 'Cards in the services carousel.',
    color: '#8b5cf6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  },
  cta: {
    label: 'Call to action',
    desc: 'Banner at the bottom of the page.',
    color: '#faa21b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  },
};

function updateServicesTop(patch) {
  content.services = { ...content.services, ...patch };
}

function updateServicesIntro(patch) {
  content.services = { ...content.services, intro: { ...content.services.intro, ...patch } };
}

function updateServicesCta(patch) {
  content.services = { ...content.services, cta: { ...content.services.cta, ...patch } };
}

function updateServicesCards(updater) {
  const cards = updater([...(content.services.cards || [])]);
  content.services = { ...content.services, cards };
}

function updateServiceCard(index, patch) {
  updateServicesCards((cards) => {
    cards[index] = { ...cards[index], ...patch };
    return cards;
  });
}

function openServicesSection(section) {
  servicesSection = section;
  editingServicesIndex = null;
  renderView();
}

function closeServicesSection() {
  servicesSection = null;
  editingServicesIndex = null;
  renderView();
}

function openServiceCard(index) {
  editingServicesIndex = index;
  renderView();
}

function closeServiceCard() {
  editingServicesIndex = null;
  renderView();
}

function createBlankServiceCard(index) {
  return {
    style: index % 2 === 0 ? 'sc-card--br-right' : 'sc-card--br-left',
    image: '',
    imageAlt: '',
    title: 'New Service',
    description: '',
    includes: [],
  };
}

function addServiceCard() {
  updateServicesCards((cards) => [...cards, createBlankServiceCard(cards.length)]);
  openServiceCard((content.services.cards || []).length - 1);
}

function removeServiceCard(index) {
  const title = content.services.cards[index]?.title || `Service ${index + 1}`;
  if (!window.confirm(`Remove "${title}"?`)) return;
  updateServicesCards((cards) => cards.filter((_, i) => i !== index));
  editingServicesIndex = null;
  renderView();
}

function moveServiceCard(index, direction) {
  const target = index + direction;
  const cards = [...(content.services.cards || [])];
  if (target < 0 || target >= cards.length) return;
  [cards[index], cards[target]] = [cards[target], cards[index]];
  content.services = { ...content.services, cards };
  editingServicesIndex = target;
  renderView();
}

function buildServiceCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'home-list-card';
  const image = item.image || '';

  card.innerHTML = `
    <div class="home-list-card__media">
      ${image ? `<img src="${image}" alt="" loading="lazy">` : '<div class="gallery-cms-card__placeholder">No image</div>'}
      <span class="gallery-cms-card__index">${index + 1}</span>
    </div>
    <div class="home-list-card__body">
      <h4>${item.title || 'Untitled service'}</h4>
      <p>${item.description || 'No description'}</p>
      <span class="gallery-cms-card__edit">Edit service</span>
    </div>
  `;

  card.addEventListener('click', () => openServiceCard(index));
  return card;
}

function renderServiceIncludesEditor(index) {
  const wrap = document.createElement('div');
  wrap.className = 'detail-list';

  const renderItems = () => {
    wrap.innerHTML = '';
    const includes = content.services.cards[index]?.includes || [];

    includes.forEach((line, lineIndex) => {
      const row = document.createElement('div');
      row.className = 'detail-list__row';

      const input = document.createElement('input');
      input.type = 'text';
      input.value = line;
      input.placeholder = 'e.g. Site supervision & coordination';
      input.addEventListener('input', () => {
        const next = [...(content.services.cards[index].includes || [])];
        next[lineIndex] = input.value;
        updateServiceCard(index, { includes: next });
      });

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        const next = (content.services.cards[index].includes || []).filter((_, i) => i !== lineIndex);
        updateServiceCard(index, { includes: next });
        renderItems();
      });

      row.append(input, removeBtn);
      wrap.appendChild(row);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-ghost';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('click', () => {
      const next = [...(content.services.cards[index].includes || []), ''];
      updateServiceCard(index, { includes: next });
      renderItems();
    });
    wrap.appendChild(addBtn);
  };

  renderItems();
  return wrap;
}

function renderServiceCardDetail(editor, index) {
  const card = content.services.cards?.[index];
  if (!card) {
    closeServiceCard();
    return;
  }

  const total = content.services.cards.length;

  appendBackButton(editor, `Back to ${SERVICES_SECTIONS.cards.label}`, closeServiceCard);

  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing service ${index + 1} of ${total}.</p>`;

  const moveGroup = document.createElement('div');
  moveGroup.className = 'gallery-editor-moves';

  const moveUp = document.createElement('button');
  moveUp.type = 'button';
  moveUp.className = 'btn btn-ghost';
  moveUp.textContent = 'Move up';
  moveUp.disabled = index === 0;
  moveUp.addEventListener('click', () => moveServiceCard(index, -1));

  const moveDown = document.createElement('button');
  moveDown.type = 'button';
  moveDown.className = 'btn btn-ghost';
  moveDown.textContent = 'Move down';
  moveDown.disabled = index === total - 1;
  moveDown.addEventListener('click', () => moveServiceCard(index, 1));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete service';
  deleteBtn.addEventListener('click', () => removeServiceCard(index));

  moveGroup.append(moveUp, moveDown);
  actions.prepend(moveGroup);
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);

  const preview = document.createElement('img');
  preview.className = 'gallery-editor-preview__image';
  preview.src = card.image || '';
  preview.alt = card.imageAlt || '';
  const previewWrap = document.createElement('div');
  previewWrap.className = 'gallery-editor-preview';
  previewWrap.appendChild(preview);
  editor.appendChild(makeSection('Preview', previewWrap, false));

  const basics = document.createElement('div');
  basics.className = 'grid-1';
  basics.appendChild(createField('title', card.title, (_, value) => updateServiceCard(index, { title: value })));
  basics.appendChild(createField('description', card.description, (_, value) => updateServiceCard(index, { description: value })));
  basics.appendChild(createField('image', card.image, (_, value) => {
    updateServiceCard(index, { image: value });
    preview.src = value;
  }));
  basics.appendChild(createField('imageAlt', card.imageAlt, (_, value) => {
    updateServiceCard(index, { imageAlt: value });
    preview.alt = value;
  }));

  const styleWrap = document.createElement('div');
  styleWrap.className = 'field';
  const styleLabel = document.createElement('label');
  styleLabel.textContent = 'Card layout';
  const styleSelect = document.createElement('select');
  [
    { value: 'sc-card--br-right', label: 'Image left — rounded bottom-right' },
    { value: 'sc-card--br-left', label: 'Image right — rounded bottom-left' },
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (card.style === value) opt.selected = true;
    styleSelect.appendChild(opt);
  });
  styleSelect.addEventListener('change', () => updateServiceCard(index, { style: styleSelect.value }));
  styleWrap.append(styleLabel, styleSelect);
  basics.appendChild(styleWrap);

  editor.appendChild(makeSection('Service details', basics, false));
  editor.appendChild(makeSection('What\'s included', renderServiceIncludesEditor(index), false));
}

function renderServicesHeaderSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeServicesSection);
  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.appendChild(createField('heroTitle', content.services.heroTitle, (_, value) => updateServicesTop({ heroTitle: value })));
  grid.appendChild(createField('heroImage', content.services.heroImage, (_, value) => updateServicesTop({ heroImage: value })));
  editor.appendChild(makeSection('Page header', grid, false));
}

function renderServicesIntroSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeServicesSection);
  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', content.services.intro?.heading, (_, value) => updateServicesIntro({ heading: value })));
  grid.appendChild(createField('text', content.services.intro?.text, (_, value) => updateServicesIntro({ text: value })));
  editor.appendChild(makeSection('Introduction', grid, false));
}

function renderServicesShowcaseSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeServicesSection);
  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('mainImage', content.services.mainImage, (_, value) => updateServicesTop({ mainImage: value })));
  editor.appendChild(makeSection('Showcase image', grid, false));
}

function renderServicesCardsSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeServicesSection);
  appendListToolbar(editor, 'Service cards', 'Cards shown in the services carousel.', '+ Add service', addServiceCard);

  const grid = document.createElement('div');
  grid.className = 'gallery-cms-grid';
  (content.services.cards || []).forEach((card, index) => {
    grid.appendChild(buildServiceCard(card, index));
  });
  editor.appendChild(grid);

  if (!content.services.cards?.length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = 'No services yet. Add your first service above.';
    editor.appendChild(empty);
  }
}

function renderServicesCtaSection(editor) {
  appendBackButton(editor, 'Back to all sections', closeServicesSection);
  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('heading', content.services.cta?.heading, (_, value) => updateServicesCta({ heading: value })));
  grid.appendChild(createField('text', content.services.cta?.text, (_, value) => updateServicesCta({ text: value })));
  grid.appendChild(createField('buttonText', content.services.cta?.buttonText, (_, value) => updateServicesCta({ buttonText: value })));
  grid.appendChild(createField('buttonLink', content.services.cta?.buttonLink, (_, value) => updateServicesCta({ buttonLink: value })));
  editor.appendChild(makeSection('Call to action', grid, false));
}

function renderServicesSectionEditor(editor, section) {
  const renderers = {
    header: renderServicesHeaderSection,
    intro: renderServicesIntroSection,
    showcase: renderServicesShowcaseSection,
    cards: renderServicesCardsSection,
    cta: renderServicesCtaSection,
  };
  renderers[section]?.(editor);
}

function renderServicesOverview(editor) {
  const intro = document.createElement('div');
  intro.className = 'dashboard__hero';
  intro.innerHTML = `
    <h2>Services page sections</h2>
    <p>Select a section to edit. Each area matches a block on your Services page.</p>
  `;
  editor.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'page-cards';

  Object.entries(SERVICES_SECTIONS).forEach(([key, meta]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    const count = key === 'cards' ? content.services.cards?.length || 0 : null;

    card.innerHTML = `
      <div class="page-card__top">
        <div class="page-card__icon" style="background:${meta.color}18;color:${meta.color}">${meta.icon}</div>
        <svg class="page-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <h3>${meta.label}</h3>
      <p>${meta.desc}</p>
      <div class="page-card__meta">${count !== null ? `${count} cards · ` : ''}Click to edit</div>
    `;
    card.addEventListener('click', () => openServicesSection(key));
    grid.appendChild(card);
  });

  editor.appendChild(grid);
}

function renderServicesEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingServicesIndex !== null) {
    renderServiceCardDetail(editor, editingServicesIndex);
    return;
  }

  if (servicesSection) {
    renderServicesSectionEditor(editor, servicesSection);
    return;
  }

  renderServicesOverview(editor);
}

function renderContactEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';
  const contact = content.contact;

  const intro = document.createElement('div');
  intro.className = 'dashboard__hero';
  intro.innerHTML = `
    <h2>Contact page</h2>
    <p>Edit the hero, intro text, and phone numbers shown on the Contact page. The contact form and footer email are managed elsewhere (see hints below).</p>
  `;
  editor.appendChild(intro);

  const hero = document.createElement('div');
  hero.className = 'grid-2';
  hero.appendChild(createField('heroTitle', contact.heroTitle, (_, value) => {
    content.contact = { ...content.contact, heroTitle: value };
  }));
  hero.appendChild(createField('heroImage', contact.heroImage, (_, value) => {
    content.contact = { ...content.contact, heroImage: value };
  }));
  editor.appendChild(makeSection('Page hero', hero, false));

  const copy = document.createElement('div');
  copy.className = 'grid-1';
  copy.appendChild(createField('heading', contact.heading, (_, value) => {
    content.contact = { ...content.contact, heading: value };
  }));
  copy.appendChild(createField('subtitle', contact.subtitle, (_, value) => {
    content.contact = { ...content.contact, subtitle: value };
  }));
  editor.appendChild(makeSection('Page intro', copy, false));

  const phones = document.createElement('div');
  phones.className = 'grid-2';
  phones.appendChild(createField('phone', contact.phone, (_, value) => {
    content.contact = { ...content.contact, phone: value };
  }));
  phones.appendChild(createField('phoneSecondary', contact.phoneSecondary, (_, value) => {
    content.contact = { ...content.contact, phoneSecondary: value };
  }));
  const phoneHint = document.createElement('p');
  phoneHint.className = 'hint';
  phoneHint.textContent = 'Shown below the intro on the Contact page. Footer phone and email are under Site settings → Contact details.';
  phones.appendChild(phoneHint);
  editor.appendChild(makeSection('Phone numbers', phones, false));

  const formNote = document.createElement('div');
  formNote.className = 'seo-intro';
  formNote.innerHTML = `
    <p><strong>Contact form submissions</strong> are sent via Formspree. Update the form endpoint under <em>Site settings → Contact details → formspree</em>.</p>
  `;
  editor.appendChild(formNote);
}

const SITE_SECTIONS = {
  general: {
    label: 'General & SEO',
    desc: 'Site name, URL, and social share image.',
    color: '#64748b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/></svg>',
  },
  contact: {
    label: 'Contact details',
    desc: 'Email, phone, and contact form endpoint.',
    color: '#3b82f6',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><polyline points="22,6 12,13 2,6"/></svg>',
  },
  navigation: {
    label: 'Main navigation',
    desc: 'Links in the top menu bar.',
    color: '#10b981',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  },
  social: {
    label: 'Social links',
    desc: 'Social icons in the footer.',
    color: '#ec4899',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  },
  footer: {
    label: 'Footer links',
    desc: 'Quick links shown in the footer.',
    color: '#f59e0b',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  },
};

const SITE_LIST_KEYS = {
  navigation: 'nav',
  social: 'social',
  footer: 'footerLinks',
};

const SITE_ITEM_BLANKS = {
  nav: { label: '', url: '' },
  social: { label: '', url: '', icon: '' },
  footerLinks: { label: '', url: '' },
};

function getSiteList(listKey) {
  return content.site[listKey] || [];
}

function updateSite(patch) {
  content.site = { ...content.site, ...patch };
}

function updateSiteList(listKey, updater) {
  const items = updater([...getSiteList(listKey)]);
  content.site = { ...content.site, [listKey]: items };
}

function updateSiteListItem(listKey, index, patch) {
  updateSiteList(listKey, (items) => {
    items[index] = { ...items[index], ...patch };
    return items;
  });
}

function openSiteSection(section) {
  siteSection = section;
  editingSiteList = null;
  editingSiteIndex = null;
  renderView();
}

function closeSiteSection() {
  siteSection = null;
  editingSiteList = null;
  editingSiteIndex = null;
  renderView();
}

function openSiteItem(listKey, index) {
  editingSiteList = listKey;
  editingSiteIndex = index;
  renderView();
}

function closeSiteItem() {
  editingSiteList = null;
  editingSiteIndex = null;
  renderView();
}

function addSiteListItem(listKey) {
  updateSiteList(listKey, (items) => [...items, { ...SITE_ITEM_BLANKS[listKey] }]);
  openSiteItem(listKey, getSiteList(listKey).length - 1);
}

function removeSiteListItem(listKey, index) {
  const item = getSiteList(listKey)[index];
  const label = item?.label || `Item ${index + 1}`;
  if (!window.confirm(`Remove "${label}"?`)) return;
  updateSiteList(listKey, (items) => items.filter((_, i) => i !== index));
  editingSiteList = null;
  editingSiteIndex = null;
  renderView();
}

function moveSiteListItem(listKey, index, direction) {
  const target = index + direction;
  const items = [...getSiteList(listKey)];
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
  content.site = { ...content.site, [listKey]: items };
  editingSiteIndex = target;
  renderView();
}

function appendSiteItemActions(editor, listKey, index) {
  const total = getSiteList(listKey).length;
  const actions = document.createElement('div');
  actions.className = 'project-editor-actions';
  actions.innerHTML = `<p class="hint">Editing item ${index + 1} of ${total}.</p>`;

  const moveGroup = document.createElement('div');
  moveGroup.className = 'gallery-editor-moves';

  const moveUp = document.createElement('button');
  moveUp.type = 'button';
  moveUp.className = 'btn btn-ghost';
  moveUp.textContent = 'Move up';
  moveUp.disabled = index === 0;
  moveUp.addEventListener('click', () => moveSiteListItem(listKey, index, -1));

  const moveDown = document.createElement('button');
  moveDown.type = 'button';
  moveDown.className = 'btn btn-ghost';
  moveDown.textContent = 'Move down';
  moveDown.disabled = index === total - 1;
  moveDown.addEventListener('click', () => moveSiteListItem(listKey, index, 1));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => removeSiteListItem(listKey, index));

  moveGroup.append(moveUp, moveDown);
  actions.prepend(moveGroup);
  actions.appendChild(deleteBtn);
  editor.appendChild(actions);
}

function buildSiteLinkCard(item, index, listKey) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'site-link-card';
  const hasIcon = listKey === 'social' && item.icon;

  card.innerHTML = `
    <div class="site-link-card__main">
      ${hasIcon ? `<img src="${item.icon}" alt="" class="site-link-card__icon">` : `<span class="site-link-card__index">${index + 1}</span>`}
      <div>
        <h4>${item.label || 'Untitled link'}</h4>
        <p>${item.url || 'No URL set'}</p>
      </div>
    </div>
    <span class="gallery-cms-card__edit">Edit</span>
  `;

  card.addEventListener('click', () => openSiteItem(listKey, index));
  return card;
}

function renderSiteItemDetail(editor, listKey, index) {
  const item = getSiteList(listKey)[index];
  if (!item) {
    closeSiteItem();
    return;
  }

  const sectionLabel = SITE_SECTIONS[siteSection]?.label || 'section';
  appendBackButton(editor, `Back to ${sectionLabel}`, closeSiteItem);
  appendSiteItemActions(editor, listKey, index);

  let preview = null;
  if (item.icon) {
    preview = document.createElement('img');
    preview.className = 'gallery-editor-preview__image';
    preview.src = item.icon;
    preview.alt = '';
    const previewWrap = document.createElement('div');
    previewWrap.className = 'gallery-editor-preview';
    previewWrap.appendChild(preview);
    editor.appendChild(makeSection('Icon preview', previewWrap, false));
  }

  const fields = document.createElement('div');
  fields.className = 'grid-1';
  Object.keys(SITE_ITEM_BLANKS[listKey]).forEach((key) => {
    fields.appendChild(createField(key, item[key], (_, value) => {
      updateSiteListItem(listKey, index, { [key]: value });
      if (preview && key === 'icon') preview.src = value;
    }));
  });
  editor.appendChild(makeSection('Link details', fields, false));
}

function renderSiteListSection(editor, section, listKey, title, hint, addLabel) {
  appendBackButton(editor, 'Back to all settings', closeSiteSection);
  appendListToolbar(editor, title, hint, addLabel, () => addSiteListItem(listKey));

  const grid = document.createElement('div');
  grid.className = 'site-link-cards';
  getSiteList(listKey).forEach((item, index) => {
    grid.appendChild(buildSiteLinkCard(item, index, listKey));
  });
  editor.appendChild(grid);

  if (!getSiteList(listKey).length) {
    const empty = document.createElement('p');
    empty.className = 'media-empty';
    empty.textContent = 'No links yet. Add your first link above.';
    editor.appendChild(empty);
  }
}

function renderSiteGeneralSection(editor) {
  appendBackButton(editor, 'Back to all settings', closeSiteSection);

  const intro = document.createElement('div');
  intro.className = 'seo-intro';
  intro.innerHTML = `
    <p>These settings apply across your entire website — search engines, social media previews, and browser tabs all use the values below.</p>
  `;
  editor.appendChild(intro);

  const previewSection = document.createElement('div');
  previewSection.className = 'seo-preview-panel';
  previewSection.innerHTML = `
    <h3 class="seo-preview-panel__title">Live preview</h3>
    <div class="seo-preview-grid">
      <div class="seo-preview-card">
        <span class="seo-preview-card__label">Google search result</span>
        <div class="seo-preview-google">
          <p class="seo-preview-google__url" data-seo-preview="url"></p>
          <p class="seo-preview-google__title" data-seo-preview="title"></p>
          <p class="seo-preview-google__desc" data-seo-preview="desc"></p>
        </div>
      </div>
      <div class="seo-preview-card">
        <span class="seo-preview-card__label">Social share card</span>
        <div class="seo-preview-social">
          <div class="seo-preview-social__image" data-seo-preview="image-wrap">
            <img data-seo-preview="image" alt="">
            <span class="seo-preview-social__placeholder">No image set</span>
          </div>
          <div class="seo-preview-social__body">
            <p class="seo-preview-social__site" data-seo-preview="site"></p>
            <p class="seo-preview-social__title" data-seo-preview="social-title"></p>
            <p class="seo-preview-social__desc" data-seo-preview="social-desc"></p>
          </div>
        </div>
      </div>
    </div>
  `;
  editor.appendChild(previewSection);

  const refreshSeoPreview = () => {
    const site = content.site;
    const name = site.name || 'Your site name';
    const url = site.url || 'https://www.example.com';
    const desc = site.defaultDescription || site.tagline || 'Add a default description for search engines and social sharing.';
    const hostname = (() => {
      try { return new URL(url).hostname; } catch { return 'www.example.com'; }
    })();

    previewSection.querySelector('[data-seo-preview="url"]').textContent = `${hostname} › Home`;
    previewSection.querySelector('[data-seo-preview="title"]').textContent = `Home | ${name}`;
    previewSection.querySelector('[data-seo-preview="desc"]').textContent = desc;
    previewSection.querySelector('[data-seo-preview="site"]').textContent = hostname;
    previewSection.querySelector('[data-seo-preview="social-title"]').textContent = `Home | ${name}`;
    previewSection.querySelector('[data-seo-preview="social-desc"]').textContent = desc;

    const img = previewSection.querySelector('[data-seo-preview="image"]');
    const wrap = previewSection.querySelector('[data-seo-preview="image-wrap"]');
    if (site.ogImage) {
      img.src = site.ogImage.startsWith('http') ? site.ogImage : site.ogImage;
      img.classList.remove('hidden');
      wrap.classList.add('has-image');
    } else {
      img.removeAttribute('src');
      img.classList.add('hidden');
      wrap.classList.remove('has-image');
    }
  };

  const onSiteFieldChange = (patch) => {
    updateSite(patch);
    refreshSeoPreview();
  };

  const brand = document.createElement('div');
  brand.className = 'grid-1';
  brand.appendChild(createField('name', content.site.name, (_, value) => onSiteFieldChange({ name: value })));
  brand.appendChild(createField('tagline', content.site.tagline, (_, value) => onSiteFieldChange({ tagline: value })));
  const brandHint = document.createElement('p');
  brandHint.className = 'field-hint';
  brandHint.textContent = 'Your business name appears in the browser tab, navigation, and when your site is shared. The tagline is a short phrase describing what you do.';
  brand.appendChild(brandHint);
  editor.appendChild(makeSection('Brand identity', brand, false));

  const website = document.createElement('div');
  website.className = 'grid-1';
  website.appendChild(createField('url', content.site.url, (_, value) => onSiteFieldChange({ url: value })));
  const websiteHint = document.createElement('p');
  websiteHint.className = 'field-hint';
  websiteHint.textContent = 'Your live website address (include https://). Used for canonical URLs, sitemap links, and social share URLs.';
  website.appendChild(websiteHint);
  editor.appendChild(makeSection('Website address', website, false));

  const search = document.createElement('div');
  search.className = 'grid-1';
  search.appendChild(createField('defaultDescription', content.site.defaultDescription, (_, value) => onSiteFieldChange({ defaultDescription: value })));
  search.appendChild(createField('ogImage', content.site.ogImage, (_, value) => onSiteFieldChange({ ogImage: value })));
  const searchHint = document.createElement('p');
  searchHint.className = 'field-hint';
  searchHint.textContent = 'The default description is used when a page does not have its own. Recommended: 120–160 characters. The share image should be at least 1200×630 px for best results on Facebook and LinkedIn.';
  search.appendChild(searchHint);
  editor.appendChild(makeSection('Search & social sharing', search, false));

  const technical = document.createElement('div');
  technical.className = 'grid-2';
  technical.appendChild(createField('locale', content.site.locale, (_, value) => updateSite({ locale: value })));
  technical.appendChild(createField('twitterHandle', content.site.twitterHandle, (_, value) => updateSite({ twitterHandle: value })));
  technical.appendChild(createField('favicon', content.site.favicon, (_, value) => updateSite({ favicon: value })));
  technical.appendChild(createField('themeColor', content.site.themeColor, (_, value) => updateSite({ themeColor: value })));
  const technicalHint = document.createElement('p');
  technicalHint.className = 'field-hint';
  technicalHint.textContent = 'Locale (e.g. en_UG), Twitter handle (e.g. @uniprixinvestment), favicon path, and theme color for mobile browser chrome.';
  technical.appendChild(technicalHint);
  editor.appendChild(makeSection('Technical SEO & appearance', technical, false));

  const reference = document.createElement('div');
  reference.className = 'seo-reference';
  reference.innerHTML = `
    <h4>What these settings control</h4>
    <ul>
      <li><strong>Site name</strong> — shown in navigation, footer, and <code>og:site_name</code></li>
      <li><strong>Website URL</strong> — used for canonical links on every page</li>
      <li><strong>Default description</strong> — fallback meta description for search engines</li>
      <li><strong>Share image</strong> — default image when any page is shared on social media</li>
      <li><strong>Favicon</strong> — small icon in the browser tab</li>
    </ul>
    <p class="hint">Individual page titles and descriptions (e.g. "About Us | Uniprix Investment") are set per page in the site build. Contact your developer to update those.</p>
  `;
  editor.appendChild(makeSection('Reference guide', reference, false));

  refreshSeoPreview();
}

function renderSiteContactSection(editor) {
  appendBackButton(editor, 'Back to all settings', closeSiteSection);
  const grid = document.createElement('div');
  grid.className = 'grid-1';
  grid.appendChild(createField('email', content.site.email, (_, value) => updateSite({ email: value })));
  grid.appendChild(createField('phone', content.site.phone, (_, value) => updateSite({ phone: value })));
  grid.appendChild(createField('formspree', content.site.formspree, (_, value) => updateSite({ formspree: value })));
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Email and phone appear in the site footer. Formspree is the endpoint for contact form submissions. Contact page phone numbers are edited under Content → Contact us.';
  grid.appendChild(hint);
  editor.appendChild(makeSection('Contact details', grid, false));
}

function renderSiteSectionEditor(editor, section) {
  if (section === 'general') renderSiteGeneralSection(editor);
  else if (section === 'contact') renderSiteContactSection(editor);
  else if (section === 'navigation') {
    renderSiteListSection(editor, section, 'nav', 'Menu links', 'Links shown in the top navigation bar.', '+ Add menu link');
  } else if (section === 'social') {
    renderSiteListSection(editor, section, 'social', 'Social links', 'Icons and links in the footer social row.', '+ Add social link');
  } else if (section === 'footer') {
    renderSiteListSection(editor, section, 'footerLinks', 'Footer links', 'Quick links in the footer navigation.', '+ Add footer link');
  }
}

function renderSiteOverview(editor) {
  const intro = document.createElement('div');
  intro.className = 'dashboard__hero';
  intro.innerHTML = `
    <h2>Site settings</h2>
    <p>Global settings used across every page — navigation, footer, contact info, and SEO.</p>
  `;
  editor.appendChild(intro);

  const grid = document.createElement('div');
  grid.className = 'page-cards';

  Object.entries(SITE_SECTIONS).forEach(([key, meta]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    const listKey = SITE_LIST_KEYS[key];
    const count = listKey ? getSiteList(listKey).length : null;

    card.innerHTML = `
      <div class="page-card__top">
        <div class="page-card__icon" style="background:${meta.color}18;color:${meta.color}">${meta.icon}</div>
        <svg class="page-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <h3>${meta.label}</h3>
      <p>${meta.desc}</p>
      <div class="page-card__meta">${count !== null ? `${count} links · ` : ''}Click to edit</div>
    `;
    card.addEventListener('click', () => openSiteSection(key));
    grid.appendChild(card);
  });

  editor.appendChild(grid);
}

function renderSiteEditor() {
  const editor = $('#editor');
  editor.innerHTML = '';

  if (editingSiteList !== null && editingSiteIndex !== null) {
    renderSiteItemDetail(editor, editingSiteList, editingSiteIndex);
    return;
  }

  if (siteSection) {
    renderSiteSectionEditor(editor, siteSection);
    return;
  }

  renderSiteOverview(editor);
}

function isImageField(key, value) {
  if (IMAGE_KEYS.has(key.toLowerCase())) return true;
  if (typeof value !== 'string') return false;
  return /^(\/|https?:\/\/).+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value);
}

function isLongText(key, value) {
  if (typeof value !== 'string') return false;
  if (LONG_TEXT_KEYS.has(key)) return true;
  return value.length > 120 || value.includes('\n');
}

function fieldLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function attachImageUpload(wrap, input, onUploaded) {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';
  fileInput.hidden = true;

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'btn btn-ghost btn-upload';
  uploadBtn.textContent = 'Upload';

  const hint = document.createElement('p');
  hint.className = 'image-field__hint';
  hint.textContent = `JPEG, PNG, WebP, GIF, SVG · max ${config?.maxUploadMB || 10} MB`;

  const setHint = (text, state = '') => {
    hint.textContent = text;
    hint.className = `image-field__hint${state ? ` is-${state}` : ''}`;
  };

  const handleFile = async (file) => {
    if (!file) return;
    uploadBtn.disabled = true;
    setHint('Uploading…', 'uploading');
    try {
      const url = await uploadMediaFile(file);
      input.value = url;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      onUploaded?.(url);
      setHint('Uploaded — path set automatically.', 'success');
      setTimeout(() => setHint(`JPEG, PNG, WebP, GIF, SVG · max ${config?.maxUploadMB || 10} MB`), 3000);
    } catch (err) {
      setHint(err.message, 'error');
    } finally {
      uploadBtn.disabled = false;
      fileInput.value = '';
    }
  };

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));

  const row = document.createElement('div');
  row.className = 'image-field__row';
  input.remove();
  row.append(input, uploadBtn, fileInput);
  wrap.append(row, hint);
}

function createField(key, value, onChange) {
  const wrap = document.createElement('div');
  const isImage = isImageField(key, value);
  wrap.className = isImage ? 'field image-field' : 'field';

  const label = document.createElement('label');
  label.textContent = fieldLabel(key);
  wrap.appendChild(label);

  let input;
  if (typeof value === 'boolean') {
    input = document.createElement('select');
    ['true', 'false'].forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (String(value) === v) opt.selected = true;
      input.appendChild(opt);
    });
    input.addEventListener('change', () => onChange(key, input.value === 'true'));
    wrap.appendChild(input);
  } else if (typeof value === 'number') {
    input = document.createElement('input');
    input.type = 'number';
    input.value = value;
    input.addEventListener('input', () => onChange(key, Number(input.value)));
    wrap.appendChild(input);
  } else if (isLongText(key, value) && !isImage) {
    input = document.createElement('textarea');
    input.value = value ?? '';
    input.addEventListener('input', () => onChange(key, input.value));
    wrap.appendChild(input);
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.value = value ?? '';
    input.placeholder = isImage ? '/media/your-image.webp' : '';
    input.addEventListener('input', () => onChange(key, input.value));

    if (isImage) {
      attachImageUpload(wrap, input, (url) => onChange(key, url));
    } else {
      wrap.appendChild(input);
    }
  }

  if (isImage) {
    const preview = document.createElement('img');
    preview.className = 'image-preview';
    preview.alt = '';
    const updatePreview = () => {
      preview.src = input.value || '';
      preview.classList.toggle('hidden', !input.value);
    };
    input.addEventListener('input', updatePreview);
    updatePreview();
    wrap.appendChild(preview);
  }

  return wrap;
}

function makeSection(title, bodyEl, collapsible = true) {
  const section = document.createElement('div');
  section.className = 'section';

  const head = document.createElement('div');
  head.className = 'section__head';
  head.innerHTML = `<h3>${title}</h3><svg class="section__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;

  const body = document.createElement('div');
  body.className = 'section__body';
  body.appendChild(bodyEl);

  if (collapsible) {
    head.addEventListener('click', () => section.classList.toggle('is-collapsed'));
  } else {
    head.querySelector('.section__chevron')?.remove();
  }

  section.append(head, body);
  return section;
}

function renderObject(obj, onChange, depth = 0, sectionTitle = '') {
  if (Array.isArray(obj)) {
    const container = document.createElement('div');
    container.className = 'repeater';

    obj.forEach((item, index) => {
      const itemWrap = document.createElement('div');
      itemWrap.className = 'repeater-item';

      const head = document.createElement('div');
      head.className = 'repeater-item__head';
      const title = document.createElement('span');
      title.className = 'repeater-item__title';
      title.textContent = `Item ${index + 1}${item?.title || item?.name ? `: ${item.title || item.name}` : ''}`;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-danger';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        onChange(obj.filter((_, i) => i !== index), true);
      });
      head.append(title, removeBtn);
      itemWrap.appendChild(head);

      if (item && typeof item === 'object') {
        itemWrap.appendChild(renderObject(item, (nextItem) => {
          const copy = [...obj];
          copy[index] = nextItem;
          onChange(copy);
        }, depth + 1));
      } else {
        itemWrap.appendChild(createField('value', item, (_, v) => {
          const copy = [...obj];
          copy[index] = v;
          onChange(copy);
        }));
      }

      container.appendChild(itemWrap);
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-ghost';
    addBtn.textContent = '+ Add item';
    addBtn.addEventListener('click', () => {
      const sample = obj[0];
      let nextItem = '';
      if (sample && typeof sample === 'object') {
        nextItem = Object.fromEntries(Object.keys(sample).map((k) => [k, typeof sample[k] === 'string' ? '' : Array.isArray(sample[k]) ? [] : typeof sample[k] === 'number' ? 0 : '']));
      }
      onChange([...obj, nextItem], true);
    });

    const wrap = document.createElement('div');
    wrap.append(container, addBtn);
    return depth === 0 && sectionTitle ? makeSection(sectionTitle, wrap) : wrap;
  }

  if (obj && typeof obj === 'object') {
    const fragment = document.createDocumentFragment();
    const keys = Object.keys(obj);

    keys.forEach((key) => {
      const value = obj[key];
      if (value && typeof value === 'object') {
        const inner = renderObject(value, (nextVal) => {
          onChange({ ...obj, [key]: nextVal });
        }, depth + 1);
        fragment.appendChild(makeSection(fieldLabel(key), inner, true));
      }
    });

    const scalarKeys = keys.filter((k) => !obj[k] || typeof obj[k] !== 'object');
    if (scalarKeys.length) {
      const grid = document.createElement('div');
      grid.className = scalarKeys.length > 2 ? 'grid-2' : '';
      scalarKeys.forEach((key) => {
        grid.appendChild(createField(key, obj[key], (k, v) => {
          onChange({ ...obj, [k]: v });
        }));
      });
      fragment.appendChild(grid);
    }

    return fragment;
  }

  const el = createField('value', obj, (_, v) => onChange(v));
  return depth === 0 && sectionTitle ? makeSection(sectionTitle, el) : el;
}

function renderDashboard() {
  destroyDashboardCharts();
  const el = $('#dashboard');
  const stats = getDashboardStats();
  const lastPublish = getLastPublish();
  const siteName = content.site?.name || 'Uniprix Investment';
  const recentPage = Object.entries(lastPublish).sort((a, b) => new Date(b[1]) - new Date(a[1]))[0];

  el.innerHTML = `
    <div class="dashboard__hero">
      <h2>Welcome back</h2>
      <p>Manage content for <strong>${siteName}</strong>. Charts below show your content overview — select a page to edit and publish.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__icon" style="background:#fff7e8;color:#faa21b">📄</div>
        <div class="stat-card__value">${stats.pages}</div>
        <div class="stat-card__label">Pages</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="background:#ecfdf5;color:#10b981">🏗️</div>
        <div class="stat-card__value">${stats.projects}</div>
        <div class="stat-card__label">Projects</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="background:#fdf2f8;color:#ec4899">🖼️</div>
        <div class="stat-card__value">${stats.gallery}</div>
        <div class="stat-card__label">Gallery images</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon" style="background:#eff6ff;color:#3b82f6">💬</div>
        <div class="stat-card__value">${stats.testimonials}</div>
        <div class="stat-card__label">Testimonials</div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card__header">
          <h3>Content by page</h3>
          <p>Total editable fields per section</p>
        </div>
        <div class="chart-card__body">
          <canvas id="chart-content-by-page" aria-label="Content fields per page"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card__header">
          <h3>Content mix</h3>
          <p>Projects, gallery, testimonials &amp; services</p>
        </div>
        <div class="chart-card__body">
          <canvas id="chart-content-mix" aria-label="Content type distribution"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card__header">
          <h3>Publish freshness</h3>
          <p>How recently each page was published</p>
        </div>
        <div class="chart-card__body">
          <canvas id="chart-freshness" aria-label="Days since last publish per page"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card__header">
          <h3>Publish activity</h3>
          <p>Updates published over the last 7 days</p>
        </div>
        <div class="chart-card__body">
          <canvas id="chart-activity" aria-label="Publish activity over time"></canvas>
        </div>
      </div>
    </div>

    <h2 class="section-heading">Edit content</h2>
    <div class="page-cards" id="page-cards"></div>

    <h2 class="section-heading">Quick actions</h2>
    <div class="quick-actions">
      <button type="button" class="quick-action" data-action="reload">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Reload all content
      </button>
      <a class="quick-action" href="/" target="_blank" rel="noopener" style="text-decoration:none">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Preview live site
      </a>
      <button type="button" class="quick-action" data-action="media">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload images
      </button>
      <button type="button" class="quick-action" data-action="site-settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/></svg>
        Site settings
      </button>
    </div>
  `;

  const cards = el.querySelector('#page-cards');
  const publish = getLastPublish();

  Object.keys(config.contentFiles).forEach((key) => {
    const meta = PAGE_META[key] || { label: key, desc: '', path: '/', color: '#64748b', icon: '' };
    const fields = countItems(content[key]);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'page-card';
    card.innerHTML = `
      <div class="page-card__top">
        <div class="page-card__icon" style="background:${meta.color}18;color:${meta.color}">${meta.icon}</div>
        <svg class="page-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <h3>${meta.label}</h3>
      <p>${meta.desc}</p>
      <div class="page-card__meta">${fields} fields · Last published ${formatRelativeTime(publish[key])}</div>
    `;
    card.addEventListener('click', () => navigateTo(key));
    cards.appendChild(card);
  });

  if (recentPage) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.style.marginTop = '1rem';
    note.textContent = `Last activity: ${PAGE_LABELS[recentPage[0]] || recentPage[0]} — ${formatRelativeTime(recentPage[1])}`;
    el.appendChild(note);
  }

  el.querySelector('[data-action="reload"]')?.addEventListener('click', async () => {
    try {
      await loadAllContent();
      renderDashboard();
      setStatus('All content reloaded.', 'success');
    } catch (err) {
      setStatus(err.message, 'error');
    }
  });

  el.querySelector('[data-action="site-settings"]')?.addEventListener('click', () => navigateTo('site'));
  el.querySelector('[data-action="media"]')?.addEventListener('click', () => navigateTo('media'));

  renderDashboardCharts();
}

async function loadMediaFiles() {
  const mediaPath = config.mediaPath || 'media';
  try {
    const files = await githubListDir(mediaPath);
    return files
      .filter((f) => f.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch (err) {
    if (/not found/i.test(err.message)) return [];
    throw err;
  }
}

function setupMediaUploadZone(zone, fileInput, onUploaded) {
  const pickFile = () => fileInput.click();

  zone.addEventListener('click', pickFile);
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('is-dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) onUploaded(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) onUploaded(file);
    fileInput.value = '';
  });
}

async function renderMediaLibrary() {
  const el = $('#media-library');
  const mediaPath = config.mediaPath || 'media';
  const maxMb = config.maxUploadMB || 10;

  el.innerHTML = `
    <div class="media-upload-zone" id="media-drop-zone" tabindex="0" role="button" aria-label="Upload image">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <h3>Upload an image</h3>
      <p>Drag and drop or click to browse · saved to <code>/${mediaPath}/</code> on GitHub</p>
      <p class="hint" style="margin-top:0.5rem">JPEG, PNG, WebP, GIF, SVG · max ${maxMb} MB</p>
    </div>
    <input type="file" id="media-file-input" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" hidden>
    <div id="media-grid" class="media-grid"><p class="media-empty">Loading media…</p></div>
  `;

  const grid = el.querySelector('#media-grid');
  const fileInput = el.querySelector('#media-file-input');
  const zone = el.querySelector('#media-drop-zone');

  const renderGrid = async () => {
    try {
      const files = await loadMediaFiles();
      if (!files.length) {
        grid.innerHTML = '<p class="media-empty">No images yet. Upload your first image above.</p>';
        return;
      }

      grid.innerHTML = '';
      files.forEach((file) => {
        const url = `/${mediaPath}/${file.name}`;
        const item = document.createElement('div');
        item.className = 'media-item';
        item.innerHTML = `
          <img src="${url}" alt="${file.name}" loading="lazy">
          <div class="media-item__footer">
            <span class="media-item__name">${file.name}</span>
            <div class="media-item__actions">
              <button type="button" class="btn btn-ghost" data-copy="${url}">Copy path</button>
            </div>
          </div>
        `;
        grid.appendChild(item);
      });

      grid.querySelectorAll('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const path = btn.dataset.copy;
          const copied = await copyText(path);
          setStatus(copied ? `Copied ${path}` : path, copied ? 'success' : 'info');
          if (copied) setTimeout(() => setStatus(''), 2500);
        });
      });
    } catch (err) {
      grid.innerHTML = `<p class="media-empty">${err.message}</p>`;
    }
  };

  const handleUpload = async (file) => {
    setStatus('Uploading image…');
    try {
      const url = await uploadMediaFile(file);
      setStatus(`Uploaded ${url}`, 'success');
      await renderGrid();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(err.message, 'error');
    }
  };

  setupMediaUploadZone(zone, fileInput, handleUpload);
  await renderGrid();
}

function renderEditor() {
  if (currentPage === 'projects') {
    renderProjectsEditor();
    return;
  }

  if (currentPage === 'gallery') {
    renderGalleryEditor();
    return;
  }

  if (currentPage === 'home') {
    renderHomeEditor();
    return;
  }

  if (currentPage === 'about') {
    renderAboutEditor();
    return;
  }

  if (currentPage === 'services') {
    renderServicesEditor();
    return;
  }

  if (currentPage === 'site') {
    renderSiteEditor();
    return;
  }

  if (currentPage === 'contact') {
    renderContactEditor();
    return;
  }

  const editor = $('#editor');
  editor.innerHTML = '';

  const data = content[currentPage];
  if (!data) {
    editor.innerHTML = '<p>No content found for this page.</p>';
    return;
  }

  const topKeys = Object.keys(data);
  topKeys.forEach((key) => {
    const value = data[key];
    if (value && typeof value === 'object') {
      const inner = renderObject(value, (nextVal, shouldRerender) => {
        content[currentPage] = { ...content[currentPage], [key]: nextVal };
        if (shouldRerender) renderEditor();
      }, 0);
      editor.appendChild(makeSection(fieldLabel(key), inner));
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'section';
      const body = document.createElement('div');
      body.className = 'section__body';
      body.appendChild(createField(key, value, (k, v) => {
        content[currentPage] = { ...content[currentPage], [k]: v };
      }));
      wrap.appendChild(body);
      editor.appendChild(wrap);
    }
  });
}

function renderView() {
  if (currentPage !== 'dashboard') destroyDashboardCharts();

  const isDashboard = currentPage === 'dashboard';
  const isMedia = currentPage === 'media';
  const isEditor = !isDashboard && !isMedia;

  $('#dashboard').classList.toggle('hidden', !isDashboard);
  $('#media-library').classList.toggle('hidden', !isMedia);
  $('#editor').classList.toggle('hidden', !isEditor);
  $('#save-btn').classList.toggle('hidden', !isEditor);
  $('#download-btn').classList.toggle('hidden', !isEditor);

  if (isDashboard) {
    $('#breadcrumb').textContent = 'Overview';
    $('#page-title').textContent = 'Dashboard';
    renderDashboard();
  } else if (isMedia) {
    $('#breadcrumb').textContent = 'Assets';
    $('#page-title').textContent = 'Media library';
    renderMediaLibrary();
  } else {
    $('#breadcrumb').textContent = 'Content';
    if (currentPage === 'projects' && editingProjectIndex !== null) {
      const project = content.projects?.projects?.[editingProjectIndex];
      $('#page-title').textContent = project?.title || `Project ${editingProjectIndex + 1}`;
    } else if (currentPage === 'gallery' && editingGalleryIndex !== null) {
      const item = content.gallery?.items?.[editingGalleryIndex];
      $('#page-title').textContent = item?.alt || `Image ${editingGalleryIndex + 1}`;
    } else if (currentPage === 'home') {
      if (editingHomeList !== null && editingHomeIndex !== null) {
        const item = getHomeList(editingHomeList)[editingHomeIndex];
        $('#page-title').textContent = item?.title || item?.name || item?.label || item?.number || `Item ${editingHomeIndex + 1}`;
      } else if (homeSection) {
        $('#page-title').textContent = HOME_SECTIONS[homeSection]?.label || 'Home';
      } else {
        $('#page-title').textContent = PAGE_LABELS.home || 'Home';
      }
    } else if (currentPage === 'about') {
      if (editingAboutList !== null && editingAboutIndex !== null) {
        const item = getAboutList(editingAboutList)[editingAboutIndex];
        $('#page-title').textContent = item?.title || item?.name || item?.label || item?.number || `Item ${editingAboutIndex + 1}`;
      } else if (aboutSection) {
        $('#page-title').textContent = ABOUT_SECTIONS[aboutSection]?.label || 'About us';
      } else {
        $('#page-title').textContent = PAGE_LABELS.about || 'About us';
      }
    } else if (currentPage === 'services') {
      if (editingServicesIndex !== null) {
        const card = content.services?.cards?.[editingServicesIndex];
        $('#page-title').textContent = card?.title || `Service ${editingServicesIndex + 1}`;
      } else if (servicesSection) {
        $('#page-title').textContent = SERVICES_SECTIONS[servicesSection]?.label || 'Services';
      } else {
        $('#page-title').textContent = PAGE_LABELS.services || 'Services';
      }
    } else if (currentPage === 'site') {
      if (editingSiteList !== null && editingSiteIndex !== null) {
        const item = getSiteList(editingSiteList)[editingSiteIndex];
        $('#page-title').textContent = item?.label || `Link ${editingSiteIndex + 1}`;
      } else if (siteSection) {
        $('#page-title').textContent = SITE_SECTIONS[siteSection]?.label || 'Site settings';
      } else {
        $('#page-title').textContent = PAGE_LABELS.site || 'Site settings';
      }
    } else {
      $('#page-title').textContent = PAGE_LABELS[currentPage] || currentPage;
    }
    renderEditor();
  }

  document.querySelectorAll('.nav-item[data-page]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === currentPage);
  });
}

function buildNav() {
  const nav = $('#page-nav');
  nav.innerHTML = '';

  Object.keys(config.contentFiles).forEach((key) => {
    const meta = PAGE_META[key] || { label: key, icon: '' };
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `nav-item${key === currentPage ? ' active' : ''}`;
    btn.dataset.page = key;
    btn.innerHTML = `${meta.icon ? `<span class="nav-icon" style="color:inherit">${meta.icon.replace('stroke="currentColor"', 'stroke="currentColor" width="18" height="18"')}</span>` : ''}${meta.label}`;
    btn.addEventListener('click', () => navigateTo(key));
    nav.appendChild(btn);
  });

  const dashBtn = document.querySelector('.nav-item[data-page="dashboard"]');
  if (dashBtn) dashBtn.classList.toggle('active', currentPage === 'dashboard');
}

function updateConnectionBadge() {
  const label = $('#repo-label');
  if (!label) return;
  if (auth?.user) {
    const host = config.siteUrl ? new URL(config.siteUrl).hostname : 'Connected';
    label.textContent = `Signed in as ${auth.user} · ${host}`;
    return;
  }
  label.textContent = '—';
}

function showApp() {
  $('#login-screen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  updateConnectionBadge();
}

function showLogin() {
  $('#app').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = $('#username').value.trim();
  const password = $('#password').value;
  const remember = $('#remember').checked;
  const errEl = $('#login-error');

  errEl.classList.add('hidden');

  const base = resolveApiUrl();
  if (!base) {
    errEl.textContent = 'CMS API is not configured yet. Contact your site administrator.';
    errEl.classList.remove('hidden');
    return;
  }

  let data;
  try {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember }),
    });
    data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errEl.textContent = data.error || 'Invalid username or password.';
      errEl.classList.remove('hidden');
      return;
    }
  } catch {
    errEl.textContent = 'Could not reach the CMS API. Please try again later.';
    errEl.classList.remove('hidden');
    return;
  }

  auth = buildAuthContext(data.user);
  saveSession(data.user, remember, data.token);

  try {
    await loadAllContent();
    currentPage = 'dashboard';
    showApp();
    buildNav();
    renderView();
    setStatus('Welcome back.', 'success');
    setTimeout(() => setStatus(''), 2500);
  } catch (err) {
    clearSession();
    auth = null;
    errEl.textContent = err?.message || 'Could not load content. Please try again in a few minutes.';
    errEl.classList.remove('hidden');
  }
}

async function tryRestoreSession() {
  const session = loadSession();
  if (!session?.token) return false;

  auth = buildAuthContext(session.user);
  try {
    await loadAllContent();
    currentPage = 'dashboard';
    showApp();
    buildNav();
    renderView();
    return true;
  } catch {
    clearSession();
    auth = null;
    return false;
  }
}

async function handleSave() {
  const path = config.contentFiles[currentPage];
  const saveBtn = $('#save-btn');
  saveBtn.disabled = true;
  setStatus('Publishing changes…');

  try {
    await saveFile(path, content[currentPage]);
    setLastPublish(currentPage);
    setStatus(`Published ${PAGE_LABELS[currentPage] || currentPage}. GitHub Actions will rebuild the site shortly.`, 'success');
    if (currentPage === 'dashboard') renderDashboardCharts();
  } catch (err) {
    setStatus(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

function handleDownload() {
  const blob = new Blob([JSON.stringify(content[currentPage], null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentPage}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function init() {
  await loadConfig();

  $('#login-form').addEventListener('submit', handleLogin);
  $('#save-btn').addEventListener('click', handleSave);
  $('#download-btn').addEventListener('click', handleDownload);
  $('#reload-btn').addEventListener('click', async () => {
    try {
      await loadAllContent();
      renderView();
      setStatus('Content reloaded.', 'success');
      setTimeout(() => setStatus(''), 2500);
    } catch (err) {
      setStatus(err.message, 'error');
    }
  });
  $('#logout-btn').addEventListener('click', () => {
    clearSession();
    auth = null;
    showLogin();
  });

  document.querySelectorAll('.nav-item[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  $('#sidebar-toggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('is-open');
  });

  localStorage.removeItem(LEGACY_AUTH_KEY);
  const restored = await tryRestoreSession();
  if (!restored) showLogin();
}

init();
