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

async function fillWork(limits) {
  const data = await fetchJson('../data/work.json');
  const companies = limitArray(data, limits.workCompanies);
  let html = '';

  companies.forEach((item) => {
    html += `<div class='timeline-item'><h3>${escapeHtml(item.company)} - ${escapeHtml(item.position)}</h3><p>${escapeHtml(item.period)}</p><ol>`;

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

async function fillProjects(limits) {
  const data = await fetchJson('../data/projects.json');
  const projects = limitArray(data, limits.projectCount);
  let html = '';

  projects.forEach((item) => {
    const background = truncateText(item.background, limits.projectTextMaxChars);
    const tech = truncateText(item.tech, limits.projectTextMaxChars);

    html += `<div class='timeline-item'><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.period)}</p><h4>项目背景:</h4><ul><li>${escapeHtml(background)}</li></ul><h4>主要工作:</h4><ul>`;

    const works = limitArray(item.work || [], limits.projectWorkBullets);
    works.forEach((w) => (html += `<li>${escapeHtml(truncateText(w, limits.projectTextMaxChars))}</li>`));

    html += `</ul><h4>技术栈:</h4><ul><li>${escapeHtml(tech)}</li></ul><h4>成果</h4><ul>`;

    (item.result || []).forEach((r) => (html += `<li>${escapeHtml(truncateText(r, limits.projectTextMaxChars))}</li>`));

    html += '</ul></div>';
  });

  const container = $('#projects-content');
  if (container) container.innerHTML = html;
}

async function fillSkills(limits) {
  const data = await fetchJson('../data/skills.json');
  const skills = limitArray(data, limits.skillCount);

  // 绘制雷达图
  const canvas = $('#skillRadar');
  if (canvas && window.Chart) {
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: skills.map((item) => item.name),
        datasets: [
          {
            label: '技能掌握程度',
            data: skills.map((item) => item.percent),
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
  }

  // 生成技能列表
  const listContainer = $('#skills-list');
  if (listContainer) {
    let html = '<div class="skills-grid">';
    skills.forEach((item) => {
      html += `
        <div class="skill-item" title="${escapeHtml(item.description)}">
          <div class="skill-name">${escapeHtml(item.name)}</div>
          <div class="skill-bar">
            <div class="skill-bar-fill" style="width: ${escapeHtml(item.percent)}%"></div>
            <span class="skill-percent">${escapeHtml(item.percent)}%</span>
          </div>
          <div class="skill-description">${escapeHtml(item.description)}</div>
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
    if (sectionName === 'work') await fillWork(modeConfig.limits);
    if (sectionName === 'projects') await fillProjects(modeConfig.limits);
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
