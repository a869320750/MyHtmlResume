/* eslint-disable no-console */

function $(selector) {
  return document.querySelector(selector);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function truncateText(text, maxChars) {
  const value = (text ?? '').trim();
  if (!maxChars || maxChars >= value.length) return value;
  return value.slice(0, Math.max(0, maxChars - 1)).trimEnd() + '…';
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.text();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return await response.json();
}

function showLocalFileWarning() {
  const container = document.querySelector('.page > div') || document.body;
  const warning = document.createElement('div');
  warning.className = 'local-warning';
  warning.innerHTML = `
    <div class="local-warning-title">检测到你正在用 <code>file://</code> 方式打开本页面</div>
    <div class="local-warning-desc">
      浏览器会阻止 <code>fetch()</code> 读取本地文件（CORS/安全策略），所以 <code>data/*</code> 和 <code>sections/*</code> 无法加载。
      请用本地 HTTP 服务器打开（效果与 GitHub Pages 一致）。
    </div>
    <div class="local-warning-actions">
      <div>Windows：运行 <code>scripts\\start-server.bat</code>，然后访问 <code>http://localhost:8000/index.html</code></div>
      <div>或 VS Code 安装 Live Server 后用 "Open with Live Server"</div>
    </div>
  `.trim();
  container.prepend(warning);
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  const profile = (params.get('profile') || 'general').trim();
  const mode = (params.get('mode') || '').trim();
  const showProfile = (params.get('showProfile') || '').trim() === '1';
  return { profile, mode, showProfile };
}

function buildModeLink(profile, mode) {
  const url = new URL(window.location.href);
  url.searchParams.set('profile', profile);
  url.searchParams.set('mode', mode);
  return url.pathname + url.search;
}

function renderHeader(baseProfile, profileLabel, position, showProfile) {
  const root = $('#resume-root');
  const name = escapeHtml(baseProfile.name || '');
  const avatar = escapeHtml(baseProfile.avatar || '');
  const contacts = baseProfile.contacts || {};

  root.insertAdjacentHTML(
    'beforeend',
    `
      <div class="header">
        <img class="avatar" src="${avatar}" alt="${name}">
        <div class="name-contact">
          <div class="name">${name}</div>
          <div class="position">${escapeHtml(position || '')}</div>
          <div class="contact">
            ${contacts.phone ? `<a href="tel:${escapeHtml(contacts.phone)}" target="_blank"><i class="fa-solid fa-phone"></i> 电话: ${escapeHtml(contacts.phone)}</a>` : ''}
            ${contacts.email ? `<a href="mailto:${escapeHtml(contacts.email)}" target="_blank"><i class="fa-solid fa-envelope"></i> 邮箱: ${escapeHtml(contacts.email)}</a>` : ''}
            ${contacts.wechat ? `<a href="#"><i class="fa-brands fa-weixin" target="_blank"></i> 微信: ${escapeHtml(contacts.wechat)}</a>` : ''}
            ${contacts.github ? `<a href="${escapeHtml(contacts.github)}" target="_blank"><i class="fa-brands fa-github"></i> GitHub: ${escapeHtml(contacts.githubLabel || contacts.github)}</a>` : ''}
            ${contacts.bilibili ? `<a href="${escapeHtml(contacts.bilibili)}" target="_blank"><i class="fa-brands fa-bilibili"></i> BiliBili: ${escapeHtml(contacts.bilibiliLabel || '主页')}</a>` : ''}
          </div>
          ${showProfile && profileLabel ? `<div class="profile-badge">${escapeHtml(profileLabel || '')}</div>` : ''}
        </div>
      </div>
    `.trim()
  );
}

function renderFooter(baseProfile) {
  const root = $('#resume-root');
  const contacts = baseProfile.contacts || {};

  root.insertAdjacentHTML(
    'beforeend',
    `
      <div class="footer-contact">
        ${contacts.phone ? `<a href="tel:${escapeHtml(contacts.phone)}" target="_blank" title="电话" aria-label="电话"><i class="fa-solid fa-phone"></i></a>` : ''}
        ${contacts.email ? `<a href="mailto:${escapeHtml(contacts.email)}" target="_blank" title="邮箱" aria-label="邮箱"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${contacts.github ? `<a href="${escapeHtml(contacts.github)}" target="_blank" title="GitHub" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>` : ''}
        ${contacts.bilibili ? `<a href="${escapeHtml(contacts.bilibili)}" target="_blank" title="BiliBili" aria-label="BiliBili"><i class="fa-brands fa-bilibili"></i></a>` : ''}
        <a href="index.html" title="返回入口" aria-label="返回入口"><i class="fa-solid fa-house"></i></a>
        <button class="print-btn" onclick="window.print()" aria-label="打印或保存PDF">打印/保存PDF</button>
      </div>
    `.trim()
  );
}

async function appendSection(sectionName) {
  const root = $('#resume-root');
  const html = await fetchText(`../sections/${sectionName}.html`);
  root.insertAdjacentHTML('beforeend', html);
}

async function fillIntro(limits) {
  const text = await fetchText('../data/intro.txt');
  const intro = truncateText(text, limits.introMaxChars);
  const root = $('#resume-root');
  root.insertAdjacentHTML(
    'beforeend',
    `
      <div class="intro fade-in" id="intro-section">
        <p id="intro-content">${escapeHtml(intro)}</p>
      </div>
    `.trim()
  );
}

function fillSummary(summaryBullets, profileKey, mode) {
  const list = $('#summary-list');
  if (!list) return;

  list.innerHTML = (summaryBullets || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join('');

  const actions = $('#summary-actions');
  if (!actions) return;

  // Keep the resume page clean: no "short/detail" switches shown inside the resume.
  actions.innerHTML = `
    <a class="pill pill-ghost" href="supplement.html">项目补充材料（模板）</a>
  `.trim();
}

function limitArray(arr, maxCount) {
  if (!Array.isArray(arr)) return [];
  if (!maxCount || maxCount >= arr.length) return arr;
  return arr.slice(0, maxCount);
}

const DISPLAY_LEVEL_SET = new Set(['oneLiner', 'value3', 'star', 'full']);

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => String(line || '').trim()).filter(Boolean);
}

function normalizeStar(star) {
  const source = star || {};
  return {
    situation: pickFirstNonEmpty(source.situation, source.S),
    task: pickFirstNonEmpty(source.task, source.T),
    action: pickFirstNonEmpty(source.action, source.A),
    result: pickFirstNonEmpty(source.result, source.R)
  };
}

function hasStarContent(star) {
  const normalized = normalizeStar(star);
  return Boolean(normalized.situation || normalized.task || normalized.action || normalized.result);
}

function resolveDisplayLevel(item, sectionPolicy) {
  let level = pickFirstNonEmpty(sectionPolicy?.defaultLevel) || 'full';

  const tagPolicy = sectionPolicy?.byTag || {};
  const itemTags = Array.isArray(item?.tags) ? item.tags : [];
  for (const tag of itemTags) {
    const nextLevel = tagPolicy[tag];
    if (typeof nextLevel === 'string' && nextLevel.trim()) {
      level = nextLevel.trim();
      break;
    }
  }

  const idPolicy = sectionPolicy?.byId || sectionPolicy?.overrides || {};
  if (item?.id && typeof idPolicy[item.id] === 'string' && idPolicy[item.id].trim()) {
    level = idPolicy[item.id].trim();
  }

  return DISPLAY_LEVEL_SET.has(level) ? level : 'full';
}

function renderValueList(title, lines, maxChars) {
  const values = normalizeLines(lines);
  if (!values.length) return '';
  const items = values
    .map((line) => `<li>${escapeHtml(truncateText(line, maxChars))}</li>`)
    .join('');
  return `<h4 class="value-block-title">${escapeHtml(title)}</h4><ul class="value-list">${items}</ul>`;
}

function renderStarBlock(star, maxChars) {
  const normalized = normalizeStar(star);
  if (!hasStarContent(normalized)) return '';

  const rows = [
    ['S', '情境', normalized.situation],
    ['T', '任务', normalized.task],
    ['A', '行动', normalized.action],
    ['R', '结果', normalized.result]
  ]
    .filter((row) => row[2])
    .map(
      ([key, label, text]) =>
        `<li><span class="star-key">${key} · ${label}</span><div class="star-text">${escapeHtml(truncateText(text, maxChars))}</div></li>`
    )
    .join('');

  return `<h4 class="value-block-title">STAR</h4><ul class="star-list">${rows}</ul>`;
}

function getOneLiner(item, fallbackMaxChars) {
  const line = pickFirstNonEmpty(item?.oneLiner, item?.brief?.[0]);
  return truncateText(line, fallbackMaxChars);
}

function getValue3(item) {
  const fromTemplate = normalizeLines(item?.value3);
  if (fromTemplate.length) return fromTemplate;
  return normalizeLines(item?.brief);
}

async function fillEducation() {
  const data = await fetchJson('../data/education.json');
  let html = '';
  data.forEach((item) => {
    html += `<div class='timeline-item'><h3>${escapeHtml(item.school)} - ${escapeHtml(item.major)} - ${escapeHtml(item.degree)}</h3><p>${escapeHtml(item.period)}</p><ul>`;
    (item.details || []).forEach((d) => (html += `<li>${escapeHtml(d)}</li>`));
    html += '</ul></div>';
  });
  const container = $('#education-content');
  if (container) container.innerHTML = html;
}

async function fillWork(limits, contentPolicy) {
  const data = await fetchJson('../data/work.json');
  const companies = limitArray(data, limits.workCompanies);
  let html = '';

  companies.forEach((item) => {
    const level = resolveDisplayLevel(item, contentPolicy);
    const oneLiner = getOneLiner(item, limits.workDescMaxChars);
    const value3 = getValue3(item);
    const starHtml = renderStarBlock(item.star, limits.workDescMaxChars);

    html += `<div class='timeline-item'><h3>${escapeHtml(item.company)} - ${escapeHtml(item.position)}</h3><p>${escapeHtml(item.period)}</p>`;

    if (level === 'oneLiner') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += '</div>';
      return;
    }

    if (level === 'value3') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += renderValueList('三句价值摘要', value3, limits.workDescMaxChars);
      html += '</div>';
      return;
    }

    if (level === 'star') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += starHtml || renderValueList('三句价值摘要', value3, limits.workDescMaxChars);
      html += '</div>';
      return;
    }

    // full
    if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
    html += renderValueList('三句价值摘要', value3, limits.workDescMaxChars);
    if (starHtml) html += starHtml;

    html += `<h4 class="value-block-title">完整经历（明细）</h4><ol>`;
    const details = limitArray(item.details || [], limits.workDetailsPerCompany);
    details.forEach((d) => {
      const desc = truncateText(d.desc, limits.workDescMaxChars);
      html += `<li><b>${escapeHtml(d.title)}：</b><br>${escapeHtml(desc)}</li>`;
    });
    html += '</ol></div>';
  });

  const container = $('#work-content');
  if (container) container.innerHTML = html;
}

async function fillProjects(limits, contentPolicy) {
  const data = await fetchJson('../data/projects.json');
  const projects = limitArray(data, limits.projectCount);
  let html = '';

  projects.forEach((item) => {
    const level = resolveDisplayLevel(item, contentPolicy);
    const oneLiner = getOneLiner(item, limits.projectTextMaxChars);
    const value3 = getValue3(item);
    const starHtml = renderStarBlock(item.star, limits.projectTextMaxChars);
    const background = truncateText(item.background, limits.projectTextMaxChars);
    const tech = truncateText(item.tech, limits.projectTextMaxChars);

    html += `<div class='timeline-item'><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.period)}</p>`;

    if (level === 'oneLiner') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += '</div>';
      return;
    }

    if (level === 'value3') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += renderValueList('三句价值摘要', value3, limits.projectTextMaxChars);
      html += '</div>';
      return;
    }

    if (level === 'star') {
      if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
      html += starHtml || renderValueList('三句价值摘要', value3, limits.projectTextMaxChars);
      html += '</div>';
      return;
    }

    // full
    if (oneLiner) html += `<p class="value-oneliner">${escapeHtml(oneLiner)}</p>`;
    html += renderValueList('三句价值摘要', value3, limits.projectTextMaxChars);
    if (starHtml) html += starHtml;

    html += `<h4 class="value-block-title">项目背景:</h4><ul><li>${escapeHtml(background)}</li></ul><h4 class="value-block-title">主要工作:</h4><ul>`;

    const works = limitArray(item.work || [], limits.projectWorkBullets);
    works.forEach((w) => (html += `<li>${escapeHtml(truncateText(w, limits.projectTextMaxChars))}</li>`));

    html += `</ul><h4 class="value-block-title">技术栈:</h4><ul><li>${escapeHtml(tech)}</li></ul><h4 class="value-block-title">成果</h4><ul>`;

    (item.result || []).forEach((r) => (html += `<li>${escapeHtml(truncateText(r, limits.projectTextMaxChars))}</li>`));

    html += '</ul></div>';
  });

  const container = $('#projects-content');
  if (container) container.innerHTML = html;
}

async function fillSkills(limits) {
  const data = await fetchJson('../data/skills.json');
  const skills = limitArray(data, limits.skillCount);

  const normalizedSkills = skills.map((item) => {
    const keywords = Array.isArray(item.keywords)
      ? item.keywords.map((k) => String(k || '').trim()).filter(Boolean)
      : String(item.description || '')
          .split(/[，,、]/)
          .map((k) => k.trim())
          .filter(Boolean);

    return {
      name: item.name || '',
      level: item.level || '熟练',
      keywords,
      evidence: item.evidence || item.description || '',
      score: typeof item.percent === 'number' ? item.percent : null
    };
  });

  // 绘制雷达图
  const canvas = $('#skillRadar');
  const radarSkills = normalizedSkills.filter((item) => typeof item.score === 'number');
  if (canvas && window.Chart && radarSkills.length) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: radarSkills.map((item) => item.name),
        datasets: [
          {
            label: '技能掌握程度',
            data: radarSkills.map((item) => item.score),
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: 'rgba(102, 126, 234, 1)',
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(102, 126, 234, 1)'
          }
        ]
      },
      options: {
        scales: {
          r: {
            angleLines: { color: '#ccc' },
            grid: { color: '#eee' },
            suggestedMin: 0,
            suggestedMax: 100,
            pointLabels: { font: { size: 12 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  } else if (canvas) {
    const radarContainer = canvas.closest('.radar-container');
    if (radarContainer) radarContainer.style.display = 'none';
  }

  // 生成技能列表
  const listContainer = $('#skills-list');
  if (listContainer) {
    let html = '<div class="skills-grid">';
    normalizedSkills.forEach((item) => {
      const keywordHtml = item.keywords
        .map((keyword) => `<span class="skill-tag">${escapeHtml(keyword)}</span>`)
        .join('');

      html += `
        <div class="skill-item" title="${escapeHtml(item.evidence)}">
          <div class="skill-head">
            <div class="skill-name">${escapeHtml(item.name)}</div>
            <span class="skill-level skill-level-${escapeHtml(item.level)}">${escapeHtml(item.level)}</span>
          </div>
          ${keywordHtml ? `<div class="skill-tags">${keywordHtml}</div>` : ''}
          <div class="skill-evidence">${escapeHtml(item.evidence)}</div>
        </div>
      `;
    });
    html += '</div>';
    listContainer.innerHTML = html;
  }
}

async function fillGithub(limits) {
  if (!limits.githubCount) {
    const section = $('#github-section');
    if (section) section.style.display = 'none';
    return;
  }

  const data = await fetchJson('../data/projects-github.json');
  data.sort(
    (a, b) =>
      (Boolean(b.highlight) - Boolean(a.highlight)) || ((b.stars || 0) - (a.stars || 0))
  );

  const items = limitArray(data, limits.githubCount);
  let html = '<div class="github-grid">';

  items.forEach((item) => {
    const highlightClass = item.highlight ? 'github-card-highlight' : '';
    const starIcon =
      item.stars > 0
        ? `<span class="github-stars"><i class="fa-solid fa-star"></i> ${escapeHtml(item.stars)}</span>`
        : '';

    html += `
      <a href="${escapeHtml(item.url)}" target="_blank" class="github-card ${highlightClass}">
        <div class="github-card-header">
          <h3><i class="fa-brands fa-github"></i> ${escapeHtml(item.name)} ${item.highlight ? '<span class="github-featured-badge" title="精选项目">精选</span>' : ''}</h3>
          ${starIcon}
        </div>
        <p class="github-description">${escapeHtml(item.description)}</p>
        <div class="github-footer">
          <span class="github-lang"><i class="fa-solid fa-circle"></i> ${escapeHtml(item.language)}</span>
          <span class="github-updated">Updated ${escapeHtml(item.updated)}</span>
        </div>
      </a>
    `;
  });

  html += '</div>';
  const container = $('#github-content');
  if (container) container.innerHTML = html;
}

async function init() {
  if (window.location && window.location.protocol === 'file:') {
    showLocalFileWarning();
    return;
  }

  const { profile: profileKey, mode: requestedMode, showProfile } = getParams();

  const baseProfile = await fetchJson('../data/profile-base.json');
  const profileConfig = await fetchJson(`../data/profiles/${profileKey}.json`);

  const mode = requestedMode || profileConfig.defaultMode || 'short';
  const modeConfig = (profileConfig.modes || {})[mode] || (profileConfig.modes || {}).short;
  const contentPolicy = modeConfig.contentPolicy || {};

  // Avoid exposing "通用/投递版" etc in the title (print headers may include it)
  document.title = `${baseProfile.name || ''} - ${modeConfig.position || '个人简历'}`.trim();

  renderHeader(baseProfile, profileConfig.label, modeConfig.position, showProfile);

  // intro
  await fillIntro(modeConfig.limits);

  // sections
  for (const sectionName of modeConfig.sections) {
    await appendSection(sectionName);

    if (sectionName === 'summary') {
      fillSummary(modeConfig.summaryBullets, profileKey, mode);
    }

    if (sectionName === 'education') await fillEducation();
    if (sectionName === 'work') await fillWork(modeConfig.limits, contentPolicy.work);
    if (sectionName === 'projects') await fillProjects(modeConfig.limits, contentPolicy.projects);
    if (sectionName === 'skills') await fillSkills(modeConfig.limits);
    if (sectionName === 'github') await fillGithub(modeConfig.limits);
  }

  renderFooter(baseProfile);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error(err);
    const root = $('#resume-root');
    if (root) {
      root.insertAdjacentHTML(
        'afterbegin',
        `<div class="local-warning"><div class="local-warning-title">页面加载失败</div><div class="local-warning-desc">${escapeHtml(err.message || String(err))}</div></div>`
      );
    }
  });
});
