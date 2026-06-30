/* eslint-disable no-console */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(v) {
  return String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
  return r.json();
}

// ----- 渲染：Header -----
function renderHeader(profile) {
  const name = escapeHtml(profile.name || '');
  const avatar = escapeHtml(profile.avatar || '../images/avatar.jpg');
  const contacts = profile.contacts || {};

  const contactHtml = [];
  if (contacts.phone) contactHtml.push(`<a href="tel:${escapeHtml(contacts.phone)}"><i class="fa-solid fa-phone"></i> ${escapeHtml(contacts.phone)}</a>`);
  if (contacts.email) contactHtml.push(`<a href="mailto:${escapeHtml(contacts.email)}"><i class="fa-solid fa-envelope"></i> ${escapeHtml(contacts.email)}</a>`);
  if (contacts.wechat) contactHtml.push(`<span title="微信"><i class="fa-brands fa-weixin"></i> ${escapeHtml(contacts.wechat)}</span>`);
  if (contacts.github) contactHtml.push(`<a href="${escapeHtml(contacts.github)}" target="_blank"><i class="fa-brands fa-github"></i> ${escapeHtml(contacts.githubLabel || 'GitHub')}</a>`);

  $('#hp-header').innerHTML = `
    <div class="hp-header-inner">
      <img class="hp-avatar" src="${avatar}" alt="${name}">
      <div class="hp-header-info">
        <div class="hp-name">${name}</div>
        <div class="hp-title">软件开发工程师</div>
        <div class="hp-contact">${contactHtml.join('')}</div>
        <div class="hp-nav">
          <a class="hp-pill" href="ats.html"><i class="fa-solid fa-file-lines"></i> 简历</a>
          <a class="hp-pill" href="${escapeHtml(contacts.github || '#')}" target="_blank"><i class="fa-brands fa-github"></i> GitHub</a>
          <a class="hp-pill hp-pill-ghost" href="ats.html" onclick="window.print()"><i class="fa-solid fa-print"></i> 打印PDF</a>
        </div>
      </div>
    </div>
  `;
}

// ----- 渲染：分类 Tab 与项目卡片 -----
let activeCategory = '全部';

function renderProjects(projects) {
  const categories = ['全部', ...new Set(projects.map(p => p.category))];

  const tabHtml = categories.map(cat =>
    `<button class="hp-tab ${cat === activeCategory ? 'hp-tab-active' : ''}" data-cat="${cat}">${escapeHtml(cat)}</button>`
  ).join('');
  $('#hp-tabs').innerHTML = tabHtml;

  $('#hp-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.hp-tab');
    if (!btn) return;
    activeCategory = btn.dataset.cat;
    renderProjectCards(projects);
    $$('.hp-tab').forEach(t => t.classList.toggle('hp-tab-active', t.dataset.cat === activeCategory));
  });

  renderProjectCards(projects);
}

function renderProjectCards(projects) {
  const container = $('#hp-cards');
  const filtered = activeCategory === '全部'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  if (!filtered.length) {
    container.innerHTML = '<div class="hp-empty">该分类暂无项目</div>';
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const mdPath = `markdown-viewer.html?file=${encodeURIComponent(item.path + '/project-doc.md')}`;
    const hasGithub = Boolean(item.githubUrl);

    html += `
      <div class="hp-card">
        <div class="hp-card-icon">${item.icon || '📄'}</div>
        <div class="hp-card-body">
          <div class="hp-card-title">${escapeHtml(item.name)}</div>
          <div class="hp-card-period">${escapeHtml(item.period || '')}</div>
          <div class="hp-card-tags">
            ${(item.tags || []).slice(0, 3).map(t => `<span class="hp-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="hp-card-desc">${escapeHtml(item.oneLiner || '')}</div>
          <div class="hp-card-actions">
            <a class="hp-card-btn hp-card-btn-primary"
               href="${mdPath}" target="_blank">
              <i class="fa-solid fa-file-lines"></i> 内容
            </a>
            ${hasGithub
              ? `<a class="hp-card-btn hp-card-btn-secondary" href="${escapeHtml(item.githubUrl)}" target="_blank">
                   <i class="fa-brands fa-github"></i> GitHub
                 </a>`
              : ''
            }
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ----- 渲染：开源项目 -----
function renderGithub(reposData) {
  if (!reposData?.length) return;
  const html = `<div class="hp-github">${
    reposData.map(repo => {
      const desc = repo.description ? ` - ${escapeHtml(repo.description)}` : '';
      const lang = repo.language ? `（${escapeHtml(repo.language)}）` : '';
      return `<a class="hp-github-item" href="${escapeHtml(repo.url)}" target="_blank">
        <div class="hp-github-name"><i class="fa-brands fa-github"></i> ${escapeHtml(repo.name)}${lang}</div>
        <div class="hp-github-desc">${escapeHtml(repo.description || '')}</div>
      </a>`;
    }).join('')
  }</div>`;
  $('#hp-github-content').innerHTML = html;
}

// ----- 渲染：技能标签 -----
function renderSkills(skillsData) {
  if (!skillsData?.length) return;
  const tags = skillsData.map(s =>
    `<span class="hp-skill-tag">${escapeHtml(s.name)}</span>`
  ).join('');
  $('#hp-skills-content').innerHTML = tags;
}

// ----- 渲染：教育 -----
function renderEducation(eduData) {
  if (!eduData?.length) return;
  const html = eduData.map(e =>
    `<div class="hp-edu-item">
      <div class="hp-edu-school">${escapeHtml(e.school)}</div>
      <div class="hp-edu-meta">${escapeHtml(e.major)} · ${escapeHtml(e.degree)} · ${escapeHtml(e.period || '')}</div>
    </div>`
  ).join('');
  $('#hp-education-content').innerHTML = html;
}

// ----- 启动 -----
async function init() {
  try {
    const [profile, indexData, repos, skills, education] = await Promise.all([
      fetchJson('../data/profile-base.json'),
      fetchJson('../data/projects/index.json'),
      fetchJson('../data/projects-github.json'),
      fetchJson('../data/skills.json'),
      fetchJson('../data/education.json')
    ]);

    // 加载每个项目的 meta.json 并与 index 信息合并
    const projects = await Promise.all(
      indexData.map(async (item) => {
        const meta = await fetchJson(`../data/projects/${item.path}/meta.json`);
        return { ...meta, ...item };
      })
    );

    renderHeader(profile);
    renderProjects(projects);
    renderGithub(repos);
    renderSkills(skills);
    renderEducation(education);

    document.title = `${profile.name} - 个人主页`;
  } catch (err) {
    console.error(err);
    $('#hp-app').innerHTML = `<div class="hp-error">加载失败: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
