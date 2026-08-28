const STORAGE_KEY = 'uniprix-cms-auth';
const PUBLISH_KEY = 'uniprix-cms-last-publish';
const PUBLISH_HISTORY_KEY = 'uniprix-cms-publish-history';

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
const LONG_TEXT_KEYS = new Set(['text', 'description', 'body', 'content', 'paragraph', 'quote', 'bio', 'summary', 'subheading', 'heading']);

let config = null;
let auth = null;
let currentPage = 'dashboard';
let content = {};
let fileMeta = {};
let dashboardCharts = [];

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

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function saveAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
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
  const res = await fetch('/admin/config.json');
  config = await res.json();
}

async function githubRequest(path, options = {}) {
  const url = `https://api.github.com/repos/${auth.repo}/contents/${path}?ref=${encodeURIComponent(auth.branch)}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${auth.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error (${res.status})`);
  }
  return res.json();
}

async function githubListDir(path) {
  const data = await githubRequest(path);
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
  if (!auth?.token) throw new Error('Sign in to upload images.');

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

  const res = await fetch(`https://api.github.com/repos/${auth.repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${auth.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `CMS: upload ${filename}`,
      content: base64,
      branch: auth.branch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed (${res.status})`);
  }

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
    message: `CMS: update ${path}`,
    content: encoded,
    branch: auth.branch,
  };
  if (fileMeta[path]?.sha) payload.sha = fileMeta[path].sha;

  const res = await fetch(`https://api.github.com/repos/${auth.repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${auth.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Save failed (${res.status})`);
  }

  const data = await res.json();
  fileMeta[path] = { sha: data.content.sha };
}

async function loadAllContent() {
  setStatus('Loading content from GitHub…');
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
  currentPage = page;
  buildNav();
  renderView();
  $('#sidebar')?.classList.remove('is-open');
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
    $('#page-title').textContent = PAGE_LABELS[currentPage] || currentPage;
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
  if (label && auth?.repo) {
    label.textContent = `${auth.repo} · ${auth.branch || 'main'}`;
  }
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
  const repo = $('#repo').value.trim();
  const branch = $('#branch').value.trim() || 'main';
  const token = $('#token').value.trim();
  const errEl = $('#login-error');

  errEl.classList.add('hidden');
  auth = { repo, branch, token };
  saveAuth(auth);

  try {
    await loadAllContent();
    currentPage = 'dashboard';
    showApp();
    buildNav();
    renderView();
    setStatus('Connected successfully.', 'success');
    setTimeout(() => setStatus(''), 3000);
  } catch (err) {
    clearAuth();
    auth = null;
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
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

  if (config.repo) $('#repo').value = config.repo;
  if (config.branch) $('#branch').value = config.branch;

  auth = loadAuth();

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
    clearAuth();
    auth = null;
    showLogin();
  });

  document.querySelectorAll('.nav-item[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  $('#sidebar-toggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('is-open');
  });

  if (auth?.repo && auth?.token) {
    $('#repo').value = auth.repo;
    $('#branch').value = auth.branch || config.branch || 'main';
    $('#token').value = auth.token;
    try {
      await loadAllContent();
      currentPage = 'dashboard';
      showApp();
      buildNav();
      renderView();
    } catch {
      showLogin();
    }
  }
}

init();
